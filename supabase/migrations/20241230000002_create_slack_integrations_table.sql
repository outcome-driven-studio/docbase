-- Create a separate table for Slack integrations
-- This is cleaner architecture: email config stays in domains, Slack gets its own table

CREATE TABLE IF NOT EXISTS public.slack_integrations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    access_token text NOT NULL,
    channel_id text,
    channel_name text,
    team_id text,
    team_name text,
    bot_user_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT slack_integrations_pkey PRIMARY KEY (id),
    CONSTRAINT slack_integrations_user_id_key UNIQUE (user_id),
    CONSTRAINT slack_integrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.slack_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own Slack integration" ON public.slack_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Slack integration" ON public.slack_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Slack integration" ON public.slack_integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Slack integration" ON public.slack_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE public.slack_integrations IS 'Slack workspace integrations for notifications';
COMMENT ON COLUMN public.slack_integrations.access_token IS 'Slack OAuth bot access token';
COMMENT ON COLUMN public.slack_integrations.channel_id IS 'Slack channel ID where notifications will be sent';
COMMENT ON COLUMN public.slack_integrations.team_id IS 'Slack workspace/team ID';

-- Migrate existing Slack data from domains table (if any exists)
INSERT INTO public.slack_integrations (
  user_id, 
  access_token, 
  channel_id, 
  channel_name, 
  team_id, 
  team_name
)
SELECT 
  user_id,
  slack_access_token,
  slack_channel_id,
  slack_channel_name,
  slack_team_id,
  slack_team_name
FROM public.domains
WHERE slack_access_token IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Optional: Remove Slack columns from domains table
-- (Comment out if you want to keep them for backward compatibility)
-- ALTER TABLE public.domains DROP COLUMN IF EXISTS slack_access_token;
-- ALTER TABLE public.domains DROP COLUMN IF EXISTS slack_channel_id;
-- ALTER TABLE public.domains DROP COLUMN IF EXISTS slack_channel_name;
-- ALTER TABLE public.domains DROP COLUMN IF EXISTS slack_team_id;
-- ALTER TABLE public.domains DROP COLUMN IF EXISTS slack_team_name;
