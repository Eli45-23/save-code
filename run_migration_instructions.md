# File Sequencing Migration Instructions

## ⚠️ IMPORTANT: Run this SQL in Supabase SQL Editor

The migration file `supabase/enhance_file_sequencing.sql` needs to be executed in the Supabase Dashboard SQL Editor:

1. Go to https://supabase.com/dashboard/project/ablctkvyoiygqhyhjlht/sql
2. Copy and paste the contents of `supabase/enhance_file_sequencing.sql`
3. Click "Run" to execute the migration

## What this migration does:

1. **Adds sequence_number column** to files table
2. **Creates indexes** for performance optimization
3. **Adds database functions** for sequence management:
   - `get_next_sequence_number()` - Auto-increment sequences
   - `assign_existing_sequences()` - Backfill existing files
   - `reorder_file_sequence()` - Allow manual reordering
   - `get_user_files_ordered()` - Enhanced file queries
4. **Creates triggers** for automatic sequence assignment
5. **Assigns sequences** to existing files based on creation date

## Verification

After running the migration, verify it worked by checking:

```sql
-- Check if sequence_number column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'files' AND column_name = 'sequence_number';

-- Check if functions were created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'get_next_sequence_number',
  'assign_existing_sequences', 
  'reorder_file_sequence',
  'get_user_files_ordered'
);

-- Check sample data
SELECT id, title, sequence_number, created_at 
FROM files 
ORDER BY user_id, sequence_number 
LIMIT 10;
```

## Next Steps

Once the migration is complete:
1. The app will automatically use the new sequencing system
2. Files will show sequence numbers in the UI
3. Users can sort by different criteria
4. Enhanced date formatting will be visible