require('dotenv').config();
require('express-async-errors');

const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');

const cron = require('node-cron');
const { connect, mongoose } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');
const { protect, adminOnly } = require('./middleware/auth');
const { runBackupAndEmail } = require('./utils/backup');

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

// Admin-only: trigger the same backup the weekly cron job runs, on demand —
// useful right before a risky change, without waiting for the schedule.
app.post('/api/admin/backup', protect, adminOnly, async (req, res) => {
  const result = await runBackupAndEmail();
  if (!result.sent) {
    return res.status(500).json({ success: false, message: `Backup failed: ${result.reason}` });
  }
  res.json({ success: true, message: 'Backup sent.' });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let server;

const start = async () => {
  try {
    await connect();
    console.log('MongoDB connected.');
    server = app.listen(PORT, () => console.log(`Khan Mobile Shop API listening on port ${PORT}`));

    // Weekly database backup, emailed as a zip. Default: every Sunday at
    // 3:00 AM server time. Override with BACKUP_CRON_SCHEDULE (standard
    // 5-field cron syntax) in .env, or set BACKUP_ENABLED=false to disable.
    if (process.env.BACKUP_ENABLED !== 'false') {
      const schedule = process.env.BACKUP_CRON_SCHEDULE || '0 3 * * 0';
      cron.schedule(schedule, () => {
        runBackupAndEmail().catch((err) => console.error('[backup] Unexpected error:', err));
      });
      console.log(`Weekly backup scheduled (cron: "${schedule}").`);
    }
  } catch (err) {
    console.error('Failed to connect to MongoDB.');
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
      await mongoose.connection.close();
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
