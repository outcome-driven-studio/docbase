-- Fix users SELECT RLS to work with server-side queries

-- Drop restrictive policy
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;

-- Create more permissive SELECT policy for authenticated users
CREATE POLICY "Authenticated users can view own data" ON public.users
  FOR SELECT 
  TO authenticated
  USING (id = auth.uid());

-- Also allow anon role to select during trigger execution
CREATE POLICY "Allow select during auth" ON public.users
  FOR SELECT
  TO anon
  USING (id = auth.uid() OR auth.uid() IS NOT NULL);

