/**
 * Central Meta Pixel Event Manager
 *
 * Meta Pixel is initialized once in index.html.
 * This module is the ONLY place where application code should call fbq().
 *
 * Only events explicitly added to ENABLED_META_EVENTS can fire.
 * Tracking failures are swallowed so analytics can never break the shop UI.
 */

const META_PIXEL_ID = '819668267751439';

// Explicitly enabled events:
// - ViewContent: product detail page
// - AddToCart: Add to Cart button
// - InitiateCheckout: checkout opened
// - Purchase: order confirmation page
// - Contact: WhatsApp contact action
const ENABLED_META_EVENTS = new Set([
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'Purchase',
  'Contact',
]);

const DEDUPE_TTL_MS = 5000;
const sentEvents = new Map();

const isMetaReady = () =>
  typeof window !== 'undefined' &&
  typeof window.fbq === 'function';

const makeEventId = (eventName, dedupeKey) => {
  if (dedupeKey) return `khan-${eventName}-${String(dedupeKey)}`;

  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `khan-${eventName}-${crypto.randomUUID()}`;
    }
  } catch {
    // Fall through to the timestamp/random fallback.
  }

  return `khan-${eventName}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const cleanupDedupeCache = (now) => {
  for (const [key, timestamp] of sentEvents) {
    if (now - timestamp > DEDUPE_TTL_MS) sentEvents.delete(key);
  }
};

export const trackMetaEvent = (eventName, parameters = {}, options = {}) => {
  try {
    if (!ENABLED_META_EVENTS.has(eventName) || !isMetaReady()) return false;

    const now = Date.now();
    cleanupDedupeCache(now);

    const dedupeKey = options.dedupeKey
      ? `${eventName}:${String(options.dedupeKey)}`
      : null;

    if (dedupeKey && sentEvents.has(dedupeKey)) return false;
    if (dedupeKey) sentEvents.set(dedupeKey, now);

    window.fbq('track', eventName, parameters, {
      eventID: makeEventId(eventName, options.dedupeKey),
    });

    return true;
  } catch {
    return false;
  }
};

export const trackMetaViewContent = (product) => {
  if (!product) return false;
  return trackMetaEvent('ViewContent', {
    content_ids: [String(product.id)],
    content_name: product.name,
    content_type: 'product',
    value: Number(product.price),
    currency: 'PKR',
  }, { dedupeKey: `product-${product.id}` });
};

export const trackMetaAddToCart = (product, quantity = 1, actionId) => {
  if (!product) return false;
  const qty = Math.max(1, Number(quantity) || 1);
  return trackMetaEvent('AddToCart', {
    content_ids: [String(product.id)],
    content_name: product.name,
    content_type: 'product',
    value: Number(product.price) * qty,
    currency: 'PKR',
    contents: [{
      id: String(product.id),
      quantity: qty,
      item_price: Number(product.price),
    }],
  }, { dedupeKey: actionId || `product-${product.id}-${Date.now()}` });
};

export const trackMetaInitiateCheckout = (items, total, checkoutId) => {
  if (!Array.isArray(items) || items.length === 0) return false;
  return trackMetaEvent('InitiateCheckout', {
    content_ids: items.map((item) => String(item.id || item.productId)),
    contents: items.map((item) => ({
      id: String(item.id || item.productId),
      quantity: Math.max(1, Number(item.quantity) || 1),
      item_price: Number(item.price),
    })),
    content_type: 'product',
    value: Number(total),
    currency: 'PKR',
    num_items: items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
  }, { dedupeKey: checkoutId || `checkout-${Date.now()}` });
};

export const trackMetaPurchase = (order) => {
  if (!order) return false;
  const orderId = order.orderId || order.orderNumber;
  if (!orderId) return false;
  return trackMetaEvent('Purchase', {
    content_ids: (order.items || []).map((item) => String(item.productId || item.id)),
    contents: (order.items || []).map((item) => ({
      id: String(item.productId || item.id),
      quantity: Math.max(1, Number(item.quantity) || 1),
      item_price: Number(item.price),
    })),
    content_type: 'product',
    value: Number(order.total),
    currency: 'PKR',
  }, { dedupeKey: `order-${orderId}` });
};

export const trackMetaContact = (contactId = 'whatsapp') =>
  trackMetaEvent('Contact', {}, { dedupeKey: `contact-${contactId}` });

const isTikTokReady = () =>
  typeof window !== 'undefined' &&
  window.ttq &&
  typeof window.ttq.track === 'function';

const oncePerSession = (key, callback) => {
  try {
    const storageKey = 'khan-ttq-' + key;
    if (window.sessionStorage.getItem(storageKey)) return;
    window.sessionStorage.setItem(storageKey, '1');
    callback();
  } catch {
    callback();
  }
};

export const trackTikTokViewContent = (product) => {
  if (!isTikTokReady() || !product) return;
  oncePerSession(`tt-view-${String(product.id)}`, () => {
    window.ttq.track('ViewContent', {
      contents: [{
        content_id: String(product.id),
        content_name: product.name,
        content_type: 'product',
        quantity: 1,
        price: Number(product.price),
      }],
      content_type: 'product',
      value: Number(product.price),
      currency: 'PKR',
    });
  });
};

export const trackTikTokAddToCart = (product, quantity = 1) => {
  if (!isTikTokReady() || !product) return;
  window.ttq.track('AddToCart', {
    contents: [{
      content_id: String(product.id),
      content_name: product.name,
      content_type: 'product',
      quantity: Number(quantity),
      price: Number(product.price),
    }],
    content_type: 'product',
    value: Number(product.price) * Number(quantity),
    currency: 'PKR',
  });
};

export const trackTikTokInitiateCheckout = (items, total) => {
  if (!isTikTokReady() || !items?.length) return;
  window.ttq.track('InitiateCheckout', {
    contents: items.map((item) => ({
      content_id: String(item.id || item.productId),
      content_name: item.name,
      content_type: 'product',
      quantity: Number(item.quantity),
      price: Number(item.price),
    })),
    value: Number(total),
    currency: 'PKR',
  });
};

export const trackTikTokPurchase = (order) => {
  if (!isTikTokReady() || !order) return;
  const key = `tt-purchase-${order.orderId || order.orderNumber}`;
  oncePerSession(key, () => {
    window.ttq.track('Purchase', {
      contents: (order.items || []).map((item) => ({
        content_id: String(item.productId || item.id),
        content_name: item.name,
        content_type: 'product',
        quantity: Number(item.quantity),
        price: Number(item.price),
      })),
      value: Number(order.total),
      currency: 'PKR',
    });
  });
};

export const getMetaPixelConfig = () => ({
  pixelId: META_PIXEL_ID,
  enabledEvents: [...ENABLED_META_EVENTS],
});
