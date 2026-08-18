const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');

const recalculateProductRating = async (productId) => {
  const [agg] = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, cnt: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { _id: productId },
    { rating: agg ? Number(agg.avgRating.toFixed(1)) : 0, reviewCount: agg?.cnt || 0 }
  );
};

// GET /api/reviews/product/:productId  (public)
exports.listForProduct = async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .sort({ createdAt: -1 })
    .populate('user', 'name');

  res.json({
    success: true,
    reviews: reviews.map((r) => ({
      id: r._id.toString(), rating: r.rating, comment: r.comment, createdAt: r.createdAt,
      userName: r.user?.name,
    })),
  });
};

// GET /api/reviews/reviewable  (requires auth) — delivered order items the user hasn't reviewed yet
exports.reviewable = async (req, res) => {
  const orders = await Order.find({ user: req.user._id, status: 'delivered' });
  const alreadyReviewed = await Review.find({ user: req.user._id }).select('product order');
  const reviewedSet = new Set(alreadyReviewed.map((r) => `${r.order}:${r.product}`));

  const reviewable = [];
  for (const order of orders) {
    for (const item of order.items) {
      if (!item.product) continue;
      const key = `${order._id}:${item.product}`;
      if (reviewedSet.has(key)) continue;
      reviewable.push({
        productId: item.product.toString(),
        name: item.name,
        imageUrl: item.imageUrl,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      });
    }
  }

  res.json({ success: true, reviewable });
};

// POST /api/reviews  (requires auth)
// Body: { productId, orderId, rating, comment }
exports.create = async (req, res) => {
  const { productId, orderId, rating, comment } = req.body;

  const numRating = Number(rating);
  if (!productId || !orderId || !numRating || numRating < 1 || numRating > 5) {
    return res.status(400).json({ success: false, message: 'A product, order, and rating (1–5) are required.' });
  }

  // Verify this user actually has a delivered order containing this product —
  // reviews are purchase-gated, not open to anyone.
  const eligible = await Order.exists({
    _id: orderId,
    user: req.user._id,
    status: 'delivered',
    'items.product': productId,
  });
  if (!eligible) {
    return res.status(403).json({ success: false, message: 'You can only review products from your own delivered orders.' });
  }

  try {
    await Review.create({
      product: productId, user: req.user._id, order: orderId,
      rating: numRating, comment: comment?.trim() || null,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'You already reviewed this product.' });
    }
    throw err;
  }

  await recalculateProductRating(productId);
  res.status(201).json({ success: true, message: 'Thanks for your review!' });
};

// GET /api/reviews  (admin only) — every review, for moderation
exports.listAll = async (req, res) => {
  const reviews = await Review.find()
    .sort({ createdAt: -1 })
    .limit(300)
    .populate('user', 'name email')
    .populate('product', 'name');

  res.json({
    success: true,
    reviews: reviews.map((r) => ({
      id: r._id.toString(), rating: r.rating, comment: r.comment, createdAt: r.createdAt,
      userName: r.user?.name, userEmail: r.user?.email,
      productId: r.product?._id?.toString(), productName: r.product?.name,
    })),
  });
};

// DELETE /api/reviews/:id  (admin only) — moderation
exports.remove = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found.' });
  }
  await Review.deleteOne({ _id: review._id });
  await recalculateProductRating(review.product);
  res.json({ success: true, message: 'Review removed.' });
};
