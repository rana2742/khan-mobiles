const express = require('express');
const router = express.Router();
const { create, myOrders, cancelMine, listAll, getOne, updateStatus, stats, downloadInvoice } = require('../controllers/orderController');
const { book, track, cancel } = require('../controllers/leopardsController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, create);
router.get('/mine', protect, myOrders);
router.put('/:id/cancel', protect, cancelMine);
router.get('/:id/invoice', protect, downloadInvoice);
router.get('/stats/summary', protect, adminOnly, stats);
router.get('/', protect, adminOnly, listAll);
router.get('/:id', protect, adminOnly, getOne);
router.put('/:id/status', protect, adminOnly, updateStatus);

// Leopards Courier — admin fulfillment actions
router.post('/:id/leopards/book', protect, adminOnly, book);
router.post('/:id/leopards/track', protect, adminOnly, track);
router.post('/:id/leopards/cancel', protect, adminOnly, cancel);

module.exports = router;
