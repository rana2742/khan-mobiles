import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Container from '../components/Container';
import Button from '../components/Button';

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];

const emptyForm = {
  fullName: '', email: '', phone: '', address: '', landmark: '', city: CITIES[0],
  paymentMethod: 'cod',
};

 const Checkout = () => {
  const { items, subtotal, discount, deliveryFee, total, promo, clearCart } = useCart();
  const { user, resendVerification, refreshUser } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [checkingAgain, setCheckingAgain] = useState(false);
  const navigate = useNavigate();

  // Prefill from the logged-in account so returning customers don't retype it.
  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, fullName: f.fullName || user.name || '', email: f.email || user.email || '' }));
    }
  }, [user]);

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await resendVerification();
      setResent(true);
    } catch {
      /* the button itself communicates the attempt; a failed resend isn't critical here */
    } finally {
      setResending(false);
    }
  };

  const handleCheckAgain = async () => {
    setCheckingAgain(true);
    await refreshUser();
    setCheckingAgain(false);
  };

  // Verified email is required to actually place an order (checked again,
  // server-side, when the order is submitted) — but we check it here too so
  // nobody wastes time filling out the whole form first.
  if (user && !user.emailVerified && !user.hasGoogleLinked) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen flex items-center justify-center">
          <Container>
            <div className="text-center py-24 max-w-md mx-auto">
              <span className="text-7xl mb-6 block">📧</span>
              <h1 className="text-2xl font-bold mb-3">Please Verify Your Email</h1>
              <p className="text-slate-500 mb-8">
                To keep your order confirmation and delivery updates reaching you, please verify{' '}
                <strong className="text-slate-700">{user.email}</strong> before checking out.
              </p>
              {resent && <p className="text-green-600 text-sm mb-4">Verification email sent — check your inbox.</p>}
              <div className="flex flex-col gap-3 items-center">
                <Button onClick={handleResendVerification} disabled={resending}>
                  {resending ? 'Sending…' : 'Resend Verification Email'}
                </Button>
                <button onClick={handleCheckAgain} disabled={checkingAgain}
                  className="text-sm text-accent hover:underline">
                  {checkingAgain ? 'Checking…' : "I've verified — check again"}
                </button>
              </div>
            </div>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  if (items.length === 0 && !placing) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen flex items-center justify-center">
          <Container>
            <div className="text-center py-24">
              <span className="text-7xl mb-6 block">🧾</span>
              <h1 className="text-2xl font-bold mb-3">Nothing to check out</h1>
              <p className="text-slate-500 mb-8">Your cart is empty. Add some products before checking out.</p>
              <Button onClick={() => navigate('/shop')}>Browse Products</Button>
            </div>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  const handleChange = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!form.email.trim() || !form.email.includes('@')) errs.email = 'A valid email is required.';
    if (!/^[0-9+\s-]{7,15}$/.test(form.phone.trim())) errs.phone = 'A valid phone number is required.';
    if (!form.address.trim()) errs.address = 'Delivery address is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setPlacing(true);

    try {
      const data = await api.post('/api/orders', {
        items: items.map((i) => ({
          productId: i.id, name: i.name, price: i.price, quantity: i.quantity, imageUrl: i.imageUrl || null,
        })),
        subtotal, discount, deliveryFee, total,
        promoCode: promo?.code || null,
        fullName: form.fullName, email: form.email, phone: form.phone,
        address: form.address, landmark: form.landmark, city: form.city, paymentMethod: form.paymentMethod,
      });

      clearCart();
      navigate('/order-confirmation', {
        state: { ...data.order, customer: form },
      });
    } catch (err) {
      setSubmitError(err.message || 'Could not place your order. Please try again.');
      setPlacing(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Container>
          <div className="py-10">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Checkout</h1>
            <p className="text-slate-500">Almost there — fill in your delivery details.</p>
          </div>

          <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-3 gap-10 pb-20">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-navy-800 rounded-xl2 p-6 space-y-5">
                <h2 className="text-lg font-bold text-slate-900">Contact &amp; Delivery Information</h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Full Name</label>
                    <input value={form.fullName} onChange={handleChange('fullName')}
                      className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 placeholder-slate-500 text-sm"
                      placeholder="Ali Khan" />
                    {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Phone Number</label>
                    <input value={form.phone} onChange={handleChange('phone')}
                      className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 placeholder-slate-500 text-sm"
                      placeholder="+92 300 1234567" />
                    {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email Address</label>
                  <input type="email" value={form.email} onChange={handleChange('email')}
                    className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 placeholder-slate-500 text-sm"
                    placeholder="you@example.com" />
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Delivery Address</label>
                  <textarea value={form.address} onChange={handleChange('address')} rows={3}
                    className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 placeholder-slate-500 text-sm resize-none"
                    placeholder="House #, Street, Area" />
                  {errors.address && <p className="text-red-600 text-xs mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nearby Landmark <span className="text-slate-400 font-normal normal-case">(optional, helps riders find you)</span></label>
                  <input value={form.landmark} onChange={handleChange('landmark')}
                    className="w-full bg-navy-700 border border-navy-700 focus:border-accent focus:outline-none rounded-xl2 px-4 py-3 text-slate-900 placeholder-slate-500 text-sm"
                    placeholder="e.g. Near Liberty Chowk, opposite Metro Store" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">City</label>
                  <select value={form.city} onChange={handleChange('city')}
                    className="w-full bg-navy-700 border border-navy-700 text-slate-900 rounded-xl2 px-4 py-3 text-sm focus:outline-none focus:border-accent">
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-navy-800 rounded-xl2 p-6 space-y-3">
                <h2 className="text-lg font-bold text-slate-900 mb-2">Payment Method</h2>
                <label className="flex items-center gap-3 bg-navy-700 rounded-xl2 px-4 py-3 cursor-pointer">
                  <input type="radio" name="payment" checked={form.paymentMethod === 'cod'}
                    onChange={() => setForm((f) => ({ ...f, paymentMethod: 'cod' }))}
                    className="accent-accent w-4 h-4" />
                  <span className="text-sm text-slate-900">💵 Cash on Delivery</span>
                </label>
                <label className="flex items-center gap-3 bg-navy-700 rounded-xl2 px-4 py-3 cursor-pointer opacity-60">
                  <input type="radio" name="payment" checked={form.paymentMethod === 'card'}
                    onChange={() => setForm((f) => ({ ...f, paymentMethod: 'card' }))}
                    className="accent-accent w-4 h-4" />
                  <span className="text-sm text-slate-900">💳 Credit / Debit Card (coming soon)</span>
                </label>
              </div>
            </div>

            {/* Summary */}
            <div>
              <div className="bg-navy-800 rounded-xl2 p-6 sticky top-24 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl2 shrink-0 bg-cover bg-center" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : { background: item.bgGradient }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-900 font-medium line-clamp-1">{item.name}</p>
                        <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-900 shrink-0">
                        Rs. {(item.price * item.quantity).toLocaleString('en-PK')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-3 border-t border-navy-700 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span><span className="text-slate-900">Rs. {subtotal.toLocaleString('en-PK')}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span><span>− Rs. {discount.toLocaleString('en-PK')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery</span>
                    <span className="text-slate-900">{deliveryFee === 0 ? 'Free' : `Rs. ${deliveryFee.toLocaleString('en-PK')}`}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-navy-700">
                    <span>Total</span><span>Rs. {total.toLocaleString('en-PK')}</span>
                  </div>
                </div>

                {submitError && <p className="text-red-600 text-sm">{submitError}</p>}

                <Button type="submit" className="w-full" size="lg" disabled={placing}>
                  {placing ? 'Placing Order…' : 'Place Order'}
                </Button>
                <Link to="/cart" className="block text-center text-sm text-slate-500 hover:text-accent transition-colors">
                  ← Back to Cart
                </Link>
              </div>
            </div>
          </form>
        </Container>
      </main>
      <Footer />
    </>
  );
};

export default Checkout;
