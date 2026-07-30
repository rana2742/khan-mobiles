import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CATEGORIES_DATA } from '../data/homeData';
import { api } from '../services/api';
import { sectionVariants, itemVariants } from '../utils/motionVariants';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import Container from '../components/Container';

// Curated icons for our original categories; anything an admin adds beyond
// this list still shows up (with a generic icon) since it's driven by data.
const ICONS = CATEGORIES_DATA.reduce((acc, c) => ({ ...acc, [c.label]: c.icon }), {});
const FALLBACK_ICON = '📦';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/products/categories')
      .then((data) => setCategories(data.categories))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEO title="Categories" description="Browse mobile accessories by category — cases, chargers, earphones, power banks, screen protectors, and smartwatches." path="/categories" />
      <Navbar />
      <main className="pt-16 min-h-screen">
        <section className="bg-gradient-to-b from-navy-800 to-navy py-16">
          <Container>
            <div className="text-center mb-4">
              <span className="text-xs font-semibold tracking-widest uppercase text-accent mb-3 block">
                Browse By Type
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold mb-3">All Categories</h1>
              <p className="text-slate-500 max-w-lg mx-auto">
                Explore our full range of mobile accessories, organized by category.
              </p>
            </div>
          </Container>
        </section>

        <section className="py-16">
          <Container>
            {loading ? (
              <div className="text-center py-20 text-slate-500">Loading categories…</div>
            ) : (
              <motion.div
                variants={sectionVariants} initial="hidden" whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {categories.map((cat) => (
                  <motion.div key={cat.label} variants={itemVariants}>
                    <Link to={`/shop?category=${encodeURIComponent(cat.label)}`}>
                      <motion.div
                        whileHover={{ y: -6, scale: 1.02, boxShadow: '0 12px 32px rgba(15,23,42,0.16)' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="bg-navy-800 rounded-xl2 p-8 flex items-center gap-5 border border-transparent hover:border-accent transition-colors"
                      >
                        <span className="text-5xl leading-none" role="img" aria-label={cat.label}>
                          {ICONS[cat.label] || FALLBACK_ICON}
                        </span>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{cat.label}</h3>
                          <p className="text-sm text-slate-500">{cat.count} product{cat.count !== 1 ? 's' : ''}</p>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Categories;
