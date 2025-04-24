const { PDFDocument } = require('pdf-lib');
const PDFMerger = require('pdf-merger-js');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const pdfParse = require('pdf-parse');
const docxPdf = require('docx-pdf');
const htmlPdf = require('html-pdf');
const docx = require('docx');
const axios = require('axios');
const FormData = require('form-data');
const { exec } = require('child_process');
const jwt = require('jsonwebtoken');
const Pdf = require('../models/pdf.model');
const { uploadToS3, deleteFromS3 } = require('../config/aws');
const { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType, BorderStyle, PageBreak } = docx;
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const readFileAsync = promisify(fs.readFile);
const execAsync = promisify(exec);
const sharp = require('sharp');
const User = require('../models/user.model');
const dotenv = require('dotenv');
dotenv.config();

// Helper function to create a temporary file
const createTempFile = async (buffer, extension) => {
    const tempFilePath = path.join(os.tmpdir(), `temp-${Date.now()}.${extension}`);
    await writeFileAsync(tempFilePath, buffer);
    return tempFilePath;
};

// Helper function to convert Office files to PDF using LibreOffice
const convertOfficeToPdf = async (inputFile, outputFormat = 'pdf') => {
    try {
        // Get the directory path of the input file
        const dirPath = path.dirname(inputFile);
        const outputPath = path.join(dirPath, 'output');

        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }

        // Build LibreOffice command 
        // soffice --headless --convert-to pdf --outdir {output_dir} {input_file}
        const command = `soffice --headless --convert-to ${outputFormat} --outdir "${outputPath}" "${inputFile}"`;

        // Execute the command
        await execAsync(command);

        // Determine the output file name (same as input but with pdf extension)
        const fileName = path.basename(inputFile);
        const outputFile = path.join(outputPath, fileName.replace(/\.[^.]+$/, `.${outputFormat}`));

        // Read the output file
        const pdfBuffer = await readFileAsync(outputFile);

        // Clean up temp files
        try {
            await unlinkAsync(outputFile);
            await unlinkAsync(inputFile);
            fs.rmdirSync(outputPath);
        } catch (cleanupError) {
            console.error('Error cleaning up temp files:', cleanupError);
        }

        return pdfBuffer;
    } catch (error) {
        console.error('Error in convertOfficeToPdf:', error);
        throw error;
    }
};

// Helper to extract user ID from token
const getUserIdFromToken = async (req) => {
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

// Function to check if a PDF contains images
const pdfContainsImages = async (pdfBuffer) => {
    try {
        // Skip PDFRest API and force basic conversion if specified by query parameter
        if (process.env.FORCE_BASIC_CONVERSION === 'true') {
            console.log('Forcing basic conversion as specified by environment variable');
            return false;
        }

        // Get raw PDF content as string to search for image markers
        const rawPdfContent = pdfBuffer.toString('utf8', 0, Math.min(50000, pdfBuffer.length));

        // Look for image-related keywords in PDF content
        // Narrowed list to reduce false positives
        const imageIndicators = [
            // Standard image markers (more specific)
            '/subtype/image',
            '/bitspercomponent',
            '/colorspace/devicergb',
            '/filter/dct',
            '/jpxdecode',

            // Clear image operators
            '/BI ', '/EI ',
            '/Im'
        ];

        // Check if any image indicators are present (more strict check)
        const hasImageIndicator = imageIndicators.some(indicator =>
            rawPdfContent.toLowerCase().includes(indicator.toLowerCase()));

        // Load and parse the PDF for text analysis
        const pdfData = await pdfParse(pdfBuffer);
        const textLength = pdfData.text.length;
        const bufferSize = pdfBuffer.length;
        const sizeRatio = bufferSize / Math.max(textLength, 1);

        // Much higher threshold to avoid false positives
        const hasSizeDisparity = sizeRatio > 500;

        // We're now being more conservative - only return true if we're more confident
        const containsImages = hasImageIndicator || hasSizeDisparity;

        console.log('PDF analysis:', {
            hasImageIndicator,
            sizeRatio,
            hasSizeDisparity,
            pages: pdfData.numpages,
            containsImages
        });

        return containsImages;
    } catch (error) {
        console.error('Error checking PDF for images:', error);
        // If there's an error in detection, don't assume it has images
        return false;
    }
};

// Function to extract text from a single PDF page
const extractTextFromPage = async (pdfBuffer, pageNum) => {
    try {
        // Extract just the single page
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdfDoc, [pageNum]);
        newPdf.addPage(page);
        const singlePageBuffer = await newPdf.save();

        // Parse the text from this page
        const data = await pdfParse(singlePageBuffer);
        return data.text;
    } catch (error) {
        console.error(`Error extracting text from page ${pageNum}:`, error);
        return "";
    }
};

