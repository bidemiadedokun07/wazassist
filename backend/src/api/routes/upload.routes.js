import express from 'express';
import uploadService from '../../services/upload.service.js';
import { uploadSingle, uploadMultiple } from '../../middleware/upload.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

/**
 * Upload Routes
 * Base path: /api/v1/uploads
 */

/**
 * Upload single file
 * POST /api/v1/uploads/single
 */
router.post('/single', authenticate, uploadSingle('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided'
      });
    }

    const folder = req.body.folder || 'general';
    const result = await uploadService.uploadFile(req.file, folder);

    res.status(200).json({
      success: true,
      data: result,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    logger.error('Error uploading file', { error: error.message });
    res.status(500).json({
      error: 'Failed to upload file',
      message: error.message
    });
  }
});

/**
 * Upload multiple files
 * POST /api/v1/uploads/multiple
 */
router.post('/multiple', authenticate, uploadMultiple('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files provided'
      });
    }

    const folder = req.body.folder || 'general';
    const results = await uploadService.uploadMultipleFiles(req.files, folder);

    res.status(200).json({
      success: true,
      data: results,
      count: results.length,
      message: `${results.length} files uploaded successfully`
    });
  } catch (error) {
    logger.error('Error uploading files', { error: error.message });
    res.status(500).json({
      error: 'Failed to upload files',
      message: error.message
    });
  }
});

/**
 * Upload product image
 * POST /api/v1/uploads/product/:productId
 */
router.post('/product/:productId', authenticate, uploadSingle('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image provided'
      });
    }

    const { productId } = req.params;
    const result = await uploadService.uploadProductImage(req.file, productId);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Product image uploaded successfully'
    });
  } catch (error) {
    logger.error('Error uploading product image', { error: error.message });
    res.status(500).json({
      error: 'Failed to upload product image',
      message: error.message
    });
  }
});

/**
 * Upload multiple product images
 * POST /api/v1/uploads/product/:productId/multiple
 */
router.post('/product/:productId/multiple', authenticate, uploadMultiple('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No images provided'
      });
    }

    const { productId } = req.params;
    const results = await uploadService.uploadMultipleFiles(req.files, `products/${productId}`);

    res.status(200).json({
      success: true,
      data: results,
      count: results.length,
      message: `${results.length} product images uploaded successfully`
    });
  } catch (error) {
    logger.error('Error uploading product images', { error: error.message });
    res.status(500).json({
      error: 'Failed to upload product images',
      message: error.message
    });
  }
});

/**
 * Upload business logo
 * POST /api/v1/uploads/business/:businessId/logo
 */
router.post('/business/:businessId/logo', authenticate, uploadSingle('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No logo provided'
      });
    }

    const { businessId } = req.params;
    const result = await uploadService.uploadBusinessLogo(req.file, businessId);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Business logo uploaded successfully'
    });
  } catch (error) {
    logger.error('Error uploading business logo', { error: error.message });
    res.status(500).json({
      error: 'Failed to upload business logo',
      message: error.message
    });
  }
});

/**
 * Upload user avatar
 * POST /api/v1/uploads/user/avatar
 */
router.post('/user/avatar', authenticate, uploadSingle('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No avatar provided'
      });
    }

    const result = await uploadService.uploadUserAvatar(req.file, req.user.id);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    logger.error('Error uploading avatar', { error: error.message });
    res.status(500).json({
      error: 'Failed to upload avatar',
      message: error.message
    });
  }
});

/**
 * Delete file
 * DELETE /api/v1/uploads/:fileName
 */
router.delete('/:fileName(*)', authenticate, async (req, res) => {
  try {
    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({
        error: 'File name is required'
      });
    }

    await uploadService.deleteFile(fileName);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting file', { error: error.message });
    res.status(500).json({
      error: 'Failed to delete file',
      message: error.message
    });
  }
});

/**
 * Get presigned URL for temporary access
 * GET /api/v1/uploads/presigned/:fileName
 */
router.get('/presigned/:fileName(*)', authenticate, async (req, res) => {
  try {
    const { fileName } = req.params;
    const expiresIn = parseInt(req.query.expiresIn) || 3600;

    if (!fileName) {
      return res.status(400).json({
        error: 'File name is required'
      });
    }

    const url = await uploadService.getPresignedUrl(fileName, expiresIn);

    res.status(200).json({
      success: true,
      data: { url, expiresIn },
      message: 'Presigned URL generated successfully'
    });
  } catch (error) {
    logger.error('Error generating presigned URL', { error: error.message });
    res.status(500).json({
      error: 'Failed to generate presigned URL',
      message: error.message
    });
  }
});

export default router;
