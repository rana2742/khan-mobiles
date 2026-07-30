import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const variantStyles = {
  accent: 'bg-accent text-white',
  success: 'bg-[#16A34A] text-white',
  warning: 'bg-accent-orange text-white',
  neutral: 'bg-navy-700 text-slate-600',
};

// Framer Motion variants
const badgeVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.08 },
};

/**
 * Badge — compact label for tags, status indicators, and category chips.
 *
 * Props:
 *  - variant:   "accent" | "success" | "warning" | "neutral"  (default: "accent")
 *  - children:  label text
 *  - className: additional Tailwind classes
 */
const Badge = ({ variant = 'accent', children, className = '' }) => {
  return (
    <motion.span
      variants={badgeVariants}
      initial="rest"
      whileHover="hover"
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`
        inline-flex items-center
        text-xs font-semibold tracking-wide
        px-3 py-1
        rounded-full
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </motion.span>
  );
};

Badge.propTypes = {
  variant: PropTypes.oneOf(['accent', 'success', 'warning', 'neutral']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Badge;