// Function to convert a single PDF page to Word using the API
const convertPageWithApi = async (pdfBuffer, pageNum) => {
    try {
        // Extract just the single page
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdfDoc, [pageNum]);
        newPdf.addPage(page);
        const singlePageBuffer = await newPdf.save();

        // Create a temporary file from the buffer to properly handle the form-data
        const tempFilePath = await createTempFile(singlePageBuffer, 'pdf');

        // Create form data for the API request
        const formData = new FormData();
        formData.append('file', fs.createReadStream(tempFilePath), {
            filename: `page_${pageNum}.pdf`,
            contentType: 'application/pdf'
        });

        try {
            // Make API request
            const response = await axios({
                method: 'post',
                url: 'https://api.pdfrest.com/word',
                headers: {
                    'Accept': 'application/json',
                    'Api-Key': process.env.PDFREST_API_KEY,
                    ...formData.getHeaders()
                },
                data: formData
            });

            // Get the output URL from the response
            const { outputUrl } = response.data;

            if (!outputUrl) {
                throw new Error('No output URL received from PDF conversion service');
            }

            // Download the converted file
            const fileResponse = await axios({
                method: 'get',
                url: outputUrl,
                responseType: 'arraybuffer'
            });

            // Clean up the temporary file
            try {
                await unlinkAsync(tempFilePath);
            } catch (cleanupError) {
                console.error(`Error cleaning up temp file for page ${pageNum}:`, cleanupError);
            }

            return fileResponse.data;
        } catch (apiError) {
            // Clean up temporary file on error too
            try {
                await unlinkAsync(tempFilePath);
            } catch (cleanupError) {
                console.error(`Error cleaning up temp file for page ${pageNum}:`, cleanupError);
            }
            throw apiError;
        }
    } catch (error) {
        console.error(`Error converting page ${pageNum} with API:`, error);
        throw error;
    }
};

// Convert PDF text to Word paragraphs
const textToWordParagraphs = (text) => {
    // Split text by lines
    const textLines = text.split('\n');

    // Create paragraphs for each line
    return textLines.map(line =>
        new Paragraph({
            children: [
                new TextRun({
                    text: line || " ",  // Add a space if the line is empty
                })
            ]
        })
    );
};

// Function to convert multiple PDF pages to Word using the API
const convertMultiPageWithApi = async (pdfBuffer) => {
    try {
        console.log('Using PDFRest API for PDF conversion');

        // Load the PDF to get total pages
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const totalPages = pdfDoc.getPageCount();
        console.log(`PDF has ${totalPages} pages, processing with API`);

        // Create a temporary file from the buffer to properly handle the form-data
        const tempFilePath = await createTempFile(pdfBuffer, 'pdf');

        // Create form data for the API request
        const formData = new FormData();
        formData.append('file', fs.createReadStream(tempFilePath), {
            filename: 'document.pdf',
            contentType: 'application/pdf'
        });

        // Make API request
        console.log('Sending PDF to PDFRest API');
        const response = await axios({
            method: 'post',
            url: 'https://api.pdfrest.com/word',
            headers: {
                'Accept': 'application/json',
                'Api-Key': process.env.PDFREST_API_KEY,
                ...formData.getHeaders()
            },
            data: formData,
            timeout: 120000 // 2 minutes timeout
        });

        // Get the output URL from the response
        const { outputUrl } = response.data;

        if (!outputUrl) {
            throw new Error('No output URL received from PDF conversion service');
        }

        // Download the converted file
        const fileResponse = await axios({
            method: 'get',
            url: outputUrl,
            responseType: 'arraybuffer'
        });

        // Clean up the temporary file
        try {
            await unlinkAsync(tempFilePath);
        } catch (cleanupError) {
            console.error('Error cleaning up temp file:', cleanupError);
        }

        // Check if response data is valid
        if (!fileResponse.data || fileResponse.data.length === 0) {
            throw new Error('Received empty file from conversion service');
        }

        console.log('Successfully converted PDF with PDFRest API');
        return fileResponse.data;
    } catch (error) {
        console.error('Error in PDFRest API conversion:', error);
        throw error;
    }
};

