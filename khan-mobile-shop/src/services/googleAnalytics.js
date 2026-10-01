const GA4_MEASUREMENT_ID = 'G-DFWN0C350F';

const isReady = () =>
  typeof window !== 'undefined' && typeof window.gtag === 'function';

const toMoney = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(Math.max(amount, 0) * 100) / 100 : 0;
};

export const initializeGA4 = () => {
  if (typeof window === 'undefined') return false;
  try {
    if (window.__KHAN_GA4_INITIALIZED) return true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID, { send_page_view: false });
    window.__KHAN_GA4_INITIALIZED = true;
    return true;
  } catch {
    return false;
  }
};

export const trackGA4PageView = (path, title) => {
  if (!isReady()) return false;
  try {
    window.gtag('event', 'page_view', {
      page_title: title || document.title,
      page_location: window.location.href,
      page_path: path || window.location.pathname,
    });
    return true;
  } catch {
    return false;
  }
};

export const trackGA4ViewItem = (product) => {
  if (!isReady() || !product) return false;
  try {
    window.gtag('event', 'view_item', {
      currency: 'PKR',
      value: toMoney(product.price),
      items: [{
        item_id: String(product.id),
        item_name: product.name,
        item_brand: product.brand || undefined,
        item_category: product.category || undefined,
        price: toMoney(product.price),
        quantity: 1,
      }],
    });
    return true;
  } catch {
    return false;
  }
};

export const trackGA4AddToCart = (product, quantity = 1) => {
  if (!isReady() || !product) return false;
  try {
    const qty = Math.max(1, Number(quantity) || 1);
    const price = toMoney(product.price);
    window.gtag('event', 'add_to_cart', {
      currency: 'PKR',
      value: toMoney(price * qty),
      items: [{
        item_id: String(product.id),
        item_name: product.name,
        item_brand: product.brand || undefined,
        item_category: product.category || undefined,
        price,
        quantity: qty,
      }],
    });
    return true;
  } catch {
    return false;
  }
};

export const trackGA4BeginCheckout = (items, total) => {
  if (!isReady() || !Array.isArray(items) || !items.length) return false;
  try {
    window.gtag('event', 'begin_checkout', {
      currency: 'PKR',
      value: toMoney(total),
      items: items.map((item) => ({
        item_id: String(item.id || item.productId),
        item_name: item.name,
        item_brand: item.brand || undefined,
        item_category: item.category || undefined,
        price: toMoney(item.price),
        quantity: Math.max(1, Number(item.quantity) || 1),
      })),
    });
    return true;
  } catch {
    return false;
  }
};

export const trackGA4Purchase = (order) => {
  if (!isReady() || !order) return false;
  const orderId = order.orderId || order.orderNumber;
  if (!orderId) return false;
  try {
    window.gtag('event', 'purchase', {
      transaction_id: String(orderId),
      value: toMoney(order.total),
      currency: 'PKR',
      items: (Array.isArray(order.items) ? order.items : []).map((item) => ({
        item_id: String(item.productId || item.id),
        item_name: item.name,
        item_brand: item.brand || undefined,
        item_category: item.category || undefined,
        price: toMoney(item.price),
        quantity: Math.max(1, Number(item.quantity) || 1),
      })),
    });
    return true;
  } catch {
    return false;
  }
};

export const getGA4MeasurementId = () => GA4_MEASUREMENT_ID;
