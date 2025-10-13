-- Add onboarding completion flag to users table

ALTER TABLE public.users ADD COLUMN onboarding_completed boolean DEFAULT false;

-- Mark existing users as having completed onboarding
UPDATE public.users SET onboarding_completed = true WHERE name IS NOT NULL OR title IS NOT NULL;

