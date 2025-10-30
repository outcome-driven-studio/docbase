-- Make domain_name nullable so users can use Slack without email setup
-- This allows the OAuth flow to create a domain record with just Slack credentials

ALTER TABLE public.domains 
ALTER COLUMN domain_name DROP NOT NULL;

-- Drop the unique constraint on (domain_name, user_id) since domain_name can now be null
-- Multiple null values are allowed in unique constraints in PostgreSQL
ALTER TABLE public.domains 
DROP CONSTRAINT IF EXISTS domains_name_user_id_key;

-- Add a check to ensure at least one integration is configured
-- (either email via api_key OR Slack via slack_access_token)
ALTER TABLE public.domains
ADD CONSTRAINT domains_has_integration 
CHECK (
  api_key IS NOT NULL 
  OR slack_access_token IS NOT NULL
);

COMMENT ON CONSTRAINT domains_has_integration ON public.domains IS 
'Ensure domain has at least one integration configured (email or Slack)';
