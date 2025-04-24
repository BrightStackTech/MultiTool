const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
// Temporarily comment out OAuth dependency
// const passport = require('../config/google-oauth');

// Middleware for protecting routes
const authMiddleware = require('../middleware/auth.middleware');

// Local authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.get('/check-email', require('../controllers/auth.controller').checkEmailExists);

// User preferences
router.put('/preferences', authMiddleware, authController.updateUserPreferences);

router.put('/updatedetails', authMiddleware, authController.updateUserDetails);

// Google OAuth with access token (Client-side flow)
router.post('/google', (req, res, next) => {
    console.log('Google auth endpoint hit');
    authController.handleGoogleAuth(req, res, next);
});

// Google OAuth routes (Server-side flow) - temporarily commented out
/*
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    authController.googleAuthCallback
);
*/

module.exports = router; 