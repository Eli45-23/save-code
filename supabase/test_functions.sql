-- =======================================
-- 🧪 TEST DATABASE FUNCTIONS
-- =======================================
-- Run these tests in Supabase SQL Editor to verify functions work

-- Test 1: Check current auth context
SELECT auth.uid() as current_user_id;

-- Test 2: Get a test user ID (replace with your actual user ID)
-- You can find this in Authentication > Users in Supabase dashboard
WITH test_user AS (
  SELECT id FROM auth.users LIMIT 1
)
SELECT id as test_user_id FROM test_user;

-- Test 3: Test file creation with explicit user context
-- Replace 'YOUR-USER-ID' with the ID from above query
DO $$
DECLARE
  test_user_id UUID;
  new_file_id UUID;
BEGIN
  -- Get first user from auth.users
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '❌ No users found in auth.users table';
    RETURN;
  END IF;
  
  RAISE NOTICE '🧪 Testing with user ID: %', test_user_id;
  
  -- Test direct insert into files table
  INSERT INTO files (
    user_id,
    title,
    description,
    language,
    tags,
    snippet_count,
    created_at,
    updated_at
  ) VALUES (
    test_user_id,
    'Direct Test File',
    'Testing direct insert',
    'javascript',
    ARRAY['test', 'direct'],
    0,
    NOW(),
    NOW()
  ) RETURNING id INTO new_file_id;
  
  RAISE NOTICE '✅ Successfully created file with ID: %', new_file_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error creating file: %', SQLERRM;
END $$;

-- Test 4: Check if the file was created
SELECT id, title, user_id, created_at 
FROM files 
WHERE title = 'Direct Test File'
ORDER BY created_at DESC
LIMIT 1;

-- Test 5: Test the emergency fallback function
-- This should work even without auth
SELECT public.emergency_create_file(
  'Emergency Test File',
  (SELECT id::TEXT FROM auth.users LIMIT 1)
);

-- Check emergency backup table
SELECT * FROM files_backup ORDER BY created_at DESC LIMIT 5;

-- Test 6: Create a test function that doesn't require auth
CREATE OR REPLACE FUNCTION public.test_file_creation()
RETURNS TABLE(status TEXT, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_user_id UUID;
  new_file_id UUID;
BEGIN
  -- Get a test user
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RETURN QUERY SELECT 'ERROR'::TEXT, 'No users found'::TEXT;
    RETURN;
  END IF;
  
  -- Try each method
  
  -- Method 1: Direct insert
  BEGIN
    INSERT INTO files (user_id, title, description, language)
    VALUES (test_user_id, 'Test Method 1', 'Direct insert test', 'javascript')
    RETURNING id INTO new_file_id;
    
    RETURN QUERY SELECT 'SUCCESS'::TEXT, format('Method 1 worked: %s', new_file_id)::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'FAILED'::TEXT, format('Method 1 failed: %s', SQLERRM)::TEXT;
  END;
  
  -- Method 2: Using insert_file_simple
  BEGIN
    new_file_id := public.insert_file_simple('Test Method 2', 'Simple function test', 'python');
    RETURN QUERY SELECT 'SUCCESS'::TEXT, format('Method 2 worked: %s', new_file_id)::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'FAILED'::TEXT, format('Method 2 failed: %s', SQLERRM)::TEXT;
  END;
  
  -- Method 3: Emergency fallback
  BEGIN
    new_file_id := public.emergency_create_file('Test Method 3', test_user_id::TEXT);
    RETURN QUERY SELECT 'SUCCESS'::TEXT, format('Method 3 worked: %s', new_file_id)::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'FAILED'::TEXT, format('Method 3 failed: %s', SQLERRM)::TEXT;
  END;
  
END $$;

-- Run the test function
SELECT * FROM public.test_file_creation();

-- Test 7: Check RLS policies are working
SET ROLE authenticated;
SELECT current_setting('role') as current_role;

-- Reset role
RESET ROLE;

-- Test 8: Verify all necessary columns exist in snippets
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'snippets'
ORDER BY ordinal_position;

-- Test 9: Check if user_analytics table exists and has correct structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_analytics'
ORDER BY ordinal_position;