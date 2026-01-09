const mysql = require('mysql2/promise');

async function truncateTablesWithDependencyOrder() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'caresync'
    });
    
    console.log('✅ Connected to caresync database');
    
    // Define table truncation order (child tables first, parent tables last)
    // Based on foreign key relationships from the schema analysis
    const truncationOrder = [
      // Tables with no foreign key dependencies to other tables (can be truncated first)
      'login_attempts',
      'email_verification_tokens',
      'password_reset_requests',
      'user_sessions',
      'refresh_tokens',
      
      // Tables that depend on appointments/billing
      'invoice_items',
      'reviews',
      'billing',
      
      // Tables that depend on patients/doctors
      'invoices',
      'medical_reports',
      'diabetes_predictions',
      'report_access_logs',
      'queue_status',
      'appointments',
      
      // Tables that depend on users
      'patients',
      'doctors',
      
      // Base table (no dependencies)
      'users'
    ];
    
    console.log('\n📋 Planned truncation order (based on foreign key dependencies):');
    truncationOrder.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });
    
    // Check which tables actually exist
    const [existingTables] = await connection.execute('SHOW TABLES');
    const existingTableNames = existingTables.map(table => Object.values(table)[0]);
    
    console.log(`\n🔍 Found ${existingTableNames.length} tables in database:`);
    existingTableNames.forEach(table => console.log(`  - ${table}`));
    
    // Filter truncation order to only include existing tables
    const tablesToTruncate = truncationOrder.filter(table => existingTableNames.includes(table));
    
    // Add any existing tables not in our predefined order
    const additionalTables = existingTableNames.filter(table => !truncationOrder.includes(table));
    if (additionalTables.length > 0) {
      console.log(`\n⚠️  Additional tables not in dependency order: ${additionalTables.join(', ')}`);
      tablesToTruncate.push(...additionalTables);
    }
    
    console.log(`\n📊 Will truncate ${tablesToTruncate.length} tables`);
    
    // Show current data counts
    console.log('\n📈 Current data in tables:');
    let totalRowsBeforeTruncation = 0;
    for (const tableName of tablesToTruncate) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        const count = rows[0].count;
        totalRowsBeforeTruncation += count;
        console.log(`${tableName}: ${count} rows`);
      } catch (error) {
        console.log(`${tableName}: Error - ${error.message}`);
      }
    }
    
    if (totalRowsBeforeTruncation === 0) {
      console.log('\n✅ All tables are already empty!');
      return;
    }
    
    console.log(`\n⚠️  Total rows to be deleted: ${totalRowsBeforeTruncation}`);
    console.log('\n🗑️  Starting truncation process...\n');
    
    // Method 1: Try with foreign key checks disabled
    console.log('🔓 Method 1: Disabling foreign key checks and truncating...');
    try {
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
      
      for (const tableName of tablesToTruncate) {
        try {
          await connection.execute(`TRUNCATE TABLE \`${tableName}\``);
          console.log(`✅ Truncated: ${tableName}`);
        } catch (error) {
          console.log(`❌ Failed to truncate ${tableName}: ${error.message}`);
          // Fallback to DELETE
          try {
            await connection.execute(`DELETE FROM \`${tableName}\``);
            console.log(`✅ Deleted all from: ${tableName}`);
          } catch (deleteError) {
            console.log(`❌ Delete also failed for ${tableName}: ${deleteError.message}`);
          }
        }
      }
      
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      console.log('🔒 Foreign key checks re-enabled');
      
    } catch (fkError) {
      console.log('❌ Foreign key method failed, trying dependency order method...');
      
      // Method 2: Truncate in dependency order
      console.log('\n🔄 Method 2: Truncating in dependency order...');
      for (const tableName of tablesToTruncate) {
        try {
          await connection.execute(`DELETE FROM \`${tableName}\``);
          console.log(`✅ Cleared: ${tableName}`);
        } catch (error) {
          console.log(`❌ Failed to clear ${tableName}: ${error.message}`);
        }
      }
    }
    
    // Verify results
    console.log('\n🔍 Verification - Final table counts:');
    let totalRowsAfterTruncation = 0;
    for (const tableName of tablesToTruncate) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        const count = rows[0].count;
        totalRowsAfterTruncation += count;
        if (count > 0) {
          console.log(`⚠️  ${tableName}: ${count} rows remaining`);
        } else {
          console.log(`✅ ${tableName}: empty`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${tableName}: ${error.message}`);
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(50));
    if (totalRowsAfterTruncation === 0) {
      console.log('🎉 SUCCESS: All tables truncated successfully!');
      console.log(`📊 Removed ${totalRowsBeforeTruncation} total rows`);
      console.log('🆕 Database is clean and ready for fresh data');
    } else {
      console.log(`⚠️  Partial success: ${totalRowsAfterTruncation} rows remain`);
      console.log(`📊 Removed ${totalRowsBeforeTruncation - totalRowsAfterTruncation} out of ${totalRowsBeforeTruncation} rows`);
    }
    
  } catch (error) {
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('❌ Database "caresync" does not exist');
      console.log('💡 Run: node scripts/setupDatabase.js to create the database first');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the function
console.log('🧹 SMART DATABASE CLEANUP TOOL');
console.log('==============================');
console.log('This tool will safely truncate all tables while respecting foreign key constraints');
console.log('');

truncateTablesWithDependencyOrder();