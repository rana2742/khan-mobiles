import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Container from '../components/Container';
import Button from '../components/Button';

const CartRow = ({ item, onRemove, onUpdate }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
    transition={{ duration: 0.2 }}
    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-6 border-b border-navy-700"
  >
    <div
      className="w-20 h-20 rounded-xl2 shrink-0 bg-cover bg-center"
      style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : { background: item.bgGradient }}
    />
    <div className="flex-1 min-w-0">
      <Link to={`/product/${item.id}`} className="text-slate-900 font-semibold hover:text-accent transition-colors">
        {item.name}
      </Link>
      <p className="text-xs text-accent mt-1">{item.category}</p>
      <p className="text-sm text-slate-500 mt-1">Rs. {item.price.toLocaleString('en-PK')} each</p>
    </div>
    <div className="flex items-center gap-3 bg-navy-800 border border-navy-700 rounded-xl2 px-2">
      <button onClick={() => onUpdate(item.id, item.quantity - 1)} aria-label="Decrease quantity"
        className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 text-lg">−</button>
      <span className="w-6 text-center text-slate-900 font-semibold">{item.quantity}</span>
      <button onClick={() => onUpdate(item.id, item.quantity + 1)} aria-label="Increase quantity"
        className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 text-lg">+</button>
    </div>
    <p className="text-lg font-bold text-slate-900 w-28 text-right shrink-0">
      Rs. {(item.price * item.quantity).toLocaleString('en-PK')}
    </p>
    <button onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}
      className="text-slate-500 hover:text-red-600 transition-colors shrink-0">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </button>
  </motion.div>
);

const Cart = () => {
  const {
    items, subtotal, discount, deliveryFee, total, promo,
    removeItem, updateQuantity, applyPromoCode, removePromoCode, freeDeliveryThreshold,
  } = useCart();
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const navigate = useNavigate();

  const remainingForFreeDelivery = Math.max(freeDeliveryThreshold - (subtotal - discount), 0);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    const result = applyPromoCode(promoInput);
    if (result.success) {
      setPromoError('');
      setPromoInput('');
    } else {
      setPromoError('Invalid promo code.');
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Container>
          <div className="py-10">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Your Cart</h1>
            <p className="text-slate-500">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 pb-28">
              <span className="text-7xl mb-6">🛒</span>
              <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
              <p className="text-slate-500 mb-8 max-w-sm">Looks like you haven&apos;t added anything yet. Let&apos;s fix that.</p>
              <Button onClick={() => navigate('/shop')}>Start Shopping</Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-10 pb-20">
              <div className="lg:col-span-2">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <CartRow key={item.id} item={item} onRemove={removeItem} onUpdate={updateQuantity} />
                  ))}
                </AnimatePresence>
              </div>

              {/* Order summary */}
              <div>
                <div className="bg-navy-800 rounded-xl2 p-6 sticky top-24 space-y-5">
                  <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>

                  {remainingForFreeDelivery > 0 ? (
                    <div className="bg-accent/10 border border-accent/30 text-accent text-xs font-medium rounded-xl2 px-4 py-3">
                      🚚 Add Rs. {remainingForFreeDelivery.toLocaleString('en-PK')} more for free delivery!
                    </div>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-600 text-xs font-medium rounded-xl2 px-4 py-3">
                      🎉 You&apos;ve unlocked free delivery!
                    </div>
                  )}

                  {/* Promo code */}
                  {promo ? (
                    <div className="flex items-center justify-between bg-navy-700 rounded-xl2 px-4 py-3">
                      <span className="text-sm text-slate-900">
                        Code <span className="font-bold text-accent">{promo.code}</span> applied
                      </span>
                      <button onClick={removePromoCode} className="text-xs text-slate-500 hover:text-red-600">Remove</button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value); setPromoError(''); }}
                        placeholder="Promo code (try KHAN10)"
                        aria-label="Promo code"
                        className="flex-1 bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-2.5 text-slate-900 placeholder-slate-500 text-sm"
                      />
                      <Button type="submit" size="sm">Apply</Button>
                    </form>
                  )}
                  {promoError && <p className="text-red-600 text-xs -mt-3">{promoError}</p>}

                  <div className="space-y-3 pt-2 border-t border-navy-700">
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Subtotal</span>
                      <span className="text-slate-900 font-medium">Rs. {subtotal.toLocaleString('en-PK')}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({promo.code})</span>
                        <span>− Rs. {discount.toLocaleString('en-PK')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Delivery</span>
                      <span className="text-slate-900 font-medium">
                        {deliveryFee === 0 ? 'Free' : `Rs. ${deliveryFee.toLocaleString('en-PK')}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-900 pt-3 border-t border-navy-700">
                      <span>Total</span>
                      <span>Rs. {total.toLocaleString('en-PK')}</span>
                    </div>
                  </div>

                  <Button className="w-full" size="lg" onClick={() => navigate('/checkout')}>
                    Proceed to Checkout
                  </Button>
                  <Link to="/shop" className="block text-center text-sm text-slate-500 hover:text-accent transition-colors">
                    ← Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
};

export default Cart;
