import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { STATS_DATA } from '../data/homeData';
import { api } from '../services/api';
import useCountUp from '../hooks/useCountUp';
import { sectionVariants, itemVariants } from '../utils/motionVariants';

const StatCell = ({ stat }) => {
  const target = stat.isStatic ? 0 : stat.isDecimal ? Math.round(stat.value * 10) : stat.value;
  const { ref, count } = useCountUp(target, 1500);

  let display;
  if (stat.isStatic) {
    display = stat.display;
  } else if (stat.isDecimal) {
    display = (count / 10).toFixed(1) + stat.suffix;
  } else {
    display = Math.round(count).toLocaleString('en-PK') + stat.suffix;
  }

  return (
    <motion.div
      ref={ref}
      variants={itemVariants}
      className="flex flex-col items-center gap-2 py-10 px-4"
    >
      <span className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
        {display}
      </span>
      <span className="text-sm text-slate-500 font-medium">{stat.label}</span>
    </motion.div>
  );
};

const StatsStrip = () => {
  const [productCount, setProductCount] = useState(null);

  useEffect(() => {
    api.get('/api/products?limit=1')
      .then((data) => setProductCount(data.pagination.total))
      .catch(() => {});
  }, []);

  const stats = STATS_DATA.map((s) =>
    s.id === 'products' && productCount !== null
      ? { ...s, value: productCount }
      : s
  );

  return (
    <section className="border-y border-navy-700 bg-navy-800/50">
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-navy-700 max-w-[1280px] mx-auto"
      >
        {stats.map((stat) => (
          <StatCell key={stat.id} stat={stat} />
        ))}
      </motion.div>
    </section>
  );
};

export default StatsStrip;
