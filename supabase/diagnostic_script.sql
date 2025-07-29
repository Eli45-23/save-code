-- =======================================
-- 🔍 SUPABASE DATABASE DIAGNOSTIC SCRIPT
-- =======================================
-- Run this BEFORE applying fixes to understand current state
-- This will help identify the specific issues in your database

DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
    user_count INTEGER;
    auth_user_count INTEGER;
    col_rec RECORD;
    constraint_rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 ================================';
    RAISE NOTICE '🔍 SUPABASE DATABASE DIAGNOSTIC';
    RAISE NOTICE '🔍 ================================';
    RAISE NOTICE '';

    -- Check table existence
    RAISE NOTICE '📋 TABLE ANALYSIS:';
    RAISE NOTICE '-------------------';
    
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles';
    RAISE NOTICE 'profiles table exists: %', CASE WHEN table_count > 0 THEN '✅ YES' ELSE '❌ NO' END;
    
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'files';
    RAISE NOTICE 'files table exists: %', CASE WHEN table_count > 0 THEN '✅ YES' ELSE '❌ NO' END;
    
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'snippets';
    RAISE NOTICE 'snippets table exists: %', CASE WHEN table_count > 0 THEN '✅ YES' ELSE '❌ NO' END;
    
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tags';
    RAISE NOTICE 'tags table exists: %', CASE WHEN table_count > 0 THEN '✅ YES' ELSE '❌ NO' END;
    
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_analytics';
    RAISE NOTICE 'user_analytics table exists: %', CASE WHEN table_count > 0 THEN '✅ YES' ELSE '❌ NO' END;
    
    RAISE NOTICE '';

    -- Check critical columns in snippets table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'snippets') THEN
        RAISE NOTICE '📋 SNIPPETS TABLE COLUMNS:';
        RAISE NOTICE '-------------------------';
        
        FOR col_rec IN 
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'snippets'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '   ✅ %', col_rec.column_name;
        END LOOP;
        
        -- Check for specific missing columns that cause errors
        SELECT COUNT(*) INTO table_count FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'user_id';
        RAISE NOTICE '';
        RAISE NOTICE 'user_id column exists: %', CASE WHEN table_count > 0 THEN '✅ YES' ELSE '❌ NO - CRITICAL ISSUE!' END;
        
        SELECT COUNT(*) INTO table_count FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'ocr_confidence';
        RAISE NOTICE 'ocr_confidence column exists: %', CASE WHEN table_count > 0 THEN '✅ YES' ELSE '❌ NO - WILL CAUSE ERRORS!' END;
        
        SELECT COUNT(*) INTO table_count FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'is_favorite';
        RAISE NOTICE 'is_favorite column exists: %', CASE WHEN table_count > 0 THEN '✅ YES' ELSE '❌ NO - WILL CAUSE ERRORS!' END;
    END IF;
    
    RAISE NOTICE '';

    -- Check functions
    RAISE NOTICE '🔧 FUNCTION ANALYSIS:';
    RAISE NOTICE '-------------------';
    
    SELECT COUNT(*) INTO function_count FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name = 'create_file_safe';
    RAISE NOTICE 'create_file_safe function exists: %', CASE WHEN function_count > 0 THEN '✅ YES' ELSE '❌ NO' END;
    
    SELECT COUNT(*) INTO function_count FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name = 'create_snippet_safe';
    RAISE NOTICE 'create_snippet_safe function exists: %', CASE WHEN function_count > 0 THEN '✅ YES' ELSE '❌ NO' END;
    
    SELECT COUNT(*) INTO function_count FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name = 'insert_file_direct';
    RAISE NOTICE 'insert_file_direct function exists: %', CASE WHEN function_count > 0 THEN '✅ YES' ELSE '❌ NO' END;
    
    SELECT COUNT(*) INTO function_count FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name = 'search_content';
    RAISE NOTICE 'search_content function exists: %', CASE WHEN function_count > 0 THEN '✅ YES' ELSE '❌ NO' END;
    
    SELECT COUNT(*) INTO function_count FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name = 'find_similar_files';
    RAISE NOTICE 'find_similar_files function exists: %', CASE WHEN function_count > 0 THEN '✅ YES' ELSE '❌ NO' END;
    
    RAISE NOTICE '';

    -- Check RLS policies
    RAISE NOTICE '🔒 RLS POLICY ANALYSIS:';
    RAISE NOTICE '---------------------';
    
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public' AND tablename = 'files';
    RAISE NOTICE 'files table RLS policies: % policies', policy_count;
    
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public' AND tablename = 'snippets';
    RAISE NOTICE 'snippets table RLS policies: % policies', policy_count;
    
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';
    RAISE NOTICE 'profiles table RLS policies: % policies', policy_count;
    
    RAISE NOTICE '';

    -- Check data counts
    RAISE NOTICE '📊 DATA ANALYSIS:';
    RAISE NOTICE '----------------';
    
    -- Auth users count
    BEGIN
        SELECT COUNT(*) INTO auth_user_count FROM auth.users;
        RAISE NOTICE 'auth.users count: %', auth_user_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'auth.users count: ❌ ERROR - Cannot access auth.users';
    END;
    
    -- Profile count
    BEGIN
        SELECT COUNT(*) INTO user_count FROM profiles; 
        RAISE NOTICE 'profiles count: %', user_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'profiles count: ❌ ERROR - %', SQLERRM;
    END;
    
    -- Files count
    BEGIN
        SELECT COUNT(*) INTO table_count FROM files;
        RAISE NOTICE 'files count: %', table_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'files count: ❌ ERROR - %', SQLERRM;
    END;
    
    -- Snippets count  
    BEGIN
        SELECT COUNT(*) INTO table_count FROM snippets;
        RAISE NOTICE 'snippets count: %', table_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'snippets count: ❌ ERROR - %', SQLERRM;
    END;

    RAISE NOTICE '';

    -- Check foreign key constraints
    RAISE NOTICE '🔗 FOREIGN KEY ANALYSIS:';
    RAISE NOTICE '------------------------';
    
    FOR constraint_rec IN
        SELECT 
            conname as constraint_name,
            conrelid::regclass as table_name,
            confrelid::regclass as foreign_table
        FROM pg_constraint 
        WHERE contype = 'f' 
        AND connamespace = 'public'::regnamespace
    LOOP
        RAISE NOTICE '   FK: % (% -> %)', constraint_rec.constraint_name, constraint_rec.table_name, constraint_rec.foreign_table;
    END LOOP;
    
    RAISE NOTICE '';

    -- Summary and recommendations
    RAISE NOTICE '📋 DIAGNOSTIC SUMMARY:';
    RAISE NOTICE '----------------------';
    
    -- Check for the specific error conditions
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        RAISE NOTICE '❌ CRITICAL: profiles table missing - will cause "relation does not exist" errors';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'user_id') THEN
        RAISE NOTICE '❌ CRITICAL: snippets.user_id column missing - will cause foreign key errors';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'ocr_confidence') THEN
        RAISE NOTICE '❌ ERROR: snippets.ocr_confidence column missing - app will fail';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'create_file_safe') THEN
        RAISE NOTICE '⚠️  WARNING: create_file_safe function missing - app will use fallbacks';
    END IF;
    
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public' AND tablename = 'files';
    IF policy_count = 0 THEN
        RAISE NOTICE '⚠️  WARNING: No RLS policies on files table - potential security issue';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '🎯 NEXT STEPS:';
    RAISE NOTICE '--------------';
    RAISE NOTICE '1. Run comprehensive_database_fix.sql to fix all issues';
    RAISE NOTICE '2. Update your React Native app with enhanced SaveCodeService';
    RAISE NOTICE '3. Test with a fresh user account';
    RAISE NOTICE '4. Monitor logs for any remaining issues';
    RAISE NOTICE '';
    
END $$;