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
    contents: [{ id: String(product.id), quantity: Number(quantity), item_price: Number(product.price) }],
  });
};

export const trackInitiateCheckout = (items, total) => {
  if (!isReady() || !items?.length) return;
  window.fbq('track', 'InitiateCheckout', {
    content_ids: items.map((item) => String(item.id || item.productId)),
    contents: items.map((item) => ({ id: String(item.id || item.productId), quantity: Number(item.quantity), item_price: Number(item.price) })),
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
    contents: (order.items || []).map((item) => ({ id: String(item.productId || item.id), quantity: Number(item.quantity), item_price: Number(item.price) })),
    content_type: 'product',
    num_items: (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    value: Number(order.total),
    currency: 'PKR',
  });
};

// The shop already fires TikTok ecommerce events in ProductDetail, ProductCard,
// Checkout and OrderConfirmation. Mirror those same events to Meta so the two
// pixels stay aligned without duplicating ecommerce logic in every component.
const bridgeExistingTikTokEvents = () => {
  if (typeof window === 'undefined' || !window.ttq || !isReady() || window.__khanMetaTikTokBridgeInstalled) return;

  const originalTrack = window.ttq.track?.bind(window.ttq);
  if (!originalTrack) return;

  window.ttq.track = (eventName, data = {}) => {
    originalTrack(eventName, data);
    if (!isReady()) return;

    const contents = Array.isArray(data.contents) ? data.contents : [];
    const metaContents = contents.map((item) => ({
      id: String(item.content_id || item.id),
      quantity: Number(item.quantity || 1),
      item_price: Number(item.price ?? item.item_price ?? 0),
    }));

    const metaData = {
      content_ids: metaContents.map((item) => item.id),
      contents: metaContents,
      content_type: 'product',
      value: Number(data.value || 0),
      currency: data.currency || 'PKR',
    };

    if (eventName === 'ViewContent' || eventName === 'AddToCart') {
      metaData.content_name = contents[0]?.content_name;
      window.fbq('track', eventName, metaData);
    } else if (eventName === 'InitiateCheckout' || eventName === 'Purchase') {
      metaData.num_items = metaContents.reduce((sum, item) => sum + item.quantity, 0);
      window.fbq('track', eventName, metaData);
    }
  };

  window.__khanMetaTikTokBridgeInstalled = true;
};

bridgeExistingTikTokEvents();

export { META_PIXEL_ID };
