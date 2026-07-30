const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getMe, logout, forgotPassword, resetPassword, verifyEmail, resendVerification } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/resend-verification', authLimiter, protect, resendVerification);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;