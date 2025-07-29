# 🔧 Database Fix Testing and Debugging Guide

## 🚀 Implementation Steps

### Step 1: Apply Database Migration
1. **Run the comprehensive database fix:**
   ```sql
   -- In Supabase SQL Editor, run:
   -- /Users/eli/save-code/supabase/comprehensive_database_fix.sql
   ```

2. **Verify database functions were created:**
   ```sql
   -- Check that these functions exist:
   SELECT routine_name, routine_type 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name IN (
     'create_file_safe', 
     'create_snippet_safe', 
     'insert_file_direct',
     'get_or_create_profile'
   );
   ```

### Step 2: Test Database Functions Manually

#### Test User Profile Creation
```sql
-- Test profile auto-creation (replace with real user ID)
SELECT public.get_or_create_profile('your-user-id-here');
```

#### Test File Creation
```sql
-- Test safe file creation
SELECT public.create_file_safe(
  'Test File', 
  'Test Description', 
  'javascript', 
  ARRAY['test', 'javascript']
);

-- Test direct file creation fallback
SELECT public.insert_file_direct('Fallback Test', 'Description', 'python');
```

#### Test Snippet Creation
```sql
-- First create a test file, then test snippet creation
SELECT public.create_snippet_safe(
  'your-file-id-here',
  'console.log("test");',
  NULL,
  95.5,
  'javascript',
  0,
  false
);
```

### Step 3: Test React Native App Integration

#### 3.1 Clear App Data and Re-authenticate
```typescript
// Add this temporary debugging code to your app
const debugUserInfo = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('🔍 Current user:', user?.id);
  console.log('🔍 User email:', user?.email);
  console.log('🔍 Auth error:', error);
  
  // Test profile creation
  try {
    const { data, error: profileError } = await supabase
      .rpc('get_or_create_profile', { user_uuid: user?.id });
    console.log('🔍 Profile data:', data);
    console.log('🔍 Profile error:', profileError);
  } catch (e) {
    console.log('🔍 Profile exception:', e);
  }
};

// Call this in your main app component
debugUserInfo();
```

#### 3.2 Test File Creation with Enhanced Logging
```typescript
// Add this test function to SaveCodeService
static async testFileCreation(): Promise<void> {
  try {
    console.log('🧪 Testing file creation...');
    
    const mockClassification: ClassificationResult = {
      language: { language: 'javascript', confidence: 0.9, allScores: {} },
      topic: { 
        primaryTopic: 'test', 
        confidence: 0.8, 
        allTopics: {}, 
        suggestedTags: ['test'], 
        frameworks: [] 
      },
      similarFiles: [],
      suggestedName: 'Test File',
      shouldAppendToExisting: false
    };

    const result = await this.createNewFile(
      'test-user-id', // This will be overridden by authenticated user
      'Test File Creation',
      mockClassification,
      ['test', 'debug']
    );
    
    console.log('🧪 File creation test successful:', result);
  } catch (error) {
    console.error('🧪 File creation test failed:', error);
  }
}
```

## 🐛 Common Issues and Solutions

### Issue 1: "User not authenticated"
**Symptoms:** Functions fail with authentication errors
**Solution:**
```typescript
// Check auth status in your app
const checkAuth = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('Session:', session?.user?.id);
  console.log('Auth error:', error);
  
  if (!session) {
    // Force re-authentication
    await supabase.auth.signOut();
    // Redirect to login
  }
};
```

### Issue 2: "Foreign key constraint still fails"
**Symptoms:** User exists but foreign key fails
**Debugging:**
```sql
-- Check if user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE id = 'your-user-id-here';

-- Check if user has profile
SELECT * FROM profiles WHERE id = 'your-user-id-here';

-- Force create profile if missing
SELECT public.get_or_create_profile('your-user-id-here');
```

