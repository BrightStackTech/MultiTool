const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('../utils/nodemailer');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// Register a new user
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            isVerified: false,
            profilePicture: 'https://res.cloudinary.com/dvb5mesnd/image/upload/v1741339315/Screenshot_2025-03-07_145028-removebg-preview_mqw8by.png'
        });

        const verificationToken = crypto.randomBytes(32).toString('hex');
        newUser.emailVerificationToken = verificationToken;
        // Save user to database
        await newUser.save();

        // Send verification email
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
        await nodemailer.sendVerificationEmail(
            newUser.email,
            newUser.username,
            verificationUrl
        );

        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ error: 'Please verify your email before logging in.' });
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Create JWT token with 24-hour expiration
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRATION || '24h' }
        );

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                googleId: user.googleId,
                profilePicture: user.profilePicture,
                saveFilesToDashboard: user.saveFilesToDashboard
            },
            token
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Handle Google authentication with access token
const handleGoogleAuth = async (req, res) => {
    try {
        const { token, isSignup } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'No token provided' });
        }

        // Get user info from Google
        const googleUserInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(response => response.data);

        if (!googleUserInfo || !googleUserInfo.email) {
            return res.status(400).json({ error: 'Invalid Google token' });
        }

        // Check if user already exists
        let user = await User.findOne({ email: googleUserInfo.email });

        if (!user) {
            // Create new user if they don't exist
            user = new User({
                username: googleUserInfo.name || googleUserInfo.email.split('@')[0],
                email: googleUserInfo.email,
                googleId: googleUserInfo.sub, // Google's user ID
                profilePicture: googleUserInfo.picture || '',
                isVerified: true, // Automatically verify Google users
            });
            await user.save();
        } else if (!user.googleId) {
            // Link Google account to existing user
            user.googleId = googleUserInfo.sub;
            // Update profile picture and display name if they came from Google
            if (googleUserInfo.picture && !user.profilePicture) {
                user.profilePicture = googleUserInfo.picture;
            }
            await user.save();
        } else {
            // Update profile info if it has changed
            let hasChanges = false;

            if (googleUserInfo.picture && user.profilePicture !== googleUserInfo.picture) {
                user.profilePicture = googleUserInfo.picture;
                hasChanges = true;
            }

            if (hasChanges) {
                await user.save();
            }
        }

        // Create JWT token
        const jwtToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRATION || '24h' }
        );

        res.status(200).json({
            message: isSignup ? 'Google signup successful' : 'Google login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                googleId: user.googleId,
                profilePicture: user.profilePicture
            },
            token: jwtToken
        });
    } catch (error) {
        console.error('Error with Google authentication:', error);
        res.status(500).json({ error: 'Server error during Google authentication' });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({ emailVerificationToken: token });

        if (!user) {
            // Try to find a user who is already verified (for better UX)
            const alreadyVerifiedUser = await User.findOne({ isVerified: true, emailVerificationToken: { $exists: false } });
            if (alreadyVerifiedUser) {
                return res.status(200).json({ message: 'Email already verified. You can now log in.' });
            }
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        if (user.isVerified) {
            user.emailVerificationToken = undefined;
            await user.save();
            return res.status(200).json({ message: 'Email already verified. You can now log in.' });
        }

        user.isVerified = true;
        user.emailVerificationToken = undefined;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
// Logout user
const logout = (req, res) => {
    res.status(200).json({ message: 'Logout successful' });
};

const checkEmailExists = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.json({ exists: false });
        }
        if (user.googleId) {
            return res.json({
                exists: true,
                googleSignIn: true,
                message: "This account uses Google sign-in. Use 'Sign in with Google'."
            });
        }
        return res.json({ exists: true, googleSignIn: false });
    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Forgot password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate password reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Set token and expiry
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        // Send password reset email
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        await nodemailer.sendPasswordResetEmail(
            user.email,
            user.username,
            resetUrl
        );

        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        console.error('Error sending password reset email:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Reset password
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Find user by reset token and check if token has not expired
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update user password and clear reset token fields
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


const updateUserDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, profilePicture } = req.body;

        // Validate input
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            userId,
            { username, profilePicture },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'Profile updated', user });
    } catch (error) {
        console.error('Error updating user details:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update user preferences
const updateUserPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { saveFilesToDashboard } = req.body;

        // Validate input
        if (typeof saveFilesToDashboard !== 'boolean') {
            return res.status(400).json({ error: 'saveFilesToDashboard must be a boolean value' });
        }

        // Update user preferences
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { saveFilesToDashboard },
            { new: true, select: '-password' } // Return updated user without password
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            message: 'Preferences updated successfully',
            preferences: {
                saveFilesToDashboard: updatedUser.saveFilesToDashboard
            }
        });
    } catch (error) {
        console.error('Error updating user preferences:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Google authentication callback
const googleAuthCallback = (req, res) => {
    // Generate JWT token for the authenticated user
    const token = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
};

module.exports = {
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    googleAuthCallback,
    handleGoogleAuth,
    updateUserPreferences,
    verifyEmail,
    updateUserDetails,
    checkEmailExists
}; 