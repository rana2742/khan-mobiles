const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

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
    const [rows] = await pool.query(
      excludeId
        ? 'SELECT id FROM products WHERE slug = ? AND id != ? LIMIT 1'
        : 'SELECT id FROM products WHERE slug = ? LIMIT 1',
      excludeId ? [slug, excludeId] : [slug]
    );
    if (!rows.length) return slug;
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

const toAbsoluteUrl = (req, relativePath) => (relativePath ? `${req.protocol}://${req.get('host')}${relativePath}` : null);

const toProductDTO = (row, req, images = []) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  price: Number(row.price),
  compareAtPrice: row.compare_at_price !== null ? Number(row.compare_at_price) : null,
  category: row.category,
  brand: row.brand,
  rating: Number(row.rating),
  reviewCount: row.review_count,
  badge: row.badge,
  imageUrl: toAbsoluteUrl(req, row.image_url),
  images: images.map((img) => ({ id: img.id, url: toAbsoluteUrl(req, img.image_url) })),
  bgGradient: row.bg_gradient,
  compatibleModels: typeof row.compatible_models === 'string' ? JSON.parse(row.compatible_models) : (row.compatible_models || []),
  stock: row.stock,
  isActive: !!row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Fetches gallery images for many products at once (avoids N+1 queries on list views).
const getImagesForProducts = async (productIds) => {
  if (!productIds.length) return {};
  const [rows] = await pool.query(
    `SELECT * FROM product_images WHERE product_id IN (${productIds.map(() => '?').join(',')}) ORDER BY product_id, sort_order, id`,
    productIds
  );
  return rows.reduce((acc, img) => {
    (acc[img.product_id] ||= []).push(img);
    return acc;
  }, {});
};

// After adding/removing gallery images, keep products.image_url (the DTO's
// primary photo, used by cards/listings) in sync with the first gallery image.
const syncPrimaryImage = async (productId) => {
  const [[first]] = await pool.query(
    'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order, id LIMIT 1',
    [productId]
  );
  await pool.query('UPDATE products SET image_url = ? WHERE id = ?', [first?.image_url || null, productId]);
};

