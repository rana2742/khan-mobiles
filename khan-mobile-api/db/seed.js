require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connect, mongoose } = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const PRODUCTS = require('./products-seed-data');

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const seedAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || 'khanmobiles345@gmail.com').toLowerCase();
  const existing = await User.exists({ email });
  if (existing) {
    console.log(`Admin already exists (${email}), skipping.`);
    return;
  }
  const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@12345', 12);
  await User.create({
    name: process.env.ADMIN_NAME || 'Admin',
    email,
    password: hashed,
    role: 'admin',
    emailVerified: true,
  });
  console.log(`Created admin account: ${email} / ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`);
};

const seedProducts = async () => {
  const count = await Product.countDocuments();
  if (count > 0) {
    console.log(`Products collection already has ${count} documents, skipping product seed.`);
    return;
  }

  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    await Product.create({
      name: p.name,
      slug,
      description: `The ${p.name} from ${p.brand} — a customer favorite in our ${p.category.toLowerCase()} lineup.`,
      price: p.price,
      category: p.category,
      brand: p.brand,
      rating: p.rating,
      badge: p.badge || null,
      bgGradient: p.bgGradient,
      compatibleModels: p.compatibleModels || [],
      stock: Math.floor(Math.random() * 80) + 20,
    });
  }
  console.log(`Seeded ${PRODUCTS.length} products.`);
};

const run = async () => {
  try {
    await connect();
    await seedAdmin();
    await seedProducts();
    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
