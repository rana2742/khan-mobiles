/**
 * Central GA4 analytics manager.
 *
 * GA4 is intentionally separate from Meta/TikTok tracking so failures here
 * can never affect checkout, orders, or advertising pixels.
 */
const GA4_MEASUREMENT_ID = 'G-DFWN0C350F';

const isReady = () =>
  typeof window !== 'undefined' &&
  typeof window.gtag === 'function';

const lastPageViewKey = { value: null };
const sentCheckoutKeys = new Set();
const sentPurchaseIds = new Set();

export const initializeGA4 = () => isReady();

export const trackGA4PageView = (pagePath) => {
  if (!isReady()) return false;

  const key = pagePath || window.location.pathname;
  // React StrictMode runs effects twice in development. Ignore only the
  // immediate duplicate while still allowing a later return to the same page.
  if (lastPageViewKey.value === key) return false;
  lastPageViewKey.value = key;

  try {
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: key,
      send_to: GA4_MEASUREMENT_ID,
    });
    return true;
  } catch {
    return false;
  }
};
const money = (value) => {
  const n = typeof value === 'string' ? Number(value.replace(/[^0-9.-]/g, '')) : Number(value);
  return Number.isFinite(n) ? Math.round(Math.max(n, 0) * 100) / 100 : 0;
};

export const trackGA4ViewItem = (product) => {
  if (!isReady() || !product) return false;
  try {
    window.gtag('event', 'view_item', {
      currency: 'PKR',
      value: money(product.price),
      items: [{
        item_id: String(product.id),
        item_name: product.name,
        item_brand: product.brand || undefined,
        item_category: product.category || undefined,
        price: money(product.price),
        quantity: 1,
      }],
      send_to: GA4_MEASUREMENT_ID,
    });
    return true;
  } catch {
    return false;
  }
};

export const trackGA4AddToCart = (product, quantity = 1) => {
  if (!isReady() || !product) return false;
  const qty = Math.max(1, Number(quantity) || 1);
  try {
    window.gtag('event', 'add_to_cart', {
      currency: 'PKR',
      value: money(product.price) * qty,
      items: [{
        item_id: String(product.id),
        item_name: product.name,
        item_brand: product.brand || undefined,
        item_category: product.category || undefined,
        price: money(product.price),
        quantity: qty,
      }],
      send_to: GA4_MEASUREMENT_ID,
    });
    return true;
  } catch {
    return false;
  }
};

export const trackGA4BeginCheckout = (items, total) => {
  if (!isReady() || !Array.isArray(items) || !items.length) return false;

  const checkoutKey = JSON.stringify({
    items: items.map((item) => [String(item.id || item.productId), Number(item.quantity) || 0, money(item.price)]),
    total: money(total),
  });
  if (sentCheckoutKeys.has(checkoutKey)) return false;

  try {
    window.gtag('event', 'begin_checkout', {
      currency: 'PKR',
      value: money(total),
      items: items.map((item) => ({
        item_id: String(item.id || item.productId),
        item_name: item.name,
        item_brand: item.brand || undefined,
        item_category: item.category || undefined,
        price: money(item.price),
        quantity: Math.max(1, Number(item.quantity) || 1),
      })),
      send_to: GA4_MEASUREMENT_ID,
    });
    sentCheckoutKeys.add(checkoutKey);
    return true;
  } catch {
    return false;
  }
};

export const trackGA4Purchase = (order) => {
  if (!isReady() || !order) return false;
  const transactionId = order.orderId || order.orderNumber;
  if (!transactionId) return false;

  const purchaseKey = String(transactionId);
  if (sentPurchaseIds.has(purchaseKey)) return false;

  try {
    window.gtag('event', 'purchase', {
      transaction_id: String(transactionId),
      currency: 'PKR',
      value: money(order.total),
      items: (Array.isArray(order.items) ? order.items : []).map((item) => ({
        item_id: String(item.productId || item.id),
        item_name: item.name,
        item_brand: item.brand || undefined,
        item_category: item.category || undefined,
        price: money(item.price),
        quantity: Math.max(1, Number(item.quantity) || 1),
      })),
      send_to: GA4_MEASUREMENT_ID,
    });
    sentPurchaseIds.add(purchaseKey);
    return true;
  } catch {
    return false;
  }
};