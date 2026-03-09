import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Authentication Service
 * Handles user registration, login, and token management
 */

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d'; // 7 days
const REFRESH_TOKEN_EXPIRY = '30d'; // 30 days

/**
 * Register a new user
 */
export async function register(userData) {
  try {
    const { phoneNumber, name, email, password } = userData;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE phone_number = $1',
      [phoneNumber]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User with this phone number already exists');
    }

    // Check if email is already registered
    if (email) {
      const existingEmail = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingEmail.rows.length > 0) {
        throw new Error('User with this email already exists');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await query(
      `INSERT INTO users (phone_number, name, email, password_hash, is_active, metadata)
       VALUES ($1, $2, $3, $4, true, '{}')
       RETURNING id, phone_number, name, email, created_at`,
      [phoneNumber, name, email || null, passwordHash]
    );

    const user = result.rows[0];

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await storeRefreshToken(user.id, refreshToken);

    logger.info('✅ User registered', {
      userId: user.id,
      phoneNumber,
      email: email || 'N/A'
    });

    return {
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        name: user.name,
        email: user.email,
        createdAt: user.created_at
      },
      accessToken,
      refreshToken
    };
  } catch (error) {
    logger.error('❌ Error registering user', {
      error: error.message,
      phoneNumber: userData.phoneNumber
    });
    throw error;
  }
}

/**
 * Login user
 */
