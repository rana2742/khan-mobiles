import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

// Variant style maps
const variantStyles = {
  primary:
    'bg-accent text-white border border-accent hover:bg-blue-500',
  secondary:
    'bg-transparent text-accent border border-accent hover:bg-accent/10',
  ghost:
    'bg-transparent text-accent border border-transparent hover:bg-accent/10',
};

const sizeStyles = {
  sm: 'text-sm px-4 py-2 rounded-xl2',
  md: 'text-base px-6 py-3 rounded-xl2',
  lg: 'text-lg px-8 py-4 rounded-xl3',
};

// Framer Motion variants
const motionVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.04 },
  tap: { scale: 0.97 },
};

const disabledMotionVariants = {
  rest: { scale: 1 },
  hover: { scale: 1 },
  tap: { scale: 1 },
};

/**
 * Button — primary interactive element.
 *
 * Props:
 *  - variant: "primary" | "secondary" | "ghost"  (default: "primary")
 *  - size:    "sm" | "md" | "lg"                 (default: "md")
 *  - disabled: boolean
 *  - type:    "button" | "submit" | "reset"       (default: "button")
 *  - onClick, children, className
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  onClick,
  children,
  className = '',
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold tracking-wide transition-colors duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-navy';

  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <motion.button
      type={type}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      variants={disabled ? disabledMotionVariants : motionVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`${base} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledClass} ${className}`}
    >
      {children}
    </motion.button>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Button;
