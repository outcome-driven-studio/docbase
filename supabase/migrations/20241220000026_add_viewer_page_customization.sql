-- Add viewer page customization fields to links table
ALTER TABLE links
ADD COLUMN viewer_page_heading text,
ADD COLUMN viewer_page_subheading text,
ADD COLUMN viewer_page_cover_letter text,
ADD COLUMN display_mode text DEFAULT 'auto' CHECK (display_mode IN ('auto', 'slideshow', 'document'));

-- Add comment for documentation
COMMENT ON COLUMN links.viewer_page_heading IS 'Custom heading shown to document receivers';
COMMENT ON COLUMN links.viewer_page_subheading IS 'Custom subheading shown to document receivers';
COMMENT ON COLUMN links.viewer_page_cover_letter IS 'Optional personal note/cover letter shown to receivers';
COMMENT ON COLUMN links.display_mode IS 'Display mode: auto (detect orientation), slideshow (for pitch decks), or document (traditional scroll)';
