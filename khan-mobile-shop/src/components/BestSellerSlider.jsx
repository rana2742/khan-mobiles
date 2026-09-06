import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { sectionVariants, itemVariants } from '../utils/motionVariants';
import ProductCard from './ProductCard';
import Container from './Container';

const BestSellerSlider = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/products?sort=popular&limit=100')
      .then((data) => setProducts((data.products || []).filter((p) => p.badge === 'Bestseller')))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-16">
      <Container>
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <motion.div variants={itemVariants} className="mb-10">
            <span className="text-xs font-semibold tracking-widest uppercase text-accent mb-3 block">
              Customer Favorites
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold">Best Sellers</h2>
          </motion.div>

          {loading ? (
            <div className="flex gap-4 md:gap-6 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-navy-800 rounded-xl2 h-72 w-56 shrink-0 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="flex gap-4 md:gap-6 w-max animate-scroll-left hover:[animation-play-state:paused]">
                {[...products, ...products].map((product, i) => (
                  <div key={`${product.id}-${i}`} className="w-[46vw] sm:w-56 md:w-64 shrink-0">
                    <ProductCard {...product} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </Container>
    </section>
  );
};

export default BestSellerSlider;