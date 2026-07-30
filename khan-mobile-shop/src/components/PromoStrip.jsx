import { motion } from 'framer-motion';

const MESSAGE = '🚚 Free Delivery on Orders Over Rs. 2,000  ·  Genuine Products, Trusted Quality  ·  Fast Shipping Across Pakistan';

const PromoStrip = () => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, amount: 0.8 }}
    transition={{ duration: 0.4 }}
    className="bg-accent overflow-hidden py-3 whitespace-nowrap"
  >
    {/* One seamless marquee at every screen size — two copies in a row,
        translated by exactly -50% so the loop has no gap and no overlap,
        regardless of message length or screen width. */}
    <motion.div
      className="flex w-max"
      animate={{ x: ['0%', '-50%'] }}
      transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
    >
      {[0, 1].map((i) => (
        <span key={i} className="text-white text-sm font-semibold tracking-wide shrink-0 pr-16">
          {MESSAGE}
        </span>
      ))}
    </motion.div>
  </motion.div>
);

export default PromoStrip;