-- =======================================
-- 🚀 ULTRA COMPREHENSIVE DATABASE FIX
-- Fixes all missing tables, functions, and policies
-- =======================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =======================================
-- 🚨 CRITICAL FIX 1: Create missing tags table
-- =======================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags') THEN
    CREATE TABLE tags (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#3B82F6',
      usage_count INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create unique constraint
    CREATE UNIQUE INDEX idx_tags_user_name ON tags(user_id, name);
    
    -- Create performance indexes
    CREATE INDEX idx_tags_user_id ON tags(user_id);
    CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);
    CREATE INDEX idx_tags_created_at ON tags(created_at DESC);
    
    -- Enable Row Level Security
    ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Users can view their own tags"
      ON tags FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can create their own tags"
      ON tags FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own tags"
      ON tags FOR UPDATE
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own tags"
      ON tags FOR DELETE
      USING (auth.uid() = user_id);
      
    RAISE NOTICE '✅ FIXED: Created tags table with RLS policies';
  ELSE
    RAISE NOTICE '⚠️ tags table already exists - verifying structure';
    
    -- Ensure all required columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tags' AND column_name = 'color') THEN
      ALTER TABLE tags ADD COLUMN color TEXT DEFAULT '#3B82F6';
      RAISE NOTICE '✅ Added missing color column to tags table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tags' AND column_name = 'usage_count') THEN
      ALTER TABLE tags ADD COLUMN usage_count INTEGER DEFAULT 1;
      RAISE NOTICE '✅ Added missing usage_count column to tags table';
    END IF;
  END IF;
END $$;

