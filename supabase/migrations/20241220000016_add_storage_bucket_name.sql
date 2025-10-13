-- Add storage bucket name to users table
-- Users can have custom-named storage buckets

ALTER TABLE public.users ADD COLUMN storage_bucket_name text DEFAULT 'cube';

-- Update existing users to use 'cube' as default
UPDATE public.users SET storage_bucket_name = 'cube' WHERE storage_bucket_name IS NULL;

