const META_PIXEL_ID = '819668267751439';

const isReady = () => typeof window !== 'undefined' && typeof window.fbq === 'function';

export const trackPageView = () => {
  if (!isReady()) return;
  window.fbq('track', 'PageView');
};

export const trackViewContent = (product) => {
  if (!isReady() || !product) return;
  window.fbq('track', 'ViewContent', {
    content_ids: [String(product.id)],
    content_name: product.name,
    content_type: 'product',
    value: Number(product.price),
    currency: 'PKR',
  });
};

export const trackAddToCart = (product, quantity = 1) => {
  if (!isReady() || !product) return;
  window.fbq('track', 'AddToCart', {
    content_ids: [String(product.id)],
    content_name: product.name,
    content_type: 'product',
    value: Number(product.price) * Number(quantity),
    currency: 'PKR',
    contents: [{
      id: String(product.id),
      quantity: Number(quantity),
      item_price: Number(product.price),
    }],
  });
};

export const trackInitiateCheckout = (items, total) => {
  if (!isReady() || !items?.length) return;
  window.fbq('track', 'InitiateCheckout', {
    content_ids: items.map((item) => String(item.id || item.productId)),
    contents: items.map((item) => ({
      id: String(item.id || item.productId),
      quantity: Number(item.quantity),
      item_price: Number(item.price),
    })),
    content_type: 'product',
    num_items: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    value: Number(total),
    currency: 'PKR',
  });
};

export const trackPurchase = (order) => {
  if (!isReady() || !order) return;
  window.fbq('track', 'Purchase', {
    content_ids: (order.items || []).map((item) => String(item.productId || item.id)),
    contents: (order.items || []).map((item) => ({
      id: String(item.productId || item.id),
      quantity: Number(item.quantity),
      item_price: Number(item.price),
    })),
    content_type: 'product',
    num_items: (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    value: Number(order.total),
    currency: 'PKR',
  });
};

export { META_PIXEL_ID };
