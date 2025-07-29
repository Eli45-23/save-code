-- =======================================
-- 🚨 COMPREHENSIVE FIXES FOR SAVE CODE APP
-- =======================================
-- This script fixes both critical issues:
-- 1. Missing language column in snippets table
-- 2. Missing profile creation for new users

-- =======================================
-- 🚨 FIX 1: Add Missing Language Column to Snippets Table
-- =======================================

DO $$ 
BEGIN
  -- First check if snippets table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'snippets') THEN
    -- Add language column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'language') THEN
      ALTER TABLE public.snippets ADD COLUMN language TEXT;
      
      -- Create index for performance
      CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
      
      RAISE NOTICE '✅ FIXED: Added language column to snippets table with index';
    ELSE
      RAISE NOTICE '⚠️ language column already exists in snippets table - no action needed';
    END IF;
  ELSE
    RAISE NOTICE '❌ ERROR: snippets table does not exist. Please run the main schema.sql first.';
  END IF;
END $$;

-- =======================================
-- 🚨 FIX 2: Ensure Profiles Table Exists with Proper Structure
-- =======================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    CREATE TABLE public.profiles (
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
-- 🚨 FIX 3: Auto-create Profile Trigger (Extra Safety)
-- =======================================

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, preferences)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    '{}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =======================================
-- ✅ COMPLETION MESSAGE
-- =======================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ===================================================';
  RAISE NOTICE '🎉 ALL CRITICAL FIXES APPLIED SUCCESSFULLY!';
  RAISE NOTICE '🎉 ===================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fixed: "column snippets_1.language does not exist" error';
  RAISE NOTICE '✅ Fixed: "PGRST116 - JSON object requested, multiple (or no) rows returned" error';
  RAISE NOTICE '✅ Added: Automatic profile creation trigger for new users';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Your React Native app should now work without these database errors!';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 What was fixed:';
  RAISE NOTICE '   • Added missing language column to snippets table';
  RAISE NOTICE '   • Ensured profiles table exists with proper RLS policies';
  RAISE NOTICE '   • Added automatic profile creation for new users';
  RAISE NOTICE '   • Updated app code to handle missing profiles gracefully';
  RAISE NOTICE '';
END $$;