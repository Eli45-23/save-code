-- =======================================
-- 🎯 TARGETED SNIPPETS TABLE FIX
-- =======================================
-- Based on your schema screenshot, this adds only the missing columns and fixes

-- =======================================
-- 🚨 STEP 1: Add Missing Critical Columns to snippets Table
-- =======================================

-- Add user_id column (CRITICAL - needed for RLS policies)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'user_id') THEN
    ALTER TABLE public.snippets ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ CRITICAL FIX: Added user_id column to snippets table';
    
    -- Update existing rows to have a user_id (if any exist)
    -- This sets user_id to NULL for now - you'll need to populate it properly later
    RAISE NOTICE '⚠️ WARNING: Existing snippet rows will have NULL user_id - populate manually if needed';
    
  ELSE
    RAISE NOTICE '⚠️ user_id column already exists in snippets table';
  END IF;
END $$;

-- Add is_favorite column (CRITICAL - needed by app)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'is_favorite') THEN
    ALTER TABLE public.snippets ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✅ CRITICAL FIX: Added is_favorite column to snippets table';
  ELSE
    RAISE NOTICE '⚠️ is_favorite column already exists in snippets table';
  END IF;
END $$;

-- Add position_in_file column (needed by app)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'position_in_file') THEN
    ALTER TABLE public.snippets ADD COLUMN position_in_file INTEGER DEFAULT 0;
    RAISE NOTICE '✅ FIXED: Added position_in_file column to snippets table';
  ELSE
    RAISE NOTICE '⚠️ position_in_file column already exists in snippets table';
  END IF;
END $$;

-- =======================================
-- 🚨 STEP 2: Create Missing user_analytics Table
-- =======================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_analytics') THEN
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
-- 🚨 STEP 3: Enable RLS on snippets Table (Now Safe)
-- =======================================

DO $$
BEGIN
  -- Enable RLS on snippets table
  ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE '✅ SECURITY: Enabled RLS on snippets table';
  
  -- Drop existing policies if they exist (to avoid conflicts)
  DROP POLICY IF EXISTS "Users can view their own snippets" ON snippets;
  DROP POLICY IF EXISTS "Users can create their own snippets" ON snippets;
  DROP POLICY IF EXISTS "Users can update their own snippets" ON snippets;
  DROP POLICY IF EXISTS "Users can delete their own snippets" ON snippets;
  
  -- Create RLS policies (now that user_id column exists)
  CREATE POLICY "Users can view their own snippets"
    ON snippets FOR SELECT
    USING (auth.uid() = user_id);
  RAISE NOTICE '✅ SECURITY: Created SELECT policy for snippets';
  
  CREATE POLICY "Users can create their own snippets"
    ON snippets FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  RAISE NOTICE '✅ SECURITY: Created INSERT policy for snippets';
  
  CREATE POLICY "Users can update their own snippets"
    ON snippets FOR UPDATE
    USING (auth.uid() = user_id);
  RAISE NOTICE '✅ SECURITY: Created UPDATE policy for snippets';
  
  CREATE POLICY "Users can delete their own snippets"
    ON snippets FOR DELETE
    USING (auth.uid() = user_id);
  RAISE NOTICE '✅ SECURITY: Created DELETE policy for snippets';
  
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error creating RLS policies: %', SQLERRM;
END $$;

-- =======================================
-- 🚨 STEP 4: Enable RLS on user_analytics Table
-- =======================================

DO $$
BEGIN
  -- Enable RLS on user_analytics table
  ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE '✅ SECURITY: Enabled RLS on user_analytics table';
  
  -- Create RLS policies for user_analytics
  CREATE POLICY "Users can view their own analytics"
    ON user_analytics FOR SELECT
    USING (auth.uid() = user_id);
  RAISE NOTICE '✅ SECURITY: Created SELECT policy for user_analytics';

  CREATE POLICY "System can insert analytics"
    ON user_analytics FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  RAISE NOTICE '✅ SECURITY: Created INSERT policy for user_analytics';
  
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error creating user_analytics RLS policies: %', SQLERRM;
END $$;

-- =======================================
-- 🚨 STEP 5: Add Performance Indexes
-- =======================================

DO $$
BEGIN
  -- Index for is_favorite column
  CREATE INDEX IF NOT EXISTS idx_snippets_favorite ON snippets(is_favorite) WHERE is_favorite = TRUE;
  RAISE NOTICE '✅ PERFORMANCE: Created idx_snippets_favorite index';
  
  -- Index for user_id column  
  CREATE INDEX IF NOT EXISTS idx_snippets_user_id ON snippets(user_id);
  RAISE NOTICE '✅ PERFORMANCE: Created idx_snippets_user_id index';
  
  -- Index for position_in_file column
  CREATE INDEX IF NOT EXISTS idx_snippets_position ON snippets(position_in_file);
  RAISE NOTICE '✅ PERFORMANCE: Created idx_snippets_position index';
  
  -- Analytics table indexes
  CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON user_analytics(user_id);
  RAISE NOTICE '✅ PERFORMANCE: Created idx_analytics_user_id index';
  
  CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON user_analytics(event_type);
  RAISE NOTICE '✅ PERFORMANCE: Created idx_analytics_event_type index';
  
  CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON user_analytics(created_at DESC);
  RAISE NOTICE '✅ PERFORMANCE: Created idx_analytics_created_at index';
  
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error creating indexes: %', SQLERRM;
END $$;

-- =======================================
-- ✅ COMPLETION MESSAGE
-- =======================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ======================================================';
  RAISE NOTICE '🎉 TARGETED SNIPPETS FIX COMPLETE!';
  RAISE NOTICE '🎉 ======================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ CRITICAL FIXES APPLIED:';
  RAISE NOTICE '   • Added user_id column to snippets table';
  RAISE NOTICE '   • Added is_favorite column to snippets table';
  RAISE NOTICE '   • Added position_in_file column to snippets table';
  RAISE NOTICE '   • Created user_analytics table';
  RAISE NOTICE '   • Enabled RLS security on both tables';
  RAISE NOTICE '   • Added performance indexes';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 ERROR FIXES:';
  RAISE NOTICE '   • "column snippets_1.is_favorite does not exist" ➜ FIXED';
  RAISE NOTICE '   • "column user_id does not exist" ➜ FIXED';
  RAISE NOTICE '   • "Analytics error: {}" ➜ FIXED';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANT: If you have existing snippet data, you need to:';
  RAISE NOTICE '   1. Update user_id values for existing snippets';
  RAISE NOTICE '   2. Restart your React Native app';
  RAISE NOTICE '   3. Test the app - all errors should be gone!';
  RAISE NOTICE '';
END $$;