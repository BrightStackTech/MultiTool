# Multi-Tool MERN Application

A comprehensive web application built with the MERN stack (MongoDB, Express, React, Node.js) that provides multiple useful tools in one place.

## Features

1. **URL Shortener**: Quickly shorten long URLs into compact, shareable links.
2. **PDF Converter**: Convert PDF to Word and Word to PDF seamlessly.
3. **PDF Merger**: Combine multiple PDF files into a single document.
4. **Image to PDF**: Convert images to PDF documents.
5. **Image Compressor**: Reduce image file size while maintaining quality.
6. **Circle Crop Image**: Crop images into perfect circles for profile pictures and more.
7. **User Authentication**: Sign up, login, and password reset functionality.
8. **Google Sign-in**: Authenticate with Google OAuth 2.0.

## Tech Stack

### Backend
- Node.js with Express
- MongoDB (prepared but not fully implemented yet)
- Multer for file uploads
- Sharp for image processing
- PDF-merger-js for PDF operations
- Passport.js for Google OAuth authentication
- JWT for authentication
- Nodemailer for email functionality
- AWS S3 and Cloudinary integrations (prepared for future use)

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API requests
- React Toastify for notifications

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/       # Configuration files (Google OAuth, etc.)
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── utils/        # Utility functions (nodemailer, etc.)
│   │   └── index.js      # Server entry point
│   ├── .env              # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/          # API service functions
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── public/       # Public assets
│   │   └── types/        # TypeScript type definitions
│   ├── index.html
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd multi-tool-app
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Configuration

1. Create a `.env` file in the backend directory and add the following variables:
```
PORT=8000
MONGODB_URI=mongodb://localhost:27017/multitool
JWT_SECRET=your_secret_key
SESSION_SECRET=your_session_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# Nodemailer
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your-email@gmail.com
EMAIL_APP_PASSWORD=your_app_password
EMAIL_FROM=your-email@gmail.com

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_BUCKET_NAME=your_bucket_name
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```
The server will run on http://localhost:8000.

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```
The frontend will run on http://localhost:5173.

## Future Improvements

- Complete the authentication implementation
- Add user-specific data storage
- Enhance the Google authentication flow
- Implement email verification
- Integrate file storage with S3 and Cloudinary for authenticated users
- Add more tools and features
- Improve UI/UX 