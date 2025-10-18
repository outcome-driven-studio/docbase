-- Add field to control color used in cover letter
ALTER TABLE links
ADD COLUMN cover_letter_color text DEFAULT 'gray-800';

-- Add comment for documentation
COMMENT ON COLUMN links.cover_letter_color IS 'Tailwind color class for cover letter text (e.g., gray-800, blue-600)';
