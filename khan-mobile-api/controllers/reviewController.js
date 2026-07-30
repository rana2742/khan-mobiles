const { pool } = require('../config/db');

const recalculateProductRating = async (productId) => {
  const [[agg]] = await pool.query(
    'SELECT COALESCE(AVG(rating), 0) AS avgRating, COUNT(*) AS cnt FROM reviews WHERE product_id = ?',
    [productId]
  );
  await pool.query('UPDATE products SET rating = ?, review_count = ? WHERE id = ?', [
    Number(agg.avgRating).toFixed(1), agg.cnt, productId,
  ]);
};

// GET /api/reviews/product/:productId  (public)
exports.listForProduct = async (req, res) => {
  const [reviews] = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.product_id = ? ORDER BY r.created_at DESC`,
    [req.params.productId]
  );
  res.json({
    success: true,
    reviews: reviews.map((r) => ({
      id: r.id, rating: r.rating, comment: r.comment, createdAt: r.created_at, userName: r.user_name,
    })),
  });
};

// GET /api/reviews/reviewable  (requires auth) — delivered order items the user hasn't reviewed yet
exports.reviewable = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT oi.product_id, oi.name, oi.image_url, o.id AS order_id, o.order_number
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.user_id = ? AND o.status = 'delivered' AND oi.product_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM reviews r WHERE r.product_id = oi.product_id AND r.user_id = ? AND r.order_id = o.id
       )`,
    [req.user.id, req.user.id]
  );
  res.json({
    success: true,
    reviewable: rows.map((r) => ({
      productId: r.product_id, name: r.name, imageUrl: r.image_url, orderId: r.order_id, orderNumber: r.order_number,
    })),
  });
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
  const [[eligible]] = await pool.query(
    `SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
     WHERE oi.order_id = ? AND oi.product_id = ? AND o.user_id = ? AND o.status = 'delivered' LIMIT 1`,
    [orderId, productId, req.user.id]
  );
  if (!eligible) {
    return res.status(403).json({ success: false, message: 'You can only review products from your own delivered orders.' });
  }

  try {
    await pool.query(
      'INSERT INTO reviews (product_id, user_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [productId, req.user.id, orderId, numRating, comment?.trim() || null]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'You already reviewed this product.' });
    }
    throw err;
  }

  await recalculateProductRating(productId);
  res.status(201).json({ success: true, message: 'Thanks for your review!' });
};

// GET /api/reviews  (admin only) — every review, for moderation
exports.listAll = async (req, res) => {
  const [reviews] = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.created_at,
            u.name AS user_name, u.email AS user_email,
            p.id AS product_id, p.name AS product_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     JOIN products p ON p.id = r.product_id
     ORDER BY r.created_at DESC LIMIT 300`
  );
  res.json({
    success: true,
    reviews: reviews.map((r) => ({
      id: r.id, rating: r.rating, comment: r.comment, createdAt: r.created_at,
      userName: r.user_name, userEmail: r.user_email,
      productId: r.product_id, productName: r.product_name,
    })),
  });
};

// DELETE /api/reviews/:id  (admin only) — moderation
exports.remove = async (req, res) => {
  const [[review]] = await pool.query('SELECT product_id FROM reviews WHERE id = ?', [req.params.id]);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found.' });
  }
  await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
  await recalculateProductRating(review.product_id);
  res.json({ success: true, message: 'Review removed.' });
};
