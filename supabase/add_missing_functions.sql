-- Add missing database functions for SaveCode app

-- Function to find similar files based on content similarity
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
  -- Simple text similarity based on common words
  -- In production, you might want to use pg_trgm or vector similarity
  RETURN QUERY
  SELECT 
    f.id,
    f.title,
    f.description,
    f.language,
    -- Simple similarity calculation based on title and language match
    CASE 
      WHEN f.language = (
        SELECT s.language 
        FROM snippets s 
        WHERE s.extracted_text = content_text 
        LIMIT 1
      ) THEN 0.8
      WHEN LOWER(f.title) LIKE '%' || LOWER(
        COALESCE(
          SUBSTRING(content_text FROM '\w+'), 
          'code'
        )
      ) || '%' THEN 0.6
      ELSE 0.3
    END as similarity,
    (SELECT COUNT(*) FROM snippets s WHERE s.file_id = f.id) as snippet_count
  FROM files f
  WHERE f.user_id = auth.uid()
    AND (
      f.language = (
        SELECT s.language 
        FROM snippets s 
        WHERE s.extracted_text = content_text 
        LIMIT 1
      )
      OR LOWER(f.title) LIKE '%' || LOWER(
        COALESCE(
          SUBSTRING(content_text FROM '\w+'), 
          'code'
        )
      ) || '%'
    )
  ORDER BY similarity DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.find_similar_files(TEXT, INTEGER, REAL) TO authenticated;

-- Function to search content with full-text search
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
    f.description as content,
    f.language,
    f.id as file_id,
    0.9::REAL as similarity
  FROM files f
  WHERE f.user_id = auth.uid()
    AND (
      LOWER(f.title) LIKE '%' || LOWER(search_query) || '%'
      OR LOWER(f.description) LIKE '%' || LOWER(search_query) || '%'
      OR LOWER(f.language) LIKE '%' || LOWER(search_query) || '%'
    )
    
  UNION ALL
  
  -- Search in snippets
  SELECT 
    'snippet'::TEXT as type,
    s.id,
    f.title,
    s.extracted_text as content,
    s.language,
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_content(TEXT, INTEGER) TO authenticated;

-- Function to get user analytics summary
CREATE OR REPLACE FUNCTION public.get_user_analytics_summary(
  user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  total_files BIGINT,
  total_snippets BIGINT,
  most_used_language TEXT,
  files_this_month BIGINT,
  snippets_this_month BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM files WHERE files.user_id = get_user_analytics_summary.user_id) as total_files,
    (SELECT COUNT(*) FROM snippets WHERE snippets.user_id = get_user_analytics_summary.user_id) as total_snippets,
    (
      SELECT s.language 
      FROM snippets s 
      WHERE s.user_id = get_user_analytics_summary.user_id 
        AND s.language IS NOT NULL
      GROUP BY s.language 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ) as most_used_language,
    (
      SELECT COUNT(*) 
      FROM files 
      WHERE files.user_id = get_user_analytics_summary.user_id 
        AND files.created_at >= DATE_TRUNC('month', CURRENT_DATE)
    ) as files_this_month,
    (
      SELECT COUNT(*) 
      FROM snippets 
      WHERE snippets.user_id = get_user_analytics_summary.user_id 
        AND snippets.created_at >= DATE_TRUNC('month', CURRENT_DATE)
    ) as snippets_this_month;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_analytics_summary(UUID) TO authenticated;