// PDF to Word conversion
const pdfToWord = async (req, res) => {
    console.log("PDF to Word conversion...");

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file was uploaded' });
        }

        const pdfFile = req.file;
        console.log(`File received: ${pdfFile.originalname}, size: ${pdfFile.size} bytes, type: ${pdfFile.mimetype}`);

        if (pdfFile.mimetype !== 'application/pdf') {
            return res.status(400).json({ error: 'File must be a PDF' });
        }

        // Get user ID from token for authentication
        const userId = await getUserIdFromToken(req);
        console.log(`User ID from token: ${userId}`);

        // Start conversion process
        console.log('Starting conversion process...');
        let wordBuffer;
        try {
            wordBuffer = await convertMultiPageWithApi(pdfFile.buffer);
            console.log(`Conversion completed, buffer size: ${wordBuffer ? wordBuffer.length : 0} bytes`);
        } catch (conversionError) {
            console.error('Error during conversion:', conversionError);
            return res.status(500).json({ error: 'Failed to convert PDF to Word: ' + conversionError.message });
        }

        if (!wordBuffer || wordBuffer.length === 0) {
            console.error('Conversion failed: Empty buffer returned');
            return res.status(500).json({ error: 'Failed to convert PDF to Word' });
        }

        // Check if user is authenticated and has storage enabled
        const filename = path.parse(pdfFile.originalname).name + '.docx';
        console.log(`Generated filename: ${filename}`);

        if (userId) {
            // Check if user has enabled file storage
            const storeFile = await shouldStoreFile(userId);

            if (storeFile) {
                try {
                    // Upload to AWS S3
                    console.log('User has storage enabled, uploading to S3...');
                    const s3Response = await uploadToS3(
                        wordBuffer,
                        `${userId}/word/${filename}`,
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    );

                    // Create a file record in the database with awsS3Key
                    const fileRecord = new Pdf({
                        userId,
                        originalName: pdfFile.originalname,
                        fileName: filename,
                        filePath: s3Response.Location,
                        fileType: 'word',
                        fileSize: wordBuffer.length,
                        processingType: 'conversion',
                        awsS3Key: s3Response.Key // Make sure to set the awsS3Key
                    });

                    await fileRecord.save();
                    console.log(`File record saved with ID: ${fileRecord._id}`);
                } catch (storageError) {
                    console.error('Error saving to storage:', storageError);
                    // Continue to provide file to user even if storage fails
                }
            } else {
                console.log('User has disabled file storage, skipping S3 upload');
            }
        }

        // Set response headers for file download
        res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        // Send the converted file
        return res.send(wordBuffer);
    } catch (error) {
        console.error('Error in PDF to Word conversion:', error);
        return res.status(500).json({
            error: 'An error occurred during conversion',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Word to PDF conversion
const wordToPdf = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Word file is required' });
        }

        // Validate file type
        if (!req.file.originalname.match(/\.(doc|docx)$/i)) {
            return res.status(400).json({ error: 'File must be a Word document (.doc or .docx)' });
        }

        // Check for user authentication
        const userId = await getUserIdFromToken(req);
        const isAuthenticated = !!userId;
        console.log(`User authentication status: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);

        // Save the uploaded file to a temporary location
        const fileExtension = path.extname(req.file.originalname).toLowerCase().substring(1);
        const tempFilePath = await createTempFile(req.file.buffer, fileExtension);
        const outputPath = path.join(os.tmpdir(), `output-${Date.now()}.pdf`);

        let pdfBuffer;
        let conversionSucceeded = false;

        try {
            // First attempt: Try conversion with docx-pdf (which uses mammoth internally)
            await new Promise((resolve, reject) => {
                // Set a timeout to avoid hanging
                const timeout = setTimeout(() => {
                    reject(new Error('Conversion timeout'));
                }, 30000); // 30 seconds timeout

                docxPdf(tempFilePath, outputPath, (err, result) => {
                    clearTimeout(timeout);
                    if (err) {
                        console.error('Error in docx-pdf conversion:', err);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });

            // Check if the output file exists and has content
            try {
                const stats = fs.statSync(outputPath);
                if (stats.size > 0) {
                    pdfBuffer = await readFileAsync(outputPath);
                    conversionSucceeded = true;
                    console.log('Successfully converted Word to PDF using docx-pdf');
                }
            } catch (statError) {
                console.error('Output file check failed:', statError);
                // Continue to alternative conversion
            }
        } catch (primaryConversionError) {
            console.error('Primary conversion method failed:', primaryConversionError.message);
            // Continue to alternative conversion
        }

        // Alternative conversion method if the first one failed
        if (!conversionSucceeded) {
            console.log('Attempting alternative conversion method...');
            try {
                // We could implement an alternative method here, like using LibreOffice,
                // or another library that doesn't rely on mammoth's problematic function

                // For now, let's create a simple PDF with an error message
                const pdfDoc = await PDFDocument.create();
                const page = pdfDoc.addPage([600, 800]);

                page.drawText('Document conversion failed', {
                    x: 50,
                    y: 700,
                    size: 30
                });

                page.drawText('Please try with a different document format', {
                    x: 50,
                    y: 650,
                    size: 14
                });

                pdfBuffer = await pdfDoc.save();
                conversionSucceeded = true;

                // Log this fallback
                console.log('Used fallback PDF creation');
            } catch (alternativeError) {
                console.error('Alternative conversion also failed:', alternativeError);
                return res.status(500).json({
                    error: 'Document conversion failed. Please try with a different format or file.',
                    details: alternativeError.message
                });
            }
        }

        // Store in AWS S3 if user is authenticated and has storage enabled
        if (isAuthenticated) {
            try {
                // Check if user has enabled file storage
                const storeFile = await shouldStoreFile(userId);

                if (storeFile) {
                    console.log('User has file storage enabled, uploading to S3');
                    // Upload to S3
                    const s3Result = await uploadToS3(
                        pdfBuffer,
                        req.file.originalname.replace(/\.(doc|docx)$/i, '.pdf'),
                        'application/pdf'
                    );

                    // Store reference in database
                    const newPdf = new Pdf({
                        originalName: req.file.originalname,
                        fileName: path.basename(s3Result.Location),
                        filePath: s3Result.Location,
                        fileSize: pdfBuffer.length,
                        fileType: 'application/pdf',
                        processingType: 'conversion',
                        userId: userId,
                        awsS3Key: s3Result.Key
                    });

                    await newPdf.save();
                    console.log('PDF saved to S3 and database');

                    // Also store the original Word document in S3
                    try {
                        const wordS3Result = await uploadToS3(
                            req.file.buffer,
                            req.file.originalname,
                            req.file.mimetype
                        );

                        // Store Word document reference in database
                        const wordDoc = new Pdf({
                            originalName: req.file.originalname,
                            fileName: path.basename(wordS3Result.Location),
                            filePath: wordS3Result.Location,
                            fileSize: req.file.buffer.length,
                            fileType: req.file.mimetype,
                            processingType: 'original-word',
                            userId: userId,
                            awsS3Key: wordS3Result.Key
                        });

                        await wordDoc.save();
                        console.log('Original Word document saved to S3 and database');
                    } catch (wordStorageError) {
                        console.error('Error storing Word document in S3:', wordStorageError);
                        // Continue processing even if Word storage fails
                    }
                } else {
                    console.log('User has disabled file storage, skipping S3 upload');
                }
            } catch (storageError) {
                console.error('Error storing in S3:', storageError);
                // Continue to serve the file even if storage fails
            }
        }

        // Clean up temp files
        try {
            await unlinkAsync(tempFilePath);
            if (fs.existsSync(outputPath)) {
                await unlinkAsync(outputPath);
            }
        } catch (cleanupError) {
            console.error('Error cleaning up temp files:', cleanupError);
        }

        // Set headers for PDF download
        const pdfFileName = req.file.originalname.replace(/\.(doc|docx)$/i, '.pdf');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${pdfFileName}`);

        // Send the converted PDF
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error in wordToPdf:', error);
        res.status(500).json({ error: 'Server error during conversion' });
    }
};

