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
const META_CURRENCY = 'PKR';

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

const readCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const match = document.cookie.split('; ').find((part) => part.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
};

const rememberFbcFromUrl = () => {
  if (typeof window === 'undefined') return null;
  try {
    const fbclid = new URLSearchParams(window.location.search).get('fbclid');
    if (!fbclid) return null;
    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    window.localStorage.setItem('khan-meta-fbc', fbc);
    return fbc;
  } catch {
    return null;
  }
};

// Capture the Meta click ID as soon as the app loads, before SPA navigation
// removes fbclid from the address bar.
rememberFbcFromUrl();

export const getMetaTrackingContext = () => {
  if (typeof window === 'undefined') return { fbp: null, fbc: null, eventSourceUrl: null };

  try {
    const fbc = readCookie('_fbc')
      || rememberFbcFromUrl()
      || window.localStorage.getItem('khan-meta-fbc')
      || null;
    const fbp = readCookie('_fbp') || window.localStorage.getItem('khan-meta-fbp') || null;

    if (fbp) window.localStorage.setItem('khan-meta-fbp', fbp);

    return {
      fbp,
      fbc,
      eventSourceUrl: window.location.href,
    };
  } catch {
    return { fbp: null, fbc: null, eventSourceUrl: window.location.href };
  }
};

const isMetaReady = () =>
  typeof window !== 'undefined' &&
  typeof window.fbq === 'function';

const normalizeAdvancedEmail = (value) => String(value || '').trim().toLowerCase();
const normalizeAdvancedName = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const normalizeAdvancedPhone = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = '92' + digits.slice(1);
  if (!digits.startsWith('92') && digits.length <= 10) digits = '92' + digits;
  return digits;
};

const buildAdvancedMatching = (customer = {}) => {
  const fullName = normalizeAdvancedName(customer.fullName || customer.name);
  const nameParts = fullName.split(' ').filter(Boolean);
  const data = {};
  const email = normalizeAdvancedEmail(customer.email);
  const phone = normalizeAdvancedPhone(customer.phone);
  const firstName = normalizeAdvancedName(customer.firstName || nameParts[0] || '');
  const lastName = normalizeAdvancedName(customer.lastName || nameParts.slice(1).join(' '));
  const city = normalizeAdvancedName(customer.city);
  if (email) data.em = email;
  if (phone) data.ph = phone;
  if (firstName) data.fn = firstName;
  if (lastName) data.ln = lastName;
  if (city) data.ct = city;
  data.country = 'pk';
  return data;
};

export const initializeMetaPixel = (customer = {}) => {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return false;
  try {
    const advancedMatching = buildAdvancedMatching(customer);
    window.fbq('init', META_PIXEL_ID, advancedMatching);
    window.__KHAN_META_PIXEL_INITIALIZED = true;
    window.__KHAN_META_PIXEL_ADVANCED_MATCHING = advancedMatching;
    return true;
  } catch {
    return false;
  }
};

const toMetaMoney = (value) => {
  const amount = typeof value === 'string'
    ? Number(value.replace(/[^0-9.-]/g, ''))
    : Number(value);
  return Number.isFinite(amount) ? Math.round(Math.max(amount, 0) * 100) / 100 : null;
};

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
  const value = toMetaMoney(product.price);
  if (value === null) return false;
  return trackMetaEvent('ViewContent', {
    content_ids: [String(product.id)],
    content_name: product.name,
    content_type: 'product',
    value,
    currency: META_CURRENCY,
  }, { dedupeKey: `product-${product.id}` });
};

export const trackMetaAddToCart = (product, quantity = 1, actionId) => {
  if (!product) return false;
  const qty = Math.max(1, Number(quantity) || 1);
  const price = toMetaMoney(product.price);
  if (price === null) return false;
  return trackMetaEvent('AddToCart', {
    content_ids: [String(product.id)],
    content_name: product.name,
    content_type: 'product',
    value: toMetaMoney(price * qty),
    currency: META_CURRENCY,
    contents: [{
      id: String(product.id),
      quantity: qty,
      item_price: price,
    }],
  }, { dedupeKey: actionId || `product-${product.id}-${Date.now()}` });
};

export const trackMetaInitiateCheckout = (items, total, checkoutId) => {
  if (!Array.isArray(items) || items.length === 0) return false;
  const value = toMetaMoney(total);
  if (value === null) return false;
  return trackMetaEvent('InitiateCheckout', {
    content_ids: items.map((item) => String(item.id || item.productId)),
    contents: items.map((item) => ({
      id: String(item.id || item.productId),
      quantity: Math.max(1, Number(item.quantity) || 1),
      item_price: toMetaMoney(item.price) ?? 0,
    })),
    content_type: 'product',
    value,
    currency: META_CURRENCY,
    num_items: items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
  }, { dedupeKey: checkoutId || `checkout-${Date.now()}` });
};

export const trackMetaPurchase = (order) => {
  if (!order) return false;

  // Refresh manual Advanced Matching with the exact customer data attached to the order.
  initializeMetaPixel(order.customer || order);
  const orderId = order.orderId || order.orderNumber;
  if (!orderId) return false;

  // The API's order.total is the source of truth. Accept numeric strings as a
  // fallback for persisted/legacy orders, but never send NaN, Infinity, or an
  // empty value to Meta. Purchase is only fired when a valid monetary value exists.
  const value = toMetaMoney(order.total);
  if (value === null) return false;

  const items = Array.isArray(order.items) ? order.items : [];
  return trackMetaEvent('Purchase', {
    content_ids: items.map((item) => String(item.productId || item.id)),
    contents: items.map((item) => ({
      id: String(item.productId || item.id),
      quantity: Math.max(1, Number(item.quantity) || 1),
      item_price: toMetaMoney(item.price) ?? 0,
    })),
    content_type: 'product',
    value,
    currency: META_CURRENCY,
    num_items: items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    order_id: String(orderId),
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
      currency: META_CURRENCY,
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
    value: Number(product.price) * Number(quantity),
    currency: META_CURRENCY,
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
    currency: META_CURRENCY,
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
      currency: META_CURRENCY,
    });
  });
};

export const getMetaPixelConfig = () => ({
  pixelId: META_PIXEL_ID,
  enabledEvents: [...ENABLED_META_EVENTS],
});
