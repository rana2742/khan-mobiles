const express = require('express');
const router = express.Router();
const { webhook } = require('../controllers/leopardsController');

// Leopards Push API callback. Authentication is handled by the shared secret
// header when LEOPARDS_PUSH_SECRET is configured.
router.post('/status', webhook);

module.exports = router;
