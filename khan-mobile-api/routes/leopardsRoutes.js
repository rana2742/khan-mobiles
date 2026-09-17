const express = require('express');
const router = express.Router();
const { webhook, cities } = require('../controllers/leopardsController');
const { protect, adminOnly } = require('../middleware/auth');

// Admin-only connectivity/configuration check.
router.get('/cities', protect, adminOnly, cities);

// Leopards Push API callback. Authentication is handled by the shared secret
// header when LEOPARDS_PUSH_SECRET is configured.
router.post('/status', webhook);

module.exports = router;
