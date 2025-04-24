const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { checkS3Connection } = require('./config/aws');
// Temporarily comment out OAuth
// const passport = require('./config/google-oauth');
// const session = require('express-session');

// Import routes
const urlRoutes = require('./routes/url.routes');
const pdfRoutes = require('./routes/pdf.routes');
const imageRoutes = require('./routes/image.routes');
const authRoutes = require('./routes/auth.routes');

// Config
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// CORS Configuration - Use a simple configuration first
app.use(cors({
    origin: '*', // Allow all origins for now
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add option preflight handler for debugging
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.send(200);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Session middleware - temporarily commented out
// app.use(session({
//    secret: process.env.SESSION_SECRET || 'your-secret-key',
//    resave: false,
//    saveUninitialized: false,
//    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 }
// }));

// Initialize passport - temporarily commented out
// app.use(passport.initialize());
// app.use(passport.session());

// Routes
console.log('Registering routes...');
app.use('/api/url', urlRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/auth', authRoutes);

// Route debugging middleware
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next();
});

// Basic route
app.get('/', (req, res) => {
    res.send('Multi-tool API is running!');
});

// Start server with needed connections
const startServer = async () => {
    // Check AWS S3 connection
    console.log('Checking AWS S3 connection...');
    const s3Status = await checkS3Connection();
    if (s3Status.connected) {
        console.log('✅ ' + s3Status.message);
    } else {
        console.warn('⚠️ ' + s3Status.message);
        console.warn('File storage for authenticated users may not work correctly');
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/multitool');
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ Could not connect to MongoDB', err);
        console.log('Starting server without MongoDB connection');
    }

    // Start the server
    app.listen(PORT, () => {
        console.log(`✅ Server is running on port ${PORT}`);
    });
};

// Run the server startup
startServer().catch(error => {
    console.error('Failed to start server:', error);
}); 