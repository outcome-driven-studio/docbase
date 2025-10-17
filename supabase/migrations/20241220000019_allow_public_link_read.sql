-- Allow public read access to links table
-- This is necessary for unauthenticated viewers to access shared links

CREATE POLICY "Anyone can view shared links" ON public.links
  FOR SELECT USING (true);
