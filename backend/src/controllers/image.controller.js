const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const Image = require('../models/image.model');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper to generate a unique filename
const generateUniqueFilename = (originalName, format, type) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 12);
    const extension = format.toLowerCase() === 'jpg' ? 'jpeg' : format.toLowerCase();
    return `${type}_${timestamp}_${randomString}.${extension}`;
};

// Helper to extract user ID from token
const getUserIdFromToken = (req) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            return decoded.id;
        }
        return null;
    } catch (error) {
        console.error('Error extracting user ID from token:', error);
        return null;
    }
};

// Helper to upload to Cloudinary
const uploadToCloudinary = async (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: 'multitool',
                // upload_preset: 'multitool',
                ...options
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        ).end(buffer);
    });
};

// Compress image
const compressImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }

        const { quality = 80, format = 'jpeg' } = req.body;
        const userId = getUserIdFromToken(req);
        const isAuthenticated = !!userId;

        // Process the image with sharp
        let processedImage;

        switch (format.toLowerCase()) {
            case 'jpeg':
            case 'jpg':
                processedImage = await sharp(req.file.buffer)
                    .jpeg({ quality: parseInt(quality, 10) })
                    .toBuffer();
                break;
            case 'png':
                processedImage = await sharp(req.file.buffer)
                    .png({ quality: parseInt(quality, 10) })
                    .toBuffer();
                break;
            case 'webp':
                processedImage = await sharp(req.file.buffer)
                    .webp({ quality: parseInt(quality, 10) })
                    .toBuffer();
                break;
            default:
                processedImage = await sharp(req.file.buffer)
                    .jpeg({ quality: parseInt(quality, 10) })
                    .toBuffer();
        }

        // Get the size of the original and compressed images
        const originalSize = req.file.size;
        const compressedSize = processedImage.length;
        const compressionRatio = (1 - (compressedSize / originalSize)) * 100;

        // If user is authenticated, store in Cloudinary and database
        if (isAuthenticated) {
            try {
                // Upload the compressed image to Cloudinary
                const cloudinaryResult = await uploadToCloudinary(processedImage, {
                    resource_type: 'image',
                    format: format.toLowerCase() === 'jpg' ? 'jpeg' : format.toLowerCase()
                });

                // Create a new image record in the database
                const newImage = new Image({
                    originalName: req.file.originalname,
                    fileName: path.basename(cloudinaryResult.secure_url),
                    filePath: cloudinaryResult.secure_url, // Store the Cloudinary URL
                    fileSize: compressedSize,
                    fileType: `image/${format.toLowerCase() === 'jpg' ? 'jpeg' : format.toLowerCase()}`,
                    compressionType: 'compression',
                    userId: userId,
                    cloudinaryPublicId: cloudinaryResult.public_id
                });

                await newImage.save();
                console.log('Compressed image saved to Cloudinary and database');
            } catch (cloudinaryError) {
                console.error('Cloudinary error:', cloudinaryError);
                // Continue to serve the processed image even if storage fails
            }
        }

        // Return the processed image regardless of authentication
        const contentType = `image/${format.toLowerCase() === 'jpg' ? 'jpeg' : format.toLowerCase()}`;
        res.set('Content-Type', contentType);
        return res.send(processedImage);

    } catch (error) {
        console.error('Error compressing image:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Circle crop image
const circleCropImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }

        const userId = getUserIdFromToken(req);
        const isAuthenticated = !!userId;

        // Use sharp to process the image
        const metadata = await sharp(req.file.buffer).metadata();

        // Calculate center and radius (use the smaller of width or height)
        const size = Math.min(metadata.width, metadata.height);

        // Create a rounded corner mask with a circle radius equal to half the width/height
        const roundedCorners = Buffer.from(
            `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${size / 2}" ry="${size / 2}" fill="white"/></svg>`
        );

        // Process the image: resize to square and apply the circular mask
        const circleImage = await sharp(req.file.buffer)
            // First resize the image to a square with the calculated size
            .resize(size, size, {
                fit: 'cover',
                position: 'centre'
            })
            // Apply the rounded corners mask
            .composite([{
                input: roundedCorners,
                blend: 'dest-in'
            }])
            // Output as PNG to preserve transparency
            .png()
            .toBuffer();

        // If user is authenticated, store in Cloudinary and database
        if (isAuthenticated) {
            try {
                // Upload the circle-cropped image to Cloudinary
                const cloudinaryResult = await uploadToCloudinary(circleImage, {
                    resource_type: 'image',
                    format: 'png'
                });

                // Create a new image record in the database
                const newImage = new Image({
                    originalName: req.file.originalname,
                    fileName: path.basename(cloudinaryResult.secure_url),
                    filePath: cloudinaryResult.secure_url, // Store the Cloudinary URL
                    fileSize: circleImage.length,
                    fileType: 'image/png',
                    compressionType: 'circle-crop',
                    userId: userId,
                    cloudinaryPublicId: cloudinaryResult.public_id
                });

                await newImage.save();
                console.log('Circle cropped image saved to Cloudinary and database');
            } catch (cloudinaryError) {
                console.error('Cloudinary error:', cloudinaryError);
                // Continue to serve the processed image even if storage fails
            }
        }

        // Return the processed image regardless of authentication
        res.set('Content-Type', 'image/png');
        return res.send(circleImage);

    } catch (error) {
        console.error('Error circle cropping image:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all images for a user
const getUserImages = async (req, res) => {
    try {
        // Extract user ID from token
        const userId = req.user.id;

        // Find all images associated with the user
        const images = await Image.find({ userId }).sort({ createdAt: -1 });

        // Transform to include URLs
        const transformedImages = images.map(image => ({
            id: image._id,
            originalName: image.originalName,
            fileName: image.fileName,
            fileUrl: image.filePath, // Already contains the Cloudinary URL
            fileSize: image.fileSize,
            fileType: image.fileType,
            compressionType: image.compressionType,
            createdAt: image.createdAt
        }));

        res.status(200).json({
            images: transformedImages
        });
    } catch (error) {
        console.error('Error fetching user images:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete an image
const deleteImage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find image and ensure it belongs to the user
        const image = await Image.findOne({ _id: id, userId });

        if (!image) {
            return res.status(404).json({ error: 'Image not found or unauthorized' });
        }

        // Delete the image from Cloudinary if public ID exists
        if (image.cloudinaryPublicId) {
            await cloudinary.uploader.destroy(image.cloudinaryPublicId);
        }

        // Delete from database
        await Image.deleteOne({ _id: id });

        res.status(200).json({
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    compressImage,
    circleCropImage,
    getUserImages,
    deleteImage
}; 