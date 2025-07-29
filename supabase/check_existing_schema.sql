-- Check existing tables and their structure
-- Run this first to see what already exists

-- Check what tables exist
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if our expected tables exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
    THEN '✅ profiles table exists' 
    ELSE '❌ profiles table missing' 
  END as profiles_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'files') 
    THEN '✅ files table exists' 
    ELSE '❌ files table missing' 
  END as files_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'snippets') 
    THEN '✅ snippets table exists' 
    ELSE '❌ snippets table missing' 
  END as snippets_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags') 
    THEN '✅ tags table exists' 
    ELSE '❌ tags table missing' 
  END as tags_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_history') 
    THEN '✅ search_history table exists' 
    ELSE '❌ search_history table missing' 
  END as search_history_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_analytics') 
    THEN '✅ user_analytics table exists' 
    ELSE '❌ user_analytics table missing' 
  END as user_analytics_status;

-- Check the structure of existing files table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'files' 
  AND table_schema = 'public'
ORDER BY ordinal_position;