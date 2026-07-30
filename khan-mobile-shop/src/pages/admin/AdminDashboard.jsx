import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Container from '../../components/Container';
import Button from '../../components/Button';
import AdminTabs from '../../components/AdminTabs';

const badgeColors = {
  New: 'text-blue-600', Hot: 'text-orange-600', Sale: 'text-orange-600', Bestseller: 'text-green-600',
};

const StatCard = ({ label, value, accent }) => (
  <div className="bg-navy-800 rounded-xl2 p-5">
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">{label}</p>
    <p className={`text-2xl font-extrabold ${accent || 'text-slate-900'}`}>{value}</p>
  </div>
);

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [productsData, statsData] = await Promise.all([
        api.get('/api/products?includeInactive=true&limit=200&sort=newest'),
        api.get('/api/orders/stats/summary'),
      ]);
      setProducts(productsData.products);
      setStats(statsData.stats);
    } catch (err) {
      setError(err.message || 'Could not load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/api/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message || 'Could not delete product.');
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Container>
          <div className="py-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Admin Dashboard</h1>
              <p className="text-slate-500">{products.length} product{products.length !== 1 ? 's' : ''} in the catalog</p>
            </div>
            <Link to="/admin/products/new"><Button>+ Add Product</Button></Link>
          </div>

          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Pending Orders" value={stats.pendingCount} accent={stats.pendingCount > 0 ? 'text-yellow-600' : undefined} />
              <StatCard label="Total Orders" value={stats.totalOrders} />
              <StatCard label="Revenue" value={`Rs. ${stats.totalRevenue.toLocaleString('en-PK')}`} accent="text-accent" />
              <StatCard label="Low Stock" value={stats.lowStockCount} accent={stats.lowStockCount > 0 ? 'text-orange-600' : undefined} />
            </div>
          )}

          <AdminTabs />

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-600 text-sm rounded-xl2 px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-slate-500">Loading products…</div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-6xl mb-4 block">📦</span>
              <p className="text-slate-900 font-semibold mb-1">No products yet</p>
              <p className="text-slate-500 text-sm mb-6">Add your first product to get the catalog started.</p>
              <Link to="/admin/products/new"><Button>+ Add Product</Button></Link>
            </div>
          ) : (
            <div className="bg-navy-800 rounded-xl2 overflow-hidden mb-20">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-navy-700">
                      <th className="px-5 py-4 font-semibold">Product</th>
                      <th className="px-5 py-4 font-semibold">Category</th>
                      <th className="px-5 py-4 font-semibold">Price</th>
                      <th className="px-5 py-4 font-semibold">Stock</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {products.map((p) => (
                        <motion.tr key={p.id} exit={{ opacity: 0 }} className="border-b border-navy-700 last:border-0">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-11 h-11 rounded-xl2 shrink-0 bg-cover bg-center"
                                style={{ background: p.imageUrl ? `url(${p.imageUrl}) center/cover` : p.bgGradient }}
                              />
                              <div className="min-w-0">
                                <p className="text-slate-900 font-medium truncate max-w-[220px]">{p.name}</p>
                                <p className="text-xs text-slate-500">{p.brand}</p>
                              </div>
                              {p.badge && <span className={`text-xs font-semibold ${badgeColors[p.badge]}`}>{p.badge}</span>}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-600">{p.category}</td>
                          <td className="px-5 py-4 text-slate-900 font-semibold">Rs. {p.price.toLocaleString('en-PK')}</td>
                          <td className="px-5 py-4">
                            <span className={p.stock === 0 ? 'text-red-600' : p.stock < 10 ? 'text-orange-600' : 'text-slate-600'}>
                              {p.stock}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.isActive ? 'bg-green-500/15 text-green-600' : 'bg-slate-500/15 text-slate-500'}`}>
                              {p.isActive ? 'Active' : 'Hidden'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link to={`/admin/products/${p.id}/edit`}
                                className="text-xs font-semibold text-accent hover:underline px-2 py-1">
                                Edit
                              </Link>
                              {confirmId === p.id ? (
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id}
                                    className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg px-2.5 py-1.5 transition-colors">
                                    {deletingId === p.id ? '…' : 'Confirm'}
                                  </button>
                                  <button onClick={() => setConfirmId(null)}
                                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1">
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmId(p.id)}
                                  className="text-xs font-semibold text-red-600 hover:underline px-2 py-1">
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
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

export default AdminDashboard;
