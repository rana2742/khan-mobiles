import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Container from './Container';

const QUICK_LINKS = [
  { label: 'Home',       to: '/' },
  { label: 'Shop',       to: '/shop' },
  { label: 'About',      to: '/about' },
  { label: 'Contact',    to: '/contact' },
];

const CATEGORY_LINKS = ['Earbuds','Chargers','Earphones','Power Banks','Screen Protectors','Smartwatches'];

const SOCIALS = [
  { label: 'Facebook', href: 'https://www.facebook.com/share/1BaF76oZUk/', icon: (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  )},
  { label: 'Instagram', href: 'https://www.instagram.com/khanmobile345?igsh=MXBhdjYzMmlzZWtibA==', icon: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )},
 {
  label: 'TikTok',
  href: 'https://www.tiktok.com/@khan.mobile345?_r=1&_t=ZS-989i23fJpoH', // Replace with your TikTok profile
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25h-3.13v13.23a2.8 2.8 0 1 1-2.8-2.8c.31 0 .61.05.89.14V9.84a5.93 5.93 0 0 0-.89-.07A5.93 5.93 0 1 0 15.82 15V8.28a7.92 7.92 0 0 0 4.64 1.49V6.69h-.87z"/>
    </svg>
  ),
},
];

const FooterLink = ({ to, children }) => (
  <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.15 }}>
    <Link to={to} className="text-sm text-slate-400 hover:text-accent transition-colors duration-200 block py-0.5">
      {children}
    </Link>
  </motion.div>
);

const Footer = () => (
  <footer className="bg-slate-900 border-t border-slate-800">
    <Container>
      <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="flex flex-col gap-5">
          <Link to="/" className="flex items-center gap-1 w-fit">
            <span className="text-xl font-extrabold text-white">Khan</span>
            <span className="text-xl font-extrabold text-accent">Mobile</span>
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your one-stop shop for premium mobile accessories. Quality products, fast delivery, unbeatable prices.
          </p>
          <div className="flex items-center gap-3">
            {SOCIALS.map(({ label, href, icon }) => (
              <motion.a key={label} href={href} aria-label={label}
                whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                className="w-9 h-9 rounded-xl2 bg-slate-800 flex items-center justify-center text-slate-400 hover:text-accent hover:bg-accent/10 transition-colors">
                {icon}
              </motion.a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-5">Quick Links</h3>
          <div className="flex flex-col gap-1">
            {QUICK_LINKS.map((l) => <FooterLink key={l.label} to={l.to}>{l.label}</FooterLink>)}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-5">Categories</h3>
          <div className="flex flex-col gap-1">
            {CATEGORY_LINKS.map((c) => (
              <FooterLink key={c} to={`/shop?category=${encodeURIComponent(c)}`}>{c}</FooterLink>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-5">Contact Us</h3>
          <div className="flex flex-col gap-3 text-sm text-slate-400">
            <p className="flex items-start gap-2"><span>📍</span><span>Industrial Estate Near UBL Bank, Multan</span></p>
            <p className="flex items-center gap-2"><span>📞</span>
              <a href="tel:+92 3166953535" className="hover:text-accent transition-colors">+92 316 695 3534</a>
            </p>
            <p className="flex items-center gap-2"><span>🕐</span><span> Open Daily: 08am – 10pm</span></p>
          </div>
        </div>
      </div>
    </Container>

    <div className="border-t border-slate-800">
      <Container>
        <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-500 text-xs">© 2026 Khan Mobile Shop. All rights reserved.</p>
                <p className="text-slate-600 text-xs">
            Designed & Developed by{" "}
            <a
              href="https://github.com/rana2742"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Rana
            </a>
            {" "}• Proudly Made in Pakistan 🇵🇰
          </p>
        </div>
      </Container>
    </div>
  </footer>
);

export default Footer;
