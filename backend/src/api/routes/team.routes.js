import express from 'express';
import teamService from '../../services/team.service.js';
import { logger } from '../../utils/logger.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Team Management Routes
 * Base path: /api/v1/team
 */

/**
 * Get all team members for a business
 * GET /api/v1/team/business/:businessId
 */
router.get('/business/:businessId', authenticate, async (req, res) => {
  try {
    const { businessId } = req.params;

    // Check if user is a team member
    const isMember = await teamService.isTeamMember(businessId, req.userId);

    if (!isMember) {
      return res.status(403).json({
        error: 'You are not a member of this business'
      });
    }

    const members = await teamService.getTeamMembers(businessId);

    res.json({
      success: true,
      data: members,
      count: members.length
    });
  } catch (error) {
    logger.error('Error getting team members', { error: error.message });
    res.status(500).json({
      error: 'Failed to get team members',
      message: error.message
    });
  }
});

/**
 * Get single team member
 * GET /api/v1/team/business/:businessId/member/:userId
 */
router.get('/business/:businessId/member/:userId', authenticate, async (req, res) => {
  try {
    const { businessId, userId } = req.params;

    // Check if requester is a team member
    const isMember = await teamService.isTeamMember(businessId, req.user.userId);

    if (!isMember) {
      return res.status(403).json({
        error: 'You are not a member of this business'
      });
    }

    const member = await teamService.getTeamMember(businessId, userId);

    if (!member) {
      return res.status(404).json({
        error: 'Team member not found'
      });
    }

    res.json({
      success: true,
      data: member
    });
  } catch (error) {
    logger.error('Error getting team member', { error: error.message });
    res.status(500).json({
      error: 'Failed to get team member',
      message: error.message
    });
  }
});

/**
 * Invite a team member (existing user)
 * POST /api/v1/team/business/:businessId/invite
 */
