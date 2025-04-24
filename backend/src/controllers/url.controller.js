const shortid = require('shortid');
const Url = require('../models/url.model');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Create a short URL
const shortenUrl = async (req, res) => {
    try {
        const { originalUrl } = req.body;
        let userId = null;

        if (!originalUrl) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Check if user is authenticated
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                userId = decoded.id;
            } catch (err) {
                console.error('Invalid token:', err);
                // Continue without associating with user
            }
        }

        // Generate a short ID
        const shortId = shortid.generate();

        // Create the short URL
        const shortUrl = `${req.protocol}://${req.get('host')}/api/url/${shortId}`;

        // Create and save URL document
        const url = new Url({
            originalUrl,
            shortId,
            userId: userId // Will be null if user is not authenticated
        });

        await url.save();

        res.status(201).json({
            shortUrl,
            shortId,
            originalUrl
        });
    } catch (error) {
        console.error('Error shortening URL:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Redirect to original URL
const redirectUrl = async (req, res) => {
    try {
        const { shortId } = req.params;

        // Find the URL document
        const url = await Url.findOne({ shortId });

        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }

        // Increment visit count
        url.visitCount += 1;
        await url.save();

        res.redirect(url.originalUrl);
    } catch (error) {
        console.error('Error redirecting URL:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all URLs for a user
const getUserUrls = async (req, res) => {
    try {
        // Extract user ID from token
        const userId = req.user.id;

        // Find all URLs associated with the user
        const urls = await Url.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json({
            urls: urls.map(url => ({
                id: url._id,
                originalUrl: url.originalUrl,
                shortUrl: `${req.protocol}://${req.get('host')}/api/url/${url.shortId}`,
                shortId: url.shortId,
                visitCount: url.visitCount,
                createdAt: url.createdAt
            }))
        });
    } catch (error) {
        console.error('Error fetching user URLs:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete a URL
const deleteUrl = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find URL and ensure it belongs to the user
        const url = await Url.findOne({ _id: id, userId });

        if (!url) {
            return res.status(404).json({ error: 'URL not found or unauthorized' });
        }

        // Delete the URL
        await Url.deleteOne({ _id: id });

        res.status(200).json({
            message: 'URL deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting URL:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    shortenUrl,
    redirectUrl,
    getUserUrls,
    deleteUrl
}; 