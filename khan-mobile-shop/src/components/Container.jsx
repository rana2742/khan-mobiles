import PropTypes from 'prop-types';

/**
 * Container — constrains content width and applies consistent horizontal padding.
 * Max-width: 1280px, centered, with responsive horizontal padding.
 *
 * Props:
 *  - children:  page/section content
 *  - className: additional Tailwind classes
 */
const Container = ({ children, className = '' }) => {
  return (
    <div className={`w-full max-w-[1280px] mx-auto px-4 md:px-8 ${className}`}>
      {children}
    </div>
  );
};

Container.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Container;
