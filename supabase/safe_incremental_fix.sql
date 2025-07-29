-- =======================================
-- 🚨 SAFE INCREMENTAL DATABASE FIX
-- =======================================
-- This script safely fixes database issues by first checking what exists
-- Run this INSTEAD of the previous script that failed

-- =======================================
-- 🔍 STEP 1: Diagnose Current Snippets Table Structure
-- =======================================

DO $$ 
DECLARE
    col_exists BOOLEAN;
    table_exists BOOLEAN;
    col_rec RECORD;
BEGIN
    -- Check if snippets table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'snippets'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ snippets table exists - proceeding with column checks';
        
        -- Show current columns
        RAISE NOTICE '';
        RAISE NOTICE '📋 Current columns in snippets table:';
        FOR col_rec IN 
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'snippets' AND table_schema = 'public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '   - %', col_rec.column_name;
        END LOOP;
        RAISE NOTICE '';
        
    ELSE
        RAISE NOTICE '❌ snippets table does not exist - cannot proceed';
        RETURN;
    END IF;
END $$;

-- =======================================
-- 🚨 STEP 2: Add Missing Columns One by One (Safe Mode)
-- =======================================

-- Add user_id column if missing (this might be the issue)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'user_id') THEN
    ALTER TABLE public.snippets ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ CRITICAL FIX: Added user_id column to snippets table';
  ELSE
    RAISE NOTICE '⚠️ user_id column already exists in snippets table';
  END IF;
END $$;

-- Add file_id column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'file_id') THEN
    -- First check if files table exists for the foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'files') THEN
      ALTER TABLE public.snippets ADD COLUMN file_id UUID REFERENCES files(id) ON DELETE CASCADE;
      RAISE NOTICE '✅ CRITICAL FIX: Added file_id column to snippets table';
    ELSE
      ALTER TABLE public.snippets ADD COLUMN file_id UUID;
      RAISE NOTICE '✅ PARTIAL FIX: Added file_id column to snippets table (no FK - files table missing)';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ file_id column already exists in snippets table';
  END IF;
END $$;

-- Add extracted_text column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'extracted_text') THEN
    ALTER TABLE public.snippets ADD COLUMN extracted_text TEXT NOT NULL DEFAULT '';
    RAISE NOTICE '✅ CRITICAL FIX: Added extracted_text column to snippets table';
  ELSE
    RAISE NOTICE '⚠️ extracted_text column already exists in snippets table';
  END IF;
END $$;

-- Add ocr_confidence column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'ocr_confidence') THEN
    ALTER TABLE public.snippets ADD COLUMN ocr_confidence REAL CHECK (ocr_confidence >= 0 AND ocr_confidence <= 100);
    RAISE NOTICE '✅ CRITICAL FIX: Added ocr_confidence column to snippets table';
  ELSE
    RAISE NOTICE '⚠️ ocr_confidence column already exists in snippets table';
  END IF;
END $$;

-- Add language column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'language') THEN
    ALTER TABLE public.snippets ADD COLUMN language TEXT;
    RAISE NOTICE '✅ CRITICAL FIX: Added language column to snippets table';
  ELSE
    RAISE NOTICE '⚠️ language column already exists in snippets table';
  END IF;
END $$;

-- Add is_favorite column if missing (MAIN ISSUE)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'is_favorite') THEN
    ALTER TABLE public.snippets ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✅ CRITICAL FIX: Added is_favorite column to snippets table';
  ELSE
    RAISE NOTICE '⚠️ is_favorite column already exists in snippets table';
  END IF;
END $$;

-- Add position_in_file column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'position_in_file') THEN
    ALTER TABLE public.snippets ADD COLUMN position_in_file INTEGER DEFAULT 0;
    RAISE NOTICE '✅ FIXED: Added position_in_file column to snippets table';
  ELSE
    RAISE NOTICE '⚠️ position_in_file column already exists in snippets table';
  END IF;
END $$;

-- Add screenshot_url column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'screenshot_url') THEN
    ALTER TABLE public.snippets ADD COLUMN screenshot_url TEXT;
    RAISE NOTICE '✅ FIXED: Added screenshot_url column to snippets table';
  ELSE
    RAISE NOTICE '⚠️ screenshot_url column already exists in snippets table';
  END IF;
END $$;

-- Add created_at column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'created_at') THEN
    ALTER TABLE public.snippets ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ FIXED: Added created_at column to snippets table';
  ELSE
    RAISE NOTICE '⚠️ created_at column already exists in snippets table';
  END IF;
END $$;

