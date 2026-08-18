const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendMail, sendVerificationEmail } = require('../utils/email');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
  hasGoogleLinked: !!user.googleId,
  // Admins are always considered verified, no matter what's in the DB —
  // this covers cases like changing the admin email/password directly,
  // which would otherwise leave emailVerified at false for the new row.
  emailVerified: user.role === 'admin' ? true : !!user.emailVerified,
});

const sendAuthResponse = (res, statusCode, user) => {
  const token = signToken(user._id.toString());
  res.cookie(process.env.COOKIE_NAME || 'khan_token', token, cookieOptions());
  res.status(statusCode).json({ success: true, user: toUserDTO(user) });
};

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const sendVerificationForUser = async (user) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);

  await User.updateOne({ _id: user._id }, { verifyTokenHash: tokenHash, verifyTokenExpires: expires });
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
  return sendVerificationEmail(user, verifyUrl);
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
    emailVerified: false,
  });

  sendVerificationForUser(user).catch(() => {}); // fire-and-forget, never blocks signup
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

// POST /api/auth/google
// Body: { credential } — the ID token returned by Google's "Sign in with Google" button.
exports.googleAuth = async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ success: false, message: 'Missing Google credential.' });
  }
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({
      success: false,
      message: 'Google sign-in is not configured on the server yet (missing GOOGLE_CLIENT_ID).',
    });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid Google credential.' });
  }

  const { sub: googleId, email, name, picture } = payload;

  let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

  if (!user) {
    user = await User.create({
      name: name || email,
      email: email.toLowerCase(),
      googleId,
      avatarUrl: picture || null,
      role: 'user',
      emailVerified: true,
    });
  } else if (!user.googleId) {
    // Existing email/password account signing in with Google for the first time — link it.
    // Google has already confirmed this email address, so mark it verified too.
    user.googleId = googleId;
    user.avatarUrl = user.avatarUrl || picture || null;
    user.emailVerified = true;
    await user.save();
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

// POST /api/auth/verify-email
// Body: { email, token }
exports.verifyEmail = async (req, res) => {
  const { email, token } = req.body;

  if (!email?.trim() || !token) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
    verifyTokenHash: tokenHash,
  }).select('+verifyTokenHash');

  if (!user || !user.verifyTokenExpires || new Date(user.verifyTokenExpires) < new Date()) {
    return res.status(400).json({ success: false, message: 'This verification link is invalid or has expired. Please request a new one.' });
  }

  await User.updateOne(
    { _id: user._id },
    { emailVerified: true, verifyTokenHash: null, verifyTokenExpires: null }
  );

  res.json({ success: true, message: 'Your email has been verified.' });
};

// POST /api/auth/resend-verification  (requires auth)
exports.resendVerification = async (req, res) => {
  if (req.user.role === 'admin' || req.user.emailVerified) {
    return res.json({ success: true, message: 'Your email is already verified.' });
  }

  const user = await User.findById(req.user._id);
  await sendVerificationForUser(user).catch(() => {});

  res.json({ success: true, message: 'Verification email sent — please check your inbox.' });
};
