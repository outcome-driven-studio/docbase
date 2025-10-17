-- Add Slack integration columns to domains table
ALTER TABLE public.domains
ADD COLUMN IF NOT EXISTS slack_access_token text,
ADD COLUMN IF NOT EXISTS slack_channel_id text,
ADD COLUMN IF NOT EXISTS slack_channel_name text,
ADD COLUMN IF NOT EXISTS slack_team_id text,
ADD COLUMN IF NOT EXISTS slack_team_name text;

COMMENT ON COLUMN public.domains.slack_access_token IS 'Slack OAuth access token for sending notifications';
COMMENT ON COLUMN public.domains.slack_channel_id IS 'Slack channel ID where notifications will be sent';
COMMENT ON COLUMN public.domains.slack_channel_name IS 'Slack channel name for display purposes';
COMMENT ON COLUMN public.domains.slack_team_id IS 'Slack workspace/team ID';
COMMENT ON COLUMN public.domains.slack_team_name IS 'Slack workspace/team name for display purposes';
