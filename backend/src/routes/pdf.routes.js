const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfController = require('../controllers/pdf.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Configure multer storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB limit
    }
});

// Public PDF conversion routes (no auth required)
router.post('/pdf-to-word', upload.single('file'), pdfController.pdfToWord);
router.post('/word-to-pdf', upload.single('file'), pdfController.wordToPdf);
router.post('/image-to-pdf', upload.single('image'), pdfController.imageToPdf);
router.post('/merge', upload.array('files', 10), pdfController.mergePdfs);

// Protected routes (require authentication)
router.get('/user/pdfs', authMiddleware, pdfController.getUserPdfs);
router.delete('/:id', authMiddleware, pdfController.deletePdf);

module.exports = router; 