### Issue 3: "RLS policy violation"
**Symptoms:** Insert fails with policy violation
**Solution:**
```sql
-- Check current auth context
SELECT auth.uid();

-- Test RLS policies
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "your-user-id-here"}';

-- Try insert with test data
INSERT INTO files (title, description, user_id) 
VALUES ('Test', 'Test', 'your-user-id-here');
```

### Issue 4: Functions don't exist
**Symptoms:** "function public.create_file_safe does not exist"
**Solution:**
```sql
-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_file_safe(TEXT, TEXT, TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_snippet_safe(UUID, TEXT, TEXT, REAL, TEXT, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_file_direct(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_profile(UUID) TO authenticated;
```

## 🧪 Comprehensive Testing Checklist

### Pre-Deployment Testing
- [ ] Database migration runs without errors
- [ ] All functions are created and granted permissions
- [ ] RLS policies are properly configured
- [ ] Test user can authenticate successfully

### Functional Testing
- [ ] New user registration creates profile automatically
- [ ] Existing user can create files successfully
- [ ] File creation works with all three strategies
- [ ] Snippet creation works with enhanced error handling
- [ ] Tag creation and updates work correctly
- [ ] Search functionality works correctly

### Error Handling Testing
- [ ] Graceful handling of authentication failures
- [ ] Proper fallback when primary functions fail
- [ ] User-friendly error messages displayed
- [ ] App doesn't crash on database errors
- [ ] Logging provides adequate debugging information

### Edge Case Testing
- [ ] User with no profile can still create files
- [ ] Network interruption during save operation
- [ ] Concurrent file creation by same user
- [ ] Very long file titles and descriptions
- [ ] Special characters in content

## 🔍 Debugging SQL Queries

### Check Database State
```sql
-- View all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check functions
SELECT routine_name, routine_type, security_type
FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Check user data
SELECT 
  (SELECT COUNT(*) FROM profiles) as profiles_count,
  (SELECT COUNT(*) FROM files) as files_count,
  (SELECT COUNT(*) FROM snippets) as snippets_count,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count;
```

### Monitor Real-time Operations
```sql
-- Enable query logging to monitor what's happening
SET log_statement = 'all';
SET log_min_duration_statement = 0;

-- Check for foreign key violations
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint 
WHERE contype = 'f' 
AND connamespace = 'public'::regnamespace;
```

## 📱 React Native App Debugging

### Enhanced Logging Setup
```typescript
// Add to your main App.tsx or root component
import { supabase } from './src/lib/supabase';

// Enable Supabase debug logging
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔐 Auth state changed:', event);
  console.log('🔐 Session user:', session?.user?.id);
  console.log('🔐 Session expires:', session?.expires_at);
});

// Global error handler
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('supabase') || args[0]?.includes?.('database')) {
    console.log('🚨 DATABASE ERROR DETECTED:', args);
  }
  originalConsoleError.apply(console, args);
};
```

### Test Sequence for Production
1. **Fresh Install Test:**
   - Uninstall and reinstall app
   - Create new account
   - Try to save first code snippet

2. **Existing User Test:**
   - Sign in with existing account
   - Try to save code snippet
   - Verify all old data is accessible

3. **Edge Case Test:**
   - Sign out and back in
   - Clear app cache
   - Test with poor network connection

## 🎯 Success Metrics

The fix is successful when:
- ✅ New users can register and immediately save code
- ✅ Existing users can save code without foreign key errors
- ✅ RLS policy violations are eliminated
- ✅ Error messages are user-friendly and actionable
- ✅ All fallback mechanisms work correctly
- ✅ Performance is not significantly degraded

## 🚨 Rollback Plan

If issues persist, rollback strategy:
1. **Revert RLS policies to original state**
2. **Remove new functions if they cause issues**
3. **Restore original SaveCodeService.ts**
4. **Implement gradual rollout with feature flags**

---

**Remember:** Always test these changes on a staging/development Supabase project first before applying to production!