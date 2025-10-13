-- Fix RLS policies for users table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- Recreate with correct policies
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow trigger to insert (SECURITY DEFINER handles this but let's be explicit)
CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT WITH CHECK (true);

