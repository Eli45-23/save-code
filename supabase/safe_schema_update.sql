-- Safe Schema Update - Only creates missing tables and columns
-- Run this instead of the full schema if tables already exist

-- =======================================
-- 🔍 STEP 1: Check and create missing tables
-- =======================================

-- Create profiles table if it doesn't exist
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
    
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = id);

    CREATE POLICY "Users can update their own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id);

    CREATE POLICY "Users can insert their own profile"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
      
    RAISE NOTICE '✅ Created profiles table';
  ELSE
    RAISE NOTICE '⚠️ profiles table already exists';
  END IF;
END $$;

-- =======================================
-- 🔍 STEP 2: Update existing files table
-- =======================================

-- Add missing columns to files table if they don't exist
DO $$ 
BEGIN
  -- Add description column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'description') THEN
    ALTER TABLE files ADD COLUMN description TEXT;
    RAISE NOTICE '✅ Added description column to files';
  END IF;
  
  -- Add language column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'language') THEN
    ALTER TABLE files ADD COLUMN language TEXT;
    RAISE NOTICE '✅ Added language column to files';
  END IF;
  
  -- Add tags column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'tags') THEN
    ALTER TABLE files ADD COLUMN tags TEXT[] DEFAULT '{}';
    RAISE NOTICE '✅ Added tags column to files';
  END IF;
  
  -- Add snippet_count column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'snippet_count') THEN
    ALTER TABLE files ADD COLUMN snippet_count INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added snippet_count column to files';
  END IF;
  
  -- Add last_accessed_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'last_accessed_at') THEN
    ALTER TABLE files ADD COLUMN last_accessed_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Added last_accessed_at column to files';
  END IF;
  
  -- Add updated_at column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'updated_at') THEN
    ALTER TABLE files ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Added updated_at column to files';
  END IF;
END $$;

-- =======================================
-- 🔍 STEP 3: Create or update snippets table
-- =======================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'snippets') THEN
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
    RAISE NOTICE '✅ Created snippets table';
  ELSE
    -- Add missing columns to existing snippets table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'ocr_confidence') THEN
      ALTER TABLE snippets ADD COLUMN ocr_confidence REAL CHECK (ocr_confidence >= 0 AND ocr_confidence <= 100);
      RAISE NOTICE '✅ Added ocr_confidence column to snippets';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'language') THEN
      ALTER TABLE snippets ADD COLUMN language TEXT;
      RAISE NOTICE '✅ Added language column to snippets';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'position_in_file') THEN
      ALTER TABLE snippets ADD COLUMN position_in_file INTEGER DEFAULT 0;
      RAISE NOTICE '✅ Added position_in_file column to snippets';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'snippets' AND column_name = 'is_favorite') THEN
      ALTER TABLE snippets ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
      RAISE NOTICE '✅ Added is_favorite column to snippets';
    END IF;
    
    RAISE NOTICE '⚠️ snippets table already exists, updated with missing columns';
  END IF;
END $$;

-- =======================================
-- 🔍 STEP 4: Create additional tables
-- =======================================

-- Create tags table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags') THEN
    CREATE TABLE tags (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#3B82F6',
      usage_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE UNIQUE INDEX idx_tags_user_name ON tags(user_id, LOWER(name));
    CREATE INDEX idx_tags_user_id ON tags(user_id);
    CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);
    
    RAISE NOTICE '✅ Created tags table';
  ELSE
    RAISE NOTICE '⚠️ tags table already exists';
  END IF;
END $$;

-- Create search_history table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_history') THEN
    CREATE TABLE search_history (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      query TEXT NOT NULL,
      results_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_search_history_user_id ON search_history(user_id);
    CREATE INDEX idx_search_history_created_at ON search_history(created_at DESC);
    
    RAISE NOTICE '✅ Created search_history table';
  ELSE
    RAISE NOTICE '⚠️ search_history table already exists';
  END IF;
END $$;

-- Create user_analytics table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_analytics') THEN
    CREATE TABLE user_analytics (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      event_type TEXT NOT NULL,
      event_data JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_analytics_user_id ON user_analytics(user_id);
    CREATE INDEX idx_analytics_event_type ON user_analytics(event_type);
    CREATE INDEX idx_analytics_created_at ON user_analytics(created_at DESC);
    
    RAISE NOTICE '✅ Created user_analytics table';
  ELSE
    RAISE NOTICE '⚠️ user_analytics table already exists';
  END IF;
END $$;

-- =======================================
-- 🔍 STEP 5: Create missing indexes
-- =======================================

-- Add indexes to files table
DO $$
BEGIN
  -- Check and create indexes for files table
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'files' AND indexname = 'idx_files_user_id') THEN
    CREATE INDEX idx_files_user_id ON files(user_id);
    RAISE NOTICE '✅ Created idx_files_user_id index';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'files' AND indexname = 'idx_files_title') THEN
    CREATE INDEX idx_files_title ON files(title);
    RAISE NOTICE '✅ Created idx_files_title index';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'files' AND indexname = 'idx_files_language') THEN
    CREATE INDEX idx_files_language ON files(language);
    RAISE NOTICE '✅ Created idx_files_language index';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'files' AND indexname = 'idx_files_updated_at') THEN
    CREATE INDEX idx_files_updated_at ON files(updated_at DESC);
    RAISE NOTICE '✅ Created idx_files_updated_at index';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'files' AND indexname = 'idx_files_tags') THEN
    CREATE INDEX idx_files_tags ON files USING GIN(tags);
    RAISE NOTICE '✅ Created idx_files_tags index';
  END IF;
