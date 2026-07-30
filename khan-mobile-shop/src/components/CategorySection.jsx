import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CATEGORIES_DATA } from '../data/homeData';
import { sectionVariants, itemVariants } from '../utils/motionVariants';
import CategoryCard from './CategoryCard';
import Container from './Container';

const CategorySection = () => (
  <section className="py-20">
    <Container>
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <motion.div variants={itemVariants} className="text-center mb-12">
          <span className="text-xs font-semibold tracking-widest uppercase text-accent mb-3 block">
            Browse By Type
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold">Featured Categories</h2>
        </motion.div>

        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES_DATA.map((cat) => (
            <motion.div key={cat.id} variants={itemVariants}>
              <Link to={`/shop?category=${encodeURIComponent(cat.label)}`}>
                <CategoryCard icon={cat.icon} label={cat.label} />
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Container>
  </section>
);

export default CategorySection;
