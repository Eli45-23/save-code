-- =======================================
-- 📋 DATABASE SCHEMA VERIFICATION SCRIPT
-- =======================================
-- Run this script AFTER running final_schema_fix.sql to verify all fixes were applied correctly
-- This script only READS the database and reports the current state

-- =======================================
-- 🔍 VERIFICATION 1: Check All Required Tables Exist
-- =======================================

SELECT 
  '🔍 TABLE VERIFICATION' as check_type,
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
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_analytics') 
    THEN '✅ user_analytics table exists' 
    ELSE '❌ user_analytics table missing' 
  END as analytics_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags') 
    THEN '✅ tags table exists' 
    ELSE '❌ tags table missing' 
  END as tags_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_history') 
    THEN '✅ search_history table exists' 
    ELSE '❌ search_history table missing' 
  END as search_history_status;

-- =======================================
-- 🔍 VERIFICATION 2: Check Critical Snippets Table Columns
-- =======================================

SELECT 
  '🔍 SNIPPETS COLUMNS VERIFICATION' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'id') 
    THEN '✅ id column exists' 
    ELSE '❌ id column missing' 
  END as id_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'file_id') 
    THEN '✅ file_id column exists' 
    ELSE '❌ file_id column missing' 
  END as file_id_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'user_id') 
    THEN '✅ user_id column exists' 
    ELSE '❌ user_id column missing' 
  END as user_id_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'extracted_text') 
    THEN '✅ extracted_text column exists' 
    ELSE '❌ extracted_text column missing' 
  END as extracted_text_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'ocr_confidence') 
    THEN '✅ ocr_confidence column exists' 
    ELSE '❌ ocr_confidence column missing' 
  END as ocr_confidence_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'language') 
    THEN '✅ language column exists' 
    ELSE '❌ language column missing' 
  END as language_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'is_favorite') 
    THEN '✅ is_favorite column exists (CRITICAL FIX)' 
    ELSE '❌ is_favorite column missing (CRITICAL ERROR)' 
  END as is_favorite_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'position_in_file') 
    THEN '✅ position_in_file column exists' 
    ELSE '❌ position_in_file column missing' 
  END as position_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'screenshot_url') 
    THEN '✅ screenshot_url column exists' 
    ELSE '❌ screenshot_url column missing' 
  END as screenshot_url_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'created_at') 
    THEN '✅ created_at column exists' 
    ELSE '❌ created_at column missing' 
  END as created_at_status;

-- =======================================
-- 🔍 VERIFICATION 3: Check User Analytics Table Structure
-- =======================================

SELECT 
  '🔍 USER_ANALYTICS STRUCTURE VERIFICATION' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_analytics' AND column_name = 'id') 
    THEN '✅ id column exists' 
    ELSE '❌ id column missing' 
  END as id_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_analytics' AND column_name = 'user_id') 
    THEN '✅ user_id column exists' 
    ELSE '❌ user_id column missing' 
  END as user_id_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_analytics' AND column_name = 'event_type') 
    THEN '✅ event_type column exists' 
    ELSE '❌ event_type column missing' 
  END as event_type_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_analytics' AND column_name = 'event_data') 
    THEN '✅ event_data column exists' 
    ELSE '❌ event_data column missing' 
  END as event_data_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_analytics' AND column_name = 'created_at') 
    THEN '✅ created_at column exists' 
    ELSE '❌ created_at column missing' 
  END as created_at_status;

-- =======================================
-- 🔍 VERIFICATION 4: Check Critical Performance Indexes
-- =======================================

SELECT 
  '🔍 PERFORMANCE INDEXES VERIFICATION' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'snippets' AND indexname = 'idx_snippets_favorite') 
    THEN '✅ idx_snippets_favorite index exists' 
    ELSE '❌ idx_snippets_favorite index missing' 
  END as snippets_favorite_index_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'snippets' AND indexname = 'idx_snippets_language') 
    THEN '✅ idx_snippets_language index exists' 
    ELSE '❌ idx_snippets_language index missing' 
  END as snippets_language_index_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_analytics' AND indexname = 'idx_analytics_user_id') 
    THEN '✅ idx_analytics_user_id index exists' 
    ELSE '❌ idx_analytics_user_id index missing' 
  END as analytics_user_index_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_analytics' AND indexname = 'idx_analytics_event_type') 
    THEN '✅ idx_analytics_event_type index exists' 
    ELSE '❌ idx_analytics_event_type index missing' 
  END as analytics_event_index_status;

-- =======================================
-- 🔍 VERIFICATION 5: Check Row Level Security (RLS) Status
-- =======================================

SELECT 
  '🔍 ROW LEVEL SECURITY VERIFICATION' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND rowsecurity = true) 
    THEN '✅ profiles RLS enabled' 
    ELSE '❌ profiles RLS disabled' 
  END as profiles_rls_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'files' AND rowsecurity = true) 
    THEN '✅ files RLS enabled' 
    ELSE '❌ files RLS disabled' 
  END as files_rls_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'snippets' AND rowsecurity = true) 
    THEN '✅ snippets RLS enabled' 
    ELSE '❌ snippets RLS disabled' 
  END as snippets_rls_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_analytics' AND rowsecurity = true) 
    THEN '✅ user_analytics RLS enabled' 
    ELSE '❌ user_analytics RLS disabled' 
  END as analytics_rls_status;

-- =======================================
-- 🔍 VERIFICATION 6: Check RLS Policies Count
-- =======================================

SELECT 
  '🔍 RLS POLICIES COUNT VERIFICATION' as check_type,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as profiles_policies_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'files') as files_policies_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'snippets') as snippets_policies_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_analytics') as analytics_policies_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'tags') as tags_policies_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'search_history') as search_history_policies_count;

-- =======================================
-- 🎯 VERIFICATION SUMMARY
-- =======================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 ======================================================';
  RAISE NOTICE '📋 DATABASE SCHEMA VERIFICATION COMPLETE!';
  RAISE NOTICE '📋 ======================================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Review the query results above to verify:';
  RAISE NOTICE '   • All required tables exist';
  RAISE NOTICE '   • All critical columns exist (especially is_favorite)';
  RAISE NOTICE '   • Performance indexes are in place'; 
  RAISE NOTICE '   • Row Level Security is enabled';
  RAISE NOTICE '   • RLS policies are created';
  RAISE NOTICE '';
  RAISE NOTICE '✅ If all checks show green checkmarks, your database is ready!';
  RAISE NOTICE '❌ If any checks show red X marks, re-run final_schema_fix.sql';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next step: Test your React Native app - all errors should be gone!';
  RAISE NOTICE '';
END $$;