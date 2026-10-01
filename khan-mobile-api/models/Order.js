const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 100 },
    imageUrl: { type: String, default: null },
  },
  { _id: false }
);

const courierSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['leopards'], default: null },
    trackingNumber: { type: String, default: null },
    status: { type: String, default: null },
    statusCode: { type: String, default: null },
    statusReason: { type: String, default: null },
    slipLink: { type: String, default: null },
    bookedAt: { type: Date, default: null },
    lastUpdatedAt: { type: Date, default: null },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    idempotencyKey: { type: String, default: null, unique: true, sparse: true, maxlength: 100 },
    guestInvoiceTokenHash: { type: String, default: null, select: false, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    promoCode: { type: String, default: null },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    landmark: { type: String, default: null, trim: true },
    city: { type: String, required: true, trim: true },
    paymentMethod: { type: String, enum: ['cod'], default: 'cod' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    items: { type: [orderItemSchema], default: [] },
    courier: { type: courierSchema, default: null },
    // Server-side Meta Purchase delivery state. This does not affect order
    // checkout; it lets safe retries avoid losing an event after a transient CAPI failure.
    metaPurchaseSentAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

orderSchema.index({ user: 1 });
orderSchema.index({ 'courier.trackingNumber': 1 });

module.exports = mongoose.model('Order', orderSchema);
