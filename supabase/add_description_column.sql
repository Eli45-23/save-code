-- Add missing description column to files table
-- Run this in Supabase SQL Editor

-- Add the description column if it doesn't exist
ALTER TABLE files ADD COLUMN IF NOT EXISTS description TEXT;

-- Update the full-text search index to include description
DROP INDEX IF EXISTS idx_files_search;
CREATE INDEX idx_files_search ON files USING GIN(
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- Update the find_similar_files function to work with the current schema
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
  RETURN QUERY
  SELECT 
    f.id,
    f.title,
    COALESCE(f.description, '') as description,
    COALESCE(f.language, '') as language,
    -- Simple similarity based on language match
    CASE 
      WHEN f.language IS NOT NULL AND LENGTH(f.language) > 0 THEN 0.8
      ELSE 0.3
    END as similarity,
    COALESCE(f.snippet_count, 0) as snippet_count
  FROM files f
  WHERE f.user_id = auth.uid()
  ORDER BY similarity DESC, f.updated_at DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.find_similar_files(TEXT, INTEGER, REAL) TO authenticated;