-- Complete fix for files table - add ALL missing columns
-- Run this in Supabase SQL Editor

-- Add all missing columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE files ADD COLUMN IF NOT EXISTS snippet_count INTEGER DEFAULT 0;
ALTER TABLE files ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_title ON files(title);
CREATE INDEX IF NOT EXISTS idx_files_language ON files(language);
CREATE INDEX IF NOT EXISTS idx_files_updated_at ON files(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_tags ON files USING GIN(tags);

-- Create full-text search index
DROP INDEX IF EXISTS idx_files_search;
CREATE INDEX idx_files_search ON files USING GIN(
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- Fix the find_similar_files function to work with all columns
DROP FUNCTION IF EXISTS public.find_similar_files(TEXT, INTEGER, REAL);

CREATE OR REPLACE FUNCTION public.find_similar_files(
  content_text TEXT,
  limit_count INTEGER DEFAULT 5,
  similarity_threshold REAL DEFAULT 0.3
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  language TEXT,
  similarity REAL,
  snippet_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple implementation that works with current schema
  RETURN QUERY
  SELECT 
    f.id,
    f.title,
    COALESCE(f.description, '') as description,
    COALESCE(f.language, '') as language,
    0.5::REAL as similarity, -- Default similarity
    COALESCE(f.snippet_count::BIGINT, 0::BIGINT) as snippet_count
  FROM files f
  WHERE f.user_id = auth.uid()
  ORDER BY f.updated_at DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.find_similar_files(TEXT, INTEGER, REAL) TO authenticated;

-- Also create the search_content function
DROP FUNCTION IF EXISTS public.search_content(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION public.search_content(
  search_query TEXT,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  type TEXT,
  id UUID,
  title TEXT,
  content TEXT,
  language TEXT,
  file_id UUID,
  similarity REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Search in files
  SELECT 
    'file'::TEXT as type,
    f.id,
    f.title,
    COALESCE(f.description, '') as content,
    COALESCE(f.language, '') as language,
    f.id as file_id,
    0.9::REAL as similarity
  FROM files f
  WHERE f.user_id = auth.uid()
    AND (
      LOWER(f.title) LIKE '%' || LOWER(search_query) || '%'
      OR LOWER(COALESCE(f.description, '')) LIKE '%' || LOWER(search_query) || '%'
      OR LOWER(COALESCE(f.language, '')) LIKE '%' || LOWER(search_query) || '%'
    )
    
  UNION ALL
  
  -- Search in snippets
  SELECT 
    'snippet'::TEXT as type,
    s.id,
    f.title,
    s.extracted_text as content,
    COALESCE(s.language, '') as language,
    s.file_id,
    0.8::REAL as similarity
  FROM snippets s
  JOIN files f ON f.id = s.file_id
  WHERE s.user_id = auth.uid()
    AND LOWER(s.extracted_text) LIKE '%' || LOWER(search_query) || '%'
    
  ORDER BY similarity DESC, title ASC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.search_content(TEXT, INTEGER) TO authenticated;