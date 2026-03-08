-- Migration: Create Team Members Table
-- Description: Allows businesses to add team members with different roles and permissions
-- Version: 007
-- Date: 2024-01-15

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(business_id, user_id)
);

-- Create indexes for team_members
CREATE INDEX idx_team_members_business_id ON team_members(business_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_status ON team_members(status);
CREATE INDEX idx_team_members_role ON team_members(role);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments to table and columns
COMMENT ON TABLE team_members IS 'Team members associated with businesses';
COMMENT ON COLUMN team_members.id IS 'Unique identifier for team member record';
COMMENT ON COLUMN team_members.business_id IS 'Reference to the business';
COMMENT ON COLUMN team_members.user_id IS 'Reference to the user who is a team member';
COMMENT ON COLUMN team_members.role IS 'Role of the team member (owner, admin, manager, member)';
COMMENT ON COLUMN team_members.permissions IS 'JSON object containing specific permissions';
COMMENT ON COLUMN team_members.invited_by IS 'User ID who sent the invitation';
COMMENT ON COLUMN team_members.invited_at IS 'Timestamp when invitation was sent';
COMMENT ON COLUMN team_members.accepted_at IS 'Timestamp when invitation was accepted';
COMMENT ON COLUMN team_members.status IS 'Status of membership (pending, active, suspended, removed)';

-- Create team_invitations table for tracking invites before user exists
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone_number VARCHAR(20),
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '{}',
  invited_by UUID NOT NULL REFERENCES users(id),
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_contact_info CHECK (email IS NOT NULL OR phone_number IS NOT NULL)
);

-- Create indexes for team_invitations
CREATE INDEX idx_team_invitations_business_id ON team_invitations(business_id);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
CREATE INDEX idx_team_invitations_phone ON team_invitations(phone_number);
CREATE INDEX idx_team_invitations_token ON team_invitations(invitation_token);
CREATE INDEX idx_team_invitations_expires_at ON team_invitations(expires_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments to table and columns
COMMENT ON TABLE team_invitations IS 'Pending team invitations sent via email or phone';
COMMENT ON COLUMN team_invitations.id IS 'Unique identifier for invitation';
COMMENT ON COLUMN team_invitations.business_id IS 'Reference to the business';
COMMENT ON COLUMN team_invitations.email IS 'Email address of invitee';
COMMENT ON COLUMN team_invitations.phone_number IS 'Phone number of invitee';
COMMENT ON COLUMN team_invitations.role IS 'Role to be assigned when accepted';
COMMENT ON COLUMN team_invitations.permissions IS 'Permissions to be assigned when accepted';
COMMENT ON COLUMN team_invitations.invited_by IS 'User who sent the invitation';
COMMENT ON COLUMN team_invitations.invitation_token IS 'Unique token for accepting invitation';
COMMENT ON COLUMN team_invitations.expires_at IS 'Expiration timestamp for invitation';
COMMENT ON COLUMN team_invitations.accepted IS 'Whether invitation has been accepted';

-- Seed data: Make existing business owners team members
INSERT INTO team_members (business_id, user_id, role, status, accepted_at)
SELECT
  b.id as business_id,
  b.owner_id as user_id,
  'owner' as role,
  'active' as status,
  b.created_at as accepted_at
FROM businesses b
WHERE b.owner_id IS NOT NULL
ON CONFLICT (business_id, user_id) DO NOTHING;
