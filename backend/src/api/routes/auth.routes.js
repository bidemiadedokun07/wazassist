import express from 'express';
import authService from '../../services/auth.service.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

/**
 * Authentication Routes
 * Handles user registration, login, token management
 */

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, name, email, password } = req.body;

    // Validate required fields
    if (!phoneNumber || !name || !password) {
      return res.status(400).json({
        success: false,
        error: 'Phone number, name, and password are required'
      });
    }

    // Validate phone number format (Nigerian format)
    const phoneRegex = /^\+234[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Please use format: +234XXXXXXXXXX'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }
    }

    const result = await authService.register({
      phoneNumber,
      name,
      email,
      password
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    logger.error('Registration error', {
      error: error.message,
      body: req.body
    });

    res.status(400).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    // Validate required fields
    if (!phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and password are required'
      });
    }

    const result = await authService.login({
      phoneNumber,
      password
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    const invalidCredentialsError = 'Invalid phone number or password';

    logger.error('Login error', {
      error: error.message,
      phoneNumber: req.body.phoneNumber
    });

    res.status(401).json({
      success: false,
      error: invalidCredentialsError
    });
  }
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Token refresh error', {
      error: error.message
    });

    res.status(401).json({
      success: false,
      error: error.message || 'Token refresh failed'
    });
  }
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (revoke refresh token)
 * @access  Public
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    await authService.logout(refreshToken);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Old password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    await authService.changePassword(req.userId, oldPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again with your new password.'
    });
  } catch (error) {
    logger.error('Change password error', {
      error: error.message,
      userId: req.userId
    });

    res.status(400).json({
      success: false,
      error: error.message || 'Password change failed'
    });
  }
});

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const result = await authService.requestPasswordReset(phoneNumber);

    res.json({
      success: true,
      message: result.message,
      // Include reset code in development only
      resetCode: result.resetCode
    });
  } catch (error) {
    logger.error('Forgot password error', {
      error: error.message,
      phoneNumber: req.body.phoneNumber
    });

    res.status(500).json({
      success: false,
      error: 'Password reset request failed'
    });
  }
});

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with code
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { phoneNumber, resetCode, newPassword } = req.body;

    if (!phoneNumber || !resetCode || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Phone number, reset code, and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    await authService.resetPassword(phoneNumber, resetCode, newPassword);

    res.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });
  } catch (error) {
    logger.error('Reset password error', {
      error: error.message,
      phoneNumber: req.body.phoneNumber
    });

    res.status(400).json({
      success: false,
      error: error.message || 'Password reset failed'
    });
  }
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user.id,
        phoneNumber: req.user.phone_number,
        name: req.user.name,
        email: req.user.email,
        isActive: req.user.is_active
      }
    });
  } catch (error) {
    logger.error('Get profile error', {
      error: error.message,
      userId: req.userId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
});

/**
 * @route   POST /api/v1/auth/verify
 * @desc    Verify if token is valid
 * @access  Private
 */
router.post('/verify', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        userId: req.userId,
        phoneNumber: req.user.phone_number
      }
    });
  } catch (error) {
    logger.error('Token verification error', {
      error: error.message
    });

    res.status(401).json({
      success: false,
      error: 'Token verification failed'
    });
  }
});

export default router;
