import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

/**
 * Team Management Service
 * Handles team member invitations, management, and permissions
 */

/**
 * Get all team members for a business
 */
export async function getTeamMembers(businessId) {
  try {
    const result = await query(
      `SELECT
        tm.id,
        tm.business_id,
        tm.user_id,
        tm.role,
        tm.permissions,
        tm.status,
        tm.invited_at,
        tm.accepted_at,
        tm.created_at,
        tm.updated_at,
        u.name as user_name,
        u.email as user_email,
        u.phone_number as user_phone,
        inviter.name as invited_by_name
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      LEFT JOIN users inviter ON tm.invited_by = inviter.id
      WHERE tm.business_id = $1
      ORDER BY
        CASE tm.role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'manager' THEN 3
          ELSE 4
        END,
        tm.created_at DESC`,
      [businessId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting team members', { error: error.message, businessId });
    throw error;
  }
}

/**
 * Get a single team member
 */
export async function getTeamMember(businessId, userId) {
  try {
    const result = await query(
      `SELECT
        tm.*,
        u.name as user_name,
        u.email as user_email,
        u.phone_number as user_phone
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.business_id = $1 AND tm.user_id = $2`,
      [businessId, userId]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting team member', { error: error.message, businessId, userId });
    throw error;
  }
}

/**
 * Check if user is member of business
 */
export async function isTeamMember(businessId, userId) {
  try {
    const result = await query(
      'SELECT id FROM team_members WHERE business_id = $1 AND user_id = $2 AND status = $3',
      [businessId, userId, 'active']
    );

    return result.rows.length > 0;
  } catch (error) {
    logger.error('Error checking team membership', { error: error.message, businessId, userId });
    throw error;
  }
}

/**
 * Check if user has specific role
 */
export async function hasRole(businessId, userId, roles) {
  try {
    const roleArray = Array.isArray(roles) ? roles : [roles];

    const result = await query(
      'SELECT role FROM team_members WHERE business_id = $1 AND user_id = $2 AND status = $3',
      [businessId, userId, 'active']
    );

    if (result.rows.length === 0) return false;

    return roleArray.includes(result.rows[0].role);
  } catch (error) {
    logger.error('Error checking role', { error: error.message, businessId, userId });
    throw error;
  }
}

/**
 * Invite a new team member (for existing users)
 */
export async function inviteTeamMember(businessId, invitedByUserId, data) {
  try {
    const { userId, role = 'member', permissions = {} } = data;

    // Check if user is already a team member
    const existing = await query(
      'SELECT id, status FROM team_members WHERE business_id = $1 AND user_id = $2',
      [businessId, userId]
    );

    if (existing.rows.length > 0) {
      if (existing.rows[0].status === 'active') {
        throw new Error('User is already an active team member');
      }
      // If previously removed, reactivate
      const result = await query(
        `UPDATE team_members
        SET status = $1, role = $2, permissions = $3, invited_by = $4, invited_at = NOW(), updated_at = NOW()
        WHERE business_id = $5 AND user_id = $6
        RETURNING *`,
        ['pending', role, JSON.stringify(permissions), invitedByUserId, businessId, userId]
      );

      return result.rows[0];
    }

    // Create new team member invitation
    const result = await query(
      `INSERT INTO team_members (business_id, user_id, role, permissions, invited_by, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [businessId, userId, role, JSON.stringify(permissions), invitedByUserId, 'pending']
    );

    logger.info('Team member invited', { businessId, userId, role });

    return result.rows[0];
  } catch (error) {
    logger.error('Error inviting team member', { error: error.message, businessId });
    throw error;
  }
}

/**
 * Create invitation for user who doesn't have account yet
 */
export async function createInvitation(businessId, invitedByUserId, data) {
  try {
    const { email, phoneNumber, role = 'member', permissions = {} } = data;

    if (!email && !phoneNumber) {
      throw new Error('Either email or phone number is required');
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const result = await query(
      `INSERT INTO team_invitations
      (business_id, email, phone_number, role, permissions, invited_by, invitation_token, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [businessId, email, phoneNumber, role, JSON.stringify(permissions), invitedByUserId, invitationToken, expiresAt]
    );

    logger.info('Team invitation created', { businessId, email, phoneNumber });

    return result.rows[0];
  } catch (error) {
    logger.error('Error creating invitation', { error: error.message, businessId });
    throw error;
  }
}

/**
 * Get pending invitations
 */
export async function getPendingInvitations(businessId) {
  try {
    const result = await query(
      `SELECT
        ti.*,
        u.name as invited_by_name
      FROM team_invitations ti
      LEFT JOIN users u ON ti.invited_by = u.id
      WHERE ti.business_id = $1
      AND ti.accepted = FALSE
      AND ti.expires_at > NOW()
      ORDER BY ti.created_at DESC`,
      [businessId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting pending invitations', { error: error.message, businessId });
    throw error;
  }
}

/**
 * Accept team invitation
 */
export async function acceptInvitation(businessId, userId) {
  try {
    const result = await query(
      `UPDATE team_members
      SET status = $1, accepted_at = NOW(), updated_at = NOW()
      WHERE business_id = $2 AND user_id = $3 AND status = $4
      RETURNING *`,
      ['active', businessId, userId, 'pending']
    );

    if (result.rows.length === 0) {
      throw new Error('No pending invitation found');
    }

    logger.info('Team invitation accepted', { businessId, userId });

    return result.rows[0];
  } catch (error) {
    logger.error('Error accepting invitation', { error: error.message, businessId, userId });
    throw error;
  }
}

/**
 * Accept invitation by token (for new users)
 */
export async function acceptInvitationByToken(invitationToken, userId) {
  try {
    // Get invitation
    const invitationResult = await query(
      `SELECT * FROM team_invitations
      WHERE token = $1 AND status = 'pending' AND expires_at > NOW()`,
      [invitationToken]
    );

    if (invitationResult.rows.length === 0) {
      throw new Error('Invalid or expired invitation token');
    }

    const invitation = invitationResult.rows[0];

    // Create team member
    const memberResult = await query(
      `INSERT INTO team_members (business_id, user_id, role, permissions, invited_by, status, accepted_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *`,
      [
        invitation.business_id,
        userId,
        invitation.role,
        invitation.permissions,
        invitation.invited_by,
        'active'
      ]
    );

    // Mark invitation as accepted
    await query(
      'UPDATE team_invitations SET status = $1, accepted_at = NOW(), updated_at = NOW() WHERE id = $2',
      ['accepted', invitation.id]
    );

    logger.info('Invitation accepted by token', { invitationToken, userId });

    return memberResult.rows[0];
  } catch (error) {
    logger.error('Error accepting invitation by token', { error: error.message });
    throw error;
  }
}

/**
 * Update team member role
 */
export async function updateTeamMemberRole(businessId, userId, role, updatedByUserId) {
  try {
    // Check if updater is owner or admin
    const hasPermission = await hasRole(businessId, updatedByUserId, ['owner', 'admin']);

    if (!hasPermission) {
      throw new Error('You do not have permission to update team member roles');
    }

    // Don't allow changing owner role
    const currentMember = await getTeamMember(businessId, userId);
    if (currentMember.role === 'owner') {
      throw new Error('Cannot change owner role');
    }

    const result = await query(
      `UPDATE team_members
      SET role = $1, updated_at = NOW()
      WHERE business_id = $2 AND user_id = $3
      RETURNING *`,
      [role, businessId, userId]
    );

    logger.info('Team member role updated', { businessId, userId, role });

    return result.rows[0];
  } catch (error) {
    logger.error('Error updating team member role', { error: error.message, businessId, userId });
    throw error;
  }
}

/**
 * Update team member permissions
 */
export async function updateTeamMemberPermissions(businessId, userId, permissions, updatedByUserId) {
  try {
    // Check if updater is owner or admin
    const hasPermission = await hasRole(businessId, updatedByUserId, ['owner', 'admin']);

    if (!hasPermission) {
      throw new Error('You do not have permission to update team member permissions');
    }

    const result = await query(
      `UPDATE team_members
      SET permissions = $1, updated_at = NOW()
      WHERE business_id = $2 AND user_id = $3
      RETURNING *`,
      [JSON.stringify(permissions), businessId, userId]
    );

    logger.info('Team member permissions updated', { businessId, userId });

    return result.rows[0];
  } catch (error) {
    logger.error('Error updating team member permissions', { error: error.message, businessId, userId });
    throw error;
  }
}

/**
 * Remove team member
 */
export async function removeTeamMember(businessId, userId, removedByUserId) {
  try {
    // Check if remover is owner or admin
    const hasPermission = await hasRole(businessId, removedByUserId, ['owner', 'admin']);

    if (!hasPermission) {
      throw new Error('You do not have permission to remove team members');
    }

    // Don't allow removing owner
    const member = await getTeamMember(businessId, userId);
    if (member.role === 'owner') {
      throw new Error('Cannot remove business owner');
    }

    // Don't allow removing yourself
    if (userId === removedByUserId) {
      throw new Error('Cannot remove yourself from the team');
    }

    const result = await query(
      `UPDATE team_members
      SET status = $1, updated_at = NOW()
      WHERE business_id = $2 AND user_id = $3
      RETURNING *`,
      ['removed', businessId, userId]
    );

    logger.info('Team member removed', { businessId, userId });

    return result.rows[0];
  } catch (error) {
    logger.error('Error removing team member', { error: error.message, businessId, userId });
    throw error;
  }
}

/**
 * Cancel invitation
 */
export async function cancelInvitation(invitationId, businessId, cancelledByUserId) {
  try {
    // Check if canceller is owner or admin
    const hasPermission = await hasRole(businessId, cancelledByUserId, ['owner', 'admin']);

    if (!hasPermission) {
      throw new Error('You do not have permission to cancel invitations');
    }

    const result = await query(
      'DELETE FROM team_invitations WHERE id = $1 AND business_id = $2 RETURNING *',
      [invitationId, businessId]
    );

    if (result.rows.length === 0) {
      throw new Error('Invitation not found');
    }

    logger.info('Invitation cancelled', { invitationId, businessId });

    return result.rows[0];
  } catch (error) {
    logger.error('Error cancelling invitation', { error: error.message, invitationId });
    throw error;
  }
}

/**
 * Get team statistics
 */
export async function getTeamStatistics(businessId) {
  try {
    const result = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_members,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_members,
        COUNT(*) FILTER (WHERE role = 'owner') as owners,
        COUNT(*) FILTER (WHERE role = 'admin') as admins,
        COUNT(*) FILTER (WHERE role = 'manager') as managers,
        COUNT(*) FILTER (WHERE role = 'member') as members
      FROM team_members
      WHERE business_id = $1`,
      [businessId]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting team statistics', { error: error.message, businessId });
    throw error;
  }
}

export default {
  getTeamMembers,
  getTeamMember,
  isTeamMember,
  hasRole,
  inviteTeamMember,
  createInvitation,
  getPendingInvitations,
  acceptInvitation,
  acceptInvitationByToken,
  updateTeamMemberRole,
  updateTeamMemberPermissions,
  removeTeamMember,
  cancelInvitation,
  getTeamStatistics
};
