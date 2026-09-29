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
