-- Create folders table for organizing links
CREATE TABLE IF NOT EXISTS public.folders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#6B7280', -- Default gray color
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.folders ADD CONSTRAINT folders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.folders ADD CONSTRAINT folders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;

-- Create unique constraint for folder name per user
ALTER TABLE ONLY public.folders ADD CONSTRAINT folders_name_user_unique UNIQUE (created_by, name);

-- Create RLS policies for folders
CREATE POLICY "Users can view their own folders" ON public.folders
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own folders" ON public.folders
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own folders" ON public.folders
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own folders" ON public.folders
  FOR DELETE USING (auth.uid() = created_by);

-- Add folder_id column to links table
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL;

-- Create index for faster folder-based queries
CREATE INDEX IF NOT EXISTS links_folder_id_idx ON public.links(folder_id);
CREATE INDEX IF NOT EXISTS folders_created_by_idx ON public.folders(created_by);
