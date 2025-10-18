-- Add logo field to links table for receiver page personalization
ALTER TABLE links
ADD COLUMN viewer_page_logo_url text;

-- Add comment for documentation
COMMENT ON COLUMN links.viewer_page_logo_url IS 'URL to logo image shown to document receivers';
