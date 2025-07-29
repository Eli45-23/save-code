# Storage RLS Solutions for Save Code App

## Problem Summary
- User cannot modify `storage.objects` RLS policies due to permissions
- Current upload path `${userId}/${fileName}` triggers RLS policy violation
- Screenshot uploads fail with "new row violates row-level security policy"

## Root Cause
The RLS policies in schema.sql use `storage.foldername(name)[1]` to extract user ID from path, which doesn't work reliably with the `${userId}/${fileName}` format.

## Alternative Solutions (No Admin Access Required)

### Solution 1: Simple Upload Path ⭐ RECOMMENDED
**Pros:**
- Quick fix, minimal code changes
- Maintains security through authentication checks
- No database storage overhead

**Cons:**
- File names could conflict between users
- Slightly less organized storage

**Implementation:**
- Change upload path from `${userId}/${fileName}` to just `fileName`
- Add timestamp prefix to prevent conflicts: `${timestamp}-${fileName}`
- Update RLS policies to allow authenticated users to upload to root

### Solution 2: Make Bucket Public ⚠️ SECURITY RISK
**Pros:**
- Immediate fix, no code changes needed
- Simple to implement

**Cons:**
- Anyone with URLs can access screenshots
- Security risk for sensitive code screenshots
- Not recommended for production

**Implementation:**
- Set bucket public flag to true in Supabase dashboard
- Remove RLS policies entirely

### Solution 3: Store as Base64 in Database 📦 ALTERNATIVE
**Pros:**
- No storage RLS issues
- Guaranteed to work
- Simpler permission model

**Cons:**
- Database bloat for large images
- Slower queries with image data
- Base64 encoding overhead (~33% larger)

**Implementation:**
- Modify snippets table to include base64_image column
- Convert images to base64 before saving
- Remove storage upload entirely

### Solution 4: Skip Image Storage 🚫 TEMPORARY
**Pros:**
- Immediate fix
- Core functionality works
- Can add images later

**Cons:**
- Loses valuable screenshot feature
- User experience degradation
- Only temporary solution

**Implementation:**
- Modify SaveCodeService to skip screenshot upload
- Set screenshot_url to null in all saves
- Add TODO for future image implementation

## Recommended Approach: Solution 1

This solution provides the best balance of:
- Security (authenticated users only)
- Performance (no database bloat)
- User experience (images still work)
- Implementation simplicity

## Next Steps
1. Choose solution approach
2. Implement the changes
3. Test screenshot upload
4. Verify full workflow works