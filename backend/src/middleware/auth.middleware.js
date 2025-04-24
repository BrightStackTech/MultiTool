const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
    try {
        // Get the authorization header
        const authHeader = req.headers.authorization;

        // Check if auth header exists and has the right format
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Extract the token from the header
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Authentication token is required' });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Find user in database to ensure they exist
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Add the user info to the request
        req.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            saveFilesToDashboard: user.saveFilesToDashboard
        };

        // Continue to the next middleware or route handler
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        return res.status(500).json({ error: 'Authentication error' });
    }
};

// This is the export style expected in routes
module.exports = authenticateToken; 