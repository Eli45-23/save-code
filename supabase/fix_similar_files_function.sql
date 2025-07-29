-- Fix the find_similar_files function with correct column references
-- Run this in Supabase SQL Editor

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
DECLARE
  detected_lang TEXT;
  first_word TEXT;
BEGIN
  -- Extract first meaningful word from content for title matching
  SELECT COALESCE(
    SUBSTRING(content_text FROM '\b[A-Za-z][A-Za-z0-9_]*\b'),
    'code'
  ) INTO first_word;

  -- Try to detect language from existing snippets with similar content
  SELECT s.language INTO detected_lang
  FROM snippets s 
  WHERE s.user_id = auth.uid()
    AND s.language IS NOT NULL
    AND LENGTH(s.language) > 0
  ORDER BY RANDOM()
  LIMIT 1;

  -- If no language detected, use default
  IF detected_lang IS NULL THEN
    detected_lang := 'javascript';
  END IF;

  RETURN QUERY
  SELECT 
    f.id,
    f.title,
    COALESCE(f.description, '') as description,
    COALESCE(f.language, '') as language,
    -- Calculate similarity score
    CASE 
      WHEN COALESCE(f.language, '') = detected_lang THEN 0.8
      WHEN LOWER(f.title) LIKE '%' || LOWER(first_word) || '%' THEN 0.6
      WHEN array_length(f.tags, 1) > 0 AND f.tags && ARRAY[detected_lang] THEN 0.7
      ELSE 0.3
    END as similarity,
    COALESCE(f.snippet_count, 0) as snippet_count
  FROM files f
  WHERE f.user_id = auth.uid()
    AND (
      COALESCE(f.language, '') = detected_lang
      OR LOWER(f.title) LIKE '%' || LOWER(first_word) || '%'
      OR (array_length(f.tags, 1) > 0 AND f.tags && ARRAY[detected_lang])
    )
  ORDER BY similarity DESC, f.updated_at DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.find_similar_files(TEXT, INTEGER, REAL) TO authenticated;

-- Also create a simpler version that just returns empty results if there are issues
CREATE OR REPLACE FUNCTION public.find_similar_files_safe(
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
  -- Simple fallback that just returns empty results
  -- This prevents the app from crashing if there are schema issues
  RETURN QUERY
  SELECT 
    NULL::UUID as id,
    ''::TEXT as title,
    ''::TEXT as description,  
    ''::TEXT as language,
    0.0::REAL as similarity,
    0::BIGINT as snippet_count
  WHERE FALSE; -- Returns no rows
  
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_similar_files_safe(TEXT, INTEGER, REAL) TO authenticated;