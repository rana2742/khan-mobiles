const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 190 },
    password: { type: String, default: null, select: false }, // null for Google-only accounts
    resetTokenHash: { type: String, default: null, select: false },
    resetTokenExpires: { type: Date, default: null },
    avatarUrl: { type: String, default: null },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    phone: { type: String, default: null, maxlength: 30 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
