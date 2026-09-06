export const SLIDES_DATA = [

  {
    id: 'slide-1',
    subtext: 'Crystal-clear earphones & headphones at unbeatable prices.',
    cta: 'Shop Audio',
    bgImage: '/images/headphone.png',
    bgPosition: '80% center', // shift focus right, toward the headphones
    accentColor: '#22c55e',
    category: 'Earphones',
  },
  {
    id: 'slide-2',
    subtext: 'Discover stylish smartwatches with fitness tracking, heart-rate monitoring, and long-lasting battery life.',
    cta: 'Explore Watches',
    bgImage: '/images/watch.png',
    bgPosition: '20% center', // shift focus left, toward the watch
    accentColor: '#0EA5E9',
    category: 'Smartwatches',
  },
  {
    id: 'slide-3',
    subtext: 'Compact earbuds with rich sound and all-day battery life.',
    cta: 'Shop Earbuds',
    bgImage: '/images/airbuds.png',
    bgPosition: '80% center', // shift focus right, toward the headphones
    accentColor: '#eab308',
    category: 'Earbuds',
  },
    {
    id: 'slide-4',
    subtext: 'Compact earbuds with rich sound and all-day battery life.',
    cta: 'Shop Earbuds',
    bgImage: '/images/eirbuds2.png',
    bgPosition: '80% center', // shift focus right, toward the headphones
    accentColor: '#eab308',
    category: 'Earbuds',
  },
]; 
// ─── CATEGORIES_DATA ──────────────────────────────────────────────────────────
export const CATEGORIES_DATA = [
  { id: 'earbuds', label: 'Earbuds', icon: '👂' },
  { id: 'chargers',          label: 'Chargers',          icon: '⚡' },
  { id: 'earphones',         label: 'Earphones',         icon: '🎧' },
  { id: 'power-banks',       label: 'Power Banks',       icon: '🔋' },
  { id: 'screen-protectors', label: 'Screen Protectors', icon: '🛡️' },
  { id: 'smartwatches',      label: 'Smartwatches',      icon: '⌚' },
];

// ─── STATS_DATA ───────────────────────────────────────────────────────────────
export const STATS_DATA = [
  { id: 'customers', value: 10000, suffix: '+',  label: 'Happy Customers' },
  { id: 'products',  value: 500,   suffix: '+',  label: 'Products' },
  { id: 'rating',    value: 4.8,   suffix: '★',  label: 'Avg Rating', isDecimal: true },
  { id: 'delivery',  value: 0,     suffix: '',   label: 'Free Delivery', isStatic: true, display: '🚚 Free' },
];

export const PHONE_MODELS = [
  'iPhone 13', 'iPhone 14', 'iPhone 15',
  'Samsung S23', 'Samsung S22', 'Samsung A54',
  'Redmi Note 12', 'Redmi Note 11',
  'OnePlus 11', 'Android Universal', 'iPad',
];
