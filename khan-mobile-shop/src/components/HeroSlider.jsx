import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import Button from './Button';
import Container from './Container';

const SLIDE_DURATION = 5000;
const FALLBACK_PRODUCTS = [
  { id: 'fallback-earbuds', name: 'Premium Earbuds', category: 'Earbuds', imageUrl: '/images/airbuds.png', accentColor: '#22c55e' },
  { id: 'fallback-earphones', name: 'Wireless Earphones', category: 'Earphones', imageUrl: '/images/eirbuds2.png', accentColor: '#0EA5E9' },
  { id: 'fallback-headphones', name: 'Premium Headphones', category: 'Headphones', imageUrl: '/images/headphone.png', accentColor: '#a855f7' },
];

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

const getProductImage = (product) => product?.imageUrl || product?.image || product?.images?.[0] || '';

const ProductSlide = ({ product }) => {
  const navigateTo = useNavigate();
  const image = getProductImage(product);
  const onSale = Number(product?.compareAtPrice) > Number(product?.price);
  const discountPct = onSale
    ? Math.round(((Number(product.compareAtPrice) - Number(product.price)) / Number(product.compareAtPrice)) * 100)
    : 0;

  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: image ? `url(${image})` : 'linear-gradient(135deg, #111827, #1f2937)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(28px) brightness(0.55)',
          transform: 'scale(1.15)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: image ? `url(${image})` : 'linear-gradient(135deg, #111827, #1f2937)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/75" />

      <div className="relative z-10 h-full flex items-center">
        <Container>
          <div className="max-w-xl">
            <span
              className="inline-flex items-center text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-3"
              style={{
                backgroundColor: `${product.accentColor || '#3B82F6'}25`,
                color: product.accentColor || '#3B82F6',
                border: `1px solid ${product.accentColor || '#3B82F6'}55`,
              }}
            >
              {product.category || 'Featured Product'}
            </span>

            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white leading-tight mb-3">
              {product.name}
            </h2>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              {onSale && (
                <span className="rounded-full bg-orange-500 text-white px-3 py-1 text-sm font-extrabold">
                  -{discountPct}% OFF
                </span>
              )}
              {Number.isFinite(Number(product.price)) && (
                <span className="text-white/90 font-semibold">
                  Rs. {Number(product.price).toLocaleString('en-PK')}
                </span>
              )}
            </div>

            <Button
              size="lg"
              onClick={() => navigateTo(product.id && !String(product.id).startsWith('fallback-') ? `/product/${product.id}` : '/shop')}
            >
              Shop Now
            </Button>
          </div>
        </Container>
      </div>
    </>
  );
};

const OfferSlide = () => {
  const navigateTo = useNavigate();

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 overflow-hidden">
      <div className="absolute -right-24 -top-28 w-72 h-72 rounded-full bg-white/15" />
      <div className="absolute -left-20 -bottom-32 w-80 h-80 rounded-full bg-black/10" />
      <div className="absolute right-[8%] top-1/2 -translate-y-1/2 hidden sm:block w-48 h-48 md:w-64 md:h-64 rounded-full border-[18px] border-white/15" />

      <div className="relative z-10 h-full flex items-center">
        <Container>
          <div className="max-w-2xl text-white">
            <span className="inline-flex items-center rounded-full bg-white text-orange-600 px-4 py-1.5 text-xs sm:text-sm font-black tracking-wider uppercase mb-3 shadow-lg">
              Limited Time Offer
            </span>
            <div className="flex items-end gap-3 sm:gap-5 flex-wrap">
              <h2 className="text-5xl sm:text-6xl md:text-8xl font-black leading-none tracking-tight">50%</h2>
              <div className="pb-1 sm:pb-2">
                <p className="text-2xl sm:text-3xl md:text-4xl font-black leading-none">OFF</p>
                <p className="text-sm sm:text-base font-semibold text-white/90">Selected Accessories</p>
              </div>
            </div>
            <p className="mt-4 text-sm sm:text-base md:text-lg text-white/90 max-w-lg">
              Upgrade your setup with selected earbuds, earphones and mobile accessories.
            </p>
            <div className="mt-5">
              <Button variant="secondary" size="lg" onClick={() => navigateTo('/shop')}>
                Shop Offers
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

const HeroSlider = () => {
  const [[current, direction], setSlide] = useState([0, 1]);
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const timerRef = useRef(null);
  const navigateTo = useNavigate();

  useEffect(() => {
    let cancelled = false;
    api.get('/api/products?limit=200')
      .then((data) => {
        if (cancelled || !Array.isArray(data?.products)) return;

        const preferred = data.products
          .filter((p) => /earbuds?|earphones?|headphones?/i.test(`${p.category || ''} ${p.name || ''}`))
          .filter((p) => getProductImage(p))
          .sort((a, b) => {
            const aSale = Number(a.compareAtPrice) > Number(a.price) ? 1 : 0;
            const bSale = Number(b.compareAtPrice) > Number(b.price) ? 1 : 0;
            return bSale - aSale || Number(b.rating || 0) - Number(a.rating || 0);
          })
          .slice(0, 3)
          .map((p, index) => ({
            ...p,
            accentColor: ['#22c55e', '#0EA5E9', '#a855f7'][index],
          }));

        if (preferred.length >= 3) setProducts(preferred);
      })
      .catch(() => {
        // Keep the verified local image fallbacks if the API is unavailable.
      });

    return () => { cancelled = true; };
  }, []);

  const slides = [{ type: 'offer', id: 'offer-50' }, ...products];

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSlide(([c]) => [(c + 1) % slides.length, 1]);
    }, SLIDE_DURATION);
  }, [slides.length]);

  useEffect(() => {
    if (current >= slides.length) setSlide([0, 1]);
  }, [current, slides.length]);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const navigate = (idx, dir) => {
    setSlide([idx, dir]);
    startTimer();
  };

  const prev = () => navigate((current - 1 + slides.length) % slides.length, -1);
  const next = () => navigate((current + 1) % slides.length, 1);
  const slide = slides[current];

  return (
    <section className="relative overflow-hidden h-[300px] sm:h-[340px] md:h-[400px] lg:h-[440px]">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={slide.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
        >
          {slide.type === 'offer' ? <OfferSlide /> : <ProductSlide product={slide} />}
        </motion.div>
      </AnimatePresence>

      <motion.button
        onClick={prev}
        aria-label="Previous slide"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="hidden md:flex absolute left-5 lg:left-7 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/25 border border-white/20 items-center justify-center text-white backdrop-blur-sm"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </motion.button>

      <motion.button
        onClick={next}
        aria-label="Next slide"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="hidden md:flex absolute right-5 lg:right-7 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/25 border border-white/20 items-center justify-center text-white backdrop-blur-sm"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((item, i) => (
          <motion.button
            key={item.id}
            onClick={() => navigate(i, i > current ? 1 : -1)}
            animate={{
              width: i === current ? 24 : 8,
              backgroundColor: i === current ? '#ffffff' : 'rgba(255,255,255,0.45)',
            }}
            transition={{ duration: 0.25 }}
            className="h-2 rounded-full"
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
