require('dotenv').config();
require('express-async-errors');

const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');

const { testConnection, pool } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const contactRoutes = require('./routes/contactRoutes');
const { sitemap } = require('./controllers/sitemapController');

const app = express();

// Trust the first proxy hop (needed for correct client IPs / secure cookies
// behind Nginx, a load balancer, etc. in production).
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow the frontend origin to load /uploads images
}));
app.use(compression());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', apiLimiter);

// Serve uploaded product images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'Khan Mobile Shop API is running.' }));
app.get('/sitemap.xml', sitemap);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact', contactRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let server;

const start = async () => {
  try {
    await testConnection();
    console.log('MySQL connected.');
    server = app.listen(PORT, () => console.log(`Khan Mobile Shop API listening on port ${PORT}`));
  } catch (err) {
    console.error('Failed to connect to MySQL.');
    console.error(`  Trying to reach: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306} as user "${process.env.DB_USER}", database "${process.env.DB_NAME}"`);
    console.error(`  Error code: ${err.code || '(none)'}`);
    console.error(`  Error message: ${err.message || '(empty — see full error below)'}`);
    console.error(err);
    process.exit(1);
  }
};

// Shut down cleanly on Ctrl+C / process manager restarts — finish in-flight
// requests, close the MySQL pool, then exit, instead of dropping connections mid-request.
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await pool.end();
      console.log('Closed out remaining connections. Goodbye.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref(); // force-exit if something hangs
  } else {
    process.exit(0);
  }
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();

module.exports = app;
