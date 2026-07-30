const { pool } = require('../config/db');
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require('../utils/email');
const { streamInvoice } = require('../utils/invoice');

const generateOrderNumber = () => `KM-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;

// POST /api/orders  (requires auth)
// Body: { items: [{productId, name, price, quantity, imageUrl}], subtotal, discount, deliveryFee, total,
//         promoCode, fullName, email, phone, address, landmark, city, paymentMethod }
exports.create = async (req, res) => {
  const {
    items, subtotal, discount = 0, deliveryFee = 0, total,
    promoCode, fullName, email, phone, address, landmark, city, paymentMethod = 'cod',
  } = req.body;

 

  const conn = await pool.getConnection();
  try {if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Your cart is empty.' });
  }
  if (!req.user.email_verified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address before placing an order.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }
  if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !address?.trim() || !city?.trim()) {
    return res.status(400).json({ success: false, message: 'All delivery details are required.' });
  }
    await conn.beginTransaction();

    // Lock and verify stock for every line item before committing to the order —
    // prevents overselling if two customers check out the same low-stock item at once.
    for (const item of items) {
      const productId = item.productId || item.id;
      if (!productId) continue;
      const [[product]] = await conn.query('SELECT id, name, stock, is_active FROM products WHERE id = ? FOR UPDATE', [productId]);
      if (!product || !product.is_active) {
        throw Object.assign(new Error(`"${item.name}" is no longer available.`), { statusCode: 409 });
      }
      if (product.stock < item.quantity) {
        throw Object.assign(
          new Error(product.stock === 0
            ? `"${product.name}" just sold out.`
            : `Only ${product.stock} left of "${product.name}" — please update your cart.`),
          { statusCode: 409 }
        );
      }
    }

    const orderNumber = generateOrderNumber();
    const [orderResult] = await conn.query(
      `INSERT INTO orders
        (order_number, user_id, subtotal, discount, delivery_fee, total, promo_code,
         full_name, email, phone, address, landmark, city, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber, req.user.id, subtotal, discount, deliveryFee, total, promoCode || null,
        fullName.trim(), email.trim(), phone.trim(), address.trim(), landmark?.trim() || null, city.trim(), paymentMethod,
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, name, price, quantity, image_url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId || item.id || null, item.name, item.price, item.quantity, item.imageUrl || null]
      );
      if (item.productId || item.id) {
        await conn.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.productId || item.id]
        );
      }
    }

    await conn.commit();

    const orderPayload = { orderId, orderNumber, subtotal, discount, deliveryFee, total, items, fullName, email, placedAt: new Date().toISOString() };
    sendOrderConfirmationEmail(orderPayload).catch(() => {}); // fire-and-forget, never blocks the response

    res.status(201).json({ success: true, order: orderPayload });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// GET /api/orders/mine  (requires auth)
exports.myOrders = async (req, res) => {
  const [orders] = await pool.query(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );
  const orderIds = orders.map((o) => o.id);
  let itemsByOrder = {};
  if (orderIds.length) {
    const [items] = await pool.query(
      `SELECT * FROM order_items WHERE order_id IN (${orderIds.map(() => '?').join(',')})`,
      orderIds
    );
    itemsByOrder = items.reduce((acc, item) => {
      (acc[item.order_id] ||= []).push(item);
      return acc;
    }, {});
  }

  // Which items in each order this user has already reviewed — lets the
  // frontend show "Leave a Review" only where it hasn't been done yet.
  const [reviewed] = await pool.query('SELECT product_id, order_id FROM reviews WHERE user_id = ?', [req.user.id]);
  const reviewedSet = new Set(reviewed.map((r) => `${r.order_id}:${r.product_id}`));

  res.json({
    success: true,
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      subtotal: Number(o.subtotal),
      discount: Number(o.discount),
      deliveryFee: Number(o.delivery_fee),
      total: Number(o.total),
      status: o.status,
      city: o.city,
      address: o.address,
      landmark: o.landmark,
      paymentMethod: o.payment_method,
      createdAt: o.created_at,
      items: (itemsByOrder[o.id] || []).map((i) => ({
        productId: i.product_id,
        name: i.name, price: Number(i.price), quantity: i.quantity, imageUrl: i.image_url,
        alreadyReviewed: i.product_id ? reviewedSet.has(`${o.id}:${i.product_id}`) : true,
      })),
    })),
  });
};

