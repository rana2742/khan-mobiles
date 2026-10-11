const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendMail } = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// Cookie security is controlled by COOKIE_SECURE, not NODE_ENV, because a
// "production" deploy isn't necessarily served over HTTPS. `secure` cookies
// are silently dropped by browsers on plain HTTP, so this must only be true
// once the site is actually served over HTTPS. Set COOKIE_SECURE=true in
// .env once you add SSL.
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: process.env.COOKIE_SECURE === 'true' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

const toUserDTO = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  avatarUrl: user.avatarUrl,
  phone: user.phone,
});

const sendAuthResponse = (res, statusCode, user) => {
  const token = signToken(user._id.toString());
  res.cookie(process.env.COOKIE_NAME || 'khan_token', token, cookieOptions());
  res.status(statusCode).json({ success: true, user: toUserDTO(user) });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are all required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.exists({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashed,
    role: 'user',
  });

  sendAuthResponse(res, 201, user);
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

  if (!user || !user.password) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  sendAuthResponse(res, 200, user);
};


// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: toUserDTO(req.user) });
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  res.clearCookie(process.env.COOKIE_NAME || 'khan_token', cookieOptions());
  res.json({ success: true, message: 'Logged out.' });
};

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// POST /api/auth/forgot-password
// Always returns the same generic message whether or not the email exists —
// this stops the endpoint being used to check which emails have accounts.
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const genericResponse = () => res.json({
    success: true,
    message: 'If an account exists for that email, a reset link has been sent.',
  });

  if (!email?.trim()) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

  // No account, or a Google-only account with no password to reset — say
  // nothing different, just don't actually send an email.
  if (!user || !user.password) {
    return genericResponse();
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await User.updateOne({ _id: user._id }, { resetTokenHash: tokenHash, resetTokenExpires: expires });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email.trim().toLowerCase())}`;

  sendMail({
    to: email.trim(),
    subject: 'Reset your Khan Mobile Shop password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color:#0F172A;">Reset your password</h2>
        <p style="color:#334155;">Hi ${user.name}, click the button below to set a new password. This link expires in 1 hour.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background:#3B82F6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a>
        </p>
        <p style="color:#94A3B8; font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  }).catch(() => {});

  genericResponse();
};

// POST /api/auth/reset-password
// Body: { email, token, password }
exports.resetPassword = async (req, res) => {
  const { email, token, password } = req.body;

  if (!email?.trim() || !token || !password) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
    resetTokenHash: tokenHash,
  }).select('+resetTokenHash');

  if (!user || !user.resetTokenExpires || new Date(user.resetTokenExpires) < new Date()) {
    return res.status(400).json({ success: false, message: 'This reset link is invalid or has expired. Please request a new one.' });
  }

  const hashed = await bcrypt.hash(password, 12);
  await User.updateOne(
    { _id: user._id },
    { password: hashed, resetTokenHash: null, resetTokenExpires: null }
  );

  res.json({ success: true, message: 'Your password has been reset. You can now log in.' });
};

