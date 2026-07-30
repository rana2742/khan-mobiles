import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SLIDES_DATA } from '../data/homeData';
import Button from './Button';
import Container from './Container';

const SLIDE_DURATION = 5000;

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

const HeroSlider = () => {
  const [[current, direction], setSlide] = useState([0, 1]);
  const timerRef = useRef(null);
  const total = SLIDES_DATA.length;

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSlide(([c]) => [(c + 1) % total, 1]);
    }, SLIDE_DURATION);
  }, [total]);

  useEffect(() => { startTimer(); return () => clearInterval(timerRef.current); }, [startTimer]);

  const navigate = (idx, dir) => { setSlide([idx, dir]); startTimer(); };
  const prev = () => navigate((current - 1 + total) % total, -1);
  const next = () => navigate((current + 1) % total, 1);
  const slide = SLIDES_DATA[current];

  return (
    <section className="relative overflow-hidden" style={{ height: 'calc(100vh - 64px)', minHeight: '480px' }}>
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div key={current} custom={direction} variants={slideVariants}
          initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0">

          {/* Ken Burns background */}
     {/* Background Image */}
<motion.div
  key={`bg-${current}`}
  className="absolute inset-0"
 style={{
  backgroundImage: `url(${slide.bgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
}}
  initial={{ scale: 1 }}
  animate={{ scale: 1.08 }}
  transition={{ duration: 6, ease: "linear" }}
/>

{/* Dark Overlay */}
<div
  className="absolute inset-0"
  style={{
    background:
      "linear-gradient(to right, rgba(0,0,0,0.75), rgba(0,0,0,0.45), rgba(0,0,0,0.75))",
  }}
></div>

          {/* Glow orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
              style={{ background: `radial-gradient(circle, ${slide.accentColor}, transparent)` }} />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-10"
              style={{ background: `radial-gradient(circle, ${slide.accentColor}, transparent)` }} />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex items-center">
            <Container>
              <div className="max-w-2xl">
                <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-6"
                  style={{ backgroundColor: `${slide.accentColor}25`, color: slide.accentColor, border: `1px solid ${slide.accentColor}50` }}>
                  Limited Time Offer
                </motion.span>

                <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6 text-white">
                  {slide.headline}
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-slate-300 text-lg md:text-xl mb-10 max-w-lg leading-relaxed">
                  {slide.subtext}
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-col sm:flex-row gap-4">
                  <motion.div whileHover={{ boxShadow: `0 0 28px ${slide.accentColor}60` }} className="rounded-xl3 inline-block">
                    <Button size="lg">{slide.cta}</Button>
                  </motion.div>
                  <Button variant="secondary" size="lg">Browse All</Button>
                </motion.div>
              </div>
            </Container>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Arrows */}
      <motion.button onClick={prev} aria-label="Previous slide"
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(59,130,246,0.2)' }} whileTap={{ scale: 0.9 }}
        className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center text-white backdrop-blur-sm">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </motion.button>
      <motion.button onClick={next} aria-label="Next slide"
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(59,130,246,0.2)' }} whileTap={{ scale: 0.9 }}
        className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center text-white backdrop-blur-sm">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </motion.button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SLIDES_DATA.map((_, i) => (
          <motion.button key={i} onClick={() => navigate(i, i > current ? 1 : -1)}
            animate={{ width: i === current ? 24 : 8, backgroundColor: i === current ? '#3B82F6' : 'rgba(255,255,255,0.3)' }}
            transition={{ duration: 0.3 }}
            className="h-2 rounded-full" aria-label={`Go to slide ${i + 1}`} />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
