const mongoose = require('mongoose');

// Line items are embedded (equivalent to the old order_items table) — an
// order's items are always read together with the order, and embedding
// preserves what was ordered/priced at checkout time even if the product
// is later changed or deleted.
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    imageUrl: { type: String, default: null },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    promoCode: { type: String, default: null },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    landmark: { type: String, default: null },
    city: { type: String, required: true },
    paymentMethod: { type: String, default: 'cod' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    items: { type: [orderItemSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

orderSchema.index({ user: 1 });

module.exports = mongoose.model('Order', orderSchema);
