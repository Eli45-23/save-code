-- =======================================
-- Fix Storage RLS Policies for Save Code App
-- =======================================
-- This script fixes the storage bucket RLS policies that are causing upload failures

-- Step 1: Check if storage RLS is enabled
SELECT 
  name,
  id,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'screenshots';

-- Step 2: Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Step 4: Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Users can upload their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own screenshots" ON storage.objects;

-- Step 5: Create proper RLS policies with better path handling
-- The issue is likely that the path format doesn't match what the policies expect

-- Policy for INSERT (upload)
CREATE POLICY "Users can upload their own screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'screenshots' 
    AND auth.uid() IS NOT NULL
    AND (
      -- Option 1: Path starts with user ID
      auth.uid()::text = (string_to_array(name, '/'))[1]
      OR
      -- Option 2: Path is exactly userId/filename
      name ~ ('^' || auth.uid()::text || '/[^/]+$')
    )
  );

-- Policy for SELECT (view/download)
CREATE POLICY "Users can view their own screenshots"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'screenshots' 
    AND auth.uid() IS NOT NULL
    AND (
      -- Option 1: Path starts with user ID
      auth.uid()::text = (string_to_array(name, '/'))[1]
      OR
      -- Option 2: Path is exactly userId/filename
      name ~ ('^' || auth.uid()::text || '/[^/]+$')
    )
  );

-- Policy for UPDATE
CREATE POLICY "Users can update their own screenshots"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'screenshots' 
    AND auth.uid() IS NOT NULL
    AND (
      -- Option 1: Path starts with user ID
      auth.uid()::text = (string_to_array(name, '/'))[1]
      OR
      -- Option 2: Path is exactly userId/filename
      name ~ ('^' || auth.uid()::text || '/[^/]+$')
    )
  );

-- Policy for DELETE
CREATE POLICY "Users can delete their own screenshots"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'screenshots' 
    AND auth.uid() IS NOT NULL
    AND (
      -- Option 1: Path starts with user ID
      auth.uid()::text = (string_to_array(name, '/'))[1]
      OR
      -- Option 2: Path is exactly userId/filename
      name ~ ('^' || auth.uid()::text || '/[^/]+$')
    )
  );

-- Step 6: Alternative simpler policies (if the above don't work)
-- Uncomment these if you want to try simpler policies

/*
-- Simpler policy that allows authenticated users to manage their files
DROP POLICY IF EXISTS "Authenticated users can upload screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete screenshots" ON storage.objects;

CREATE POLICY "Authenticated users can upload screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'screenshots' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can view screenshots"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'screenshots' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can update screenshots"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'screenshots' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can delete screenshots"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'screenshots' 
    AND auth.uid() IS NOT NULL
  );
*/

-- Step 7: Create the bucket if it doesn't exist
-- This needs to be run separately or via Supabase dashboard
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'screenshots', 
  'screenshots', 
  false, -- private bucket
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Step 8: Diagnostic query to test path format
-- Replace 'YOUR_USER_ID' with an actual user ID to test
/*
SELECT 
  auth.uid()::text as current_user_id,
  'fd090d7c-dfee-4e1e-b0b2-cf0bce7100d5/screenshot-123.jpg' as test_path,
  (string_to_array('fd090d7c-dfee-4e1e-b0b2-cf0bce7100d5/screenshot-123.jpg', '/'))[1] as extracted_user_id,
  'fd090d7c-dfee-4e1e-b0b2-cf0bce7100d5/screenshot-123.jpg' ~ ('^' || 'fd090d7c-dfee-4e1e-b0b2-cf0bce7100d5' || '/[^/]+$') as regex_match;
*/

-- Step 9: Function to debug storage upload issues
CREATE OR REPLACE FUNCTION debug_storage_upload(
  p_user_id UUID,
  p_file_path TEXT
)
RETURNS TABLE (
  check_name TEXT,
  check_result BOOLEAN,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'User authenticated'::TEXT, 
         auth.uid() IS NOT NULL, 
         COALESCE('User ID: ' || auth.uid()::text, 'Not authenticated')::TEXT;
  
  RETURN QUERY
  SELECT 'Path format correct'::TEXT,
         p_file_path ~ ('^' || p_user_id::text || '/[^/]+$'),
         'Path: ' || p_file_path || ', Expected format: ' || p_user_id::text || '/filename'::TEXT;
  
  RETURN QUERY
  SELECT 'User ID matches path'::TEXT,
         p_user_id::text = (string_to_array(p_file_path, '/'))[1],
         'Path user ID: ' || (string_to_array(p_file_path, '/'))[1] || ', Provided user ID: ' || p_user_id::text::TEXT;
  
  RETURN QUERY
  SELECT 'Bucket exists'::TEXT,
         EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'screenshots'),
         CASE 
           WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'screenshots') 
           THEN 'Bucket found'::TEXT
           ELSE 'Bucket not found'::TEXT
         END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage example:
-- SELECT * FROM debug_storage_upload('fd090d7c-dfee-4e1e-b0b2-cf0bce7100d5'::uuid, 'fd090d7c-dfee-4e1e-b0b2-cf0bce7100d5/screenshot-123.jpg');