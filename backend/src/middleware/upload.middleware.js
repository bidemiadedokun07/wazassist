import multer from 'multer';
import { logger } from '../utils/logger.js';

/**
 * Upload Middleware using Multer
 * Handles file uploads with validation
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Configure multer for memory storage (files will be uploaded to S3)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`), false);
  }
};

// Create multer upload middleware
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter
});

/**
 * Single file upload
 */
export const uploadSingle = (fieldName = 'file') => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);

    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Multer error
        logger.error('Multer error', { error: err.message, code: err.code });

        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
          });
        }

        return res.status(400).json({
          error: err.message
        });
      } else if (err) {
        // Other errors
        logger.error('Upload error', { error: err.message });
        return res.status(400).json({
          error: err.message
        });
      }

      // No error
      next();
    });
  };
};

/**
 * Multiple files upload
 */
export const uploadMultiple = (fieldName = 'files', maxCount = 5) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);

    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        logger.error('Multer error', { error: err.message, code: err.code });

        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
          });
        }

        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            error: `Too many files. Maximum ${maxCount} files allowed`
          });
        }

        return res.status(400).json({
          error: err.message
        });
      } else if (err) {
        logger.error('Upload error', { error: err.message });
        return res.status(400).json({
          error: err.message
        });
      }

      next();
    });
  };
};

/**
 * Multiple fields upload
 */
export const uploadFields = (fields) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.fields(fields);

    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        logger.error('Multer error', { error: err.message, code: err.code });
        return res.status(400).json({
          error: err.message
        });
      } else if (err) {
        logger.error('Upload error', { error: err.message });
        return res.status(400).json({
          error: err.message
        });
      }

      next();
    });
  };
};

export default {
  uploadSingle,
  uploadMultiple,
  uploadFields
};
