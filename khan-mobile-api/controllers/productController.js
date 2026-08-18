const Product = require('../models/Product');
const { deleteFromCloudinary } = require('../middleware/upload');

const slugify = (str) =>
  str.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const generateUniqueSlug = async (name, excludeId = null) => {
  const base = slugify(name) || 'product';
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = excludeId ? { slug, _id: { $ne: excludeId } } : { slug };
    const exists = await Product.exists(query);
    if (!exists) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
};

const parseCompatibleModels = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : String(value).split(',').map((s) => s.trim()).filter(Boolean);
  } catch {
    return String(value).split(',').map((s) => s.trim()).filter(Boolean);
  }
};

const toProductDTO = (doc) => ({
  id: doc._id.toString(),
  name: doc.name,
  slug: doc.slug,
  description: doc.description,
  price: Number(doc.price),
  compareAtPrice: doc.compareAtPrice !== null && doc.compareAtPrice !== undefined ? Number(doc.compareAtPrice) : null,
  category: doc.category,
  brand: doc.brand,
  rating: Number(doc.rating),
  reviewCount: doc.reviewCount,
  badge: doc.badge,
  imageUrl: doc.imageUrl,
  images: (doc.images || [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => ({ id: img._id.toString(), url: img.url })),
  bgGradient: doc.bgGradient,
  compatibleModels: doc.compatibleModels || [],
  stock: doc.stock,
  isActive: !!doc.isActive,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// GET /api/products
// Query: search, category, minPrice, maxPrice, sort, page, limit
exports.list = async (req, res) => {
  const {
    search, category, minPrice, maxPrice,
    sort = 'popular', page = 1, limit = 100, includeInactive,
  } = req.query;

  const filter = {};

  if (!includeInactive || req.user?.role !== 'admin') {
    filter.isActive = true;
  }
  if (category) {
    filter.category = category;
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (search) {
    const re = new RegExp(search, 'i');
    filter.$or = [
      { name: re },
      { brand: re },
      { category: re },
      { compatibleModels: re },
    ];
  }

  const sortMap = {
    popular: { rating: -1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    newest: { createdAt: -1 },
    rating: { rating: -1 },
  };
  const sortBy = sortMap[sort] || sortMap.popular;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortBy).skip(skip).limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    products: products.map(toProductDTO),
    pagination: { page: pageNum, limit: limitNum, total },
  });
};

// GET /api/products/categories — distinct categories with counts, for shop filters
exports.listCategories = async (req, res) => {
  const categories = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $project: { _id: 0, label: '$_id', count: 1 } },
    { $sort: { label: 1 } },
  ]);
  res.json({ success: true, categories });
};

// GET /api/products/:idOrSlug
exports.getOne = async (req, res) => {
  const { idOrSlug } = req.params;
  const product = OBJECT_ID_RE.test(idOrSlug)
    ? await Product.findById(idOrSlug)
    : await Product.findOne({ slug: idOrSlug });

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }
  res.json({ success: true, product: toProductDTO(product) });
};

// POST /api/products  (admin only, multipart/form-data with up to 6 `images` files)
exports.create = async (req, res) => {
  const { name, description, price, compareAtPrice, category, brand, badge, stock, compatibleModels, bgGradient } = req.body;

  if (!name?.trim() || !price || !category?.trim() || !brand?.trim()) {
    return res.status(400).json({ success: false, message: 'Name, price, category, and brand are required.' });
  }
  if (compareAtPrice && Number(compareAtPrice) <= Number(price)) {
    return res.status(400).json({ success: false, message: '"Compare at" price must be higher than the actual price.' });
  }

  const slug = await generateUniqueSlug(name);
  const files = req.files || [];
  // multer-storage-cloudinary sets `.path` to the uploaded image's full Cloudinary URL.
  const images = files.map((f, i) => ({ url: f.path, sortOrder: i }));

  const product = await Product.create({
    name: name.trim(),
    slug,
    description: description?.trim() || null,
    price: Number(price),
    compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
    category: category.trim(),
    brand: brand.trim(),
    badge: badge || null,
    imageUrl: images.length ? images[0].url : null,
    images,
    bgGradient: bgGradient || 'linear-gradient(135deg, #1e293b, #334155)',
    compatibleModels: parseCompatibleModels(compatibleModels),
    stock: Number(stock) || 0,
  });

  res.status(201).json({ success: true, product: toProductDTO(product) });
};

// PUT /api/products/:id  (admin only, multipart/form-data — new `images` files are ADDED to the gallery, not replaced)
exports.update = async (req, res) => {
  const { id } = req.params;
  const existing = await Product.findById(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const { name, description, price, compareAtPrice, category, brand, badge, stock, compatibleModels, bgGradient, isActive } = req.body;

  const effectivePrice = price ? Number(price) : existing.price;
  const effectiveCompareAt = compareAtPrice !== undefined
    ? (compareAtPrice ? Number(compareAtPrice) : null)
    : existing.compareAtPrice;
  if (effectiveCompareAt && effectiveCompareAt <= effectivePrice) {
    return res.status(400).json({ success: false, message: '"Compare at" price must be higher than the actual price.' });
  }

  if (name && name.trim() !== existing.name) {
    existing.slug = await generateUniqueSlug(name, existing._id);
  }

  existing.name = name?.trim() || existing.name;
  existing.description = description !== undefined ? (description?.trim() ?? null) : existing.description;
  existing.price = effectivePrice;
  existing.compareAtPrice = effectiveCompareAt;
  existing.category = category?.trim() || existing.category;
  existing.brand = brand?.trim() || existing.brand;
  existing.badge = badge !== undefined ? (badge || null) : existing.badge;
  existing.bgGradient = bgGradient || existing.bgGradient;
  existing.compatibleModels = compatibleModels !== undefined
    ? parseCompatibleModels(compatibleModels)
    : existing.compatibleModels;
  existing.stock = stock !== undefined ? Number(stock) : existing.stock;
  existing.isActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : existing.isActive;

  // Any newly uploaded files are appended after whatever's already in the gallery.
  const files = req.files || [];
  if (files.length) {
    const maxOrder = existing.images.reduce((max, img) => Math.max(max, img.sortOrder), -1);
    files.forEach((f, i) => {
      existing.images.push({ url: f.path, sortOrder: maxOrder + 1 + i });
    });
    existing.images.sort((a, b) => a.sortOrder - b.sortOrder);
    existing.imageUrl = existing.images[0]?.url || null;
  }

  await existing.save();
  res.json({ success: true, product: toProductDTO(existing) });
};

// DELETE /api/products/:id/images/:imageId  (admin only) — removes one gallery photo
exports.removeImage = async (req, res) => {
  const { id, imageId } = req.params;
  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const image = product.images.id(imageId);
  if (!image) {
    return res.status(404).json({ success: false, message: 'Image not found.' });
  }

  const imageUrl = image.url;
  product.images.pull(imageId);
  product.images.sort((a, b) => a.sortOrder - b.sortOrder);
  product.imageUrl = product.images[0]?.url || null;
  await product.save();

  // Best-effort: remove the actual file from Cloudinary too.
  deleteFromCloudinary(imageUrl); // fire-and-forget, ignores errors internally

  res.json({
    success: true,
    images: product.images.map((img) => ({ id: img._id.toString(), url: img.url })),
  });
};

// DELETE /api/products/:id  (admin only)
exports.remove = async (req, res) => {
  const { id } = req.params;
  const result = await Product.findByIdAndDelete(id);
  if (!result) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }
  res.json({ success: true, message: 'Product deleted.' });
};
