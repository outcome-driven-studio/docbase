-- Add field to control whether to show creator's signature in cover letter
ALTER TABLE links
ADD COLUMN show_creator_signature boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN links.show_creator_signature IS 'When true, displays the creator signature at the end of the cover letter';
