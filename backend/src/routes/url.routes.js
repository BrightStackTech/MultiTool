const express = require('express');
const router = express.Router();
const urlController = require('../controllers/url.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes - don't require authentication
router.post('/shorten', urlController.shortenUrl);

// Protected routes - require authentication
// Must come before wildcard routes!
router.get('/user/urls', authMiddleware, urlController.getUserUrls);
router.delete('/:id', authMiddleware, urlController.deleteUrl);

// Wildcard route for short URLs - must be last!
router.get('/:shortId', urlController.redirectUrl);

module.exports = router; 