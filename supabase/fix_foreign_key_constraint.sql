-- Fix foreign key constraint issues
-- Run this in Supabase SQL Editor

-- First, let's check what foreign key constraints exist
-- You can run this to see current constraints:
-- SELECT constraint_name, table_name, column_name 
-- FROM information_schema.key_column_usage 
-- WHERE table_name IN ('files', 'snippets') AND table_schema = 'public';

-- Drop existing foreign key constraints if they're causing issues
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_user_id_fkey;
ALTER TABLE snippets DROP CONSTRAINT IF EXISTS snippets_user_id_fkey;
ALTER TABLE snippets DROP CONSTRAINT IF EXISTS snippets_file_id_fkey;

-- Recreate the constraints with proper handling
-- Files table user_id constraint
ALTER TABLE files 
ADD CONSTRAINT files_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Snippets table constraints
ALTER TABLE snippets 
ADD CONSTRAINT snippets_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE snippets 
ADD CONSTRAINT snippets_file_id_fkey 
FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE;

-- Create a function to safely create files with proper user validation
CREATE OR REPLACE FUNCTION public.create_file_safe(
  p_title TEXT,
  p_description TEXT DEFAULT '',
  p_language TEXT DEFAULT '',
  p_tags TEXT[] DEFAULT '{}'
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
    p_title,
    p_description,
    p_language,
    p_tags,
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

-- Create a function to safely create snippets
CREATE OR REPLACE FUNCTION public.create_snippet_safe(
  p_file_id UUID,
  p_screenshot_url TEXT DEFAULT NULL,
  p_extracted_text TEXT,
  p_ocr_confidence REAL DEFAULT NULL,
  p_language TEXT DEFAULT NULL,
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
    p_position_in_file,
    p_is_favorite,
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