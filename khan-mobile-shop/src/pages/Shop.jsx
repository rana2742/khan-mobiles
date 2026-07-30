import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PHONE_MODELS } from '../data/homeData';
import { api } from '../services/api';
import { sectionVariants, itemVariants } from '../utils/motionVariants';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import Container from '../components/Container';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';

// ─── Constants ────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'popular',   label: 'Most Popular' },
  { value: 'newest',    label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc',label: 'Price: High to Low' },
];
const PAGE_SIZE = 8;

// ─── Phone model search bar ───────────────────────────────────────────────────
const PhoneSearchBar = ({ value, onChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  const handleChange = (e) => {
    const q = e.target.value;
    onChange(q);
    if (q.trim().length > 0) {
      const matches = PHONE_MODELS.filter((m) =>
        m.toLowerCase().includes(q.toLowerCase())
      );
      setSuggestions(matches);
      setOpen(matches.length > 0);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  };

  const pick = (model) => {
    onChange(model);
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.blur();
  };

  const clear = () => { onChange(''); setSuggestions([]); setOpen(false); };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        {/* Search icon */}
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-accent">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
        </span>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => value && suggestions.length && setOpen(true)}
          placeholder='Search by phone model — e.g. "iPhone 13", "Samsung A54", "Redmi Note 12"'
          aria-label="Search by phone model"
          className="w-full bg-navy-800 border-2 border-navy-700 focus:border-accent focus:outline-none rounded-xl3 pl-14 pr-12 py-4 text-slate-900 placeholder-slate-500 text-base transition-all duration-200 focus:shadow-glow"
        />

        {/* Clear button */}
        {value && (
          <button onClick={clear} aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 right-0 bg-navy-800 border border-navy-700 rounded-xl2 overflow-hidden z-30 shadow-card"
            role="listbox"
          >
            {suggestions.map((model) => (
              <li key={model}>
                <button
                  onMouseDown={() => pick(model)}
                  className="w-full text-left px-5 py-3 text-sm text-slate-700 hover:bg-accent/10 hover:text-accent transition-colors flex items-center gap-3"
                  role="option"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-accent shrink-0">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                  {model}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Popular models */}
      {!value && (
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          {['iPhone 14', 'Samsung S23', 'Redmi Note 12', 'Samsung A54', 'OnePlus 11'].map((m) => (
            <button key={m} onClick={() => pick(m)}
              className="text-xs px-3 py-1.5 rounded-full bg-navy-800 border border-navy-700 text-slate-500 hover:border-accent hover:text-accent transition-colors">
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Sidebar filter panel ─────────────────────────────────────────────────────
const FilterSidebar = ({ filters, onChange, categories, brands, maxPrice }) => {
  const toggle = (key, value) => {
    const current = filters[key];
    onChange(key, current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
  };

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-navy-800 rounded-xl2 p-6 sticky top-24 space-y-8">

        {/* Sort */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Sort By</h3>
          <select
            value={filters.sort}
            onChange={(e) => onChange('sort', e.target.value)}
            className="w-full bg-navy-700 border border-navy-700 text-slate-900 text-sm rounded-xl2 px-4 py-2.5 focus:outline-none focus:border-accent"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Category */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Category</h3>
          <div className="space-y-2">
            {['All', ...categories].map((cat) => (
              <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox"
                  checked={cat === 'All' ? filters.categories.length === 0 : filters.categories.includes(cat)}
                  onChange={() => cat === 'All' ? onChange('categories', []) : toggle('categories', cat)}
                  className="w-4 h-4 rounded accent-accent bg-navy-700 border-navy-600 cursor-pointer"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price range */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Max Price</h3>
          <input type="range" min={0} max={maxPrice || 1000} step={100}
            value={filters.maxPrice}
            onChange={(e) => onChange('maxPrice', Number(e.target.value))}
            className="w-full accent-accent cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Rs. 0</span>
            <span className="text-accent font-semibold">Rs. {filters.maxPrice.toLocaleString('en-PK')}</span>
          </div>
        </div>

        {/* Brand */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Brand</h3>
          <div className="space-y-2">
            {['All', ...brands].map((brand) => (
              <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox"
                  checked={brand === 'All' ? filters.brands.length === 0 : filters.brands.includes(brand)}
                  onChange={() => brand === 'All' ? onChange('brands', []) : toggle('brands', brand)}
                  className="w-4 h-4 rounded accent-accent bg-navy-700 border-navy-600 cursor-pointer"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{brand}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={() => onChange('reset')}
          className="w-full text-sm text-slate-500 hover:text-slate-900 border border-navy-700 hover:border-accent rounded-xl2 py-2 transition-colors"
        >
          Reset Filters
        </button>
      </div>
    </aside>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ phoneQuery }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-24 text-center">
    <span className="text-7xl mb-6">🔍</span>
    <h3 className="text-2xl font-bold mb-2">No results found</h3>
    {phoneQuery ? (
      <p className="text-slate-500 max-w-sm">
        We couldn&apos;t find any accessories compatible with <span className="text-accent font-semibold">&quot;{phoneQuery}&quot;</span>.
        Try a different phone model.
      </p>
    ) : (
      <p className="text-slate-500 max-w-sm">Try adjusting your filters or search query.</p>
    )}
  </motion.div>
);

// ─── Main Shop page ───────────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  sort: 'popular',
  categories: [],
  brands: [],
  maxPrice: Infinity,
};

const Shop = () => {
  const [searchParams] = useSearchParams();
  const [phoneQuery, setPhoneQuery] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState(() => {
    const categoryParam = searchParams.get('category');
    return categoryParam
      ? { ...DEFAULT_FILTERS, categories: [categoryParam] }
      : DEFAULT_FILTERS;
  });
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/api/products?limit=200')
      .then((data) => {
        if (cancelled) return;
        setProducts(data.products);
        // Once we know the real price ceiling, relax the default filter to match.
        setFilters((f) => (f.maxPrice === Infinity
          ? { ...f, maxPrice: Math.max(...data.products.map((p) => p.price), 1000) }
          : f));
      })
      .catch((err) => !cancelled && setLoadError(err.message || 'Could not load products.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))], [products]);
  const maxPrice = useMemo(() => Math.max(...products.map((p) => p.price), 1000), [products]);

  // Re-sync filters/search whenever the URL query changes (e.g. clicking a
  // category card or navbar search while already on the Shop page).
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    setFilters((f) => ({ ...f, categories: categoryParam ? [categoryParam] : [] }));
    setPhoneQuery(searchParam || '');
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleFilter = (key, value) => {
    if (key === 'reset') { setFilters({ ...DEFAULT_FILTERS, maxPrice }); setPage(1); return; }
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const filtered = useMemo(() => {
    let list = [...products];

    // Phone model / keyword search — matches compatible phone models as well
    // as product name, brand, and category so navbar search works too.
    if (phoneQuery.trim()) {
      const q = phoneQuery.toLowerCase();
      list = list.filter((p) =>
        p.compatibleModels.some((m) => m.toLowerCase().includes(q)) ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filters.categories.length > 0)
      list = list.filter((p) => filters.categories.includes(p.category));

    // Brand filter
    if (filters.brands.length > 0)
      list = list.filter((p) => filters.brands.includes(p.brand));

    // Price filter
    if (filters.maxPrice !== Infinity)
      list = list.filter((p) => p.price <= filters.maxPrice);

    // Sort
    switch (filters.sort) {
      case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'newest':     list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case 'popular':
      default:           list.sort((a, b) => b.rating - a.rating); break;
    }

    return list;
  }, [phoneQuery, filters, products]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  return (
    <>
      <SEO
        title="Shop"
        description="Browse cases, chargers, earphones, power banks, screen protectors, and smartwatches for every phone model. Fast delivery across Pakistan."
        path="/shop"
      />
      <Navbar />
      <main className="pt-16 min-h-screen">

        {/* ── Phone model search hero ── */}
        <section className="bg-gradient-to-b from-navy-800 to-navy py-16">
          <Container>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }} className="text-center mb-8">
              <span className="text-xs font-semibold tracking-widest uppercase text-accent mb-3 block">
                Find The Perfect Fit
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold mb-3">
                Shop by Phone Model
              </h1>
              <p className="text-slate-500 text-base max-w-lg mx-auto">
                Enter your phone model and instantly see all compatible accessories.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}>
              <PhoneSearchBar value={phoneQuery} onChange={(v) => { setPhoneQuery(v); setPage(1); }} />
            </motion.div>

            {phoneQuery && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center text-sm text-slate-500 mt-4">
                Showing accessories compatible with{' '}
                <span className="text-accent font-semibold">{phoneQuery}</span>
                {' '}— {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </motion.p>
            )}
          </Container>
        </section>

        {/* ── Products area ── */}
        <section className="py-12">
          <Container>
            <div className="flex flex-col lg:flex-row gap-8">

              <FilterSidebar filters={filters} onChange={handleFilter} categories={categories} brands={brands} maxPrice={maxPrice} />

              <div className="flex-1 min-w-0">
                {/* Result count */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-slate-500">
                    {loading ? 'Loading products…' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''} found`}
                  </p>
                </div>

                {loadError ? (
                  <div className="text-center py-24">
                    <span className="text-6xl mb-4 block">⚠️</span>
                    <p className="text-slate-900 font-semibold mb-1">Couldn&apos;t load products</p>
                    <p className="text-slate-500 text-sm">{loadError}</p>
                  </div>
                ) : loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="bg-navy-800 rounded-xl2 h-72 animate-pulse" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <EmptyState phoneQuery={phoneQuery} />
                ) : (
                  <>
                    <motion.div
                      variants={sectionVariants}
                      initial="hidden"
                      animate="visible"
                      key={`${phoneQuery}-${JSON.stringify(filters)}`}
                      className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5"
                    >
                      {paginated.map((product) => (
                        <motion.div key={product.id} variants={itemVariants}>
                          <ProductCard {...product} />
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Load more */}
                    {hasMore && (
                      <div className="mt-10 flex justify-center">
                        <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
                          Load More ({filtered.length - paginated.length} remaining)
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Shop;
