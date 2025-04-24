const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const imageController = require('../controllers/image.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
// We'll use memory storage for processing, then save to disk after
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

// Public routes - don't require authentication
router.post('/compress', upload.single('image'), imageController.compressImage);
router.post('/circle-crop', upload.single('image'), imageController.circleCropImage);

// Protected routes - require authentication
router.get('/user/images', authMiddleware, imageController.getUserImages);
router.delete('/:id', authMiddleware, imageController.deleteImage);

// Static route to serve uploaded images
router.use('/uploads/images', express.static('uploads/images'));

module.exports = router; 