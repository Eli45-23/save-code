-- =======================================
-- ULTRA DIAGNOSTIC: Find the Root Cause of Storage RLS Issues
-- =======================================

-- 1. Check if the screenshots bucket exists and its configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE name = 'screenshots';

-- 2. Check current RLS policies on storage.objects
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
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 3. Check if RLS is even enabled on storage.objects
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 4. Test current user authentication (run this while logged in)
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 5. Check for any uploaded files in screenshots bucket (should be empty or have old uploads)
SELECT 
  name,
  bucket_id,
  owner,
  created_at,
  last_accessed_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'screenshots'
ORDER BY created_at DESC
LIMIT 10;

-- 6. Test if we can insert a simple object (this will fail with the exact RLS error)
-- DON'T RUN THIS - just to understand what would happen:
-- INSERT INTO storage.objects (bucket_id, name, owner, metadata)
-- VALUES ('screenshots', 'test-file.jpg', auth.uid(), '{}');

-- 7. Check bucket-level permissions
SELECT 
  b.name as bucket_name,
  b.public as is_public,
  b.owner as bucket_owner
FROM storage.buckets b
WHERE b.name = 'screenshots';

-- =======================================
-- DIAGNOSIS GUIDE:
-- =======================================
-- If bucket doesn't exist: Need to create it
-- If RLS is disabled: That's not the issue
-- If no policies exist: That's the problem - no policies = no access
-- If policies exist but are wrong: Need to fix them
-- If auth.uid() is null: Authentication issue
-- If bucket is private and has restrictive policies: That's the root cause
-- =======================================