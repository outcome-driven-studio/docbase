-- Create api_keys table for programmatic link creation
CREATE TABLE IF NOT EXISTS public.api_keys (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL,
    name text NOT NULL, -- Human-readable name for the API key
    key_hash text NOT NULL, -- Hashed version of the API key
    key_prefix text NOT NULL, -- First 8 characters for identification (e.g., "vbd_1234...")
    last_used_at timestamp with time zone,
    is_active boolean DEFAULT true,
    expires_at timestamp with time zone, -- Optional expiration
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.api_keys ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.api_keys ADD CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Create unique constraint for key_hash to prevent duplicates
ALTER TABLE ONLY public.api_keys ADD CONSTRAINT api_keys_key_hash_unique UNIQUE (key_hash);

-- Create index for faster key lookups
CREATE INDEX IF NOT EXISTS api_keys_key_hash_idx ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_key_prefix_idx ON public.api_keys(key_prefix);

-- Create RLS policies for API keys
CREATE POLICY "Users can view their own API keys" ON public.api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys" ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" ON public.api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" ON public.api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to validate API key (used by API endpoint)
CREATE OR REPLACE FUNCTION public.validate_api_key(api_key_hash text)
RETURNS TABLE (
    user_id uuid,
    is_valid boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ak.user_id,
        (ak.is_active AND (ak.expires_at IS NULL OR ak.expires_at > now()))::boolean as is_valid
    FROM public.api_keys ak
    WHERE ak.key_hash = api_key_hash;

    -- Update last_used_at
    UPDATE public.api_keys
    SET last_used_at = now()
    WHERE key_hash = api_key_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
