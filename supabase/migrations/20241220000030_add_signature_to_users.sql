-- Add signature field to users table for profile signature
ALTER TABLE users
ADD COLUMN signature_url text;

-- Add comment for documentation
COMMENT ON COLUMN users.signature_url IS 'URL to user signature image for personalizing shared documents';
