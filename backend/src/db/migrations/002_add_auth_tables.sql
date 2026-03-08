-- WazAssist AI - Authentication Tables Migration
-- Run this after 001_initial_schema.sql

-- Add password_hash column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create refresh_tokens table for JWT refresh token management
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- Create password_reset_tokens table for password reset functionality
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_code ON password_reset_tokens(code);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Add missing columns to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_active ON businesses(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_business_active ON products(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_orders_business_status ON orders(business_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_business_status ON conversations(business_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);

-- Create function to clean up expired tokens (to be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  -- Delete expired refresh tokens
  DELETE FROM refresh_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days';

  -- Delete used or expired password reset tokens
  DELETE FROM password_reset_tokens
  WHERE used = true OR expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Create function to revoke all user tokens (useful for security)
CREATE OR REPLACE FUNCTION revoke_all_user_tokens(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE refresh_tokens
  SET revoked = true, revoked_at = NOW()
  WHERE user_id = p_user_id AND revoked = false;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE refresh_tokens IS 'Stores JWT refresh tokens for token rotation';
COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens with 6-digit SMS codes';
COMMENT ON FUNCTION cleanup_expired_tokens() IS 'Cleans up expired authentication tokens';
COMMENT ON FUNCTION revoke_all_user_tokens(UUID) IS 'Revokes all refresh tokens for a user';
