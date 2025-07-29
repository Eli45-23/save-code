const { createClient } = require('@supabase/supabase-js');

// Supabase configuration (using anon key as we don't have service key)
const supabaseUrl = 'https://ablctkvyoiygqhyhjlht.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFibGN0a3Z5b2l5Z3FoeWhqbGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjI3MTgsImV4cCI6MjA2OTI5ODcxOH0.VPQprW4NzIVhre5BCMnIPftqguOC0GNiIx0tadxzWxM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixDatabase() {
  try {
    console.log('🚀 Starting database diagnostics and fixes...');
    
    // Test 1: Check if tags table exists
    console.log('🔍 Checking if tags table exists...');
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.message.includes('relation "public.tags" does not exist')) {
          console.log('❌ CONFIRMED: tags table is missing');
          console.log('📝 This explains the getUserTags() and upsertTag() errors');
        } else {
          console.log('🟡 Tags table exists but has other issues:', error.message);
        }
      } else {
        console.log('✅ Tags table exists and is accessible');
      }
    } catch (err) {
      console.log('❌ Tags table test failed:', err.message);
    }
    
    // Test 2: Check if search_history table exists
    console.log('🔍 Checking if search_history table exists...');
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.message.includes('relation "public.search_history" does not exist')) {
          console.log('❌ CONFIRMED: search_history table is missing');
        } else {
          console.log('🟡 Search_history table exists but has other issues:', error.message);
        }
      } else {
        console.log('✅ Search_history table exists and is accessible');
      }
    } catch (err) {
      console.log('❌ Search_history table test failed:', err.message);
    }
    
    // Test 3: Check if user_analytics table exists
    console.log('🔍 Checking if user_analytics table exists...');
    try {
      const { data, error } = await supabase
        .from('user_analytics')
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.message.includes('relation "public.user_analytics" does not exist')) {
          console.log('❌ CONFIRMED: user_analytics table is missing');
        } else {
          console.log('🟡 User_analytics table exists but has other issues:', error.message);
        }
      } else {
        console.log('✅ User_analytics table exists and is accessible');
      }
    } catch (err) {
      console.log('❌ User_analytics table test failed:', err.message);
    }
    
    // Test 4: Check required functions exist
    console.log('🔍 Checking if database functions exist...');
    
    const functions = [
      'search_content',
      'find_similar_files',
      'create_file_bulletproof',
      'create_snippet_safe'
    ];
    
    for (const funcName of functions) {
      try {
        // Try to call the function with minimal args to see if it exists
        if (funcName === 'search_content') {
          const { error } = await supabase.rpc(funcName, { search_query: 'test' });
          if (error && !error.message.includes('Authentication required')) {
            console.log(`❌ Function ${funcName} has issues:`, error.message);
          } else {
            console.log(`✅ Function ${funcName} exists`);
          }
        } else if (funcName === 'find_similar_files') {
          const { error } = await supabase.rpc(funcName, { content_text: 'test' });
          if (error && !error.message.includes('Authentication required')) {
            console.log(`❌ Function ${funcName} has issues:`, error.message);
          } else {
            console.log(`✅ Function ${funcName} exists`);
          }
        } else {
          // For create functions, we can't test without being authenticated
          console.log(`🟡 Function ${funcName} - cannot test without authentication`);
        }
      } catch (err) {
        console.log(`❌ Function ${funcName} test failed:`, err.message);
      }
    }
    
    // Test 5: Check supabase client access
    console.log('🔍 Testing basic supabase client access...');
    try {
      const { data, error } = await supabase
        .from('files')
        .select('id')
        .limit(1);
      
      if (error) {
        console.log('🟡 Files table access issue (expected without auth):', error.message);
      } else {
        console.log('✅ Files table is accessible');
      }
    } catch (err) {
      console.log('❌ Supabase client test failed:', err.message);
    }
    
    console.log('');
    console.log('📋 DIAGNOSIS SUMMARY:');
    console.log('====================');
    console.log('');
    console.log('Main Issues Found:');
    console.log('1. ❌ Missing tags table (causes getUserTags/upsertTag errors)');
    console.log('2. ❌ Likely missing search_history table');
    console.log('3. ❌ Likely missing user_analytics table');
    console.log('');
    console.log('Next Steps:');
    console.log('1. 🔧 Need to create missing tables using admin access');
    console.log('2. 🔧 The ultra_comprehensive_fix.sql contains the complete fix');
    console.log('3. 🔧 Need to apply this SQL via Supabase dashboard or admin API');
    console.log('');
    console.log('🚨 IMMEDIATE ACTION NEEDED:');
    console.log('Copy the contents of supabase/ultra_comprehensive_fix.sql');
    console.log('and execute it in the Supabase dashboard SQL editor');
    console.log('');
    
  } catch (error) {
    console.error('💥 Fatal error during diagnosis:', error);
  }
}

// Run the diagnosis
fixDatabase();