const mongoose = require('mongoose');

// Gallery photos are embedded directly on the product instead of living in a
// separate collection — MongoDB has no JOINs, and a product's images are
// always fetched together with the product anyway, so embedding avoids an
// extra query on every read (what used to be the MySQL product_images table).
const productImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, maxlength: 220 },
    description: { type: String, default: null },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number, default: null },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    brand: { type: String, required: true, trim: true, maxlength: 80 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    badge: { type: String, enum: ['New', 'Hot', 'Sale', 'Bestseller', null], default: null },
    imageUrl: { type: String, default: null }, // primary photo, kept in sync with images[0]
    images: { type: [productImageSchema], default: [] },
    bgGradient: { type: String, default: null },
    compatibleModels: { type: [String], default: [] },
    stock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ name: 'text', brand: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
