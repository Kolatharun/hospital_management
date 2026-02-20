-- ============================================================
-- Admin User Seed Script
-- ============================================================
-- This script creates the admin user if it doesn't exist.
--
-- Credentials:
--   Username: admin
--   Password: admin123
--   Role: admin
--
-- The password hash below is for "admin123" using bcrypt with 12 rounds.
-- If you need a different password, generate a new hash using:
--   python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('your_password'))"
-- ============================================================

INSERT INTO users (
    id,
    username,
    password_hash,
    display_name,
    email,
    role,
    is_active,
    created_at,
    updated_at,
    is_deleted
)
SELECT
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55'::uuid,
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G6FQqy8bUm0vYi',
    'System Administrator',
    'admin@balajiheart.com',
    'admin',
    true,
    NOW(),
    NOW(),
    false
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE username = 'admin'
);

-- Verify the admin user was created
SELECT id, username, display_name, role, is_active, created_at
FROM users
WHERE username = 'admin';
