-- Add missing columns to links table

ALTER TABLE public.links 
ADD COLUMN IF NOT EXISTS expires timestamp with time zone,
ADD COLUMN IF NOT EXISTS filename text;

