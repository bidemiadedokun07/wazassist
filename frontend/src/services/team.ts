import api from './api'

export interface TeamMember {
  id: string
  businessId: string
  userId: string
  role: 'owner' | 'admin' | 'manager' | 'member'
  permissions: Record<string, boolean>
  status: 'pending' | 'active' | 'suspended' | 'removed'
  invitedAt: string
  acceptedAt?: string
  createdAt: string
  updatedAt: string
  userName: string
  userEmail?: string
  userPhone: string
  invitedByName?: string
}

export interface TeamInvitation {
  id: string
  businessId: string
  email?: string
  phoneNumber?: string
  role: string
  permissions: Record<string, boolean>
  invitedBy: string
  invitationToken: string
  expiresAt: string
  accepted: boolean
  createdAt: string
  updatedAt: string
  invitedByName?: string
}

export interface TeamStatistics {
  activeMembers: number
  pendingMembers: number
  owners: number
  admins: number
  managers: number
  members: number
}

class TeamService {
  /**
   * Get all team members for a business
   */
  async getTeamMembers(businessId: string): Promise<TeamMember[]> {
    const response = await api.get(`/team/business/${businessId}`)
    return response.data.data
  }

  /**
   * Get a single team member
   */
  async getTeamMember(businessId: string, userId: string): Promise<TeamMember> {
    const response = await api.get(`/team/business/${businessId}/member/${userId}`)
    return response.data.data
  }

  /**
   * Invite an existing user to the team
   */
  async inviteTeamMember(
    businessId: string,
    data: {
      userId: string
      role?: string
      permissions?: Record<string, boolean>
    }
  ): Promise<TeamMember> {
    const response = await api.post(`/team/business/${businessId}/invite`, data)
    return response.data.data
  }

  /**
   * Create an invitation for a new user
   */
  async createInvitation(
    businessId: string,
    data: {
      email?: string
      phoneNumber?: string
      role?: string
      permissions?: Record<string, boolean>
    }
  ): Promise<TeamInvitation> {
    const response = await api.post(`/team/business/${businessId}/invitation`, data)
    return response.data.data
  }

  /**
   * Get pending invitations
   */
  async getPendingInvitations(businessId: string): Promise<TeamInvitation[]> {
    const response = await api.get(`/team/business/${businessId}/invitations`)
    return response.data.data
  }

  /**
   * Accept a team invitation
   */
  async acceptInvitation(businessId: string): Promise<TeamMember> {
    const response = await api.post(`/team/business/${businessId}/accept`)
    return response.data.data
  }

  /**
   * Accept invitation by token
   */
  async acceptInvitationByToken(token: string): Promise<TeamMember> {
    const response = await api.post(`/team/accept-invitation/${token}`)
    return response.data.data
  }

  /**
   * Update team member role
   */
  async updateTeamMemberRole(
    businessId: string,
    userId: string,
    role: string
  ): Promise<TeamMember> {
    const response = await api.patch(`/team/business/${businessId}/member/${userId}/role`, { role })
    return response.data.data
  }

  /**
   * Update team member permissions
   */
  async updateTeamMemberPermissions(
    businessId: string,
    userId: string,
    permissions: Record<string, boolean>
  ): Promise<TeamMember> {
    const response = await api.patch(`/team/business/${businessId}/member/${userId}/permissions`, {
      permissions,
    })
    return response.data.data
  }

  /**
   * Remove a team member
   */
  async removeTeamMember(businessId: string, userId: string): Promise<TeamMember> {
    const response = await api.delete(`/team/business/${businessId}/member/${userId}`)
    return response.data.data
  }

  /**
   * Cancel an invitation
   */
  async cancelInvitation(businessId: string, invitationId: string): Promise<TeamInvitation> {
    const response = await api.delete(`/team/business/${businessId}/invitation/${invitationId}`)
    return response.data.data
  }

  /**
   * Get team statistics
   */
  async getTeamStatistics(businessId: string): Promise<TeamStatistics> {
    const response = await api.get(`/team/business/${businessId}/statistics`)
    return response.data.data
  }
}

export const teamService = new TeamService()
export default teamService
