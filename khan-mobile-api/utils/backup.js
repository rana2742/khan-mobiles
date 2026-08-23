const archiver = require('archiver');
const { PassThrough } = require('stream');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const ContactMessage = require('../models/ContactMessage');
const { sendMail } = require('./email');

// Collections to include, and how to sanitize each one. Password hashes and
// reset/verification token hashes are stripped — email isn't a secure
// channel, and a leaked backup shouldn't hand over credentials.
const EXPORTERS = [
  {
    name: 'users',
    fetch: () => User.find().select('-password -resetTokenHash -verifyTokenHash').lean(),
  },
  { name: 'products', fetch: () => Product.find().lean() },
  { name: 'orders', fetch: () => Order.find().lean() },
  { name: 'reviews', fetch: () => Review.find().lean() },
  { name: 'contactMessages', fetch: () => ContactMessage.find().lean() },
];

// Builds a zip (in memory, as a Buffer) containing one JSON file per collection.
const buildBackupZip = async () => {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const chunks = [];
  const passthrough = new PassThrough();
  passthrough.on('data', (chunk) => chunks.push(chunk));
  archive.pipe(passthrough);

  for (const { name, fetch } of EXPORTERS) {
    const docs = await fetch();
    archive.append(JSON.stringify(docs, null, 2), { name: `${name}.json` });
  }

  await archive.finalize();
  await new Promise((resolve) => passthrough.on('end', resolve));
  return Buffer.concat(chunks);
};

// Runs the export and emails it as a zip attachment. Used both by the cron
// schedule and by the on-demand admin endpoint.
const runBackupAndEmail = async () => {
  const to = process.env.BACKUP_EMAIL_TO || process.env.ADMIN_EMAIL;
  if (!to) {
    console.log('[backup] Skipped — no BACKUP_EMAIL_TO or ADMIN_EMAIL configured.');
    return { sent: false, reason: 'no_recipient' };
  }

  const zipBuffer = await buildBackupZip();
  const dateStr = new Date().toISOString().split('T')[0];

  const result = await sendMail({
    to,
    subject: `Khan Mobile Shop — Database Backup (${dateStr})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color:#0F172A;">Weekly database backup</h2>
        <p style="color:#334155;">Attached is a zip containing a JSON export of your database as of ${dateStr}.</p>
        <p style="color:#94A3B8; font-size:12px;">Passwords and security tokens are excluded from this export. Store this file securely — it contains customer names, emails, addresses, and order history.</p>
      </div>
    `,
    attachments: [
      { filename: `khan-mobile-backup-${dateStr}.zip`, content: zipBuffer },
    ],
  });

  console.log(`[backup] ${result.sent ? 'Sent' : 'Failed to send'} backup to ${to}.`);
  return result;
};

module.exports = { runBackupAndEmail };
