import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

// Framer Motion variants for Card hover effect
const cardVariants = {
  rest: {
    scale: 1,
    boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.45)',
  },
};

/**
 * Card — reusable surface for products, content, and info blocks.
 *
 * Props:
 *  - children:  React nodes rendered inside the card
 *  - className: additional Tailwind classes
 *  - onClick:   optional click handler (makes the card focusable)
 */
const Card = ({ children, className = '', onClick }) => {
  const isClickable = typeof onClick === 'function';

  return (
    <motion.div
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      onClick={onClick}
      // Keyboard accessibility when clickable
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      className={`
        bg-navy-800
        rounded-xl2
        overflow-hidden
        ${isClickable ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-navy' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default Card;
