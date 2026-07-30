const express = require('express');
const router = express.Router();
const { create, myOrders, cancelMine, listAll, getOne, updateStatus, stats, downloadInvoice } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, create);
router.get('/mine', protect, myOrders);
router.put('/:id/cancel', protect, cancelMine);
router.get('/:id/invoice', protect, downloadInvoice);
router.get('/stats/summary', protect, adminOnly, stats);
router.get('/', protect, adminOnly, listAll);
router.get('/:id', protect, adminOnly, getOne);
router.put('/:id/status', protect, adminOnly, updateStatus);

module.exports = router;
