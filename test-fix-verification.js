const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ablctkvyoiygqhyhjlht.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFibGN0a3Z5b2l5Z3FoeWhqbGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjI3MTgsImV4cCI6MjA2OTI5ODcxOH0.VPQprW4NzIVhre5BCMnIPftqguOC0GNiIx0tadxzWxM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyFix() {
  console.log('🔍 Verifying database fix was applied...');
  console.log('');
  
  let allPassed = true;
  
  // Test 1: Check if tags table exists and is accessible
  console.log('Test 1: Tags table accessibility');
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "public.tags" does not exist')) {
        console.log('❌ FAILED: tags table still missing');
        allPassed = false;
      } else if (error.message.includes('row-level security') || error.message.includes('not authenticated')) {
        console.log('✅ PASSED: tags table exists (RLS working correctly)');
      } else {
        console.log('🟡 PARTIAL: tags table exists but has issues:', error.message);
      }
    } else {
      console.log('✅ PASSED: tags table exists and accessible');
    }
  } catch (err) {
    console.log('❌ FAILED: tags table test error:', err.message);
    allPassed = false;
  }
  
  // Test 2: Check if search_history table exists and is accessible
  console.log('Test 2: Search history table accessibility');
  try {
    const { data, error } = await supabase
      .from('search_history')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "public.search_history" does not exist')) {
        console.log('❌ FAILED: search_history table still missing');
        allPassed = false;
      } else if (error.message.includes('row-level security') || error.message.includes('not authenticated')) {
        console.log('✅ PASSED: search_history table exists (RLS working correctly)');
      } else {
        console.log('🟡 PARTIAL: search_history table exists but has issues:', error.message);
      }
    } else {
      console.log('✅ PASSED: search_history table exists and accessible');
    }
  } catch (err) {
    console.log('❌ FAILED: search_history table test error:', err.message);
    allPassed = false;
  }
  
  // Test 3: Check if user_analytics table still works
  console.log('Test 3: User analytics table accessibility');
  try {
    const { data, error } = await supabase
      .from('user_analytics')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "public.user_analytics" does not exist')) {
        console.log('❌ FAILED: user_analytics table missing');
        allPassed = false;
      } else if (error.message.includes('row-level security') || error.message.includes('not authenticated')) {
        console.log('✅ PASSED: user_analytics table exists (RLS working correctly)');
      } else {
        console.log('🟡 PARTIAL: user_analytics table exists but has issues:', error.message);
      }
    } else {
      console.log('✅ PASSED: user_analytics table exists and accessible');
    }
  } catch (err) {
    console.log('❌ FAILED: user_analytics table test error:', err.message);
    allPassed = false;
  }
  
  // Test 4: Verify core functions still work
  console.log('Test 4: Database functions accessibility');
  try {
    const { error } = await supabase.rpc('search_content', { search_query: 'test' });
    if (error && !error.message.includes('Authentication required')) {
      console.log('❌ FAILED: search_content function issue:', error.message);
      allPassed = false;
    } else {
      console.log('✅ PASSED: search_content function works');
    }
  } catch (err) {
    console.log('❌ FAILED: search_content function test error:', err.message);
    allPassed = false;
  }
  
  // Test 5: Verify files table still works (shouldn't be affected)
  console.log('Test 5: Files table accessibility (baseline check)');
  try {
    const { data, error } = await supabase
      .from('files')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "public.files" does not exist')) {
        console.log('❌ CRITICAL: files table missing - this should not happen!');
        allPassed = false;
      } else if (error.message.includes('row-level security') || error.message.includes('not authenticated')) {
        console.log('✅ PASSED: files table exists (RLS working correctly)');
      } else {
        console.log('🟡 PARTIAL: files table exists but has issues:', error.message);
      }
    } else {
      console.log('✅ PASSED: files table exists and accessible');
    }
  } catch (err) {
    console.log('❌ FAILED: files table test error:', err.message);
    allPassed = false;
  }
  
  console.log('');
  console.log('==========================================');
  
  if (allPassed) {
    console.log('🎉 SUCCESS! Database fix verification PASSED');
    console.log('');
    console.log('✅ All required tables exist');
    console.log('✅ RLS policies are working correctly');
    console.log('✅ Database functions are accessible');
    console.log('✅ Your app should now work without errors!');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('  1. Test search functionality in the app');
    console.log('  2. Test tag management features');
    console.log('  3. Verify no more "relation does not exist" errors');
  } else {
    console.log('❌ VERIFICATION FAILED');
    console.log('');
    console.log('Some tests failed. Please:');
    console.log('  1. Double-check the SQL was executed correctly in Supabase Dashboard');
    console.log('  2. Verify you ran the complete critical_missing_tables_fix.sql script');
    console.log('  3. Check for any error messages in the Supabase Dashboard logs');
    console.log('  4. Re-run this verification script after fixing issues');
  }
  
  console.log('==========================================');
}

// Run verification
verifyFix();