// GET /api/products
// Query: search, category, minPrice, maxPrice, sort, page, limit
exports.list = async (req, res) => {
  const {
    search, category, minPrice, maxPrice,
    sort = 'popular', page = 1, limit = 100, includeInactive,
  } = req.query;

  const where = [];
  const params = [];

  if (!includeInactive || req.user?.role !== 'admin') {
    where.push('is_active = 1');
  }
  if (category) {
    where.push('category = ?');
    params.push(category);
  }
  if (minPrice) {
    where.push('price >= ?');
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    where.push('price <= ?');
    params.push(Number(maxPrice));
  }
  if (search) {
    where.push('(name LIKE ? OR brand LIKE ? OR category LIKE ? OR JSON_SEARCH(compatible_models, "one", ?) IS NOT NULL)');
    const like = `%${search}%`;
    params.push(like, like, like, `%${search}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sortMap = {
    popular: 'rating DESC',
    'price-asc': 'price ASC',
    'price-desc': 'price DESC',
    newest: 'created_at DESC',
    rating: 'rating DESC',
  };
  const orderBy = sortMap[sort] || sortMap.popular;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
  const offset = (pageNum - 1) * limitNum;

  const [rows] = await pool.query(
    `SELECT * FROM products ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM products ${whereClause}`,
    params
  );

  const imagesByProduct = await getImagesForProducts(rows.map((r) => r.id));

  res.json({
    success: true,
    products: rows.map((r) => toProductDTO(r, req, imagesByProduct[r.id] || [])),
    pagination: { page: pageNum, limit: limitNum, total },
  });
};

// GET /api/products/categories — distinct categories with counts, for shop filters
exports.listCategories = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT category AS label, COUNT(*) AS count
     FROM products WHERE is_active = 1
     GROUP BY category ORDER BY category ASC`
  );
  res.json({ success: true, categories: rows });
};

// GET /api/products/:idOrSlug
exports.getOne = async (req, res) => {
  const { idOrSlug } = req.params;
  const isNumeric = /^\d+$/.test(idOrSlug);
  const [rows] = await pool.query(
    `SELECT * FROM products WHERE ${isNumeric ? 'id' : 'slug'} = ? LIMIT 1`,
    [idOrSlug]
  );
  if (!rows.length) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }
  const [images] = await pool.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id', [rows[0].id]);
  res.json({ success: true, product: toProductDTO(rows[0], req, images) });
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
  const primaryImageUrl = files.length ? `/uploads/products/${files[0].filename}` : null;

  const [result] = await pool.query(
    `INSERT INTO products
      (name, slug, description, price, compare_at_price, category, brand, badge, image_url, bg_gradient, compatible_models, stock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name.trim(),
      slug,
      description?.trim() || null,
      Number(price),
      compareAtPrice ? Number(compareAtPrice) : null,
      category.trim(),
      brand.trim(),
      badge || null,
      primaryImageUrl,
      bgGradient || 'linear-gradient(135deg, #1e293b, #334155)',
      JSON.stringify(parseCompatibleModels(compatibleModels)),
      Number(stock) || 0,
    ]
  );

  const productId = result.insertId;
  for (let i = 0; i < files.length; i++) {
    await pool.query(
      'INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)',
      [productId, `/uploads/products/${files[i].filename}`, i]
    );
  }

  const [[row]] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
  const [images] = await pool.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id', [productId]);
  res.status(201).json({ success: true, product: toProductDTO(row, req, images) });
};

// PUT /api/products/:id  (admin only, multipart/form-data — new `images` files are ADDED to the gallery, not replaced)
exports.update = async (req, res) => {
  const { id } = req.params;
  const [[existing]] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const { name, description, price, compareAtPrice, category, brand, badge, stock, compatibleModels, bgGradient, isActive } = req.body;

  const effectivePrice = price ? Number(price) : Number(existing.price);
  const effectiveCompareAt = compareAtPrice !== undefined
    ? (compareAtPrice ? Number(compareAtPrice) : null)
    : existing.compare_at_price;
  if (effectiveCompareAt && effectiveCompareAt <= effectivePrice) {
    return res.status(400).json({ success: false, message: '"Compare at" price must be higher than the actual price.' });
  }

  const slug = name && name.trim() !== existing.name ? await generateUniqueSlug(name, id) : existing.slug;

  await pool.query(
    `UPDATE products SET
      name = ?, slug = ?, description = ?, price = ?, compare_at_price = ?, category = ?, brand = ?,
      badge = ?, bg_gradient = ?, compatible_models = ?, stock = ?, is_active = ?
     WHERE id = ?`,
    [
      name?.trim() || existing.name,
      slug,
      description?.trim() ?? existing.description,
      price ? Number(price) : existing.price,
      effectiveCompareAt,
      category?.trim() || existing.category,
      brand?.trim() || existing.brand,
      badge !== undefined ? (badge || null) : existing.badge,
      bgGradient || existing.bg_gradient,
      compatibleModels !== undefined
        ? JSON.stringify(parseCompatibleModels(compatibleModels))
        : JSON.stringify(existing.compatible_models || []),
      stock !== undefined ? Number(stock) : existing.stock,
      isActive !== undefined ? (isActive === 'true' || isActive === true ? 1 : 0) : existing.is_active,
      id,
    ]
  );

  // Any newly uploaded files are appended after whatever's already in the gallery.
  const files = req.files || [];
  if (files.length) {
    const [[{ maxOrder }]] = await pool.query(
      'SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM product_images WHERE product_id = ?',
      [id]
    );
    for (let i = 0; i < files.length; i++) {
      await pool.query(
        'INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)',
        [id, `/uploads/products/${files[i].filename}`, maxOrder + 1 + i]
      );
    }
    await syncPrimaryImage(id);
  }

  const [[row]] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  const [images] = await pool.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id', [id]);
  res.json({ success: true, product: toProductDTO(row, req, images) });
};

// DELETE /api/products/:id/images/:imageId  (admin only) — removes one gallery photo
exports.removeImage = async (req, res) => {
  const { id, imageId } = req.params;
  const [[image]] = await pool.query('SELECT * FROM product_images WHERE id = ? AND product_id = ?', [imageId, id]);
  if (!image) {
    return res.status(404).json({ success: false, message: 'Image not found.' });
  }

  await pool.query('DELETE FROM product_images WHERE id = ?', [imageId]);

  // Best-effort: remove the actual file from disk too.
  const filePath = path.join(__dirname, '..', image.image_url);
  fs.unlink(filePath, () => {}); // ignore errors — a missing file shouldn't block the API response

  await syncPrimaryImage(id);

  const [images] = await pool.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id', [id]);
  res.json({ success: true, images: images.map((img) => ({ id: img.id, url: toAbsoluteUrl(req, img.image_url) })) });
};

// DELETE /api/products/:id  (admin only)
exports.remove = async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
  if (!result.affectedRows) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }
  res.json({ success: true, message: 'Product deleted.' });
};
