const crypto = require('crypto');

const PIXEL_ID = process.env.META_PIXEL_ID || '819668267751439';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v26.0';
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || '';

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizeName = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const normalizePhone = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `92${digits.slice(1)}`;
  if (!digits.startsWith('92') && digits.length <= 10) digits = `92${digits}`;
  return digits;
};

const hashIfPresent = (value) => {
  const normalized = String(value || '').trim();
  return normalized ? sha256(normalized) : undefined;
};

const buildUserData = ({ order, req, trackingContext = {} }) => {
  const firstName = normalizeName(order.fullName).split(' ')[0] || '';
  const lastName = normalizeName(order.fullName).split(' ').slice(1).join(' ');
  const userId = req.user?._id ? String(req.user._id) : '';

  const userData = {
    em: hashIfPresent(normalizeEmail(order.email)),
    ph: hashIfPresent(normalizePhone(order.phone)),
    fn: hashIfPresent(firstName),
    ln: hashIfPresent(lastName),
    ct: hashIfPresent(order.city),
    country: hashIfPresent('pk'),
    external_id: hashIfPresent(userId),
    client_user_agent: req.get('user-agent') || undefined,
    client_ip_address: req.ip || undefined,
  };

  if (trackingContext.fbp) userData.fbp = String(trackingContext.fbp);
  if (trackingContext.fbc) userData.fbc = String(trackingContext.fbc);

  return Object.fromEntries(Object.entries(userData).filter(([, value]) => value));
};

const sendMetaPurchase = async ({ order, req, trackingContext = {} }) => {
  if (!ACCESS_TOKEN || !GRAPH_API_VERSION) {
    return { sent: false, skipped: true, reason: 'META_ACCESS_TOKEN or META_GRAPH_API_VERSION is not configured.' };
  }

  const orderId = String(order.orderId || order.orderNumber || '');
  if (!orderId) return { sent: false, skipped: true, reason: 'Missing order ID.' };

  const items = Array.isArray(order.items) ? order.items : [];
  const value = Number(order.total);
  if (!Number.isFinite(value) || value < 0) {
    return { sent: false, skipped: true, reason: 'Invalid order total.' };
  }

  const event = {
    event_name: 'Purchase',
    event_time: Math.floor(new Date(order.placedAt || Date.now()).getTime() / 1000),
    event_id: `khan-Purchase-order-${orderId}`,
    action_source: 'website',
    event_source_url: trackingContext.eventSourceUrl || process.env.META_EVENT_SOURCE_URL || 'https://www.khanmobiles.store/order-confirmation',
    user_data: buildUserData({ order, req, trackingContext }),
    custom_data: {
      currency: 'PKR',
      value: Math.round(value * 100) / 100,
      content_type: 'product',
      content_ids: items.map((item) => String(item.productId || item.id)).filter(Boolean),
      contents: items.map((item) => ({
        id: String(item.productId || item.id),
        quantity: Math.max(1, Number(item.quantity) || 1),
        item_price: Math.round(Math.max(Number(item.price) || 0, 0) * 100) / 100,
      })),
      num_items: items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
      order_id: orderId,
    },
  };

  const payload = { data: [event] };
  if (TEST_EVENT_CODE) payload.test_event_code = TEST_EVENT_CODE;

  const response = await fetch(
    `https://graph.facebook.com/${encodeURIComponent(GRAPH_API_VERSION)}/${encodeURIComponent(PIXEL_ID)}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Meta CAPI Purchase failed (${response.status}): ${body?.error?.message || 'Unknown error'}`);
  }

  return { sent: true, body };
};

module.exports = { sendMetaPurchase };
