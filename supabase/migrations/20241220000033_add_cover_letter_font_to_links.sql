-- Add field to control font used in cover letter
ALTER TABLE links
ADD COLUMN cover_letter_font text DEFAULT 'cursive';

-- Add comment for documentation
COMMENT ON COLUMN links.cover_letter_font IS 'Font family for cover letter text (cursive, arial, times, georgia, mono)';
