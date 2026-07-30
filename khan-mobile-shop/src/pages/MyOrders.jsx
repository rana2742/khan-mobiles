import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api, downloadFile } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Container from '../components/Container';
import Button from '../components/Button';

const statusStyles = {
  pending:    'bg-yellow-50 text-yellow-700',
  processing: 'bg-blue-50 text-blue-700',
  shipped:    'bg-purple-50 text-purple-700',
  delivered:  'bg-green-50 text-green-700',
  cancelled:  'bg-red-50 text-red-700',
};

const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];

const StarPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} type="button" onClick={() => onChange(s)} aria-label={`Rate ${s} stars`}>
        <svg width="26" height="26" viewBox="0 0 24 24"
          fill={s <= value ? '#f59e0b' : '#E2E8F0'} stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>
    ))}
  </div>
);

const ReviewForm = ({ item, orderId, onDone }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.post('/api/reviews', { productId: item.productId, orderId, rating, comment });
      onDone();
    } catch (err) {
      setError(err.message || 'Could not submit your review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 rounded-xl2 p-4 mt-2">
      <p className="text-xs font-semibold text-slate-600 mb-2">Rate this product</p>
      <StarPicker value={rating} onChange={setRating} />
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
        placeholder="Optional: share your experience with this product…"
        className="w-full mt-3 bg-white border border-slate-200 focus:border-accent focus:outline-none rounded-xl2 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 resize-none" />
      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Review'}</Button>
      </div>
    </div>
  );
};

const OrderCard = ({ order, onCancelled }) => {
  const [open, setOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [reviewingProductId, setReviewingProductId] = useState(null);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const stepIndex = statusSteps.indexOf(order.status);

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true);
    setInvoiceError('');
    try {
      await downloadFile(`/api/orders/${order.id}/invoice`, `invoice-${order.orderNumber}.pdf`);
    } catch (err) {
      setInvoiceError(err.message || 'Could not download invoice.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      await api.put(`/api/orders/${order.id}/cancel`);
      onCancelled(order.id);
    } catch (err) {
      setCancelError(err.message || 'Could not cancel this order.');
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  };

  return (
    <motion.div layout className="bg-navy-800 rounded-xl2 overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-accent font-semibold text-sm">{order.orderNumber}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}{order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyles[order.status]}`}>
            {order.status}
          </span>
          <span className="text-slate-900 font-bold">Rs. {order.total.toLocaleString('en-PK')}</span>
          <span className="text-slate-400 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-navy-700 pt-4">
          {/* Status tracker */}
          {order.status !== 'cancelled' ? (
            <div className="flex items-center mb-6">
              {statusSteps.map((step, i) => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${i <= stepIndex ? 'bg-accent' : 'bg-navy-700'}`} />
                    <span className={`text-[10px] mt-1.5 capitalize ${i <= stepIndex ? 'text-accent' : 'text-slate-400'}`}>{step}</span>
                  </div>
                  {i < statusSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < stepIndex ? 'bg-accent' : 'bg-navy-700'}`} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-red-600 text-sm mb-6">This order was cancelled.</p>
          )}

          <div className="space-y-4 mb-4">
            {order.items.map((item, i) => {
              const canReview = order.status === 'delivered' && item.productId && !item.alreadyReviewed && !reviewedIds.has(item.productId);
              return (
                <div key={i}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl2 shrink-0 bg-cover bg-center"
                      style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : { background: 'linear-gradient(135deg, #1e293b, #334155)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 font-medium line-clamp-1">{item.name}</p>
                      <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 shrink-0">
                      Rs. {(item.price * item.quantity).toLocaleString('en-PK')}
                    </span>
                  </div>

                  {canReview && (
                    reviewingProductId === item.productId ? (
                      <ReviewForm
                        item={item}
                        orderId={order.id}
                        onDone={() => { setReviewedIds((prev) => new Set(prev).add(item.productId)); setReviewingProductId(null); }}
                      />
                    ) : (
                      <button onClick={() => setReviewingProductId(item.productId)}
                        className="text-xs font-semibold text-accent hover:underline mt-2 ml-16">
                        ⭐ Leave a Review
                      </button>
                    )
                  )}
                  {(item.alreadyReviewed || reviewedIds.has(item.productId)) && order.status === 'delivered' && (
                    <p className="text-xs text-green-600 mt-2 ml-16">✓ You reviewed this product</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-navy-700 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span><span className="text-slate-900">Rs. {order.subtotal.toLocaleString('en-PK')}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span><span>− Rs. {order.discount.toLocaleString('en-PK')}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Delivery</span>
              <span className="text-slate-900">{order.deliveryFee === 0 ? 'Free' : `Rs. ${order.deliveryFee.toLocaleString('en-PK')}`}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-4">
            📍 Delivered to: {order.address}{order.landmark ? ` · Landmark: ${order.landmark}` : ''}, {order.city}
          </p>

          <div className="mt-3">
            {invoiceError && <p className="text-red-600 text-xs mb-2">{invoiceError}</p>}
            <button onClick={handleDownloadInvoice} disabled={downloadingInvoice}
              className="text-xs font-semibold text-accent hover:underline">
              {downloadingInvoice ? 'Preparing PDF…' : '⬇ Download Invoice'}
            </button>
          </div>

          {order.status === 'pending' && (
            <div className="mt-4 pt-4 border-t border-navy-700">
              {cancelError && <p className="text-red-600 text-xs mb-2">{cancelError}</p>}
              {confirmCancel ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">Cancel this order?</span>
                  <button onClick={handleCancel} disabled={cancelling}
                    className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1.5 transition-colors">
                    {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                  </button>
                  <button onClick={() => setConfirmCancel(false)} className="text-xs font-semibold text-slate-500 hover:text-slate-900">
                    Never mind
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmCancel(true)} className="text-xs font-semibold text-red-600 hover:underline">
                  Cancel Order
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/orders/mine')
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(err.message || 'Could not load your orders.'))
      .finally(() => setLoading(false));
  }, []);

  const handleCancelled = (orderId) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
  };

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Container>
          <div className="py-10">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">My Orders</h1>
            <p className="text-slate-500">Track, review, and manage everything you&apos;ve ordered.</p>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-500">Loading your orders…</div>
          ) : error ? (
            <div className="text-center py-20">
              <span className="text-6xl mb-4 block">⚠️</span>
              <p className="text-slate-900 font-semibold mb-1">Couldn&apos;t load your orders</p>
              <p className="text-slate-500 text-sm">{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 pb-28">
              <span className="text-7xl mb-6 block">🧾</span>
              <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">When you place an order, you&apos;ll be able to track and review it here.</p>
              <Link to="/shop"><Button>Start Shopping</Button></Link>
            </div>
          ) : (
            <div className="space-y-4 pb-20">
              <AnimatePresence>
                {orders.map((order) => <OrderCard key={order.id} order={order} onCancelled={handleCancelled} />)}
              </AnimatePresence>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
};

export default MyOrders;
