const express = require('express');
const router = express.Router();
const { create, myOrders, cancelMine, listAll, getOne, updateStatus, deleteOrder, stats, downloadInvoice } = require('../controllers/orderController');
const { book, track, cancel } = require('../controllers/leopardsController');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, create);
router.get('/mine', protect, myOrders);
router.put('/:id/cancel', protect, cancelMine);
router.get('/:id/invoice', optionalAuth, downloadInvoice);
router.get('/stats/summary', protect, adminOnly, stats);
router.get('/', protect, adminOnly, listAll);
router.get('/:id', protect, adminOnly, getOne);
router.put('/:id/status', protect, adminOnly, updateStatus);
router.delete('/:id', protect, adminOnly, deleteOrder);

// Leopards Courier — admin fulfillment actions
router.post('/:id/leopards/book', protect, adminOnly, book);
router.post('/:id/leopards/track', protect, adminOnly, track);
router.post('/:id/leopards/cancel', protect, adminOnly, cancel);

module.exports = router;
