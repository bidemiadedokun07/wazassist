-- Add Team Management Tables
-- Migration: 003_add_team_tables.sql

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    -- Roles: owner, admin, manager, member

    -- Granular permissions
    permissions JSONB DEFAULT '{
        "products": {"view": true, "create": false, "edit": false, "delete": false},
        "orders": {"view": true, "create": false, "edit": false, "delete": false},
        "customers": {"view": true, "create": false, "edit": false, "delete": false},
        "analytics": {"view": false},
        "team": {"view": false, "invite": false, "manage": false},
        "settings": {"view": false, "edit": false}
    }'::jsonb,

    status VARCHAR(20) DEFAULT 'active',
    -- Status: active, inactive, suspended

    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(business_id, user_id)
);

CREATE INDEX idx_team_members_business ON team_members(business_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(business_id, role);
CREATE INDEX idx_team_members_status ON team_members(business_id, status);

-- Team invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- For existing users
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- For new users (will be null if user already exists)
    email VARCHAR(255),
    phone_number VARCHAR(20),

    role VARCHAR(50) NOT NULL DEFAULT 'member',
    permissions JSONB DEFAULT '{
        "products": {"view": true, "create": false, "edit": false, "delete": false},
        "orders": {"view": true, "create": false, "edit": false, "delete": false},
        "customers": {"view": true, "create": false, "edit": false, "delete": false},
        "analytics": {"view": false},
        "team": {"view": false, "invite": false, "manage": false},
        "settings": {"view": false, "edit": false}
    }'::jsonb,

    token VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending',
    -- Status: pending, accepted, expired, cancelled

    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure either user_id or (email/phone_number) is provided
    CONSTRAINT check_invitation_target CHECK (
        user_id IS NOT NULL OR email IS NOT NULL OR phone_number IS NOT NULL
    )
);

CREATE INDEX idx_team_invitations_business ON team_invitations(business_id);
CREATE INDEX idx_team_invitations_user ON team_invitations(user_id);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
CREATE INDEX idx_team_invitations_phone ON team_invitations(phone_number);
CREATE INDEX idx_team_invitations_token ON team_invitations(token);
CREATE INDEX idx_team_invitations_status ON team_invitations(business_id, status);

-- Add business owner as team member for existing businesses
INSERT INTO team_members (business_id, user_id, role, status, permissions)
SELECT
    id as business_id,
    owner_id as user_id,
    'owner' as role,
    'active' as status,
    '{
        "products": {"view": true, "create": true, "edit": true, "delete": true},
        "orders": {"view": true, "create": true, "edit": true, "delete": true},
        "customers": {"view": true, "create": true, "edit": true, "delete": true},
        "analytics": {"view": true},
        "team": {"view": true, "invite": true, "manage": true},
        "settings": {"view": true, "edit": true}
    }'::jsonb as permissions
FROM businesses
WHERE owner_id IS NOT NULL
ON CONFLICT (business_id, user_id) DO NOTHING;

-- Update function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_invitations_updated_at BEFORE UPDATE ON team_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE team_members IS 'Team members associated with businesses';
COMMENT ON TABLE team_invitations IS 'Pending invitations for team members';
