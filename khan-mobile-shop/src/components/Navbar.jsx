import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useScrollNavbar from '../hooks/useScrollNavbar';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Container from './Container';
import CartDrawer from './CartDrawer';

const PENDING_ORDERS_POLL_MS = 30000; // how often admins get a fresh "new orders" count

const NAV_LINKS = [
  { label: 'Home',       to: '/' },
  { label: 'Shop',       to: '/shop' },
  { label: 'Categories', to: '/categories' },
  { label: 'About',      to: '/about' },
  { label: 'Contact',    to: '/contact' },
];

const NavLink = ({ label, to, active }) => (
  <Link to={to} className="relative py-1 group">
    <span className={`text-sm font-medium transition-colors duration-200 ${active ? 'text-accent' : 'text-slate-600 hover:text-slate-900'}`}>
      {label}
    </span>
    <motion.span
      className="absolute bottom-0 left-0 h-[2px] bg-accent rounded-full w-full block"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: active ? 1 : 0 }}
      whileHover={{ scaleX: 1 }}
      transition={{ duration: 0.2 }}
      style={{ transformOrigin: 'left' }}
    />
  </Link>
);

const Navbar = () => {
  const scrolled = useScrollNavbar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [pendingOrders, setPendingOrders] = useState(0);

  // Admins get a live-ish "new orders" count in the nav so they notice a sale
  // without having to keep the dashboard open. Simple polling — no websocket
  // infra needed for a store this size, and it degrades gracefully if a poll fails.
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const fetchPending = () => {
      api.get('/api/orders/stats/summary')
        .then((data) => !cancelled && setPendingOrders(data.stats.pendingCount))
        .catch(() => {});
    };
    fetchPending();
    const interval = setInterval(fetchPending, PENDING_ORDERS_POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isAdmin]);

  const handleLogout = async () => {
    setAccountOpen(false);
    await logout();
    navigate('/');
  };

  const submitSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 border-b"
        animate={scrolled
          ? { backgroundColor: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderColor: 'rgba(15,23,42,0.08)' }
          : { backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',  borderColor: 'rgba(15,23,42,0.04)' }
        }
        transition={{ duration: 0.3 }}
      >
        <Container>
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-1 select-none">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">Khan</span>
              <span className="text-xl font-extrabold tracking-tight text-accent">Mobile</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.to} {...link} active={location.pathname === link.to} />
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => setSearchOpen((o) => !o)}
                className="text-slate-600 hover:text-slate-900 p-1" aria-label="Search">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
                </svg>
              </motion.button>

              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => setCartOpen(true)}
                className="relative text-slate-600 hover:text-slate-900 p-1" aria-label="Cart">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      key={itemCount}
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {itemCount > 9 ? '9+' : itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <div className="relative hidden sm:block">
                {isAuthenticated ? (
                  <>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setAccountOpen((o) => !o)}
                      className="relative w-8 h-8 rounded-full bg-accent/20 border border-accent/40 text-accent text-sm font-bold flex items-center justify-center"
                      aria-label="Account menu">
                      {user.avatarUrl
                        ? <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        : user.name?.[0]?.toUpperCase() || 'U'}
                      {isAdmin && pendingOrders > 0 && (
                        <span className="absolute -top-1 -right-1 bg-yellow-500 text-slate-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                          {pendingOrders > 9 ? '9+' : pendingOrders}
                        </span>
                      )}
                    </motion.button>
                    <AnimatePresence>
                      {accountOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-11 w-52 bg-navy-800 border border-navy-700 rounded-xl2 shadow-xl z-50 overflow-hidden"
                          >
                            <div className="px-4 py-3 border-b border-navy-700">
                              <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                              <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>
                            {isAdmin ? (
                              <>
                                <Link to="/admin" onClick={() => setAccountOpen(false)}
                                  className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-navy-700 hover:text-slate-900 transition-colors">
                                  Admin Dashboard
                                </Link>
                                <Link to="/admin/orders" onClick={() => setAccountOpen(false)}
                                  className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-600 hover:bg-navy-700 hover:text-slate-900 transition-colors">
                                  <span>Orders</span>
                                  {pendingOrders > 0 && (
                                    <span className="bg-yellow-500 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingOrders} new</span>
                                  )}
                                </Link>
                              </>
                            ) : (
                              <Link to="/orders" onClick={() => setAccountOpen(false)}
                                className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-navy-700 hover:text-slate-900 transition-colors">
                                My Orders
                              </Link>
                            )}
                            <button onClick={handleLogout}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-navy-700 transition-colors">
                              Log Out
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl2 hover:bg-navy-800 transition-colors">
                    Log In
                  </Link>
                )}
              </div>

              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => setMobileOpen((o) => !o)}
                className="md:hidden text-slate-600 hover:text-slate-900 p-1"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/>
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>}
                </svg>
              </motion.button>
            </div>
          </div>
        </Container>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-slate-900/10 bg-navy-800/95 backdrop-blur-md"
            >
              <Container>
                <form onSubmit={submitSearch} className="py-4 flex items-center gap-3">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-slate-500 shrink-0">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
                  </svg>
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    aria-label="Search products"
                    className="flex-1 bg-transparent text-slate-900 placeholder-slate-500 text-sm focus:outline-none"
                  />
                  <button type="submit" className="text-accent text-sm font-semibold hover:underline">Search</button>
                </form>
              </Container>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div key="mobile-menu"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-navy-800 border-b border-navy-700 md:hidden">
            <Container>
              <div className="py-4 flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                    className={`px-3 py-3 rounded-xl2 text-sm font-medium transition-colors ${
                      location.pathname === link.to ? 'bg-accent/10 text-accent' : 'text-slate-600 hover:bg-navy-700 hover:text-slate-900'
                    }`}>
                    {link.label}
                  </Link>
                ))}
                <div className="h-px bg-navy-700 my-2" />
                {isAuthenticated ? (
                  <>
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    {isAdmin ? (
                      <>
                        <Link to="/admin" onClick={() => setMobileOpen(false)}
                          className="px-3 py-3 rounded-xl2 text-sm font-medium text-slate-600 hover:bg-navy-700 hover:text-slate-900 transition-colors">
                          Admin Dashboard
                        </Link>
                        <Link to="/admin/orders" onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between px-3 py-3 rounded-xl2 text-sm font-medium text-slate-600 hover:bg-navy-700 hover:text-slate-900 transition-colors">
                          <span>Orders</span>
                          {pendingOrders > 0 && (
                            <span className="bg-yellow-500 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingOrders} new</span>
                          )}
                        </Link>
                      </>
                    ) : (
                      <Link to="/orders" onClick={() => setMobileOpen(false)}
                        className="px-3 py-3 rounded-xl2 text-sm font-medium text-slate-600 hover:bg-navy-700 hover:text-slate-900 transition-colors">
                        My Orders
                      </Link>
                    )}
                    <button onClick={() => { setMobileOpen(false); handleLogout(); }}
                      className="text-left px-3 py-3 rounded-xl2 text-sm font-medium text-red-600 hover:bg-navy-700 transition-colors">
                      Log Out
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)}
                    className="px-3 py-3 rounded-xl2 text-sm font-medium text-slate-600 hover:bg-navy-700 hover:text-slate-900 transition-colors">
                    Log In / Sign Up
                  </Link>
                )}
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Navbar;
