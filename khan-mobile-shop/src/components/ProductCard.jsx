import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import Badge from './Badge';
import Button from './Button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const StarRating = ({ rating, reviewCount }) => (
  <div className="flex items-center gap-1">
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} width="13" height="13" viewBox="0 0 24 24"
          fill={s <= Math.round(rating) ? '#f59e0b' : '#E2E8F0'}
          stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
    {reviewCount > 0 ? (
      <span className="text-xs text-slate-500">{rating.toFixed(1)} ({reviewCount})</span>
    ) : (
      <span className="text-xs text-slate-500">No reviews yet</span>
    )}
  </div>
);

StarRating.propTypes = { rating: PropTypes.number.isRequired, reviewCount: PropTypes.number };

const badgeVariantMap = { New: 'accent', Hot: 'warning', Sale: 'warning', Bestseller: 'success' };

const imageVariants = { rest: { scale: 1 }, hover: { scale: 1.06 } };
const cardVars = {
  rest:  { boxShadow: '0 1px 3px rgba(15,23,42,0.08)', y: 0 },
  hover: { boxShadow: '0 16px 32px rgba(15,23,42,0.12)', y: -5 },
};

// Always-visible Add to Cart button (not hover-dependent) so the card works
// the same on touch devices as it does with a mouse. Shows a real product
// photo when the admin has uploaded one, falling back to the gradient swatch.
// Adding to cart requires being logged in — guests are sent to /login and
// bounced right back here once they've signed in.
const ProductCard = ({ id, name, price, compareAtPrice, category, rating, reviewCount, badge, bgGradient, imageUrl }) => {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const onSale = compareAtPrice && compareAtPrice > price;
  const discountPct = onSale ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    addItem({ id, name, price, category, bgGradient, imageUrl });

    window.ttq?.track('AddToCart', {
      contents: [{
        content_id: String(id),
        content_name: name,
        content_type: 'product',
        quantity: 1,
        price: Number(price),
      }],
      content_type: 'product',
      value: Number(price),
      currency: 'PKR',
    });
  };

  return (
    <motion.div variants={cardVars} initial="rest" whileHover="hover"
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="bg-navy-800 rounded-xl2 overflow-hidden flex flex-col h-full border border-slate-100">

      <Link to={`/product/${id}`}>
        {/* Image */}
        <div className="relative overflow-hidden h-52 bg-slate-50">
          <motion.div variants={imageVariants} transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-cover bg-center"
            style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : { background: bgGradient }} />
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
            {badge && <Badge variant={badgeVariantMap[badge] || 'accent'}>{badge}</Badge>}
            {onSale && <Badge variant="warning">-{discountPct}%</Badge>}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col gap-1.5">
          <span className="text-xs font-medium text-accent uppercase tracking-wider">{category}</span>
          <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 min-h-[2.5rem]">{name}</h3>
          <StarRating rating={rating} reviewCount={reviewCount} />
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-base font-bold text-slate-900">
              Rs.&nbsp;{price.toLocaleString('en-PK')}
            </p>
            {onSale && (
              <p className="text-sm text-slate-400 line-through">
                Rs.&nbsp;{compareAtPrice.toLocaleString('en-PK')}
              </p>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4 mt-auto">
        <motion.div whileTap={{ scale: 0.96 }}>
          <Button size="sm" className="w-full" onClick={handleAddToCart} aria-label={`Add ${name} to cart`}>
            Add to Cart
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

ProductCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  compareAtPrice: PropTypes.number,
  category: PropTypes.string.isRequired,
  rating: PropTypes.number.isRequired,
  reviewCount: PropTypes.number,
  badge: PropTypes.string,
  bgGradient: PropTypes.string,
  imageUrl: PropTypes.string,
};

export default ProductCard;