// Image to PDF conversion
const imageToPdf = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }

        // Log file details for debugging
        console.log('Image details:', {
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        // Validate file type
        if (!req.file.originalname.match(/\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i)) {
            return res.status(400).json({ error: 'File must be an image (jpg, jpeg, png, gif, bmp, tiff, webp)' });
        }

        // Check file size (10MB limit)
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        if (req.file.size > MAX_SIZE) {
            return res.status(413).json({ error: 'Image file is too large. Maximum size is 10MB.' });
        }

        console.log('Starting image-to-pdf conversion for file:', req.file.originalname);

        // Check for user authentication
        const userId = await getUserIdFromToken(req);
        const isAuthenticated = !!userId;

        // First normalize the image using sharp for better compatibility
        let normalizedImageBuffer;
        try {
            // Convert any image format to PNG for consistency
            normalizedImageBuffer = await sharp(req.file.buffer)
                .flatten({ background: { r: 255, g: 255, b: 255 } }) // Handle transparency
                .resize({ width: 1200, fit: 'inside' }) // Prevent oversized images
                .withMetadata() // Preserve metadata
                .toFormat('png')
                .toBuffer();

            console.log('Image normalized successfully, size:', normalizedImageBuffer.length);
        } catch (normalizeError) {
            console.error('Error normalizing image:', normalizeError);
            return res.status(400).json({ error: 'Failed to process image. The image may be corrupted.' });
        }

        // Create PDF from normalized image using pdf-lib
        const pdfDoc = await PDFDocument.create();

        // Embed the normalized PNG image
        let image;
        try {
            image = await pdfDoc.embedPng(normalizedImageBuffer);
            console.log('Image embedded in PDF successfully');
        } catch (embedError) {
            console.error('Error embedding image into PDF:', embedError);
            return res.status(400).json({ error: 'Failed to embed image into PDF. Please try with a different image.' });
        }

        // Calculate dimensions with margins
        const margin = 10; // 10pt margin
        const pageWidth = image.width + (margin * 2);
        const pageHeight = image.height + (margin * 2);

        // Add a page with appropriate dimensions
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Draw the image with margins
        page.drawImage(image, {
            x: margin,
            y: margin,
            width: image.width,
            height: image.height,
        });

        // Serialize the PDF to a buffer
        let pdfBuffer;
        try {
            pdfBuffer = await pdfDoc.save({ addDefaultPage: false });
            console.log('PDF created successfully, size:', pdfBuffer.length);
        } catch (saveError) {
            console.error('Error saving PDF:', saveError);
            return res.status(500).json({ error: 'Failed to create PDF' });
        }

        // Store in AWS S3 if user is authenticated and has storage enabled
        if (isAuthenticated) {
            try {
                // Check if user has enabled file storage
                const storeFile = await shouldStoreFile(userId);

                if (storeFile) {
                    console.log('User has storage enabled, uploading to S3');
                    // Upload to S3
                    const s3Result = await uploadToS3(
                        pdfBuffer,
                        req.file.originalname.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i, '.pdf'),
                        'application/pdf'
                    );

                    // Store reference in database
                    const newPdf = new Pdf({
                        originalName: req.file.originalname,
                        fileName: path.basename(s3Result.Location),
                        filePath: s3Result.Location,
                        fileSize: pdfBuffer.length,
                        fileType: 'application/pdf',
                        processingType: 'image-to-pdf',
                        userId: userId,
                        awsS3Key: s3Result.Key
                    });

                    await newPdf.save();
                    console.log('PDF saved to S3 and database');
                } else {
                    console.log('User has disabled file storage, skipping S3 upload');
                }
            } catch (storageError) {
                console.error('Error storing in S3:', storageError);
                // Continue to serve the file even if storage fails
                console.log('Continuing without S3 storage due to error');
            }
        }

        // Set headers for PDF download
        const pdfFileName = req.file.originalname.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i, '.pdf');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(pdfFileName)}`);

        // Send the PDF and end the response
        console.log('Sending PDF to client, size:', pdfBuffer.length);
        res.status(200).end(pdfBuffer);
    } catch (error) {
        console.error('Error converting image to PDF:', error);
        res.status(500).json({ error: 'Failed to convert image to PDF: ' + error.message });
    }
};

// Merge PDFs
const mergePdfs = async (req, res) => {
    try {
        if (!req.files || req.files.length < 2) {
            return res.status(400).json({ error: 'At least two PDF files are required' });
        }

        // Log details for debugging
        console.log(`Merge PDFs request: ${req.files.length} files received`);
        req.files.forEach((file, index) => {
            console.log(`File ${index + 1}: ${file.originalname}, size: ${file.size} bytes`);
        });

        // Validate all files are PDFs
        for (const file of req.files) {
            if (!file.originalname.match(/\.pdf$/i)) {
                return res.status(400).json({ error: 'All files must be PDF documents' });
            }
        }

        // Check for user authentication
        const userId = await getUserIdFromToken(req);
        const isAuthenticated = !!userId;
        console.log(`User authenticated: ${isAuthenticated}, userId: ${userId || 'none'}`);

        // Create temporary files to work with
        const tempFiles = [];
        for (const file of req.files) {
            const tempPath = await createTempFile(file.buffer, 'pdf');
            tempFiles.push(tempPath);
        }
        console.log(`Created ${tempFiles.length} temporary files for merging`);

        // Merge PDFs
        const merger = new PDFMerger();
        for (const tempFile of tempFiles) {
            await merger.add(tempFile);
        }

        // Output the merged PDF as a buffer
        const mergedPdfBuffer = await merger.saveAsBuffer();
        console.log(`Successfully merged PDFs, total size: ${mergedPdfBuffer.length} bytes`);

        // Store in AWS S3 if user is authenticated and has storage enabled
        if (isAuthenticated) {
            try {
                // Check if user has enabled file storage
                const storeFile = await shouldStoreFile(userId);

                if (storeFile) {
                    console.log('Uploading merged PDF to S3');

                    // Generate unique filename with timestamp to prevent conflicts
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const uniqueFileName = `merged-${timestamp}.pdf`;

                    // Upload to S3
                    const s3Result = await uploadToS3(
                        mergedPdfBuffer,
                        uniqueFileName,
                        'application/pdf'
                    );

                    // Store reference in database
                    const newPdf = new Pdf({
                        originalName: 'Merged PDF',
                        fileName: path.basename(s3Result.Location),
                        filePath: s3Result.Location,
                        fileSize: mergedPdfBuffer.length,
                        fileType: 'application/pdf',
                        processingType: 'merge',
                        userId: userId,
                        awsS3Key: s3Result.Key
                    });

                    await newPdf.save();
                    console.log('Merged PDF saved to S3 and database:', newPdf._id);
                } else {
                    console.log('User has disabled file storage, skipping S3 upload');
                }
            } catch (storageError) {
                console.error('Error storing merged PDF in S3:', storageError);
                // Continue to serve the file even if storage fails
            }
        }

        // Clean up temp files
        for (const tempFile of tempFiles) {
            try {
                await unlinkAsync(tempFile);
            } catch (err) {
                console.error('Error cleaning up temp file:', err);
            }
        }

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=merged.pdf`);

        // Send the merged PDF and end the response
        console.log('Sending merged PDF to client');
        res.status(200).end(mergedPdfBuffer);
    } catch (error) {
        console.error('Error merging PDFs:', error);
        res.status(500).json({ error: 'Failed to merge PDFs: ' + error.message });
    }
};

