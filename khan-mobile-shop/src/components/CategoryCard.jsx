import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const CategoryCard = ({ icon, label }) => (
  <motion.div
    initial="rest"
    whileHover="hover"
    animate="rest"
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    variants={{
      rest:  { y: 0, scale: 1, boxShadow: '0 4px 24px rgba(15,23,42,0.08)' },
      hover: { y: -6, scale: 1.03, boxShadow: '0 12px 32px rgba(15,23,42,0.16)' },
    }}
    className="cursor-pointer rounded-xl2 overflow-hidden"
  >
    <motion.div
      variants={{
        rest:  { borderColor: 'rgba(59,130,246,0)' },
        hover: { borderColor: 'rgba(59,130,246,1)' },
      }}
      transition={{ duration: 0.2 }}
      className="bg-navy-800 rounded-xl2 border border-transparent p-6 flex flex-col items-center gap-3 select-none h-full"
    >
      <motion.span
        variants={{ rest: { scale: 1, rotate: 0 }, hover: { scale: 1.15, rotate: -5 } }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className="text-4xl leading-none"
        role="img"
        aria-label={label}
      >
        {icon}
      </motion.span>
      <span className="text-sm font-semibold text-slate-700 text-center leading-tight">
        {label}
      </span>
    </motion.div>
  </motion.div>
);

CategoryCard.propTypes = {
  icon:  PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

export default CategoryCard;
