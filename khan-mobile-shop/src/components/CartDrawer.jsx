import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useCart } from '../context/CartContext';
import Button from './Button';

const CartLineItem = ({ item, onRemove, onUpdate }) => (
  <motion.div
    layout
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ duration: 0.2 }}
    className="flex gap-3 py-4 border-b border-navy-700"
  >
    <div
      className="w-16 h-16 rounded-xl2 shrink-0 bg-cover bg-center"
      style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : { background: item.bgGradient }}
    />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{item.name}</p>
      <p className="text-xs text-accent mt-0.5">{item.category}</p>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 bg-navy-700 rounded-xl2">
          <button
            onClick={() => onUpdate(item.id, item.quantity - 1)}
            aria-label="Decrease quantity"
            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900"
          >
            −
          </button>
          <span className="text-sm text-slate-900 w-5 text-center">{item.quantity}</span>
          <button
            onClick={() => onUpdate(item.id, item.quantity + 1)}
            aria-label="Increase quantity"
            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900"
          >
            +
          </button>
        </div>
        <span className="text-sm font-bold text-slate-900">
          Rs. {(item.price * item.quantity).toLocaleString('en-PK')}
        </span>
      </div>
    </div>
    <button
      onClick={() => onRemove(item.id)}
      aria-label={`Remove ${item.name}`}
      className="text-slate-500 hover:text-red-600 transition-colors shrink-0 h-fit"
    >
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </button>
  </motion.div>
);

const CartDrawer = ({ open, onClose }) => {
  const { items, subtotal, itemCount, removeItem, updateQuantity, freeDeliveryThreshold } = useCart();
  const remainingForFreeDelivery = Math.max(freeDeliveryThreshold - subtotal, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[60]"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-navy z-[70] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-navy-700">
              <h2 className="text-lg font-bold text-slate-900">
                Your Cart {itemCount > 0 && <span className="text-accent">({itemCount})</span>}
              </h2>
              <button onClick={onClose} aria-label="Close cart" className="text-slate-500 hover:text-slate-900 p-1">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <span className="text-6xl mb-4">🛒</span>
                  <p className="text-slate-900 font-semibold mb-1">Your cart is empty</p>
                  <p className="text-slate-500 text-sm mb-6">Add some products to get started.</p>
                  <Button onClick={onClose}>
                    <Link to="/shop">Start Shopping</Link>
                  </Button>
                </div>
              ) : (
                <>
                  {remainingForFreeDelivery > 0 && (
                    <div className="bg-accent/10 border border-accent/30 text-accent text-xs font-medium rounded-xl2 px-4 py-3 my-4">
                      🚚 Add Rs. {remainingForFreeDelivery.toLocaleString('en-PK')} more for free delivery!
                    </div>
                  )}
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <CartLineItem key={item.id} item={item} onRemove={removeItem} onUpdate={updateQuantity} />
                    ))}
                  </AnimatePresence>
                </>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-navy-700 px-6 py-5 space-y-4">
                <div className="flex items-center justify-between text-slate-900">
                  <span className="text-sm text-slate-500">Subtotal</span>
                  <span className="font-bold">Rs. {subtotal.toLocaleString('en-PK')}</span>
                </div>
                <Link to="/cart" onClick={onClose}>
                  <Button variant="secondary" className="w-full">View Cart</Button>
                </Link>
                <Link to="/checkout" onClick={onClose}>
                  <Button className="w-full">Checkout</Button>
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

CartDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CartDrawer;
