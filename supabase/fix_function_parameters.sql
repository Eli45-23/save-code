-- Fix database function parameter syntax
-- Run this in Supabase SQL Editor

-- Drop the problematic functions first
DROP FUNCTION IF EXISTS public.create_file_safe(TEXT, TEXT, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS public.create_snippet_safe(UUID, TEXT, TEXT, REAL, TEXT, INTEGER, BOOLEAN);

-- Create corrected create_file_safe function
CREATE OR REPLACE FUNCTION public.create_file_safe(
  p_title TEXT,
  p_description TEXT,
  p_language TEXT,
  p_tags TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_file_id UUID;
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- Check if user exists
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Insert the file
  INSERT INTO files (
    user_id,
    title,
    description,
    language,
    tags,
    snippet_count,
    last_accessed_at,
    created_at,
    updated_at
  ) VALUES (
    current_user_id,
    COALESCE(p_title, 'Untitled'),
    COALESCE(p_description, ''),
    COALESCE(p_language, ''),
    COALESCE(p_tags, '{}'),
    0,
    NOW(),
    NOW(),
    NOW()
  ) RETURNING id INTO new_file_id;
  
  RETURN new_file_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_file_safe(TEXT, TEXT, TEXT, TEXT[]) TO authenticated;

-- Create corrected create_snippet_safe function  
CREATE OR REPLACE FUNCTION public.create_snippet_safe(
  p_file_id UUID,
  p_extracted_text TEXT,
  p_screenshot_url TEXT,
  p_ocr_confidence REAL,
  p_language TEXT,
  p_position_in_file INTEGER,
  p_is_favorite BOOLEAN
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_snippet_id UUID;
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- Check if user exists
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if file exists and belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM files 
    WHERE id = p_file_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'File not found or access denied';
  END IF;
  
  -- Insert the snippet
  INSERT INTO snippets (
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
    p_file_id,
    current_user_id,
    p_screenshot_url,
    p_extracted_text,
    p_ocr_confidence,
    p_language,
    COALESCE(p_position_in_file, 0),
    COALESCE(p_is_favorite, FALSE),
    NOW()
  ) RETURNING id INTO new_snippet_id;
  
  -- Update file snippet count
  UPDATE files 
  SET snippet_count = snippet_count + 1,
      updated_at = NOW()
  WHERE id = p_file_id;
  
  RETURN new_snippet_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_snippet_safe(UUID, TEXT, TEXT, REAL, TEXT, INTEGER, BOOLEAN) TO authenticated;

-- Also create simpler versions with fewer parameters for easier calling
CREATE OR REPLACE FUNCTION public.create_file_simple(
  p_title TEXT,
  p_language TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.create_file_safe(
    p_title,
    COALESCE(p_language, '') || ' code',
    COALESCE(p_language, ''),
    ARRAY[COALESCE(p_language, '')]::TEXT[]
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_file_simple(TEXT, TEXT) TO authenticated;