// PUT /api/orders/:id/cancel  (requires auth) — customer self-service, pending orders only
exports.cancelMine = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[order]] = await conn.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? FOR UPDATE',
      [req.params.id, req.user.id]
    );
    if (!order) {
      throw Object.assign(new Error('Order not found.'), { statusCode: 404 });
    }
    if (order.status !== 'pending') {
      throw Object.assign(
        new Error(`This order is already ${order.status} and can no longer be cancelled. Contact us if you need help.`),
        { statusCode: 409 }
      );
    }

    await conn.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [order.id]);

    // Restock whatever was reserved for this order.
    const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [order.id]);
    for (const item of items) {
      if (item.product_id) {
        await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }

    await conn.commit();
    res.json({ success: true, message: 'Order cancelled.' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// GET /api/orders  (admin only) — supports ?status= filter
exports.listAll = async (req, res) => {
  const { status } = req.query;
  const where = status ? 'WHERE o.status = ?' : '';
  const params = status ? [status] : [];

  const [orders] = await pool.query(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email FROM orders o
     JOIN users u ON u.id = o.user_id ${where} ORDER BY o.created_at DESC LIMIT 200`,
    params
  );
  res.json({
    success: true,
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      customerEmail: o.customer_email,
      total: Number(o.total),
      status: o.status,
      city: o.city,
      paymentMethod: o.payment_method,
      createdAt: o.created_at,
    })),
  });
};

// GET /api/orders/:id  (admin only) — full detail incl. items + shipping info, for fulfillment
exports.getOne = async (req, res) => {
  const [[order]] = await pool.query(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_account_email FROM orders o
     JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
    [req.params.id]
  );
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }
  const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

  res.json({
    success: true,
    order: {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      customerName: order.customer_name,
      customerAccountEmail: order.customer_account_email,
      fullName: order.full_name,
      email: order.email,
      phone: order.phone,
      address: order.address,
      landmark: order.landmark,
      city: order.city,
      paymentMethod: order.payment_method,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      deliveryFee: Number(order.delivery_fee),
      total: Number(order.total),
      promoCode: order.promo_code,
      createdAt: order.created_at,
      items: items.map((i) => ({
        name: i.name, price: Number(i.price), quantity: i.quantity, imageUrl: i.image_url, productId: i.product_id,
      })),
    },
  });
};

// PUT /api/orders/:id/status  (admin only)
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  const [[order]] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  // If admin cancels an order that wasn't already cancelled, restock the items.
  if (status === 'cancelled' && order.status !== 'cancelled') {
    const [items] = await pool.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [order.id]);
    for (const item of items) {
      if (item.product_id) {
        await pool.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }
  }

  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);

  sendOrderStatusEmail(
    { orderNumber: order.order_number, email: order.email },
    status
  ).catch(() => {});

  res.json({ success: true, message: 'Order status updated.' });
};

// GET /api/orders/:id/invoice  (requires auth) — the order's own customer, or any admin
exports.downloadInvoice = async (req, res) => {
  const [[order]] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }
  if (order.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'You can only download your own invoices.' });
  }

  const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

  streamInvoice({
    orderNumber: order.order_number,
    status: order.status,
    createdAt: order.created_at,
    fullName: order.full_name,
    email: order.email,
    phone: order.phone,
    address: order.address,
    landmark: order.landmark,
    city: order.city,
    paymentMethod: order.payment_method,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    deliveryFee: Number(order.delivery_fee),
    total: Number(order.total),
    promoCode: order.promo_code,
    items: items.map((i) => ({ name: i.name, price: Number(i.price), quantity: i.quantity })),
  }, res);
};

// GET /api/orders/stats/summary  (admin only) — dashboard widgets + the navbar's live pending-order badge
exports.stats = async (req, res) => {
  const [[{ pendingCount }]] = await pool.query("SELECT COUNT(*) AS pendingCount FROM orders WHERE status = 'pending'");
  const [[{ totalOrders }]] = await pool.query('SELECT COUNT(*) AS totalOrders FROM orders');
  const [[{ totalRevenue }]] = await pool.query(
    "SELECT COALESCE(SUM(total), 0) AS totalRevenue FROM orders WHERE status != 'cancelled'"
  );
  const [[{ lowStockCount }]] = await pool.query(
    'SELECT COUNT(*) AS lowStockCount FROM products WHERE stock <= 10 AND is_active = 1'
  );
  const [[{ productCount }]] = await pool.query('SELECT COUNT(*) AS productCount FROM products');

  res.json({
    success: true,
    stats: {
      pendingCount,
      totalOrders,
      totalRevenue: Number(totalRevenue),
      lowStockCount,
      productCount,
    },
  });
};