export async function login(credentials) {
  try {
    const { phoneNumber, password } = credentials;
    const invalidCredentialsError = 'Invalid phone number or password';

    // Get user with password hash
    const result = await query(
      `SELECT id, phone_number, name, email, password_hash, is_active
       FROM users WHERE phone_number = $1`,
      [phoneNumber]
    );

    if (result.rows.length === 0) {
      throw new Error(invalidCredentialsError);
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      throw new Error(invalidCredentialsError);
    }

    // Verify password
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      logger.warn('⚠️ Password compare failed during login', {
        userId: user.id,
        phoneNumber,
        error: error.message
      });
      throw new Error(invalidCredentialsError);
    }

    if (!passwordMatch) {
      throw new Error(invalidCredentialsError);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await storeRefreshToken(user.id, refreshToken);

    // Update last active
    await query(
      'UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    logger.info('✅ User logged in', {
      userId: user.id,
      phoneNumber
    });

    return {
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        name: user.name,
        email: user.email
      },
      accessToken,
      refreshToken
    };
  } catch (error) {
    logger.error('❌ Error logging in user', {
      error: error.message,
      phoneNumber: credentials.phoneNumber
    });
    throw error;
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken) {
  try {
    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret || config.jwt.secret);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }

    // Check if refresh token exists in database
    const result = await query(
      `SELECT user_id, expires_at FROM refresh_tokens
       WHERE token = $1 AND revoked = false`,
      [refreshToken]
    );

    if (result.rows.length === 0) {
      throw new Error('Refresh token not found or revoked');
    }

    const tokenData = result.rows[0];

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      throw new Error('Refresh token expired');
    }

    // Get user
    const userResult = await query(
      'SELECT id, phone_number, name, email, is_active FROM users WHERE id = $1',
      [tokenData.user_id]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Generate new access token
    const accessToken = generateAccessToken(user.id);

    logger.info('✅ Access token refreshed', {
      userId: user.id
    });

    return {
      accessToken,
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        name: user.name,
        email: user.email
      }
    };
  } catch (error) {
    logger.error('❌ Error refreshing token', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Logout user (revoke refresh token)
 */
export async function logout(refreshToken) {
  try {
    if (!refreshToken) {
      return { success: true };
    }

    // Revoke refresh token
    await query(
      `UPDATE refresh_tokens
       SET revoked = true, revoked_at = CURRENT_TIMESTAMP
       WHERE token = $1`,
      [refreshToken]
    );

    logger.info('✅ User logged out');

    return { success: true };
  } catch (error) {
    logger.error('❌ Error logging out', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Change password
 */
export async function changePassword(userId, oldPassword, newPassword) {
  try {
    // Get user's current password hash
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];

    // Verify old password
    const passwordMatch = await bcrypt.compare(oldPassword, user.password_hash);

    if (!passwordMatch) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Revoke all refresh tokens
    await query(
      `UPDATE refresh_tokens
       SET revoked = true, revoked_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND revoked = false`,
      [userId]
    );

    logger.info('✅ Password changed', {
      userId
    });

    return { success: true };
  } catch (error) {
    logger.error('❌ Error changing password', {
      error: error.message,
      userId
    });
    throw error;
  }
}

/**
 * Request password reset (generates reset token)
 */
export async function requestPasswordReset(phoneNumber) {
  try {
    // Check if user exists
    const result = await query(
      'SELECT id, name FROM users WHERE phone_number = $1',
      [phoneNumber]
    );

    if (result.rows.length === 0) {
      // Don't reveal if user exists
      logger.warn('Password reset requested for non-existent user', {
        phoneNumber
      });
      return { success: true };
    }

    const user = result.rows[0];

    // Generate reset token (6-digit code for SMS)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = jwt.sign(
      { userId: user.id, code: resetCode },
      config.jwt.secret,
      { expiresIn: '15m' }
    );

    // Store reset token
    await query(
      `INSERT INTO password_reset_tokens (user_id, token, code, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '15 minutes')`,
      [user.id, resetToken, resetCode]
    );

    logger.info('✅ Password reset requested', {
      userId: user.id,
      phoneNumber
    });

    // In production, send SMS with reset code
    // For now, return code in response (for testing)
    return {
      success: true,
      resetCode: config.env === 'development' ? resetCode : undefined,
      message: 'Password reset code sent to your phone'
    };
  } catch (error) {
    logger.error('❌ Error requesting password reset', {
      error: error.message,
      phoneNumber
    });
    throw error;
  }
}

/**
 * Reset password with reset code
 */
export async function resetPassword(phoneNumber, resetCode, newPassword) {
  try {
    // Find valid reset token
    const result = await query(
      `SELECT prt.user_id, prt.token
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE u.phone_number = $1
         AND prt.code = $2
         AND prt.expires_at > NOW()
         AND prt.used = false
       ORDER BY prt.created_at DESC
       LIMIT 1`,
      [phoneNumber, resetCode]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired reset code');
    }

    const tokenData = result.rows[0];

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, tokenData.user_id]
    );

    // Mark reset token as used
    await query(
      'UPDATE password_reset_tokens SET used = true, used_at = NOW() WHERE token = $1',
      [tokenData.token]
    );

    // Revoke all refresh tokens
    await query(
      `UPDATE refresh_tokens
       SET revoked = true, revoked_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND revoked = false`,
      [tokenData.user_id]
    );

    logger.info('✅ Password reset', {
      userId: tokenData.user_id
    });

    return { success: true };
  } catch (error) {
    logger.error('❌ Error resetting password', {
      error: error.message,
      phoneNumber
    });
    throw error;
  }
}

/**
 * Generate access token
 */
function generateAccessToken(userId) {
  return jwt.sign(
    { userId, type: 'access' },
    config.jwt.secret,
    { expiresIn: TOKEN_EXPIRY }
  );
}

/**
 * Generate refresh token
 */
function generateRefreshToken(userId) {
  return jwt.sign(
    { userId, type: 'refresh' },
    config.jwt.refreshSecret || config.jwt.secret,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

/**
 * Store refresh token in database
 */
async function storeRefreshToken(userId, token) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  // Check if refresh_tokens table exists, if not create it
  try {
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );
  } catch (error) {
    // Table might not exist yet, that's okay
    logger.warn('Could not store refresh token', {
      error: error.message,
      userId
    });
  }
}

export default {
  register,
  login,
  refreshAccessToken,
  logout,
  changePassword,
  requestPasswordReset,
  resetPassword
};
