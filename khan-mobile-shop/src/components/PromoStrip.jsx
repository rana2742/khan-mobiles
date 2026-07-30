import { motion } from 'framer-motion';

const MESSAGE = '🚚 Free Delivery on Orders Over Rs. 2,000  ·  Use code KHAN10 for 10% off  ·  Limited time only!';

const PromoStrip = () => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, amount: 0.8 }}
    transition={{ duration: 0.4 }}
    className="bg-accent overflow-hidden"
  >
    {/* Desktop: static */}
    <div className="hidden sm:block py-3 text-center text-white text-sm font-semibold tracking-wide">
      {MESSAGE}
    </div>

    {/* Mobile: marquee */}
    <div className="sm:hidden py-3 flex overflow-hidden whitespace-nowrap">
      {[0, 1].map((i) => (
        <motion.span
          key={i}
          className="text-white text-sm font-semibold shrink-0 pr-16"
          animate={{ x: '-100%' }}
          initial={{ x: i === 0 ? '0%' : '100%' }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear', delay: i * 9 }}
        >
          {MESSAGE}
        </motion.span>
      ))}
    </div>
  </motion.div>
);

export default PromoStrip;
