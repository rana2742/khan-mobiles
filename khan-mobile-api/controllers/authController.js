const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../config/db');
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

const sendAuthResponse = (res, statusCode, user) => {
  const token = signToken(user.id);
  res.cookie(process.env.COOKIE_NAME || 'khan_token', token, cookieOptions());
  res.status(statusCode).json({ success: true, user: toUserDTO(user) });
};

 const publicUserFields =
  'id, name, email, role, avatar_url, phone, google_id, email_verified';

const toUserDTO = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatarUrl: user.avatar_url,
  phone: user.phone,
  hasGoogleLinked: !!user.google_id,
  // Admins are always considered verified, no matter what's in the DB —
  // this covers cases like changing the admin email/password directly,
  // which would otherwise leave email_verified at 0 for the new row.
  emailVerified: user.role === 'admin' ? true : !!user.email_verified,
});

// POST /api/auth/register
 const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const sendVerificationForUser = (user) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);

  return pool.query('UPDATE users SET verify_token_hash = ?, verify_token_expires = ? WHERE id = ?', [
    tokenHash, expires, user.id,
  ]).then(() => {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    return sendVerificationEmail(user, verifyUrl);
  });
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
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
  if (existing.length) {
    return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
  }

  const hashed = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password, role, email_verified) VALUES (?, ?, ?, ?, 0)',
    [name.trim(), normalizedEmail, hashed, 'user']
  );

  const [[user]] = await pool.query(`SELECT ${publicUserFields} FROM users WHERE id = ?`, [result.insertId]);
  sendVerificationForUser(user).catch(() => {}); // fire-and-forget, never blocks signup
  sendAuthResponse(res, 201, user);
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email.trim().toLowerCase()]);
  const user = rows[0];

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

  const [rows] = await pool.query(
    'SELECT * FROM users WHERE google_id = ? OR email = ? LIMIT 1',
    [googleId, email.toLowerCase()]
  );

  let user = rows[0];

 if (!user) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, google_id, avatar_url, role, email_verified) VALUES (?, ?, ?, ?, ?, 1)',
      [name || email, email.toLowerCase(), googleId, picture || null, 'user']
    );
    const [[created]] = await pool.query(`SELECT ${publicUserFields} FROM users WHERE id = ?`, [result.insertId]);
    user = created;
  } else if (!user.google_id) {
    // Existing email/password account signing in with Google for the first time — link it.
    // Google has already confirmed this email address, so mark it verified too.
    await pool.query('UPDATE users SET google_id = ?, avatar_url = COALESCE(avatar_url, ?), email_verified = 1 WHERE id = ?', [
      googleId,
      picture || null,
      user.id,
    ]);
    user.google_id = googleId;
    user.email_verified = 1;
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

  const [[user]] = await pool.query('SELECT id, name, password FROM users WHERE email = ? LIMIT 1', [email.trim().toLowerCase()]);

  // No account, or a Google-only account with no password to reset — say
  // nothing different, just don't actually send an email.
  if (!user || !user.password) {
    return genericResponse();
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await pool.query('UPDATE users SET reset_token_hash = ?, reset_token_expires = ? WHERE id = ?', [
    tokenHash, expires, user.id,
  ]);

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

  const [[user]] = await pool.query(
    'SELECT id, reset_token_expires FROM users WHERE email = ? AND reset_token_hash = ? LIMIT 1',
    [email.trim().toLowerCase(), tokenHash]
  );

  if (!user || !user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
    return res.status(400).json({ success: false, message: 'This reset link is invalid or has expired. Please request a new one.' });
  }

  const hashed = await bcrypt.hash(password, 12);
  await pool.query(
    'UPDATE users SET password = ?, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = ?',
    [hashed, user.id]
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

  const [[user]] = await pool.query(
    'SELECT id, verify_token_expires FROM users WHERE email = ? AND verify_token_hash = ? LIMIT 1',
    [email.trim().toLowerCase(), tokenHash]
  );

  if (!user || !user.verify_token_expires || new Date(user.verify_token_expires) < new Date()) {
    return res.status(400).json({ success: false, message: 'This verification link is invalid or has expired. Please request a new one.' });
  }

  await pool.query(
    'UPDATE users SET email_verified = 1, verify_token_hash = NULL, verify_token_expires = NULL WHERE id = ?',
    [user.id]
  );

  res.json({ success: true, message: 'Your email has been verified.' });
};

// POST /api/auth/resend-verification  (requires auth)
exports.resendVerification = async (req, res) => {
  if (req.user.role === 'admin' || req.user.email_verified) {
    return res.json({ success: true, message: 'Your email is already verified.' });
  }

  const [[user]] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [req.user.id]);
  await sendVerificationForUser(user).catch(() => {});

  res.json({ success: true, message: 'Verification email sent — please check your inbox.' });
};