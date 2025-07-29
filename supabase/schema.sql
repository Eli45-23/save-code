-- =======================================
-- 🚀 Save Code App - Enhanced Supabase Schema
-- =======================================
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- =======================================
-- 📋 PROFILES TABLE (User Metadata)
-- =======================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profiles
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

-- =======================================
-- 📁 ENHANCED FILES TABLE
-- =======================================
CREATE TABLE files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT, -- detected programming language
  tags TEXT[] DEFAULT '{}',
  snippet_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_title ON files(title);
CREATE INDEX idx_files_language ON files(language);
CREATE INDEX idx_files_updated_at ON files(updated_at DESC);
CREATE INDEX idx_files_tags ON files USING GIN(tags);

-- Full-text search index
CREATE INDEX idx_files_search ON files USING GIN(
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- RLS for files
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own files"
  ON files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own files"
  ON files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files"
  ON files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
  ON files FOR DELETE
  USING (auth.uid() = user_id);

-- =======================================
-- 📄 ENHANCED SNIPPETS TABLE
-- =======================================
CREATE TABLE snippets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  screenshot_url TEXT,
  extracted_text TEXT NOT NULL,
  ocr_confidence REAL CHECK (ocr_confidence >= 0 AND ocr_confidence <= 100),
  language TEXT, -- detected language for this snippet
  position_in_file INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_snippets_file_id ON snippets(file_id);
CREATE INDEX idx_snippets_user_id ON snippets(user_id);
CREATE INDEX idx_snippets_language ON snippets(language);
CREATE INDEX idx_snippets_favorite ON snippets(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_snippets_created_at ON snippets(created_at DESC);

-- Full-text search index
CREATE INDEX idx_snippets_text_search ON snippets 
  USING GIN(to_tsvector('english', extracted_text));

-- RLS for snippets
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;

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

-- =======================================
-- 🏷️ TAGS TABLE (for organized tagging)
-- =======================================
CREATE TABLE tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6', -- hex color
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on user_id + name
CREATE UNIQUE INDEX idx_tags_user_name ON tags(user_id, LOWER(name));
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);

-- RLS for tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tags"
  ON tags FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =======================================
-- 🔍 SEARCH HISTORY TABLE
-- =======================================
CREATE TABLE search_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at DESC);

-- RLS for search history
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own search history"
  ON search_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =======================================
-- 📊 ANALYTICS TABLE (optional)
-- =======================================
CREATE TABLE user_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- 'file_created', 'snippet_added', 'search_performed'
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_analytics_event_type ON user_analytics(event_type);
CREATE INDEX idx_analytics_created_at ON user_analytics(created_at DESC);

-- RLS for analytics
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics"
  ON user_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics"
  ON user_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =======================================
-- 🔧 DATABASE FUNCTIONS
-- =======================================

-- Function to update snippet count when snippets are added/removed
CREATE OR REPLACE FUNCTION update_file_snippet_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE files SET 
      snippet_count = snippet_count + 1,
      updated_at = NOW()
    WHERE id = NEW.file_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE files SET 
      snippet_count = snippet_count - 1,
      updated_at = NOW()
    WHERE id = OLD.file_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update snippet count
CREATE TRIGGER trigger_update_snippet_count
  AFTER INSERT OR DELETE ON snippets
  FOR EACH ROW EXECUTE FUNCTION update_file_snippet_count();

-- Function to update file updated_at when snippets change
CREATE OR REPLACE FUNCTION update_file_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE files SET updated_at = NOW() WHERE id = NEW.file_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update file timestamp
CREATE TRIGGER trigger_update_file_timestamp
  AFTER INSERT OR UPDATE ON snippets
  FOR EACH ROW EXECUTE FUNCTION update_file_updated_at();

-- =======================================
-- 🔍 SEARCH FUNCTIONS
-- =======================================

-- Full-text search across files and snippets
CREATE OR REPLACE FUNCTION search_content(
  search_query TEXT,
  user_uuid UUID DEFAULT auth.uid(),
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  type TEXT,
  id UUID,
  title TEXT,
  content TEXT,
  language TEXT,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  -- Search in files
  SELECT 
    'file'::TEXT as type,
    f.id,
    f.title,
    COALESCE(f.description, '') as content,
    f.language,
    f.created_at,
    ts_rank(to_tsvector('english', f.title || ' ' || COALESCE(f.description, '')), 
            plainto_tsquery('english', search_query)) as rank
  FROM files f
  WHERE f.user_id = user_uuid
    AND (to_tsvector('english', f.title || ' ' || COALESCE(f.description, '')) 
         @@ plainto_tsquery('english', search_query))
  
  UNION ALL
  
  -- Search in snippets
  SELECT 
    'snippet'::TEXT as type,
    s.id,
    f.title,
    s.extracted_text as content,
    s.language,
    s.created_at,
    ts_rank(to_tsvector('english', s.extracted_text), 
            plainto_tsquery('english', search_query)) as rank
  FROM snippets s
  JOIN files f ON s.file_id = f.id
  WHERE s.user_id = user_uuid
    AND (to_tsvector('english', s.extracted_text) 
         @@ plainto_tsquery('english', search_query))
  
  ORDER BY rank DESC, created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find similar content (for topic classification)
CREATE OR REPLACE FUNCTION find_similar_files(
  content_text TEXT,
  user_uuid UUID DEFAULT auth.uid(),
  similarity_threshold REAL DEFAULT 0.3,
  limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.title,
    similarity(f.title || ' ' || COALESCE(f.description, ''), content_text) as sim
  FROM files f
  WHERE f.user_id = user_uuid
    AND similarity(f.title || ' ' || COALESCE(f.description, ''), content_text) > similarity_threshold
  ORDER BY sim DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================================
-- 💾 STORAGE SETUP
-- =======================================

-- Create storage bucket for screenshots (run in Supabase Dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('screenshots', 'screenshots', false);

-- Storage policies for screenshots
CREATE POLICY "Users can upload their own screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'screenshots' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own screenshots"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'screenshots' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own screenshots"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'screenshots' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own screenshots"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'screenshots' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =======================================
-- 🎯 FINAL NOTES
-- =======================================
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Create the 'screenshots' storage bucket in Supabase Dashboard
-- 3. Enable RLS on storage.objects if not already enabled
-- 4. Consider adding pgvector extension for semantic search (optional)
-- COMMIT;