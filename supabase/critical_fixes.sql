-- Critical Database Schema Fixes
-- This script addresses the specific missing elements causing app errors:
-- 1. Missing "profiles" table
-- 2. Missing "ocr_confidence" column in snippets table

-- =======================================
-- 🚨 CRITICAL FIX 1: Create profiles table
-- =======================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    CREATE TABLE profiles (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      username TEXT UNIQUE,
      full_name TEXT,
      avatar_url TEXT,
      preferences JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Enable Row Level Security
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Users can view their own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = id);

    CREATE POLICY "Users can update their own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id);

    CREATE POLICY "Users can insert their own profile"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
      
    RAISE NOTICE '✅ FIXED: Created profiles table with RLS policies';
  ELSE
    RAISE NOTICE '⚠️ profiles table already exists - no action needed';
  END IF;
END $$;

-- =======================================
-- 🚨 CRITICAL FIX 2: Add ocr_confidence column to snippets
-- =======================================

DO $$ 
BEGIN
  -- First check if snippets table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'snippets') THEN
    -- Add ocr_confidence column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'ocr_confidence') THEN
      ALTER TABLE snippets ADD COLUMN ocr_confidence REAL CHECK (ocr_confidence >= 0 AND ocr_confidence <= 100);
      RAISE NOTICE '✅ FIXED: Added ocr_confidence column to snippets table';
    ELSE
      RAISE NOTICE '⚠️ ocr_confidence column already exists in snippets table - no action needed';
    END IF;
  ELSE
    -- If snippets table doesn't exist, create it with all required columns
    CREATE TABLE snippets (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      file_id UUID REFERENCES files(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      screenshot_url TEXT,
      extracted_text TEXT NOT NULL,
      ocr_confidence REAL CHECK (ocr_confidence >= 0 AND ocr_confidence <= 100),
      language TEXT,
      position_in_file INTEGER DEFAULT 0,
      is_favorite BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Enable Row Level Security
    ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Users can view their own snippets"
      ON snippets FOR SELECT
      USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can create their own snippets"
      ON snippets FOR INSERT
      WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update their own snippets"
      ON snippets FOR UPDATE
      USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete their own snippets"
      ON snippets FOR DELETE
      USING (auth.uid() = user_id);
    
    -- Create essential indexes
    CREATE INDEX idx_snippets_file_id ON snippets(file_id);
    CREATE INDEX idx_snippets_user_id ON snippets(user_id);
    CREATE INDEX idx_snippets_created_at ON snippets(created_at DESC);
    
    RAISE NOTICE '✅ FIXED: Created complete snippets table with ocr_confidence column';
  END IF;
END $$;

-- =======================================
-- ✅ COMPLETION MESSAGE
-- =======================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ================================';
  RAISE NOTICE '🎉 CRITICAL FIXES APPLIED!';
  RAISE NOTICE '🎉 ================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fixed: "relation public.profiles does not exist" error';
  RAISE NOTICE '✅ Fixed: "column snippets_1.ocr_confidence does not exist" error';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Your app should now work without these database errors!';
  RAISE NOTICE '';
END $$;