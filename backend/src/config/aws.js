const AWS = require('aws-sdk');
const dotenv = require('dotenv');
dotenv.config();


// Check if required environment variables are present
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID ;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ;
const awsBucketName = process.env.AWS_BUCKET_NAME ;
const awsRegion = process.env.AWS_REGION ;

// Log warning if AWS credentials are missing
if (!awsAccessKeyId || !awsSecretAccessKey || !awsBucketName) {
    console.warn('⚠️ AWS S3 credentials are missing or incomplete. File storage will work locally but not in AWS S3.');
    console.warn('Please ensure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME are set in your .env file.');
}

// Configure AWS with credentials from .env file
const s3Config = {
    region: awsRegion
};

// Only add credentials if they exist
if (awsAccessKeyId && awsSecretAccessKey) {
    s3Config.accessKeyId = awsAccessKeyId;
    s3Config.secretAccessKey = awsSecretAccessKey;
}

// Create S3 instance
const s3 = new AWS.S3(s3Config);

// Helper function to upload file to S3
const uploadToS3 = async (buffer, fileName, mimeType) => {
    if (!awsAccessKeyId || !awsSecretAccessKey || !awsBucketName) {
        throw new Error('AWS S3 credentials are missing. Cannot upload file.');
    }

    try {
        const params = {
            Bucket: awsBucketName,
            Key: `${Date.now()}-${fileName}`,
            Body: buffer,
            ContentType: mimeType,
        };

        const result = await s3.upload(params).promise();
        return result;
    } catch (error) {
        console.error('Error uploading to AWS S3:', error);
        throw new Error(`Failed to upload to S3: ${error.message}`);
    }
};

// Helper function to delete file from S3
const deleteFromS3 = async (key) => {
    if (!awsAccessKeyId || !awsSecretAccessKey || !awsBucketName) {
        throw new Error('AWS S3 credentials are missing. Cannot delete file.');
    }

    try {
        const params = {
            Bucket: awsBucketName,
            Key: key
        };

        return await s3.deleteObject(params).promise();
    } catch (error) {
        console.error('Error deleting from AWS S3:', error);
        throw new Error(`Failed to delete from S3: ${error.message}`);
    }
};

// Helper function to check S3 connection
const checkS3Connection = async () => {
    if (!awsAccessKeyId || !awsSecretAccessKey || !awsBucketName) {
        return {
            connected: false,
            message: 'AWS S3 credentials are missing'
        };
    }

    try {
        await s3.headBucket({ Bucket: awsBucketName }).promise();
        return {
            connected: true,
            message: 'Successfully connected to AWS S3'
        };
    } catch (error) {
        console.error('Error connecting to AWS S3:', error);
        return {
            connected: false,
            message: `Could not connect to AWS S3: ${error.message}`
        };
    }
};

module.exports = {
    s3,
    uploadToS3,
    deleteFromS3,
    checkS3Connection,
    isConfigured: !!(awsAccessKeyId && awsSecretAccessKey && awsBucketName)
}; 