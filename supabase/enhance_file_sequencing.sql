-- =======================================
-- 🔢 File Sequencing and Dating Enhancement
-- =======================================
-- Enhanced database schema for file sequencing and dating

-- Add sequence column to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS sequence_number INTEGER;

-- Create index for sequence ordering
CREATE INDEX IF NOT EXISTS idx_files_sequence ON files(user_id, sequence_number);

-- Function to get next sequence number for a user
CREATE OR REPLACE FUNCTION get_next_sequence_number(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  next_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(sequence_number), 0) + 1 
  INTO next_seq 
  FROM files 
  WHERE user_id = user_uuid;
  
  RETURN next_seq;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign sequence numbers to existing files
CREATE OR REPLACE FUNCTION assign_existing_sequences()
RETURNS VOID AS $$
DECLARE
  file_record RECORD;
  seq_num INTEGER;
BEGIN
  -- For each user, assign sequences based on created_at order
  FOR file_record IN 
    SELECT DISTINCT user_id FROM files WHERE sequence_number IS NULL
  LOOP
    seq_num := 1;
    
    -- Update files for this user in created_at order
    UPDATE files SET sequence_number = seq_num + row_number
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 as row_number
      FROM files 
      WHERE user_id = file_record.user_id 
      AND sequence_number IS NULL
    ) AS numbered_files
    WHERE files.id = numbered_files.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Enhanced trigger function for auto-sequence assignment
CREATE OR REPLACE FUNCTION auto_assign_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign sequence if not provided
  IF NEW.sequence_number IS NULL THEN
    NEW.sequence_number := get_next_sequence_number(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-sequence assignment
DROP TRIGGER IF EXISTS trigger_auto_assign_sequence ON files;
CREATE TRIGGER trigger_auto_assign_sequence
  BEFORE INSERT ON files
  FOR EACH ROW EXECUTE FUNCTION auto_assign_sequence();

-- Enhanced file timestamp update function
CREATE OR REPLACE FUNCTION update_file_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update file timestamps and last_accessed_at
  IF TG_OP = 'INSERT' THEN
    UPDATE files SET 
      snippet_count = snippet_count + 1,
      updated_at = NOW(),
      last_accessed_at = NOW()
    WHERE id = NEW.file_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE files SET 
      updated_at = NOW(),
      last_accessed_at = NOW()
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

-- Update existing triggers
DROP TRIGGER IF EXISTS trigger_update_snippet_count ON snippets;
DROP TRIGGER IF EXISTS trigger_update_file_timestamp ON snippets;

CREATE TRIGGER trigger_update_file_metadata
  AFTER INSERT OR UPDATE OR DELETE ON snippets
  FOR EACH ROW EXECUTE FUNCTION update_file_metadata();

-- Function to reorder file sequences
CREATE OR REPLACE FUNCTION reorder_file_sequence(
  file_uuid UUID,
  new_sequence INTEGER,
  user_uuid UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
DECLARE
  old_sequence INTEGER;
  max_sequence INTEGER;
BEGIN
  -- Get current sequence and max sequence
  SELECT sequence_number INTO old_sequence 
  FROM files 
  WHERE id = file_uuid AND user_id = user_uuid;
  
  SELECT COALESCE(MAX(sequence_number), 0) INTO max_sequence
  FROM files 
  WHERE user_id = user_uuid;
  
  -- Validate new sequence
  IF new_sequence < 1 OR new_sequence > max_sequence THEN
    RAISE EXCEPTION 'Invalid sequence number. Must be between 1 and %', max_sequence;
  END IF;
  
  -- If moving up in sequence (decreasing number)
  IF new_sequence < old_sequence THEN
    UPDATE files SET 
      sequence_number = sequence_number + 1,
      updated_at = NOW()
    WHERE user_id = user_uuid 
    AND sequence_number >= new_sequence 
    AND sequence_number < old_sequence;
  
  -- If moving down in sequence (increasing number)  
  ELSIF new_sequence > old_sequence THEN
    UPDATE files SET 
      sequence_number = sequence_number - 1,
      updated_at = NOW()
    WHERE user_id = user_uuid 
    AND sequence_number > old_sequence 
    AND sequence_number <= new_sequence;
  END IF;
  
  -- Update the target file
  UPDATE files SET 
    sequence_number = new_sequence,
    updated_at = NOW()
  WHERE id = file_uuid AND user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get files with enhanced ordering
CREATE OR REPLACE FUNCTION get_user_files_ordered(
  user_uuid UUID DEFAULT auth.uid(),
  order_by TEXT DEFAULT 'sequence',
  order_direction TEXT DEFAULT 'ASC'
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  language TEXT,
  tags TEXT[],
  snippet_count INTEGER,
  sequence_number INTEGER,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  CASE order_by
    WHEN 'sequence' THEN
      IF order_direction = 'DESC' THEN
        RETURN QUERY
        SELECT f.* FROM files f
        WHERE f.user_id = user_uuid
        ORDER BY f.sequence_number DESC NULLS LAST, f.created_at DESC;
      ELSE
        RETURN QUERY
        SELECT f.* FROM files f
        WHERE f.user_id = user_uuid
        ORDER BY f.sequence_number ASC NULLS LAST, f.created_at ASC;
      END IF;
    
    WHEN 'updated' THEN
      RETURN QUERY
      SELECT f.* FROM files f
      WHERE f.user_id = user_uuid
      ORDER BY f.updated_at DESC, f.sequence_number ASC NULLS LAST;
    
    WHEN 'created' THEN
      RETURN QUERY
      SELECT f.* FROM files f
      WHERE f.user_id = user_uuid
      ORDER BY f.created_at DESC, f.sequence_number ASC NULLS LAST;
    
    WHEN 'accessed' THEN
      RETURN QUERY
      SELECT f.* FROM files f
      WHERE f.user_id = user_uuid
      ORDER BY f.last_accessed_at DESC NULLS LAST, f.sequence_number ASC NULLS LAST;
    
    ELSE
      -- Default to sequence order
      RETURN QUERY
      SELECT f.* FROM files f
      WHERE f.user_id = user_uuid
      ORDER BY f.sequence_number ASC NULLS LAST, f.created_at ASC;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the assignment for existing files
SELECT assign_existing_sequences();

-- Update constraints
ALTER TABLE files ADD CONSTRAINT unique_user_sequence 
  UNIQUE (user_id, sequence_number) DEFERRABLE INITIALLY DEFERRED;