// Get all PDFs for a user
const getUserPdfs = async (req, res) => {
    try {
        // Extract user ID from token (using req.user from auth middleware)
        const userId = req.user.id;

        // Find all PDFs associated with the user
        const pdfs = await Pdf.find({ userId }).sort({ createdAt: -1 });

        // Transform to include better file representation
        const transformedPdfs = pdfs.map(pdf => ({
            id: pdf._id,
            originalName: pdf.originalName,
            fileName: pdf.fileName,
            fileUrl: pdf.filePath,
            fileSize: pdf.fileSize,
            fileType: pdf.fileType,
            processingType: pdf.processingType,
            createdAt: pdf.createdAt
        }));

        res.status(200).json({
            pdfs: transformedPdfs
        });
    } catch (error) {
        console.error('Error fetching user PDFs:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete a PDF
const deletePdf = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find PDF and ensure it belongs to the user
        const pdf = await Pdf.findOne({ _id: id, userId });

        if (!pdf) {
            return res.status(404).json({ error: 'PDF not found or unauthorized' });
        }

        // Delete the PDF from AWS S3 if S3 key exists
        if (pdf.awsS3Key) {
            try {
                await deleteFromS3(pdf.awsS3Key);
            } catch (s3Error) {
                console.error('Error deleting from S3:', s3Error);
                // Continue with database deletion even if S3 deletion fails
            }
        }

        // Delete from database
        await Pdf.deleteOne({ _id: id });

        res.status(200).json({
            message: 'PDF deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting PDF:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Utility to check if user has file storage enabled
const shouldStoreFile = async (userId) => {
    if (!userId) return false;

    try {
        const user = await User.findById(userId);
        return user && user.saveFilesToDashboard === true;
    } catch (error) {
        console.error('Error checking user file storage preference:', error);
        return false;
    }
};

// Extract text from PDF
const extractTextFromPdf = async (pdfBuffer) => {
    try {
        const pdfData = await pdfParse(pdfBuffer);
        return pdfData.text || '';
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        return '';
    }
};

// Extract images from PDF using a safer approach
const extractImagesFromPdf = async (pdfPath, outputDir) => {
    try {
        console.log(`Extracting images from PDF: ${pdfPath} to ${outputDir}`);

        // Try to create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // We'll implement a basic approach that doesn't rely on external tools
        // This won't extract all images but will try to process the PDF directly

        // Read the PDF file
        const pdfBuffer = await readFileAsync(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pageCount = pdfDoc.getPageCount();

        console.log(`PDF has ${pageCount} pages`);

        // Process each page and attempt to create an image representation
        for (let i = 0; i < pageCount; i++) {
            try {
                // Create a single-page PDF for this page
                const singlePagePdf = await PDFDocument.create();
                const [page] = await singlePagePdf.copyPages(pdfDoc, [i]);
                singlePagePdf.addPage(page);
                const pageBuffer = await singlePagePdf.save();

                // Create an image for this page 
                // (This is a fallback approach, won't extract embedded images)
                const imagePath = path.join(outputDir, `page_${i + 1}.png`);

                // For now, let's just create a placeholder file
                // In a real implementation, you would use PDF rendering libraries
                await writeFileAsync(imagePath, Buffer.from('placeholder'));

                console.log(`Created image representation for page ${i + 1}`);
            } catch (pageError) {
                console.error(`Error processing page ${i + 1}:`, pageError);
            }
        }

        console.log('Image extraction completed');
        return true;
    } catch (error) {
        console.error('Error extracting images from PDF:', error);
        // Create at least one placeholder image so the process can continue
        try {
            const placeholderPath = path.join(outputDir, 'placeholder.png');
            await writeFileAsync(placeholderPath, Buffer.from('placeholder'));
        } catch (placeholderError) {
            console.error('Error creating placeholder image:', placeholderError);
        }
        return false;
    }
};

module.exports = {
    pdfToWord,
    wordToPdf,
    imageToPdf,
    mergePdfs,
    getUserPdfs,
    deletePdf
}; 