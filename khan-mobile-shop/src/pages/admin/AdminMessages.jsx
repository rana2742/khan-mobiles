import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Container from '../../components/Container';
import AdminTabs from '../../components/AdminTabs';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/contact');
      setMessages(data.messages);
    } catch (err) {
      setError(err.message || 'Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleExpand = async (msg) => {
    const opening = expandedId !== msg.id;
    setExpandedId(opening ? msg.id : null);
    if (opening && !msg.isRead) {
      try {
        await api.put(`/api/contact/${msg.id}/read`);
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m)));
      } catch {
        /* non-critical */
      }
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/contact/${id}`);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err.message || 'Could not delete message.');
    }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Container>
          <div className="py-10">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Messages</h1>
            <p className="text-slate-500">{messages.length} message{messages.length !== 1 ? 's' : ''}{unreadCount > 0 ? ` · ${unreadCount} unread` : ''}</p>
          </div>

          <AdminTabs />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl2 px-4 py-3 mb-6">{error}</div>
          )}

          {loading ? (
            <div className="text-center py-20 text-slate-500">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-6xl mb-4 block">📭</span>
              <p className="text-slate-900 font-semibold mb-1">No messages yet</p>
              <p className="text-slate-500 text-sm">Contact form submissions will show up here.</p>
            </div>
          ) : (
            <div className="space-y-3 pb-20">
              {messages.map((m) => (
                <div key={m.id} onClick={() => handleExpand(m)}
                  className={`bg-navy-800 rounded-xl2 p-5 cursor-pointer transition-colors ${!m.isRead ? 'border-l-4 border-accent' : ''}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${!m.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{m.name}</p>
                        <span className="text-xs text-slate-400">{m.email}</span>
                      </div>
                      <p className="text-sm text-slate-500 truncate mt-0.5">{m.subject || m.message}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-400">
                        {new Date(m.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                      </span>
                      <button onClick={(e) => handleDelete(m.id, e)} className="text-xs font-semibold text-red-600 hover:underline">
                        Delete
                      </button>
                    </div>
                  </div>
                  {expandedId === m.id && (
                    <div className="mt-4 pt-4 border-t border-navy-700">
                      {m.subject && <p className="text-sm font-semibold text-slate-900 mb-2">{m.subject}</p>}
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{m.message}</p>
                      <a href={`mailto:${m.email}`} onClick={(e) => e.stopPropagation()}
                        className="inline-block mt-3 text-xs font-semibold text-accent hover:underline">
                        Reply via email →
                      </a>
                    </div>
                  )}
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

export default AdminMessages;
