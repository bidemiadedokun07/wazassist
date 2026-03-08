import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * S3 Upload Service
 * Handles file uploads to AWS S3 for product images and business logos
 */

// Initialize S3 client
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
  }
});

const BUCKET_NAME = config.aws.bucketMedia || config.aws.s3Bucket || 'wazassist-uploads';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Upload file to S3
 */
export async function uploadFile(file, folder = 'products') {
  try {
    // Validate file
    validateFile(file);

    // Generate unique filename
    const fileExt = path.extname(file.originalname);
    const fileName = `${folder}/${crypto.randomUUID()}${fileExt}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
      Metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString()
      }
    });

    await s3Client.send(command);

    const fileUrl = `https://${BUCKET_NAME}.s3.${config.aws.region}.amazonaws.com/${fileName}`;

    logger.info('✅ File uploaded to S3', {
      fileName,
      fileUrl,
      size: file.size
    });

    return {
      fileName,
      fileUrl,
      size: file.size,
      mimeType: file.mimetype
    };
  } catch (error) {
    logger.error('❌ S3 upload failed', {
      error: error.message,
      fileName: file?.originalname
    });
    throw new Error(`File upload failed: ${error.message}`);
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(files, folder = 'products') {
  try {
    const uploadPromises = files.map(file => uploadFile(file, folder));
    const results = await Promise.all(uploadPromises);

    logger.info('✅ Multiple files uploaded', {
      count: results.length,
      folder
    });

    return results;
  } catch (error) {
    logger.error('❌ Multiple file upload failed', {
      error: error.message,
      fileCount: files?.length
    });
    throw error;
  }
}

/**
 * Delete file from S3
 */
export async function deleteFile(fileName) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName
    });

    await s3Client.send(command);

    logger.info('✅ File deleted from S3', { fileName });

    return { success: true, fileName };
  } catch (error) {
    logger.error('❌ S3 delete failed', {
      error: error.message,
      fileName
    });
    throw new Error(`File deletion failed: ${error.message}`);
  }
}

/**
 * Delete multiple files
 */
export async function deleteMultipleFiles(fileNames) {
  try {
    const deletePromises = fileNames.map(fileName => deleteFile(fileName));
    await Promise.all(deletePromises);

    logger.info('✅ Multiple files deleted', {
      count: fileNames.length
    });

    return { success: true, count: fileNames.length };
  } catch (error) {
    logger.error('❌ Multiple file delete failed', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Generate presigned URL for temporary access
 */
export async function getPresignedUrl(fileName, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    logger.info('✅ Presigned URL generated', {
      fileName,
      expiresIn
    });

    return url;
  } catch (error) {
    logger.error('❌ Presigned URL generation failed', {
      error: error.message,
      fileName
    });
    throw new Error(`Presigned URL generation failed: ${error.message}`);
  }
}

/**
 * Validate file before upload
 */
function validateFile(file) {
  // Check if file exists
  if (!file) {
    throw new Error('No file provided');
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
  }

  return true;
}

/**
 * Extract filename from URL
 */
export function extractFileNameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Remove leading slash
    return pathname.substring(1);
  } catch (error) {
    logger.error('❌ Failed to extract filename from URL', {
      error: error.message,
      url
    });
    return null;
  }
}

/**
 * Upload product image
 */
export async function uploadProductImage(file, productId) {
  return uploadFile(file, `products/${productId}`);
}

/**
 * Upload business logo
 */
export async function uploadBusinessLogo(file, businessId) {
  return uploadFile(file, `logos/${businessId}`);
}

/**
 * Upload user avatar
 */
export async function uploadUserAvatar(file, userId) {
  return uploadFile(file, `avatars/${userId}`);
}

export default {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  deleteMultipleFiles,
  getPresignedUrl,
  extractFileNameFromUrl,
  uploadProductImage,
  uploadBusinessLogo,
  uploadUserAvatar
};
