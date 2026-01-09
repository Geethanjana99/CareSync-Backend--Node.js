const mysql = require('mysql2/promise');

/**
 * Comprehensive Database Truncation Tool
 * Handles various database scenarios with foreign key constraints
 */

async function truncateDatabaseTables() {
  let connection;
  
  try {
    // Try different common MySQL configurations
    const configurations = [
      { host: 'localhost', user: 'root', password: '', database: 'caresync', port: 3306 },
      { host: 'localhost', user: 'root', password: 'password', database: 'caresync', port: 3306 },
      { host: 'localhost', user: 'root', password: 'root', database: 'caresync', port: 3306 },
      { host: '127.0.0.1', user: 'root', password: '', database: 'caresync', port: 3306 }
    ];
    
    console.log('🔍 Attempting to connect to MySQL database...\n');
    
    let connected = false;
    for (const config of configurations) {
      try {
        console.log(`Trying: ${config.user}@${config.host}:${config.port}/${config.database}`);
        connection = await mysql.createConnection(config);
        console.log('✅ Successfully connected!');
        connected = true;
        break;
      } catch (error) {
        console.log(`❌ Failed: ${error.code || error.message}`);
      }
    }
    
    if (!connected) {
      console.log('\n❌ Could not connect to MySQL database');
      console.log('\n🔧 Troubleshooting steps:');
      console.log('1. Ensure MySQL server is running');
      console.log('2. Check if caresync database exists');
      console.log('3. Verify MySQL credentials');
      console.log('4. Check MySQL is running on port 3306');
      console.log('\n💡 To start MySQL:');
      console.log('   - Windows: net start mysql (as administrator)');
      console.log('   - Or start via MySQL Workbench/XAMPP/WAMP');
      return;
    }
    
    // Get all tables
    console.log('\n🔍 Fetching database tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('ℹ️  No tables found in the caresync database');
      console.log('💡 Database is already empty or needs to be set up');
      return;
    }
    
    const tableNames = tables.map(table => Object.values(table)[0]);
    console.log(`\n📊 Found ${tables.length} tables:`);
    tableNames.forEach((name, index) => console.log(`${index + 1}. ${name}`));
    
    // Check current data
    console.log('\n📈 Current data counts:');
    let totalRows = 0;
    const tableData = [];
    
    for (const tableName of tableNames) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        const count = rows[0].count;
        totalRows += count;
        tableData.push({ name: tableName, rows: count });
        console.log(`  ${tableName}: ${count} rows`);
      } catch (error) {
        console.log(`  ${tableName}: Error reading - ${error.message}`);
        tableData.push({ name: tableName, rows: 'Error' });
      }
    }
    
    if (totalRows === 0) {
      console.log('\n✅ All tables are already empty!');
      console.log('🎉 No truncation needed');
      return;
    }
    
    console.log(`\n⚠️  WARNING: This will delete ${totalRows} total rows from ${tables.length} tables!`);
    console.log('📋 Truncation process will:');
    console.log('  1. Disable foreign key constraints');
    console.log('  2. Truncate all tables (faster than DELETE)');
    console.log('  3. Reset auto-increment counters to 1');
    console.log('  4. Re-enable foreign key constraints');
    
    // Perform truncation
    console.log('\n🚀 Starting truncation process...\n');
    
    // Step 1: Disable foreign key checks
    console.log('🔓 Disabling foreign key constraints...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✅ Foreign key checks disabled');
    
    // Step 2: Truncate all tables
    console.log('\n🗑️  Truncating tables...');
    const results = [];
    
    for (const tableName of tableNames) {
      try {
        await connection.execute(`TRUNCATE TABLE \`${tableName}\``);
        console.log(`✅ ${tableName}: truncated`);
        results.push({ table: tableName, status: 'success', method: 'TRUNCATE' });
      } catch (error) {
        console.log(`⚠️  ${tableName}: TRUNCATE failed, trying DELETE...`);
        try {
          await connection.execute(`DELETE FROM \`${tableName}\``);
          await connection.execute(`ALTER TABLE \`${tableName}\` AUTO_INCREMENT = 1`);
          console.log(`✅ ${tableName}: cleared with DELETE`);
          results.push({ table: tableName, status: 'success', method: 'DELETE' });
        } catch (deleteError) {
          console.log(`❌ ${tableName}: DELETE also failed - ${deleteError.message}`);
          results.push({ table: tableName, status: 'failed', error: deleteError.message });
        }
      }
    }
    
    // Step 3: Re-enable foreign key checks
    console.log('\n🔒 Re-enabling foreign key constraints...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Foreign key checks re-enabled');
    
    // Step 4: Verify truncation
    console.log('\n🔍 Verifying truncation results...');
    let remainingRows = 0;
    
    for (const tableName of tableNames) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        const count = rows[0].count;
        remainingRows += count;
        
        if (count === 0) {
          console.log(`✅ ${tableName}: empty`);
        } else {
          console.log(`⚠️  ${tableName}: ${count} rows remaining`);
        }
      } catch (error) {
        console.log(`❌ ${tableName}: verification error - ${error.message}`);
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TRUNCATION SUMMARY');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    
    console.log(`📈 Tables processed: ${tableNames.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Data removed: ${totalRows - remainingRows} rows`);
    console.log(`⚠️  Data remaining: ${remainingRows} rows`);
    
    if (remainingRows === 0) {
      console.log('\n🎉 SUCCESS: All tables completely cleared!');
      console.log('🆕 Database is clean and ready for fresh data');
      console.log('💡 You can now run seeders or add new data');
    } else if (failed === 0) {
      console.log('\n✅ Partial success: Most data cleared');
      console.log('⚠️  Some data remains - manual review recommended');
    } else {
      console.log('\n❌ Some tables could not be truncated');
      console.log('💡 Check error messages above for details');
    }
    
    // Show failed tables
    const failedTables = results.filter(r => r.status === 'failed');
    if (failedTables.length > 0) {
      console.log('\n❌ Failed tables:');
      failedTables.forEach(ft => {
        console.log(`  - ${ft.table}: ${ft.error}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Database "caresync" does not exist');
      console.log('Run this command to create it:');
      console.log('   CREATE DATABASE caresync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Main execution
console.log('🧹 COMPREHENSIVE DATABASE TRUNCATION TOOL');
console.log('==========================================');
console.log('⚠️  This tool will DELETE ALL DATA from the caresync database');
console.log('⚠️  Make sure you have backups if needed!');
console.log('');

// Add a small delay to allow user to read the warning
setTimeout(() => {
  truncateDatabaseTables().catch(console.error);
}, 2000);