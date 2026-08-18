const jwt = require('jsonwebtoken');
const User = require('../models/User');

const USER_SELECT_FIELDS = 'name email role avatarUrl phone googleId emailVerified';

// Verifies the JWT from the httpOnly cookie (or Authorization header as a
// fallback) and attaches the authenticated user to req.user.
const protect = async (req, res, next) => {
  const cookieName = process.env.COOKIE_NAME || 'khan_token';
  let token = req.cookies?.[cookieName];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(USER_SELECT_FIELDS);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
};

// Must be used after `protect`.
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

// Like `protect`, but doesn't reject the request when there's no valid
// session — it just leaves req.user unset. Useful for public endpoints that
// behave slightly differently for logged-in admins (e.g. showing hidden products).
const optionalAuth = async (req, res, next) => {
  const cookieName = process.env.COOKIE_NAME || 'khan_token';
  const token = req.cookies?.[cookieName];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(USER_SELECT_FIELDS);
    if (user) req.user = user;
  } catch {
    // invalid/expired token on a public route — just proceed as a guest
  }
  next();
};

module.exports = { protect, adminOnly, optionalAuth };
