const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/Review');
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

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Your cart is empty.' });
  }
  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address before placing an order.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }
  if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !address?.trim() || !city?.trim()) {
    return res.status(400).json({ success: false, message: 'All delivery details are required.' });
  }

  const session = await mongoose.startSession();
  try {
    let orderDoc;

    // MongoDB Atlas's free tier is a replica set, so multi-document
    // transactions work here. Stock is checked and decremented atomically
    // per item (findOneAndUpdate with a stock >= quantity filter) instead of
    // MySQL's SELECT ... FOR UPDATE row locking — same effect: two
    // customers can't oversell the same low-stock item.
    await session.withTransaction(async () => {
      const orderItems = [];

      for (const item of items) {
        const productId = item.productId || item.id;
        if (!productId) continue;

        const updated = await Product.findOneAndUpdate(
          { _id: productId, isActive: true, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );

        if (!updated) {
          const product = await Product.findById(productId).session(session);
          if (!product || !product.isActive) {
            throw Object.assign(new Error(`"${item.name}" is no longer available.`), { statusCode: 409 });
          }
          throw Object.assign(
            new Error(product.stock === 0
              ? `"${product.name}" just sold out.`
              : `Only ${product.stock} left of "${product.name}" — please update your cart.`),
            { statusCode: 409 }
          );
        }

        orderItems.push({
          product: productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl || null,
        });
      }

      const orderNumber = generateOrderNumber();
      const [created] = await Order.create([{
        orderNumber,
        user: req.user._id,
        subtotal, discount, deliveryFee, total,
        promoCode: promoCode || null,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        landmark: landmark?.trim() || null,
        city: city.trim(),
        paymentMethod,
        items: orderItems,
      }], { session });

      orderDoc = created;
    });

    const orderPayload = {
      orderId: orderDoc._id.toString(),
      orderNumber: orderDoc.orderNumber,
      subtotal, discount, deliveryFee, total, items, fullName, email,
      placedAt: orderDoc.createdAt.toISOString(),
    };
    sendOrderConfirmationEmail(orderPayload).catch(() => {}); // fire-and-forget, never blocks the response

    res.status(201).json({ success: true, order: orderPayload });
  } finally {
    session.endSession();
  }
};

// GET /api/orders/mine  (requires auth)
exports.myOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

  // Which items in each order this user has already reviewed — lets the
  // frontend show "Leave a Review" only where it hasn't been done yet.
  const reviewed = await Review.find({ user: req.user._id }).select('product order');
  const reviewedSet = new Set(reviewed.map((r) => `${r.order}:${r.product}`));

  res.json({
    success: true,
    orders: orders.map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      subtotal: Number(o.subtotal),
      discount: Number(o.discount),
      deliveryFee: Number(o.deliveryFee),
      total: Number(o.total),
      status: o.status,
      city: o.city,
      address: o.address,
      landmark: o.landmark,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt,
      items: o.items.map((i) => ({
        productId: i.product ? i.product.toString() : null,
        name: i.name, price: Number(i.price), quantity: i.quantity, imageUrl: i.imageUrl,
        alreadyReviewed: i.product ? reviewedSet.has(`${o._id}:${i.product}`) : true,
      })),
    })),
  });
};

// PUT /api/orders/:id/cancel  (requires auth) — customer self-service, pending orders only
exports.cancelMine = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).session(session);
      if (!order) {
        throw Object.assign(new Error('Order not found.'), { statusCode: 404 });
      }
      if (order.status !== 'pending') {
        throw Object.assign(
          new Error(`This order is already ${order.status} and can no longer be cancelled. Contact us if you need help.`),
          { statusCode: 409 }
        );
      }

      order.status = 'cancelled';
      await order.save({ session });

      // Restock whatever was reserved for this order.
      for (const item of order.items) {
        if (item.product) {
          await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } }, { session });
        }
      }
    });

    res.json({ success: true, message: 'Order cancelled.' });
  } finally {
    session.endSession();
  }
};

// GET /api/orders  (admin only) — supports ?status= filter
exports.listAll = async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('user', 'name email');

  res.json({
    success: true,
    orders: orders.map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      customerName: o.user?.name,
      customerEmail: o.user?.email,
      total: Number(o.total),
      status: o.status,
      city: o.city,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt,
    })),
  });
};

// GET /api/orders/:id  (admin only) — full detail incl. items + shipping info, for fulfillment
exports.getOne = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  res.json({
    success: true,
    order: {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      customerName: order.user?.name,
      customerAccountEmail: order.user?.email,
      fullName: order.fullName,
      email: order.email,
      phone: order.phone,
      address: order.address,
      landmark: order.landmark,
      city: order.city,
      paymentMethod: order.paymentMethod,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),
      promoCode: order.promoCode,
      createdAt: order.createdAt,
      items: order.items.map((i) => ({
        name: i.name, price: Number(i.price), quantity: i.quantity, imageUrl: i.imageUrl,
        productId: i.product ? i.product.toString() : null,
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

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  // If admin cancels an order that wasn't already cancelled, restock the items.
  if (status === 'cancelled' && order.status !== 'cancelled') {
    for (const item of order.items) {
      if (item.product) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
      }
    }
  }

  order.status = status;
  await order.save();

  sendOrderStatusEmail(
    { orderNumber: order.orderNumber, email: order.email },
    status
  ).catch(() => {});

  res.json({ success: true, message: 'Order status updated.' });
};

// GET /api/orders/:id/invoice  (requires auth) — the order's own customer, or any admin
exports.downloadInvoice = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'You can only download your own invoices.' });
  }

  streamInvoice({
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    fullName: order.fullName,
    email: order.email,
    phone: order.phone,
    address: order.address,
    landmark: order.landmark,
    city: order.city,
    paymentMethod: order.paymentMethod,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    deliveryFee: Number(order.deliveryFee),
    total: Number(order.total),
    promoCode: order.promoCode,
    items: order.items.map((i) => ({ name: i.name, price: Number(i.price), quantity: i.quantity })),
  }, res);
};

// GET /api/orders/stats/summary  (admin only) — dashboard widgets + the navbar's live pending-order badge
exports.stats = async (req, res) => {
  const [pendingCount, totalOrders, revenueAgg, lowStockCount, productCount] = await Promise.all([
    Order.countDocuments({ status: 'pending' }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Product.countDocuments({ stock: { $lte: 10 }, isActive: true }),
    Product.countDocuments(),
  ]);

  res.json({
    success: true,
    stats: {
      pendingCount,
      totalOrders,
      totalRevenue: Number(revenueAgg[0]?.total || 0),
      lowStockCount,
      productCount,
    },
  });
};