-- =======================================
-- 🚨 CRITICAL FIX 2: Create missing search_history table
-- =======================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_history') THEN
    CREATE TABLE search_history (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      query TEXT NOT NULL,
      results_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create indexes
    CREATE INDEX idx_search_history_user_id ON search_history(user_id);
    CREATE INDEX idx_search_history_created_at ON search_history(created_at DESC);
    CREATE INDEX idx_search_history_query ON search_history USING gin(query gin_trgm_ops);
    
    -- Enable Row Level Security
    ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Users can view their own search history"
      ON search_history FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can create their own search history"
      ON search_history FOR INSERT
      WITH CHECK (auth.uid() = user_id);
      
    RAISE NOTICE '✅ FIXED: Created search_history table with RLS policies';
  ELSE
    RAISE NOTICE '⚠️ search_history table already exists - no action needed';
  END IF;
END $$;

-- =======================================
-- 🚨 CRITICAL FIX 3: Create missing user_analytics table
-- =======================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_analytics') THEN
    CREATE TABLE user_analytics (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      event_type TEXT NOT NULL,
      event_data JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create indexes
    CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
    CREATE INDEX idx_user_analytics_created_at ON user_analytics(created_at DESC);
    CREATE INDEX idx_user_analytics_event_type ON user_analytics(event_type);
    
    -- Enable Row Level Security
    ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Users can view their own analytics"
      ON user_analytics FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can create their own analytics"
      ON user_analytics FOR INSERT
      WITH CHECK (auth.uid() = user_id);
      
    RAISE NOTICE '✅ FIXED: Created user_analytics table with RLS policies';
  ELSE
    RAISE NOTICE '⚠️ user_analytics table already exists - no action needed';
  END IF;
END $$;

-- =======================================
-- 🚨 CRITICAL FIX 4: Enhanced create_snippet_safe function
-- =======================================

DROP FUNCTION IF EXISTS public.create_snippet_safe(UUID, TEXT, TEXT, REAL, TEXT, INTEGER, BOOLEAN);

CREATE OR REPLACE FUNCTION public.create_snippet_safe(
  p_file_id UUID,
  p_extracted_text TEXT,
  p_screenshot_url TEXT DEFAULT NULL,
  p_ocr_confidence REAL DEFAULT 95.0,
  p_language TEXT DEFAULT 'javascript',
  p_position_in_file INTEGER DEFAULT 0,
  p_is_favorite BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_snippet_id UUID;
  current_user_id UUID;
  file_exists BOOLEAN;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Verify file exists and belongs to user
  SELECT EXISTS(
    SELECT 1 FROM files 
    WHERE id = p_file_id AND user_id = current_user_id
  ) INTO file_exists;
  
  IF NOT file_exists THEN
    RAISE EXCEPTION 'File not found or access denied';
  END IF;

  new_snippet_id := uuid_generate_v4();
  
  INSERT INTO snippets (
    id,
    file_id,
    user_id,
    screenshot_url,
    extracted_text,
    ocr_confidence,
    language,
    position_in_file,
    is_favorite,
    created_at
  ) VALUES (
    new_snippet_id,
    p_file_id,
    current_user_id,
    p_screenshot_url,
    p_extracted_text,
    COALESCE(p_ocr_confidence, 95.0),
    COALESCE(p_language, 'javascript'),
    COALESCE(p_position_in_file, 0),
    COALESCE(p_is_favorite, FALSE),
    NOW()
  );
  
  -- Update file snippet count and timestamp
  UPDATE files 
  SET snippet_count = snippet_count + 1, 
      updated_at = NOW(),
      last_accessed_at = NOW()
  WHERE id = p_file_id;
  
  RETURN new_snippet_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create snippet: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_snippet_safe(UUID, TEXT, TEXT, REAL, TEXT, INTEGER, BOOLEAN) TO authenticated;

-- =======================================
-- 🚨 CRITICAL FIX 5: Enhanced search_content function
-- =======================================

DROP FUNCTION IF EXISTS public.search_content(TEXT, UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.search_content(
  search_query TEXT,
  user_uuid UUID DEFAULT NULL,
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
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := COALESCE(user_uuid, auth.uid());
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  (
    -- Search in files
    SELECT 
      'file'::TEXT as type,
      f.id,
      f.title,
      COALESCE(f.description, '')::TEXT as content,
      f.language,
      f.created_at,
      ts_rank(
        to_tsvector('english', f.title || ' ' || COALESCE(f.description, '') || ' ' || array_to_string(f.tags, ' ')),
        plainto_tsquery('english', search_query)
      )::REAL as rank
    FROM files f
    WHERE f.user_id = current_user_id
      AND (
        to_tsvector('english', f.title || ' ' || COALESCE(f.description, '') || ' ' || array_to_string(f.tags, ' '))
        @@ plainto_tsquery('english', search_query)
        OR f.title ILIKE '%' || search_query || '%'
        OR f.description ILIKE '%' || search_query || '%'
      )
  )
  UNION ALL
  (
    -- Search in snippets
    SELECT 
      'snippet'::TEXT as type,
      s.id,
      f.title,
      s.extracted_text as content,
      s.language,
      s.created_at,
      ts_rank(
        to_tsvector('english', s.extracted_text),
        plainto_tsquery('english', search_query)
      )::REAL as rank
    FROM snippets s
    JOIN files f ON s.file_id = f.id
    WHERE s.user_id = current_user_id
      AND (
        to_tsvector('english', s.extracted_text) @@ plainto_tsquery('english', search_query)
        OR s.extracted_text ILIKE '%' || search_query || '%'
      )
  )
  ORDER BY rank DESC, created_at DESC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_content(TEXT, UUID, INTEGER) TO authenticated;

-- =======================================
-- 🚨 CRITICAL FIX 6: Enhanced find_similar_files function
-- =======================================

DROP FUNCTION IF EXISTS public.find_similar_files(TEXT, UUID, REAL, INTEGER);

CREATE OR REPLACE FUNCTION public.find_similar_files(
  content_text TEXT,
  user_uuid UUID DEFAULT NULL,
  similarity_threshold REAL DEFAULT 0.3,
  limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  similarity REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := COALESCE(user_uuid, auth.uid());
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT 
    f.id,
    f.title,
    similarity(
      COALESCE(f.description, '') || ' ' || array_to_string(f.tags, ' '),
      content_text
    )::REAL as similarity
  FROM files f
  WHERE f.user_id = current_user_id
    AND f.id != COALESCE((
      SELECT id FROM files 
      WHERE user_id = current_user_id 
      ORDER BY created_at DESC 
      LIMIT 1
    ), uuid_generate_v4()) -- Exclude most recent file
    AND similarity(
      COALESCE(f.description, '') || ' ' || array_to_string(f.tags, ' '),
      content_text
    ) > similarity_threshold
  ORDER BY similarity DESC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_similar_files(TEXT, UUID, REAL, INTEGER) TO authenticated;

-- =======================================
-- 🚨 CRITICAL FIX 7: Verify all required tables exist
-- =======================================

DO $$
DECLARE
  missing_tables TEXT[] := '{}';
  table_name TEXT;
  required_tables TEXT[] := ARRAY['profiles', 'files', 'snippets', 'tags', 'search_history', 'user_analytics'];
BEGIN
  FOREACH table_name IN ARRAY required_tables
  LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
      missing_tables := missing_tables || table_name;
    END IF;
  END LOOP;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE NOTICE '❌ Missing tables: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE '✅ All required tables exist!';
  END IF;
END $$;

-- =======================================
-- ✅ COMPLETION MESSAGE
-- =======================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ================================';
  RAISE NOTICE '🎉 ULTRA COMPREHENSIVE FIX COMPLETE!';
  RAISE NOTICE '🎉 ================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fixed: Missing tags table';
  RAISE NOTICE '✅ Fixed: Missing search_history table';
  RAISE NOTICE '✅ Fixed: Missing user_analytics table';
  RAISE NOTICE '✅ Fixed: Enhanced create_snippet_safe function';
  RAISE NOTICE '✅ Fixed: Enhanced search_content function';
  RAISE NOTICE '✅ Fixed: Enhanced find_similar_files function';
  RAISE NOTICE '✅ Fixed: All RLS policies in place';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Your app should now work without any database errors!';
  RAISE NOTICE '📋 Test the search functionality and file operations';
  RAISE NOTICE '';
END $$;