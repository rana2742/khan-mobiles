const express = require('express');
const router = express.Router();
const { listForProduct, reviewable, create, listAll, remove } = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/product/:productId', listForProduct);
router.get('/reviewable', protect, reviewable);
router.get('/', protect, adminOnly, listAll);
router.post('/', protect, create);
router.delete('/:id', protect, adminOnly, remove);

module.exports = router;
