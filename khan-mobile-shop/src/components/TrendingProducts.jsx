 import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { sectionVariants, itemVariants } from '../utils/motionVariants';
import ProductCard from './ProductCard';
import Container from './Container';

const MarqueeRow = ({ products, direction = 'left' }) => (
  <div className="overflow-hidden">
    <div
      className={`flex gap-4 md:gap-6 w-max ${
        direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right'
      } hover:[animation-play-state:paused]`}
    >
      {[...products, ...products].map((product, i) => (
        <div key={`${product.id}-${i}`} className="w-[46vw] sm:w-56 md:w-64 shrink-0">
          <ProductCard {...product} />
        </div>
      ))}
    </div>
  </div>
);

const TrendingProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/products?sort=popular&limit=16')
      .then((data) => setProducts(data.products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && products.length === 0) return null;

  const half = Math.ceil(products.length / 2);
  const topRow = products.slice(0, half);
  const bottomRow = products.slice(half);

  return (
    <section className="py-20">
      <Container>
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {/* Heading */}
          <motion.div variants={itemVariants} className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs font-semibold tracking-widest uppercase text-accent mb-3 block">
                What&apos;s Hot
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold">Trending Products</h2>
            </div>
            <motion.div whileHover={{ x: 3 }} className="hidden sm:block shrink-0">
              <Link to="/shop" className="text-accent text-sm font-semibold hover:underline">
                View All →
              </Link>
            </motion.div>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-navy-800 rounded-xl2 h-72 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4 md:gap-6">
              <MarqueeRow products={topRow} direction="left" />
              {bottomRow.length > 0 && (
                <MarqueeRow products={bottomRow} direction="right" />
              )}
            </div>
          )}
        </motion.div>
      </Container>
    </section>
  );
};

export default TrendingProducts;