import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { downloadFile } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Container from '../components/Container';
import Button from '../components/Button';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(location.state || null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true);
    setInvoiceError('');
    try {
      await downloadFile(`/api/orders/${order.orderId}/invoice`, `invoice-${order.orderNumber}.pdf`);
    } catch (err) {
      setInvoiceError(err.message || 'Could not download invoice.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  useEffect(() => {
    if (!order) {
      try {
        const stored = sessionStorage.getItem('khan-mobile-last-order');
        if (stored) setOrder(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
  }, [order]);

  useEffect(() => {
    if (!order || !window.ttq) return;

    const purchaseKey = `khan-mobile-tiktok-purchase-${order.orderId || order.orderNumber}`;
    if (sessionStorage.getItem(purchaseKey)) return;

    window.ttq.track('Purchase', {
      contents: (order.items || []).map((item) => ({
        content_id: String(item.productId || item.id),
        content_name: item.name,
        content_type: 'product',
        quantity: Number(item.quantity),
        price: Number(item.price),
      })),
      value: Number(order.total),
      currency: 'PKR',
    });

    sessionStorage.setItem(purchaseKey, '1');
  }, [order]);

  if (!order) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen flex items-center justify-center">
          <Container>
            <div className="text-center py-24">
              <span className="text-7xl mb-6 block">🧾</span>
              <h1 className="text-2xl font-bold mb-3">No order found</h1>
              <p className="text-slate-500 mb-8">We couldn&apos;t find a recent order to show you.</p>
              <Button onClick={() => navigate('/shop')}>Continue Shopping</Button>
            </div>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  const { orderId, items, total, customer, placedAt } = order;
  const estDelivery = new Date(new Date(placedAt).getTime() + 4 * 24 * 60 * 60 * 1000);

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Container>
          <div className="max-w-2xl mx-auto py-16 text-center">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/40 flex items-center justify-center mx-auto mb-6"
            >
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#22C55E" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
              </svg>
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Order Placed Successfully!</h1>
            <p className="text-slate-500 mb-8">
              Thank you{customer?.fullName ? `, ${customer.fullName.split(' ')[0]}` : ''}! A confirmation has been sent to{' '}
              <span className="text-slate-900">{customer?.email}</span>.
            </p>

            <div className="bg-navy-800 rounded-xl2 p-6 text-left mb-8">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5 pb-5 border-b border-navy-700">
                <div>
                  <p className="text-xs text-slate-500">Order Number</p>
                  <p className="text-lg font-bold text-accent">{orderId}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Estimated Delivery</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {estDelivery.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl2 shrink-0 bg-cover bg-center" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : { background: item.bgGradient || 'linear-gradient(135deg, #1e293b, #334155)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 font-medium line-clamp-1">{item.name}</p>
                      <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 shrink-0">
                      Rs. {(item.price * item.quantity).toLocaleString('en-PK')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-lg font-bold text-slate-900 pt-4 border-t border-navy-700">
                <span>Total Paid</span>
                <span>Rs. {total.toLocaleString('en-PK')}</span>
              </div>

              {customer?.address && (
                <p className="text-xs text-slate-500 mt-5 pt-5 border-t border-navy-700">
                  📍 Delivering to: {customer.address}{customer.landmark ? ` · Landmark: ${customer.landmark}` : ''}, {customer.city}
                </p>
              )}
            </div>

            {invoiceError && <p className="text-red-600 text-sm mb-3">{invoiceError}</p>}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={handleDownloadInvoice} disabled={downloadingInvoice}
                className="text-sm font-semibold text-accent hover:underline">
                {downloadingInvoice ? 'Preparing PDF…' : '⬇ Download Invoice'}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
              <Link to="/shop"><Button variant="secondary">Continue Shopping</Button></Link>
              <Link to="/orders"><Button>View My Orders</Button></Link>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
};

export default OrderConfirmation;
