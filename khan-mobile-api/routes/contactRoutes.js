const express = require('express');
const router = express.Router();
const { create, list, markRead, remove } = require('../controllers/contactController');
const { protect, adminOnly } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/', authLimiter, create);
router.get('/', protect, adminOnly, list);
router.put('/:id/read', protect, adminOnly, markRead);
router.delete('/:id', protect, adminOnly, remove);

module.exports = router;
