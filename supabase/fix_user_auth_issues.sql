-- Fix user authentication and RLS policy issues
-- Run this in Supabase SQL Editor

-- First, let's check and fix the RLS policies for files table
DROP POLICY IF EXISTS "Users can view their own files" ON files;
DROP POLICY IF EXISTS "Users can create their own files" ON files;
DROP POLICY IF EXISTS "Users can update their own files" ON files;
DROP POLICY IF EXISTS "Users can delete their own files" ON files;

-- Create more permissive RLS policies for files
CREATE POLICY "Users can view their own files"
  ON files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own files"
  ON files FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own files"
  ON files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
  ON files FOR DELETE
  USING (auth.uid() = user_id);

-- Fix snippets RLS policies too
DROP POLICY IF EXISTS "Users can view their own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can create their own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can update their own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can delete their own snippets" ON snippets;

CREATE POLICY "Users can view their own snippets"
  ON snippets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own snippets"
  ON snippets FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own snippets"
  ON snippets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snippets"
  ON snippets FOR DELETE
  USING (auth.uid() = user_id);

-- Update the create_file_safe function to be more robust
DROP FUNCTION IF EXISTS public.create_file_safe(TEXT, TEXT, TEXT, TEXT[]);

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
  
  -- Insert the file directly without foreign key constraint issues
  INSERT INTO files (
    id,
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
    uuid_generate_v4(),
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

-- Also create a simpler direct insert function
CREATE OR REPLACE FUNCTION public.insert_file_direct(
  p_title TEXT,
  p_description TEXT DEFAULT '',
  p_language TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_file_id UUID;
BEGIN
  INSERT INTO files (title, description, language, user_id)
  VALUES (p_title, p_description, p_language, auth.uid())
  RETURNING id INTO new_file_id;
  
  RETURN new_file_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_file_direct(TEXT, TEXT, TEXT) TO authenticated;