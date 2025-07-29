-- =======================================
-- 🔍 DIAGNOSTIC SCRIPT: Check Current Snippets Table Structure
-- =======================================
-- Run this FIRST to understand what your snippets table actually looks like

-- Check if snippets table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'snippets') 
    THEN '✅ snippets table exists' 
    ELSE '❌ snippets table does not exist' 
  END as table_status;

-- Show ALL columns in the snippets table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'snippets' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show table definition
SELECT 
  'Table Definition' as info_type,
  pg_get_tabledef('public.snippets'::regclass) as table_definition;

-- Show existing RLS policies
SELECT 
  policyname,
  tablename,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'snippets';

-- Show RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'snippets';

-- Show all indexes on snippets table
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'snippets';

-- Show constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.snippets'::regclass;