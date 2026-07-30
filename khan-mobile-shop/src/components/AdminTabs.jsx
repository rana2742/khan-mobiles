import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';

const TABS = [
  { to: '/admin', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/reviews', label: 'Reviews' },
];

const AdminTabs = () => {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.get('/api/contact')
      .then((data) => setUnreadCount(data.messages.filter((m) => !m.isRead).length))
      .catch(() => {});
  }, [location.pathname]);

  return (
    <div className="flex gap-1 border-b border-navy-700 mb-8">
      {TABS.map((t) => (
        <Link key={t.to} to={t.to}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            location.pathname === t.to ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}>
          {t.label}
          {t.to === '/admin/messages' && unreadCount > 0 && (
            <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </Link>
      ))}
    </div>
  );
};

export default AdminTabs;
