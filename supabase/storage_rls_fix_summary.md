# Storage RLS Fix Summary for Save Code App

## Problem Analysis

The Save Code app is experiencing RLS (Row Level Security) policy violations when uploading screenshots to Supabase storage. The specific error is: "new row violates row-level security policy".

### Key Findings:

1. **Bucket Configuration**: The app uses a storage bucket named `screenshots`
2. **Upload Path Format**: Files are uploaded with path format: `{userId}/{filename}`
   - Example: `fd090d7c-dfee-4e1e-b0b2-cf0bce7100d5/screenshot-1234567890.jpg`
3. **Current RLS Issue**: The existing RLS policies use `storage.foldername(name)` which may not correctly extract the user ID from the path

## Root Cause

The RLS policies in the original schema use:
```sql
auth.uid()::text = (storage.foldername(name))[1]
```

However, `storage.foldername()` returns an array of folder components, and the indexing might not work as expected for the path format being used.

## Recommended Fix

I've created `fix_storage_rls_policies.sql` which:

1. **Drops existing policies** to ensure clean slate
2. **Creates new policies** with better path matching:
   - Uses `string_to_array(name, '/')` for more reliable path parsing
   - Adds regex matching as a fallback: `name ~ ('^' || auth.uid()::text || '/[^/]+$')`
   - Ensures auth.uid() is not null

3. **Includes diagnostic function** `debug_storage_upload()` to help troubleshoot issues

## Implementation Steps

1. **Run the fix script** in Supabase SQL Editor:
   ```sql
   -- Run the entire fix_storage_rls_policies.sql file
   ```

2. **Verify bucket exists**:
   ```sql
   SELECT * FROM storage.buckets WHERE name = 'screenshots';
   ```

3. **Test with the debug function**:
   ```sql
   SELECT * FROM debug_storage_upload(
     'fd090d7c-dfee-4e1e-b0b2-cf0bce7100d5'::uuid, 
     'fd090d7c-dfee-4e1e-b0b2-cf0bce7100d5/screenshot-123.jpg'
   );
   ```

## Alternative Solution

If the main fix doesn't work, the script includes simpler policies (commented out) that:
- Allow any authenticated user to manage screenshots in the bucket
- Don't verify the path structure
- Less secure but can help identify if the issue is with path matching

## Other Potential Issues Found

1. **File Creation**: Using bulletproof functions (`create_file_bulletproof`, `create_snippet_safe`) which work correctly
2. **User ID Consistency**: The code verifies authenticated user ID matches the provided user ID
3. **Error Handling**: Good error handling with fallback strategies

## Testing Checklist

After applying the fix:
- [ ] Verify user can upload screenshots
- [ ] Verify user can view their uploaded screenshots
- [ ] Verify user cannot access other users' screenshots
- [ ] Test with different file formats (jpg, png, webp)
- [ ] Check file size limits (5MB configured)