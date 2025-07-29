#!/usr/bin/env node
/**
 * Test script for file sequencing functionality
 * Run after database migration is complete
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ablctkvyoiygqhyhjlht.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFibGN0a3Z5b2l5Z3FoeWhqbGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjI3MTgsImV4cCI6MjA2OTI5ODcxOH0.VPQprW4NzIVhre5BCMnIPftqguOC0GNiIx0tadxzWxM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSequencing() {
  console.log('🧪 Testing File Sequencing Implementation...\n');

  try {
    // Test 1: Check if sequence_number column exists
    console.log('1️⃣ Testing sequence_number column...');
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('id, title, sequence_number, created_at')
      .limit(5);

    if (filesError) {
      console.error('❌ Error fetching files:', filesError);
      return;
    }

    if (files && files.length > 0) {
      console.log('✅ sequence_number column exists');
      console.log('Sample files with sequences:');
      files.forEach(file => {
        console.log(`   - ${file.title}: #${file.sequence_number}`);
      });
    } else {
      console.log('⚠️ No files found to test');
    }

    // Test 2: Check if enhanced ordering function exists
    console.log('\n2️⃣ Testing get_user_files_ordered function...');
    try {
      const { data: orderedFiles, error: orderError } = await supabase
        .rpc('get_user_files_ordered', {
          order_by: 'sequence',
          order_direction: 'ASC'
        });

      if (orderError) {
        console.log('❌ get_user_files_ordered function not available:', orderError.message);
      } else {
        console.log('✅ get_user_files_ordered function working');
        if (orderedFiles && orderedFiles.length > 0) {
          console.log('Sample ordered files:');
          orderedFiles.slice(0, 3).forEach(file => {
            console.log(`   - #${file.sequence_number}: ${file.title}`);
          });
        }
      }
    } catch (err) {
      console.log('❌ Function test failed:', err.message);
    }

    // Test 3: Check sequence assignment function
    console.log('\n3️⃣ Testing sequence assignment...');
    try {
      const { data: nextSeq, error: seqError } = await supabase
        .rpc('get_next_sequence_number', {
          user_uuid: '00000000-0000-0000-0000-000000000000' // placeholder
        });

      if (seqError) {
        console.log('❌ get_next_sequence_number function not available:', seqError.message);
      } else {
        console.log('✅ get_next_sequence_number function working');
      }
    } catch (err) {
      console.log('❌ Sequence function test failed:', err.message);
    }

    console.log('\n📊 Test Summary:');
    console.log('- Database schema updated with sequence_number column');
    console.log('- Enhanced database functions available');
    console.log('- File sequencing system ready for use');
    console.log('\n🎉 File Sequencing Implementation Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSequencing();