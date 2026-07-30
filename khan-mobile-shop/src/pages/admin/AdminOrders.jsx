import { useState, useEffect, useCallback, Fragment } from 'react';
import { api, downloadFile } from '../../services/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Container from '../../components/Container';
import AdminTabs from '../../components/AdminTabs';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const statusStyles = {
  pending:    'bg-yellow-500/15 text-yellow-600',
  processing: 'bg-blue-500/15 text-blue-600',
  shipped:    'bg-purple-500/15 text-purple-600',
  delivered:  'bg-green-500/15 text-green-600',
  cancelled:  'bg-red-500/15 text-red-600',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/api/orders${statusFilter ? `?status=${statusFilter}` : ''}`);
      setOrders(data.orders);
    } catch (err) {
      setError(err.message || 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); setDetail(null); return; }
    setExpandedId(id);
    setDetailLoading(true);
    try {
      const data = await api.get(`/api/orders/${id}`);
      setDetail(data.order);
    } catch (err) {
      setError(err.message || 'Could not load order detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.put(`/api/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      if (detail?.id === id) setDetail((d) => ({ ...d, status }));
    } catch (err) {
      setError(err.message || 'Could not update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Container>
          <div className="py-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Orders</h1>
              <p className="text-slate-500">{orders.length} order{orders.length !== 1 ? 's' : ''}{statusFilter ? ` · ${statusFilter}` : ''}</p>
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-navy-700 border border-navy-700 text-slate-900 text-sm rounded-xl2 px-4 py-2.5 focus:outline-none focus:border-accent">
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>

          <AdminTabs />

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-600 text-sm rounded-xl2 px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-slate-500">Loading orders…</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-6xl mb-4 block">🧾</span>
              <p className="text-slate-900 font-semibold mb-1">No orders {statusFilter ? `with status "${statusFilter}"` : 'yet'}</p>
              <p className="text-slate-500 text-sm">Orders will show up here as customers check out.</p>
            </div>
          ) : (
            <div className="bg-navy-800 rounded-xl2 overflow-hidden mb-20">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-navy-700">
                      <th className="px-5 py-4 font-semibold">Order</th>
                      <th className="px-5 py-4 font-semibold">Customer</th>
                      <th className="px-5 py-4 font-semibold">Total</th>
                      <th className="px-5 py-4 font-semibold">City</th>
                      <th className="px-5 py-4 font-semibold">Placed</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 font-semibold text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <Fragment key={o.id}>
                        <tr className="border-b border-navy-700 last:border-0 hover:bg-navy-700/30 transition-colors">
                          <td className="px-5 py-4 text-accent font-semibold">{o.orderNumber}</td>
                          <td className="px-5 py-4">
                            <p className="text-slate-900 font-medium">{o.customerName}</p>
                            <p className="text-xs text-slate-500">{o.customerEmail}</p>
                          </td>
                          <td className="px-5 py-4 text-slate-900 font-semibold">Rs. {o.total.toLocaleString('en-PK')}</td>
                          <td className="px-5 py-4 text-slate-600">{o.city}</td>
                          <td className="px-5 py-4 text-slate-500 text-xs">
                            {new Date(o.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-4">
                            <select
                              value={o.status}
                              disabled={updatingId === o.id}
                              onChange={(e) => handleStatusChange(o.id, e.target.value)}
                              className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border-0 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer ${statusStyles[o.status]}`}
                            >
                              {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-navy-800 text-slate-900">{s}</option>)}
                            </select>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button onClick={() => toggleExpand(o.id)} className="text-xs font-semibold text-accent hover:underline">
                              {expandedId === o.id ? 'Hide' : 'View'}
                            </button>
                          </td>
                        </tr>
                        {expandedId === o.id && (
                          <tr className="bg-navy-900/40">
                            <td colSpan={7} className="px-5 py-5">
                              {detailLoading ? (
                                <p className="text-slate-500 text-sm">Loading details…</p>
                              ) : detail && detail.id === o.id ? (
                                <div className="grid md:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Shipping To</h4>
                                    <p className="text-slate-900 text-sm font-medium">{detail.fullName}</p>
                                    <p className="text-slate-500 text-sm">{detail.phone}</p>
                                    <p className="text-slate-500 text-sm">{detail.email}</p>
                                    <p className="text-slate-500 text-sm mt-2">{detail.address}{detail.landmark ? ` · Landmark: ${detail.landmark}` : ''}, {detail.city}</p>
                                    <p className="text-slate-500 text-xs mt-2 capitalize">Payment: {detail.paymentMethod === 'cod' ? 'Cash on Delivery' : detail.paymentMethod}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Items</h4>
                                    <div className="space-y-2">
                                      {detail.items.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                          <span className="text-slate-600">{item.name} × {item.quantity}</span>
                                          <span className="text-slate-900 font-medium">Rs. {(item.price * item.quantity).toLocaleString('en-PK')}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-3 mt-3 border-t border-navy-700">
                                      <span>Total</span>
                                      <span>Rs. {detail.total.toLocaleString('en-PK')}</span>
                                    </div>
                                    <button
                                      onClick={() => downloadFile(`/api/orders/${detail.id}/invoice`, `invoice-${detail.orderNumber}.pdf`)}
                                      className="text-xs font-semibold text-accent hover:underline mt-3">
                                      ⬇ Download Invoice
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
};

export default AdminOrders;
