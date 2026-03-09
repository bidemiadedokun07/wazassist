import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Shield,
  Trash2,
  X,
  Crown,
  ShieldCheck,
  UserCog,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useBusiness } from '../hooks/useBusiness'
import { teamService, TeamMember, TeamInvitation } from '../services/team'

export default function TeamPage() {
  const { currentBusiness } = useBusiness()
  const queryClient = useQueryClient()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  // Fetch team members
  const { data: teamMembers, isLoading: loadingMembers } = useQuery({
    queryKey: ['team', currentBusiness?.id],
    queryFn: () => teamService.getTeamMembers(currentBusiness!.id),
    enabled: !!currentBusiness,
  })

  // Fetch pending invitations
  const { data: invitations } = useQuery({
    queryKey: ['team-invitations', currentBusiness?.id],
    queryFn: () => teamService.getPendingInvitations(currentBusiness!.id),
    enabled: !!currentBusiness,
  })

  // Fetch team statistics
  const { data: statistics } = useQuery({
    queryKey: ['team-statistics', currentBusiness?.id],
    queryFn: () => teamService.getTeamStatistics(currentBusiness!.id),
    enabled: !!currentBusiness,
  })

  // Remove team member mutation
  const removeTeamMemberMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      teamService.removeTeamMember(currentBusiness!.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      queryClient.invalidateQueries({ queryKey: ['team-statistics'] })
    },
  })

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      teamService.updateTeamMemberRole(currentBusiness!.id, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      queryClient.invalidateQueries({ queryKey: ['team-statistics'] })
    },
  })

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: (invitationId: string) =>
      teamService.cancelInvitation(currentBusiness!.id, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] })
    },
  })

  const handleRemoveMember = async (member: TeamMember) => {
    if (window.confirm(`Are you sure you want to remove ${member.userName} from the team?`)) {
      try {
        await removeTeamMemberMutation.mutateAsync({ userId: member.userId })
      } catch (error) {
        alert('Failed to remove team member')
      }
    }
  }

  const handleUpdateRole = async (member: TeamMember, newRole: string) => {
    try {
      await updateRoleMutation.mutateAsync({ userId: member.userId, role: newRole })
    } catch (error) {
      alert('Failed to update role')
    }
  }

  const handleCancelInvitation = async (invitation: TeamInvitation) => {
    if (window.confirm('Are you sure you want to cancel this invitation?')) {
      try {
        await cancelInvitationMutation.mutateAsync(invitation.id)
      } catch (error) {
        alert('Failed to cancel invitation')
      }
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4" />
      case 'admin':
        return <ShieldCheck className="w-4 h-4" />
      case 'manager':
        return <UserCog className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Business Found</h2>
          <p className="text-gray-600">Please create a business to manage your team.</p>
        </div>
      </div>
    )
  }

  if (loadingMembers) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">Manage your team members and permissions</p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <UserPlus className="w-5 h-5" />
          Invite Member
        </button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Members</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.activeMembers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.pendingMembers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.admins}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserCog className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Managers</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.managers}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Members List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          <p className="text-sm text-gray-600">Manage roles and permissions for your team</p>
        </div>
        <div className="divide-y divide-gray-200">
          {teamMembers && teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <div key={member.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {member.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{member.userName}</h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(
                            member.role
                          )}`}
                        >
                          {getRoleIcon(member.role)}
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                        {getStatusIcon(member.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {member.userEmail && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {member.userEmail}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {member.userPhone}
                        </div>
                      </div>
                      {member.invitedByName && (
                        <p className="text-xs text-gray-500 mt-1">
                          Invited by {member.invitedByName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role !== 'owner' && member.status === 'active' && (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member, e.target.value)}
                          disabled={updateRoleMutation.isPending}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="member">Member</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member)}
                          disabled={removeTeamMemberMutation.isPending}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="Remove member"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members yet</h3>
              <p className="text-gray-600">Invite team members to collaborate on your business</p>
            </div>
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Invitations</h2>
            <p className="text-sm text-gray-600">Invitations waiting to be accepted</p>
          </div>
          <div className="divide-y divide-gray-200">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-lg font-medium text-gray-900">
                        {invitation.email || invitation.phoneNumber}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(
                          invitation.role
                        )}`}
                      >
                        {getRoleIcon(invitation.role)}
                        {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Invited by {invitation.invitedByName || 'Unknown'} •{' '}
                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancelInvitation(invitation)}
                    disabled={cancelInvitationMutation.isPending}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    title="Cancel invitation"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <InviteModal
          businessId={currentBusiness.id}
          onClose={() => setIsInviteModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['team-invitations'] })
            setIsInviteModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

// Invite Modal Component
interface InviteModalProps {
  businessId: string
  onClose: () => void
  onSuccess: () => void
}

function InviteModal({ businessId, onClose, onSuccess }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [role, setRole] = useState('member')

  const createInvitationMutation = useMutation({
    mutationFn: (data: { email?: string; phoneNumber?: string; role: string }) =>
      teamService.createInvitation(businessId, data),
    onSuccess,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email && !phoneNumber) {
      alert('Please provide either email or phone number')
      return
    }

    try {
      await createInvitationMutation.mutateAsync({
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        role,
      })
    } catch (error) {
      alert('Failed to create invitation')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Invite Team Member</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="text-center text-sm text-gray-500">OR</div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+234..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="member">Member</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createInvitationMutation.isPending}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {createInvitationMutation.isPending ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
