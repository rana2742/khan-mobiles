const Order = require('../models/Order');
const { bookPacket, trackPacket, cancelPacket, getCities } = require('../services/leopardsService');

const adminOrder = async (id) => {
  const order = await Order.findById(id);
  if (!order) throw Object.assign(new Error('Order not found.'), { statusCode: 404 });
  return order;
};

exports.cities = async (req, res) => {
  const cities = await getCities();
  res.json({ success: true, count: cities.length, cities });
};

exports.book = async (req, res) => {
  const order = await adminOrder(req.params.id);
  if (order.status === 'cancelled') return res.status(409).json({ success: false, message: 'Cancelled orders cannot be booked.' });
  if (order.courier?.trackingNumber) return res.status(409).json({ success: false, message: `This order is already booked with CN ${order.courier.trackingNumber}.` });
  const data = await bookPacket({ order, weightGrams: req.body.weightGrams, pieces: req.body.pieces, specialInstructions: req.body.specialInstructions });
  const trackNumber = data.track_number || data.data?.[0]?.track_number;
  const slipLink = data.slip_link || data.data?.[0]?.slip_link || null;
  if (!trackNumber) { const err = new Error('Leopards accepted the request but did not return a tracking number.'); err.statusCode = 502; throw err; }
  order.courier = { provider: 'leopards', trackingNumber: String(trackNumber), status: 'Booked', statusCode: 'RC', statusReason: null, slipLink, bookedAt: new Date(), lastUpdatedAt: new Date() };
  if (order.status === 'pending' || order.status === 'processing') order.status = 'shipped';
  await order.save();
  res.json({ success: true, message: 'Shipment booked with Leopards.', courier: order.courier, orderStatus: order.status });
};

exports.track = async (req, res) => {
  const order = await adminOrder(req.params.id);
  if (!order.courier?.trackingNumber) return res.status(409).json({ success: false, message: 'This order has not been booked with Leopards yet.' });
  const data = await trackPacket(order.courier.trackingNumber);
  const packet = data.packet_list?.[0];
  if (packet) { order.courier.status = packet.booked_packet_status || order.courier.status; order.courier.statusCode = packet.booked_packet_status_code || order.courier.statusCode; order.courier.lastUpdatedAt = new Date(); await order.save(); }
  res.json({ success: true, courier: order.courier, tracking: packet || null });
};

exports.cancel = async (req, res) => {
  const order = await adminOrder(req.params.id);
  if (!order.courier?.trackingNumber) return res.status(409).json({ success: false, message: 'This order has no Leopards tracking number.' });
  const data = await cancelPacket(order.courier.trackingNumber);
  order.courier.status = 'Cancelled'; order.courier.statusCode = null; order.courier.lastUpdatedAt = new Date(); await order.save();
  res.json({ success: true, message: 'Leopards shipment cancellation requested.', courier: order.courier, leopards: data });
};

exports.webhook = async (req, res) => {
  // The Push API documentation specifies a POST payload but does not specify
  // a fixed custom authentication header name. Do not require an invented
  // header here; configure a documented header only if Leopards provides one.
  const rows = Array.isArray(req.body?.data) ? req.body.data : [];
  for (const row of rows) {
    if (!row?.cn_number) continue;
    const order = await Order.findOne({ 'courier.trackingNumber': String(row.cn_number) });
    if (!order) continue;
    order.courier.status = row.status || order.courier.status;
    order.courier.statusCode = row.status || order.courier.statusCode;
    order.courier.statusReason = row.reason || null;
    order.courier.lastUpdatedAt = row.activity_date ? new Date(row.activity_date) : new Date();
    const code = String(row.status || '').toUpperCase();
    if (code === 'DV') order.status = 'delivered';
    else if (code === 'RS') order.status = 'cancelled';
    else if (['RC', 'AC', 'PN1', 'PN2', 'AR', 'DP', 'SP'].includes(code)) order.status = 'shipped';
    await order.save();
  }
  res.status(202).json([{ status: 1, errors: [] }]);
};
