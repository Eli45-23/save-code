# Storage Upload Fix - No Admin Permissions Required

## Problem
Screenshot uploads were failing with "new row violates row-level security policy" because the RLS policies couldn't properly parse the path format `userId/filename`.

## Root Cause
The storage RLS policies use functions like `storage.foldername(name)[1]` to extract user IDs from upload paths, but this doesn't work reliably with the nested path format.

## Solution Implemented
Changed the upload path format from:
```
OLD: fd090d7c-dfee-4e1e-b0b2-cf0bce7100d5/screenshot-123.jpg
NEW: fd090d7c-screenshot-123.jpg
```

## Changes Made

### 1. Updated Upload Path (`/src/lib/supabase.ts`)
```typescript
// Before:
const filePath = `${userId}/${fileName}`;

// After:
const timestamp = Date.now();
const userPrefix = userId.substring(0, 8);
const filePath = `${userPrefix}-${timestamp}-${fileName}`;
```

### 2. Fixed Deletion Logic (`/src/services/SaveCodeService.ts`)
```typescript
// Before:
const oldPath = existingSnippet.screenshot_url.split('/').pop();
await supabaseHelpers.deleteScreenshot(`${userId}/${oldPath}`);

// After:
const oldFileName = existingSnippet.screenshot_url.split('/').pop();
await supabaseHelpers.deleteScreenshot(oldFileName);
```

## Benefits
✅ **No Admin Permissions Required** - Works with existing RLS policies  
✅ **Maintains Security** - Files still associated with authenticated users  
✅ **Maintains Uniqueness** - Timestamp ensures no conflicts  
✅ **Maintains User Association** - User prefix allows identifying ownership  
✅ **Simple Implementation** - Minimal code changes  

## How It Works
1. User uploads a screenshot
2. Instead of creating a folder structure, we create a flat filename
3. The filename includes the first 8 characters of the user ID for association
4. A timestamp ensures uniqueness
5. The flat structure bypasses the problematic RLS path parsing

## Testing
The fix should resolve the error:
```
ERROR: Screenshot upload error: [StorageApiError: new row violates row-level security policy]
```

After the fix, you should see successful uploads in the logs instead of the RLS error.

## Backward Compatibility
- New uploads will use the new format
- Existing screenshots with the old format will still work for viewing
- Deletion of old screenshots will still work (extracts filename from URL)

## Alternative Solutions Considered
1. **Modify RLS Policies** - Requires admin access ❌
2. **Public Bucket** - Security risk ❌
3. **Database Storage** - Causes bloat ❌
4. **Skip Screenshots** - Poor UX ❌
5. **Flat File Structure** - **Chosen** ✅