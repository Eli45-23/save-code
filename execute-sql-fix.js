const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://ablctkvyoiygqhyhjlht.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFibGN0a3Z5b2l5Z3FoeWhqbGh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcyMjcxOCwiZXhwIjoyMDY5Mjk4NzE4fQ.M8z6GnLKp9fqEy4wBzqRLVdoB2J0xRfkdAUKqBJ3HZo'; // Service role key needed for DDL operations

// Create client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFix() {
  try {
    console.log('🚀 Starting database fix execution...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync(path.join(__dirname, 'supabase', 'ultra_comprehensive_fix.sql'), 'utf8');
    
    console.log('📄 SQL file loaded, executing...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative approach - execute parts individually
      console.log('🔄 Trying alternative execution method...');
      
      // Split SQL into individual statements and execute them
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.includes('DO $$') || stmt.includes('CREATE') || stmt.includes('ALTER')) {
          console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
          
          try {
            const { error: stmtError } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
            if (stmtError) {
              console.warn(`⚠️ Statement ${i + 1} failed:`, stmtError.message);
            } else {
              console.log(`✅ Statement ${i + 1} succeeded`);
            }
          } catch (stmtErr) {
            console.warn(`⚠️ Statement ${i + 1} exception:`, stmtErr.message);
          }
        }
      }
    } else {
      console.log('✅ SQL executed successfully:', data);
    }
    
    // Verify the tables exist
    console.log('🔍 Verifying tables exist...');
    
    const tables = ['profiles', 'files', 'snippets', 'tags', 'search_history', 'user_analytics'];
    
    for (const tableName of tables) {
      const { data: tableData, error: tableError } = await supabase
        .from(tableName)
        .select('count')
        .limit(1);
      
      if (tableError) {
        console.error(`❌ Table ${tableName} check failed:`, tableError.message);
      } else {
        console.log(`✅ Table ${tableName} exists and is accessible`);
      }
    }
    
    console.log('🎉 Database fix execution completed!');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the fix
executeSQLFix();