-- =======================================
-- 🚨 STEP 3: Create user_analytics Table (Safe)
-- =======================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_analytics') THEN
    -- Create user_analytics table
    CREATE TABLE public.user_analytics (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      event_type TEXT NOT NULL,
      event_data JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    RAISE NOTICE '✅ CRITICAL FIX: Created user_analytics table';
  ELSE
    RAISE NOTICE '⚠️ user_analytics table already exists';
  END IF;
END $$;

-- =======================================
-- 🚨 STEP 4: Enable RLS Only After user_id Column Exists
-- =======================================

DO $$
BEGIN
  -- Only proceed if user_id column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'user_id') THEN
    
    -- Enable RLS on snippets table if not already enabled
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'snippets' AND rowsecurity = true) THEN
      ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
      RAISE NOTICE '✅ SECURITY: Enabled RLS on snippets table';
    END IF;
    
    -- Create RLS policies only if they don't exist and user_id column exists
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'snippets' AND policyname = 'Users can view their own snippets') THEN
      CREATE POLICY "Users can view their own snippets"
        ON snippets FOR SELECT
        USING (auth.uid() = user_id);
      RAISE NOTICE '✅ SECURITY: Created SELECT policy for snippets';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'snippets' AND policyname = 'Users can create their own snippets') THEN
      CREATE POLICY "Users can create their own snippets"
        ON snippets FOR INSERT
        WITH CHECK (auth.uid() = user_id);
      RAISE NOTICE '✅ SECURITY: Created INSERT policy for snippets';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'snippets' AND policyname = 'Users can update their own snippets') THEN
      CREATE POLICY "Users can update their own snippets"
        ON snippets FOR UPDATE
        USING (auth.uid() = user_id);
      RAISE NOTICE '✅ SECURITY: Created UPDATE policy for snippets';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'snippets' AND policyname = 'Users can delete their own snippets') THEN
      CREATE POLICY "Users can delete their own snippets"
        ON snippets FOR DELETE
        USING (auth.uid() = user_id);
      RAISE NOTICE '✅ SECURITY: Created DELETE policy for snippets';
    END IF;
    
  ELSE
    RAISE NOTICE '❌ Cannot create RLS policies - user_id column does not exist in snippets table';
  END IF;
END $$;

-- =======================================
-- 🚨 STEP 5: Enable RLS on user_analytics
-- =======================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_analytics') THEN
    
    -- Enable RLS on user_analytics table
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_analytics' AND rowsecurity = true) THEN
      ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
      RAISE NOTICE '✅ SECURITY: Enabled RLS on user_analytics table';
    END IF;
    
    -- Create RLS policies for user_analytics
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_analytics' AND policyname = 'Users can view their own analytics') THEN
      CREATE POLICY "Users can view their own analytics"
        ON user_analytics FOR SELECT
        USING (auth.uid() = user_id);
      RAISE NOTICE '✅ SECURITY: Created SELECT policy for user_analytics';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_analytics' AND policyname = 'System can insert analytics') THEN
      CREATE POLICY "System can insert analytics"
        ON user_analytics FOR INSERT
        WITH CHECK (auth.uid() = user_id);
      RAISE NOTICE '✅ SECURITY: Created INSERT policy for user_analytics';
    END IF;
    
  END IF;
END $$;

-- =======================================
-- 🚨 STEP 6: Add Performance Indexes (Safe)
-- =======================================

DO $$
BEGIN
  -- Add indexes only if the required columns exist
  
  -- Index for is_favorite column
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'is_favorite') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'snippets' AND indexname = 'idx_snippets_favorite') THEN
      CREATE INDEX idx_snippets_favorite ON snippets(is_favorite) WHERE is_favorite = TRUE;
      RAISE NOTICE '✅ PERFORMANCE: Created idx_snippets_favorite index';
    END IF;
  END IF;
  
  -- Index for language column
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'language') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'snippets' AND indexname = 'idx_snippets_language') THEN
      CREATE INDEX idx_snippets_language ON snippets(language);
      RAISE NOTICE '✅ PERFORMANCE: Created idx_snippets_language index';
    END IF;
  END IF;
  
  -- Index for user_id column
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'user_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'snippets' AND indexname = 'idx_snippets_user_id') THEN
      CREATE INDEX idx_snippets_user_id ON snippets(user_id);
      RAISE NOTICE '✅ PERFORMANCE: Created idx_snippets_user_id index';
    END IF;
  END IF;
  
  -- Index for file_id column
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'file_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'snippets' AND indexname = 'idx_snippets_file_id') THEN
      CREATE INDEX idx_snippets_file_id ON snippets(file_id);
      RAISE NOTICE '✅ PERFORMANCE: Created idx_snippets_file_id index';
    END IF;
  END IF;
  
  -- Analytics table indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_analytics') THEN
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_analytics' AND indexname = 'idx_analytics_user_id') THEN
      CREATE INDEX idx_analytics_user_id ON user_analytics(user_id);
      RAISE NOTICE '✅ PERFORMANCE: Created idx_analytics_user_id index';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_analytics' AND indexname = 'idx_analytics_event_type') THEN
      CREATE INDEX idx_analytics_event_type ON user_analytics(event_type);
      RAISE NOTICE '✅ PERFORMANCE: Created idx_analytics_event_type index';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_analytics' AND indexname = 'idx_analytics_created_at') THEN
      CREATE INDEX idx_analytics_created_at ON user_analytics(created_at DESC);
      RAISE NOTICE '✅ PERFORMANCE: Created idx_analytics_created_at index';
    END IF;
    
  END IF;
END $$;

-- =======================================
-- ✅ FINAL STATUS CHECK
-- =======================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ======================================================';
  RAISE NOTICE '🎉 SAFE INCREMENTAL DATABASE FIX COMPLETE!';
  RAISE NOTICE '🎉 ======================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ FIXES APPLIED:';
  RAISE NOTICE '   • Added all missing columns to snippets table';
  RAISE NOTICE '   • Created user_analytics table if missing';
  RAISE NOTICE '   • Enabled RLS security safely';
  RAISE NOTICE '   • Added performance indexes';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 KEY FIX: is_favorite column should now exist';
  RAISE NOTICE '🔧 KEY FIX: user_analytics table should handle analytics';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next: Run the diagnostic script to verify all fixes';
  RAISE NOTICE '🚀 Then: Restart your React Native app to test';
  RAISE NOTICE '';
END $$;