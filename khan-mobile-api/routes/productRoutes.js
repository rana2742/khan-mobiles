const express = require('express');
const router = express.Router();
const {
  list, listCategories, getOne, create, update, remove, removeImage,
} = require('../controllers/productController');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', optionalAuth, list);
router.get('/categories', listCategories);
router.get('/:idOrSlug', getOne);

router.post('/', protect, adminOnly, upload.array('images', 6), create);
router.put('/:id', protect, adminOnly, upload.array('images', 6), update);
router.delete('/:id/images/:imageId', protect, adminOnly, removeImage);
router.delete('/:id', protect, adminOnly, remove);

module.exports = router;
