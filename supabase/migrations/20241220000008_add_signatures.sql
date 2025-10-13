-- Add E-Signature Feature

-- Add signature columns to links table
ALTER TABLE public.links ADD COLUMN require_signature boolean DEFAULT false;
ALTER TABLE public.links ADD COLUMN signature_instructions text;

-- Create signatures table
CREATE TABLE public.signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  signer_email text NOT NULL,
  signer_name text NOT NULL,
  signature_data text NOT NULL, -- Base64 encoded signature image
  signature_type text NOT NULL CHECK (signature_type IN ('drawn', 'uploaded', 'typed')),
  ip_address inet,
  user_agent text,
  signed_at timestamp with time zone DEFAULT now(),
  consent_accepted boolean NOT NULL DEFAULT false,
  UNIQUE(link_id, signer_email)
);

ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- Create signature_events table for audit trail
CREATE TABLE public.signature_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_id uuid REFERENCES public.signatures(id) ON DELETE CASCADE,
  link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('viewed', 'signed', 'declined', 'downloaded', 'certificate_generated')),
  signer_email text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.signature_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Signatures

-- Link creators can view signatures on their links
CREATE POLICY "Link creators can view signatures" ON public.signatures
  FOR SELECT USING (
    link_id IN (
      SELECT id FROM public.links WHERE created_by = auth.uid()
    )
  );

-- Anyone can insert their own signature (when viewing a shared link)
CREATE POLICY "Anyone can sign documents" ON public.signatures
  FOR INSERT WITH CHECK (true);

-- Link creators can view signature events
CREATE POLICY "Link creators can view signature events" ON public.signature_events
  FOR SELECT USING (
    link_id IN (
      SELECT id FROM public.links WHERE created_by = auth.uid()
    )
  );

-- System can insert signature events
CREATE POLICY "System can create signature events" ON public.signature_events
  FOR INSERT WITH CHECK (true);

-- Function to get signature status for a link
CREATE OR REPLACE FUNCTION public.get_link_signatures(link_id_arg uuid)
RETURNS TABLE (
  id uuid,
  signer_email text,
  signer_name text,
  signature_type text,
  signed_at timestamp with time zone,
  consent_accepted boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.signer_email,
    s.signer_name,
    s.signature_type,
    s.signed_at,
    s.consent_accepted
  FROM public.signatures s
  WHERE s.link_id = link_id_arg
  ORDER BY s.signed_at DESC;
END;
$$;

-- Function to check if a link requires signature and if it's signed
CREATE OR REPLACE FUNCTION public.check_signature_status(link_id_arg uuid, viewer_email_arg text)
RETURNS TABLE (
  requires_signature boolean,
  is_signed boolean,
  signature_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.require_signature,
    EXISTS(
      SELECT 1 FROM public.signatures 
      WHERE link_id = link_id_arg AND signer_email = viewer_email_arg
    ) as is_signed,
    s.id as signature_id
  FROM public.links l
  LEFT JOIN public.signatures s ON l.id = s.link_id AND s.signer_email = viewer_email_arg
  WHERE l.id = link_id_arg;
END;
$$;

