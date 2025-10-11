-- Add allow_download column to links table
-- This controls whether viewers can download the document
ALTER TABLE links ADD COLUMN IF NOT EXISTS allow_download BOOLEAN DEFAULT true;

-- Update existing links to allow downloads by default (backward compatibility)
UPDATE links SET allow_download = true WHERE allow_download IS NULL;

