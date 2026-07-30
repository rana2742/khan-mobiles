require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const PRODUCTS = require('./products-seed-data');

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const seedAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || 'khanmobiles345@gmail.com').toLowerCase();
  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (rows.length) {
    console.log(`Admin already exists (${email}), skipping.`);
    return;
  }
  const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@12345', 12);
  await pool.query(
    'INSERT INTO users (name, email, password, role, email_verified) VALUES (?, ?, ?, ?, 1)',
    [process.env.ADMIN_NAME || 'Admin', email, hashed, 'admin']
  );
  console.log(`Created admin account: ${email} / ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`);
};

const seedProducts = async () => {
  const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM products');
  if (count > 0) {
    console.log(`Products table already has ${count} rows, skipping product seed.`);
    return;
  }

  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    await pool.query(
      `INSERT INTO products
        (name, slug, description, price, category, brand, rating, badge, bg_gradient, compatible_models, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.name,
        slug,
        `The ${p.name} from ${p.brand} — a customer favorite in our ${p.category.toLowerCase()} lineup.`,
        p.price,
        p.category,
        p.brand,
        p.rating,
        p.badge || null,
        p.bgGradient,
        JSON.stringify(p.compatibleModels || []),
        Math.floor(Math.random() * 80) + 20,
      ]
    );
  }
  console.log(`Seeded ${PRODUCTS.length} products.`);
};

const run = async () => {
  try {
    await seedAdmin();
    await seedProducts();
    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();
