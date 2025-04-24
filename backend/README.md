# MultiTool Backend

Backend server for MultiTool application, providing various document and image processing tools.

## Setup

1. Install dependencies:

```
npm install
```

2. Create a `.env` file in the root directory with the following variables:

```
PORT=8000
MONGODB_URI=mongodb://localhost:27017/multitool
JWT_SECRET=your_jwt_secret_key

# AWS S3 Configuration (for file storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_bucket_name

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback
```

3. Start the server:

```
npm run dev
```

## AWS S3 Configuration

This application uses AWS S3 for file storage when users are authenticated. For unauthenticated users, files are processed but not stored.

### Setting up AWS S3:

1. Create an AWS account if you don't have one
2. Create an S3 bucket with the following settings:

   - Make sure to choose the appropriate region
   - For public access permissions, you can block all public access if you prefer strict privacy
   - Enable bucket versioning (optional but recommended)

3. Create an IAM user with S3 access:

   - Go to IAM in AWS Console
   - Create a new user with programmatic access
   - Attach the `AmazonS3FullAccess` policy (or a more restricted custom policy)
   - Save the Access Key ID and Secret Access Key

4. Configure CORS for your S3 bucket:

   - In the S3 Management Console, select your bucket
   - Go to Permissions > CORS
   - Add a CORS configuration like:

   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["http://localhost:5173"],
       "ExposeHeaders": []
     }
   ]
   ```

   - Replace `http://localhost:5173` with your frontend URL in production

5. Update your `.env` file with the AWS credentials and bucket information

## Features

- URL shortener
- PDF processing (merge, conversion)
- Image processing (compression, circle crop)
- Authentication and user management

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google OAuth login

### URL Shortener

- `POST /api/url/shorten` - Create a short URL
- `GET /api/url/user/urls` - Get all URLs for a user
- `DELETE /api/url/:id` - Delete a URL

### PDF Processing

- `POST /api/pdf/pdf-to-word` - Convert PDF to Word
- `POST /api/pdf/word-to-pdf` - Convert Word to PDF
- `POST /api/pdf/image-to-pdf` - Convert Image to PDF
- `POST /api/pdf/merge` - Merge multiple PDFs
- `GET /api/pdf/user/pdfs` - Get all PDFs for a user
- `DELETE /api/pdf/:id` - Delete a PDF

### Image Processing

- `POST /api/image/compress` - Compress an image
- `POST /api/image/circle-crop` - Circle crop an image
- `GET /api/image/user/images` - Get all images for a user
- `DELETE /api/image/:id` - Delete an image
