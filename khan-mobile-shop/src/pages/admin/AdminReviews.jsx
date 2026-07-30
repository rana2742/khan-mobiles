import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Container from '../../components/Container';
import AdminTabs from '../../components/AdminTabs';

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg key={s} width="14" height="14" viewBox="0 0 24 24"
        fill={s <= rating ? '#f59e0b' : '#E2E8F0'} stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ))}
  </div>
);

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [ratingFilter, setRatingFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/reviews');
      setReviews(data.reviews);
    } catch (err) {
      setError(err.message || 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/api/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message || 'Could not delete review.');
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  const filtered = ratingFilter ? reviews.filter((r) => r.rating === Number(ratingFilter)) : reviews;

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Container>
          <div className="py-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Reviews</h1>
              <p className="text-slate-500">{reviews.length} review{reviews.length !== 1 ? 's' : ''} across all products</p>
            </div>
            <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}
              className="bg-navy-700 border border-navy-700 text-slate-900 text-sm rounded-xl2 px-4 py-2.5 focus:outline-none focus:border-accent">
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>)}
            </select>
          </div>

          <AdminTabs />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl2 px-4 py-3 mb-6">{error}</div>
          )}

          {loading ? (
            <div className="text-center py-20 text-slate-500">Loading reviews…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-6xl mb-4 block">⭐</span>
              <p className="text-slate-900 font-semibold mb-1">No reviews {ratingFilter ? `with ${ratingFilter} stars` : 'yet'}</p>
              <p className="text-slate-500 text-sm">Customer reviews will show up here once orders are marked delivered.</p>
            </div>
          ) : (
            <div className="space-y-3 pb-20">
              {filtered.map((r) => (
                <div key={r.id} className="bg-navy-800 rounded-xl2 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <StarRating rating={r.rating} />
                        <Link to={`/product/${r.productId}`} className="text-sm font-semibold text-accent hover:underline truncate">
                          {r.productName}
                        </Link>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{r.comment || <em className="text-slate-400">No written comment.</em>}</p>
                      <p className="text-xs text-slate-400">
                        {r.userName} ({r.userEmail}) · {new Date(r.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {confirmId === r.id ? (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleDelete(r.id)} disabled={deletingId === r.id}
                            className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-2.5 py-1.5 transition-colors">
                            {deletingId === r.id ? '…' : 'Confirm'}
                          </button>
                          <button onClick={() => setConfirmId(null)} className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmId(r.id)} className="text-xs font-semibold text-red-600 hover:underline">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
};

export default AdminReviews;
