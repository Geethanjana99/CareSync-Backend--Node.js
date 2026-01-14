const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * AIVEN CLOUD DATABASE TRUNCATION TOOL
 * Safely truncates all tables in your Aiven.io MySQL database
 */

// Aiven database configuration (from your existing files)
const dbConfig = {
  host: process.env.MYSQL_HOST || 'caresyncdb-caresync.e.aivencloud.com',
  port: process.env.MYSQL_PORT || 16006,
  user: process.env.MYSQL_USER || 'avnadmin',
  password: process.env.MYSQL_PASSWORD || 'AVNS_6xeaVpCVApextDTAKfU',
  database: process.env.MYSQL_DATABASE || 'caresync',
  ssl: {
    rejectUnauthorized: false
  },
  connectTimeout: 20000,
  acquireTimeout: 20000,
  timeout: 20000
};

async function truncateAivenDatabase() {
  let connection;
  
  try {
    console.log('🌐 AIVEN DATABASE TRUNCATION TOOL');
    console.log('================================');
    console.log('⚠️  This will DELETE ALL DATA from your Aiven cloud database!');
    console.log('⚠️  This action cannot be undone!\n');
    
    // Connect to Aiven database
    console.log('🔗 Connecting to Aiven.io database...');
    console.log(`📍 Host: ${dbConfig.host}`);
    console.log(`🔌 Port: ${dbConfig.port}`);
    console.log(`🗄️  Database: ${dbConfig.database}\n`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Successfully connected to Aiven.io MySQL database!');
    
    // Get all tables
    console.log('\n🔍 Fetching database tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('ℹ️  No tables found in the database');
      console.log('🎉 Database is already empty!');
      return;
    }
    
    const tableNames = tables.map(table => Object.values(table)[0]);
    console.log(`\n📊 Found ${tables.length} tables:`);
    tableNames.forEach((name, index) => console.log(`${index + 1}. ${name}`));
    
    // Check current data counts
    console.log('\n📈 Current data in tables:');
    let totalRows = 0;
    const tableStats = [];
    
    for (const tableName of tableNames) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        const count = rows[0].count;
        totalRows += count;
        tableStats.push({ name: tableName, rows: count });
        
        if (count > 0) {
          console.log(`  ${tableName}: ${count} rows`);
        } else {
          console.log(`  ${tableName}: empty`);
        }
      } catch (error) {
        console.log(`  ${tableName}: Error reading - ${error.message}`);
        tableStats.push({ name: tableName, rows: 'Error' });
      }
    }
    
    if (totalRows === 0) {
      console.log('\n✅ All tables are already empty!');
      console.log('🎉 No truncation needed');
      return;
    }
    
    console.log(`\n⚠️  Total rows to delete: ${totalRows}`);
    console.log(`📋 Tables with data: ${tableStats.filter(t => t.rows > 0).length}`);
    
    // Show what will happen
    console.log('\n📋 Truncation process for Aiven database:');
    console.log('  1. Disable foreign key constraint checks');
    console.log('  2. Truncate all tables (fastest method)');
    console.log('  3. Reset auto-increment counters');
    console.log('  4. Re-enable foreign key constraints');
    console.log('  5. Verify all data removed');
    
    console.log('\n🚀 Starting truncation in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 1: Disable foreign key checks for cloud database
    console.log('\n🔓 Disabling foreign key constraints...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('SET SQL_SAFE_UPDATES = 0');
    console.log('✅ Constraints disabled');
    
    // Step 2: Truncate all tables
    console.log('\n🗑️  Truncating tables...');
    const truncationResults = [];
    
    for (const tableName of tableNames) {
      try {
        await connection.execute(`TRUNCATE TABLE \`${tableName}\``);
        console.log(`✅ ${tableName}: truncated successfully`);
        truncationResults.push({ table: tableName, status: 'success', method: 'TRUNCATE' });
      } catch (truncateError) {
        console.log(`⚠️  ${tableName}: TRUNCATE failed, trying DELETE...`);
        try {
          await connection.execute(`DELETE FROM \`${tableName}\``);
          // Reset auto-increment if the table has an auto-increment column
          try {
            await connection.execute(`ALTER TABLE \`${tableName}\` AUTO_INCREMENT = 1`);
          } catch (alterError) {
            // Some tables might not have auto-increment, which is fine
          }
          console.log(`✅ ${tableName}: cleared with DELETE`);
          truncationResults.push({ table: tableName, status: 'success', method: 'DELETE' });
        } catch (deleteError) {
          console.log(`❌ ${tableName}: Both TRUNCATE and DELETE failed`);
          console.log(`   Error: ${deleteError.message}`);
          truncationResults.push({ table: tableName, status: 'failed', error: deleteError.message });
        }
      }
    }
    
    // Step 3: Re-enable constraints
    console.log('\n🔒 Re-enabling foreign key constraints...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    await connection.execute('SET SQL_SAFE_UPDATES = 1');
    console.log('✅ Constraints re-enabled');
    
    // Step 4: Verification
    console.log('\n🔍 Verifying truncation results...');
    let remainingRows = 0;
    const verificationResults = [];
    
    for (const tableName of tableNames) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        const count = rows[0].count;
        remainingRows += count;
        verificationResults.push({ table: tableName, rows: count });
        
        if (count === 0) {
          console.log(`✅ ${tableName}: completely empty`);
        } else {
          console.log(`⚠️  ${tableName}: ${count} rows remaining`);
        }
      } catch (error) {
        console.log(`❌ ${tableName}: verification error - ${error.message}`);
      }
    }
    
    // Final report
    console.log('\n' + '='.repeat(70));
    console.log('📊 AIVEN DATABASE TRUNCATION SUMMARY');
    console.log('='.repeat(70));
    
    const successful = truncationResults.filter(r => r.status === 'success').length;
    const failed = truncationResults.filter(r => r.status === 'failed').length;
    const truncateMethods = truncationResults.filter(r => r.method === 'TRUNCATE').length;
    const deleteMethods = truncationResults.filter(r => r.method === 'DELETE').length;
    
    console.log(`🗄️  Database: ${dbConfig.database} on Aiven.io`);
    console.log(`📈 Tables processed: ${tableNames.length}`);
    console.log(`✅ Successfully cleared: ${successful}`);
    console.log(`❌ Failed to clear: ${failed}`);
    console.log(`🚀 Used TRUNCATE: ${truncateMethods}`);
    console.log(`🔄 Used DELETE: ${deleteMethods}`);
    console.log(`📊 Data removed: ${totalRows - remainingRows} rows`);
    console.log(`⚠️  Data remaining: ${remainingRows} rows`);
    
    if (remainingRows === 0 && failed === 0) {
      console.log('\n🎉 COMPLETE SUCCESS!');
      console.log('✨ All tables in your Aiven database are now completely empty');
      console.log('🆕 Database is clean and ready for fresh data');
      console.log('💡 You can now run seeders or import new data');
      
      console.log('\n🚀 Next steps:');
      console.log('  • Run: node scripts/setupDatabase.js (to add basic admin user)');
      console.log('  • Run: node create-test-data.js (to add sample data)');
      console.log('  • Start fresh development with clean database');
      
    } else if (failed === 0) {
      console.log('\n✅ MOSTLY SUCCESSFUL!');
      console.log('🔍 Some data remains - this might be expected for certain system tables');
      
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS');
      console.log('❌ Some tables could not be cleared:');
      
      const failedTables = truncationResults.filter(r => r.status === 'failed');
      failedTables.forEach(ft => {
        console.log(`  • ${ft.table}: ${ft.error}`);
      });
      
      console.log('\n💡 Manual cleanup may be needed for failed tables');
    }
    
    console.log('\n🔒 Your Aiven database connection is secure and intact');
    
  } catch (error) {
    console.error('\n❌ Fatal error during truncation:', error.message);
    
    if (error.code === 'ETIMEDOUT') {
      console.log('\n🌐 Connection timeout to Aiven.io');
      console.log('💡 Possible causes:');
      console.log('  • Slow internet connection');
      console.log('  • Aiven service temporarily unavailable');
      console.log('  • Firewall blocking connection');
      console.log('  • Try again in a few minutes');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n🚫 Access denied to Aiven database');
      console.log('💡 Check your credentials in .env file');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n🗄️  Database does not exist on Aiven');
      console.log('💡 Check database name in Aiven console');
    } else {
      console.log('\n🔧 Troubleshooting:');
      console.log('  • Check Aiven.io console for service status');
      console.log('  • Verify connection settings in .env');
      console.log('  • Try the simple connection test script first');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Disconnected from Aiven database');
    }
  }
}

// Execute with proper error handling
console.log('🌐 Preparing to truncate Aiven.io cloud database...\n');

truncateAivenDatabase()
  .then(() => {
    console.log('\n✅ Truncation process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Truncation process failed:', error.message);
    process.exit(1);
  });