router.post('/business/:businessId/invite', authenticate, async (req, res) => {
  try {
    const { businessId } = req.params;
    const { userId, role, permissions } = req.body;

    // Check if requester has permission (owner or admin)
    const hasPermission = await teamService.hasRole(businessId, req.userId, ['owner', 'admin']);

    if (!hasPermission) {
      return res.status(403).json({
        error: 'You do not have permission to invite team members'
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    const member = await teamService.inviteTeamMember(businessId, req.userId, {
      userId,
      role,
      permissions
    });

    res.status(201).json({
      success: true,
      data: member,
      message: 'Team member invited successfully'
    });
  } catch (error) {
    logger.error('Error inviting team member', { error: error.message });
    res.status(500).json({
      error: 'Failed to invite team member',
      message: error.message
    });
  }
});

/**
 * Create invitation for new user
 * POST /api/v1/team/business/:businessId/invitation
 */
router.post('/business/:businessId/invitation', authenticate, async (req, res) => {
  try {
    const { businessId } = req.params;
    const { email, phoneNumber, role, permissions } = req.body;

    // Check if requester has permission (owner or admin)
    const hasPermission = await teamService.hasRole(businessId, req.userId, ['owner', 'admin']);

    if (!hasPermission) {
      return res.status(403).json({
        error: 'You do not have permission to create invitations'
      });
    }

    if (!email && !phoneNumber) {
      return res.status(400).json({
        error: 'Either email or phone number is required'
      });
    }

    const invitation = await teamService.createInvitation(businessId, req.userId, {
      email,
      phoneNumber,
      role,
      permissions
    });

    res.status(201).json({
      success: true,
      data: invitation,
      message: 'Invitation created successfully'
    });
  } catch (error) {
    logger.error('Error creating invitation', { error: error.message });
    res.status(500).json({
      error: 'Failed to create invitation',
      message: error.message
    });
  }
});

/**
 * Get pending invitations
 * GET /api/v1/team/business/:businessId/invitations
 */
router.get('/business/:businessId/invitations', authenticate, async (req, res) => {
  try {
    const { businessId } = req.params;

    // Check if requester has permission (owner or admin)
    const hasPermission = await teamService.hasRole(businessId, req.userId, ['owner', 'admin']);

    if (!hasPermission) {
      return res.status(403).json({
        error: 'You do not have permission to view invitations'
      });
    }

    const invitations = await teamService.getPendingInvitations(businessId);

    res.json({
      success: true,
      data: invitations,
      count: invitations.length
    });
  } catch (error) {
    logger.error('Error getting invitations', { error: error.message });
    res.status(500).json({
      error: 'Failed to get invitations',
      message: error.message
    });
  }
});

/**
 * Accept team invitation
 * POST /api/v1/team/business/:businessId/accept
 */
router.post('/business/:businessId/accept', authenticate, async (req, res) => {
  try {
    const { businessId } = req.params;

    const member = await teamService.acceptInvitation(businessId, req.userId);

    res.json({
      success: true,
      data: member,
      message: 'Invitation accepted successfully'
    });
  } catch (error) {
    logger.error('Error accepting invitation', { error: error.message });
    res.status(500).json({
      error: 'Failed to accept invitation',
      message: error.message
    });
  }
});

/**
 * Accept invitation by token
 * POST /api/v1/team/accept-invitation/:token
 */
router.post('/accept-invitation/:token', authenticate, async (req, res) => {
  try {
    const { token } = req.params;

    const member = await teamService.acceptInvitationByToken(token, req.userId);

    res.json({
      success: true,
      data: member,
      message: 'Invitation accepted successfully'
    });
  } catch (error) {
    logger.error('Error accepting invitation by token', { error: error.message });
    res.status(500).json({
      error: 'Failed to accept invitation',
      message: error.message
    });
  }
});

/**
 * Update team member role
 * PATCH /api/v1/team/business/:businessId/member/:userId/role
 */
router.patch('/business/:businessId/member/:userId/role', authenticate, async (req, res) => {
  try {
    const { businessId, userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        error: 'Role is required'
      });
    }

    const validRoles = ['owner', 'admin', 'manager', 'member'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    const member = await teamService.updateTeamMemberRole(businessId, userId, role, req.userId);

    res.json({
      success: true,
      data: member,
      message: 'Team member role updated successfully'
    });
  } catch (error) {
    logger.error('Error updating team member role', { error: error.message });
    res.status(error.message.includes('permission') ? 403 : 500).json({
      error: 'Failed to update team member role',
      message: error.message
    });
  }
});

/**
 * Update team member permissions
 * PATCH /api/v1/team/business/:businessId/member/:userId/permissions
 */
router.patch('/business/:businessId/member/:userId/permissions', authenticate, async (req, res) => {
  try {
    const { businessId, userId } = req.params;
    const { permissions } = req.body;

    if (!permissions) {
      return res.status(400).json({
        error: 'Permissions object is required'
      });
    }

    const member = await teamService.updateTeamMemberPermissions(
      businessId,
      userId,
      permissions,
      req.userId
    );

    res.json({
      success: true,
      data: member,
      message: 'Team member permissions updated successfully'
    });
  } catch (error) {
    logger.error('Error updating team member permissions', { error: error.message });
    res.status(error.message.includes('permission') ? 403 : 500).json({
      error: 'Failed to update team member permissions',
      message: error.message
    });
  }
});

/**
 * Remove team member
 * DELETE /api/v1/team/business/:businessId/member/:userId
 */
router.delete('/business/:businessId/member/:userId', authenticate, async (req, res) => {
  try {
    const { businessId, userId } = req.params;

    const member = await teamService.removeTeamMember(businessId, userId, req.userId);

    res.json({
      success: true,
      data: member,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    logger.error('Error removing team member', { error: error.message });
    res.status(error.message.includes('permission') ? 403 : 500).json({
      error: 'Failed to remove team member',
      message: error.message
    });
  }
});

/**
 * Cancel invitation
 * DELETE /api/v1/team/business/:businessId/invitation/:invitationId
 */
router.delete('/business/:businessId/invitation/:invitationId', authenticate, async (req, res) => {
  try {
    const { businessId, invitationId } = req.params;

    const invitation = await teamService.cancelInvitation(invitationId, businessId, req.userId);

    res.json({
      success: true,
      data: invitation,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    logger.error('Error cancelling invitation', { error: error.message });
    res.status(error.message.includes('permission') ? 403 : 500).json({
      error: 'Failed to cancel invitation',
      message: error.message
    });
  }
});

/**
 * Get team statistics
 * GET /api/v1/team/business/:businessId/statistics
 */
router.get('/business/:businessId/statistics', authenticate, async (req, res) => {
  try {
    const { businessId } = req.params;

    // Check if requester is a team member
    const isMember = await teamService.isTeamMember(businessId, req.user.userId);

    if (!isMember) {
      return res.status(403).json({
        error: 'You are not a member of this business'
      });
    }

    const statistics = await teamService.getTeamStatistics(businessId);

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error getting team statistics', { error: error.message });
    res.status(500).json({
      error: 'Failed to get team statistics',
      message: error.message
    });
  }
});

export default router;
