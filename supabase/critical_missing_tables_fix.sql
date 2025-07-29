-- =======================================
-- 🚨 CRITICAL MISSING TABLES FIX
-- Creates the missing tags and search_history tables
-- Execute this in the Supabase Dashboard SQL Editor
-- =======================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================================
-- 🚨 FIX 1: Create missing tags table
-- =======================================

CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_user_name ON tags(user_id, name);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tags_created_at ON tags(created_at DESC);

-- Enable Row Level Security
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tags
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Users can view their own tags') THEN
    CREATE POLICY "Users can view their own tags"
      ON tags FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Users can create their own tags') THEN
    CREATE POLICY "Users can create their own tags"
      ON tags FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Users can update their own tags') THEN
    CREATE POLICY "Users can update their own tags"
      ON tags FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Users can delete their own tags') THEN
    CREATE POLICY "Users can delete their own tags"
      ON tags FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- =======================================
-- 🚨 FIX 2: Create missing search_history table
-- =======================================

CREATE TABLE IF NOT EXISTS search_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for search_history
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_history' AND policyname = 'Users can view their own search history') THEN
    CREATE POLICY "Users can view their own search history"
      ON search_history FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_history' AND policyname = 'Users can create their own search history') THEN
    CREATE POLICY "Users can create their own search history"
      ON search_history FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =======================================
-- ✅ VERIFICATION
-- =======================================

-- Verify tables exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags') 
    THEN '✅ tags table created successfully'
    ELSE '❌ tags table creation failed'
  END as tags_status;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_history') 
    THEN '✅ search_history table created successfully'
    ELSE '❌ search_history table creation failed'
  END as search_history_status;

-- Show completion message
SELECT '🎉 CRITICAL MISSING TABLES FIX COMPLETE! 🎉' as status;