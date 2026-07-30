import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { sectionVariants, itemVariants } from '../utils/motionVariants';
import ProductCard from './ProductCard';
import Container from './Container';

const TrendingProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/products?sort=popular&limit=8')
      .then((data) => setProducts(data.products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && products.length === 0) return null;

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
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
  {products.map((product) => (
    <motion.div key={product.id} variants={itemVariants}>
      <ProductCard {...product} />
    </motion.div>
  ))}
</div>
          )}
        </motion.div>
      </Container>
    </section>
  );
};

export default TrendingProducts;
