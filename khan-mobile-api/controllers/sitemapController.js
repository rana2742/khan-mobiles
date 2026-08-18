const Product = require('../models/Product');

// The frontend's public domain — sitemap URLs must point at the site
// customers/Google actually visit, not this API's own domain.
const SITE_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const STATIC_PAGES = ['', '/shop', '/categories', '/about', '/contact'];

// GET /sitemap.xml — regenerated fresh on every request from whatever's
// currently active, so it never goes stale as products are added/removed.
exports.sitemap = async (req, res) => {
  const products = await Product.find({ isActive: true }).select('slug updatedAt').sort({ updatedAt: -1 });
  const categories = await Product.distinct('category', { isActive: true });

  const urls = [
    ...STATIC_PAGES.map((p) => ({ loc: `${SITE_URL}${p}`, priority: p === '' ? '1.0' : '0.8' })),
    ...categories.map((c) => ({
      loc: `${SITE_URL}/shop?category=${encodeURIComponent(c)}`,
      priority: '0.6',
    })),
    ...products.map((p) => ({
      loc: `${SITE_URL}/product/${p.slug}`,
      lastmod: new Date(p.updatedAt).toISOString().split('T')[0],
      priority: '0.7',
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
};