END $$;

-- Add indexes to snippets table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'snippets' AND indexname = 'idx_snippets_file_id') THEN
    CREATE INDEX idx_snippets_file_id ON snippets(file_id);
    RAISE NOTICE '✅ Created idx_snippets_file_id index';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'snippets' AND indexname = 'idx_snippets_user_id') THEN
    CREATE INDEX idx_snippets_user_id ON snippets(user_id);
    RAISE NOTICE '✅ Created idx_snippets_user_id index';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'snippets' AND indexname = 'idx_snippets_language') THEN
    CREATE INDEX idx_snippets_language ON snippets(language);
    RAISE NOTICE '✅ Created idx_snippets_language index';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'snippets' AND indexname = 'idx_snippets_favorite') THEN
    CREATE INDEX idx_snippets_favorite ON snippets(is_favorite) WHERE is_favorite = TRUE;
    RAISE NOTICE '✅ Created idx_snippets_favorite index';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'snippets' AND indexname = 'idx_snippets_created_at') THEN
    CREATE INDEX idx_snippets_created_at ON snippets(created_at DESC);
    RAISE NOTICE '✅ Created idx_snippets_created_at index';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'snippets' AND indexname = 'idx_snippets_text_search') THEN
    CREATE INDEX idx_snippets_text_search ON snippets USING GIN(to_tsvector('english', extracted_text));
    RAISE NOTICE '✅ Created idx_snippets_text_search index';
  END IF;
END $$;

-- =======================================
-- 🔍 STEP 6: Enable RLS on all tables
-- =======================================

-- Enable RLS on files table and create policies
DO $$
BEGIN
  -- Enable RLS if not already enabled
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'files' AND rowsecurity = true) THEN
    ALTER TABLE files ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Enabled RLS on files table';
  END IF;
  
  -- Create policies if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Users can view their own files') THEN
    CREATE POLICY "Users can view their own files"
      ON files FOR SELECT
      USING (auth.uid() = user_id);
    RAISE NOTICE '✅ Created SELECT policy for files';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Users can create their own files') THEN
    CREATE POLICY "Users can create their own files"
      ON files FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE '✅ Created INSERT policy for files';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Users can update their own files') THEN
    CREATE POLICY "Users can update their own files"
      ON files FOR UPDATE
      USING (auth.uid() = user_id);
    RAISE NOTICE '✅ Created UPDATE policy for files';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Users can delete their own files') THEN
    CREATE POLICY "Users can delete their own files"
      ON files FOR DELETE
      USING (auth.uid() = user_id);
    RAISE NOTICE '✅ Created DELETE policy for files';
  END IF;
END $$;

-- Enable RLS on snippets table and create policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'snippets' AND rowsecurity = true) THEN
    ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Enabled RLS on snippets table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'snippets' AND policyname = 'Users can view their own snippets') THEN
    CREATE POLICY "Users can view their own snippets"
      ON snippets FOR SELECT
      USING (auth.uid() = user_id);
    RAISE NOTICE '✅ Created SELECT policy for snippets';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'snippets' AND policyname = 'Users can create their own snippets') THEN
    CREATE POLICY "Users can create their own snippets"
      ON snippets FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE '✅ Created INSERT policy for snippets';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'snippets' AND policyname = 'Users can update their own snippets') THEN
    CREATE POLICY "Users can update their own snippets"
      ON snippets FOR UPDATE
      USING (auth.uid() = user_id);
    RAISE NOTICE '✅ Created UPDATE policy for snippets';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'snippets' AND policyname = 'Users can delete their own snippets') THEN
    CREATE POLICY "Users can delete their own snippets"
      ON snippets FOR DELETE
      USING (auth.uid() = user_id);
    RAISE NOTICE '✅ Created DELETE policy for snippets';
  END IF;
END $$;

-- Enable RLS on other tables
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for tags
CREATE POLICY "Users can manage their own tags"
  ON tags FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for search_history
CREATE POLICY "Users can manage their own search history"
  ON search_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for user_analytics
CREATE POLICY "Users can view their own analytics"
  ON user_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics"
  ON user_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =======================================
-- ✅ COMPLETION MESSAGE
-- =======================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ================================';
  RAISE NOTICE '🎉 SCHEMA UPDATE COMPLETE!';
  RAISE NOTICE '🎉 ================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ All tables are now ready for the Save Code app';
  RAISE NOTICE '✅ RLS policies are in place for security';
  RAISE NOTICE '✅ Indexes are created for performance';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Create storage bucket called "screenshots"';
  RAISE NOTICE '2. Update your app config with Supabase credentials';
  RAISE NOTICE '3. Start your app: npm start';
  RAISE NOTICE '';
END $$;