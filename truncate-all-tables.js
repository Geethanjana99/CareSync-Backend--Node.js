const mysql = require('mysql2/promise');

async function truncateAllTables() {
  let connection;
  
  try {
    // First, try to connect to the caresync database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'caresync'
    });
    
    console.log('✅ Connected to caresync database');
    
    // Get all tables in the database
    console.log('\n🔍 Fetching all tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('ℹ️  No tables found in the database');
      return;
    }
    
    console.log(`Found ${tables.length} tables:`);
    const tableNames = tables.map(table => Object.values(table)[0]);
    tableNames.forEach((tableName, index) => {
      console.log(`${index + 1}. ${tableName}`);
    });
    
    // Check for data in tables before truncation
    console.log('\n📊 Current data counts:');
    for (const tableName of tableNames) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        console.log(`${tableName}: ${rows[0].count} rows`);
      } catch (error) {
        console.log(`${tableName}: Error - ${error.message}`);
      }
    }
    
    console.log('\n⚠️  WARNING: This will delete ALL data from ALL tables!');
    console.log('📋 Truncation process:');
    console.log('1. Disable foreign key checks');
    console.log('2. Truncate all tables');
    console.log('3. Re-enable foreign key checks');
    console.log('4. Reset auto-increment counters');
    
    // Disable foreign key checks
    console.log('\n🔓 Disabling foreign key checks...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Truncate all tables
    console.log('\n🗑️  Truncating tables...');
    for (const tableName of tableNames) {
      try {
        await connection.execute(`TRUNCATE TABLE \`${tableName}\``);
        console.log(`✅ Truncated: ${tableName}`);
      } catch (error) {
        console.log(`❌ Failed to truncate ${tableName}: ${error.message}`);
        // Try DELETE as fallback
        try {
          await connection.execute(`DELETE FROM \`${tableName}\``);
          console.log(`✅ Deleted all rows from: ${tableName}`);
        } catch (deleteError) {
          console.log(`❌ Failed to delete from ${tableName}: ${deleteError.message}`);
        }
      }
    }
    
    // Re-enable foreign key checks
    console.log('\n🔒 Re-enabling foreign key checks...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    // Verify truncation
    console.log('\n🔍 Verifying truncation...');
    let totalRows = 0;
    for (const tableName of tableNames) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        const count = rows[0].count;
        totalRows += count;
        if (count > 0) {
          console.log(`⚠️  ${tableName}: ${count} rows remaining`);
        } else {
          console.log(`✅ ${tableName}: empty`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${tableName}: ${error.message}`);
      }
    }
    
    if (totalRows === 0) {
      console.log('\n🎉 SUCCESS: All tables have been truncated successfully!');
      console.log('📊 Database is now clean and ready for fresh data');
    } else {
      console.log(`\n⚠️  WARNING: ${totalRows} rows remain across all tables`);
    }
    
  } catch (error) {
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('❌ Database "caresync" does not exist');
      console.log('💡 Please create the database first or run the setup script');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('❌ Access denied. Please check your MySQL credentials');
    } else {
      console.error('❌ Database error:', error.message);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Add confirmation prompt
console.log('🚨 DATABASE TRUNCATION TOOL 🚨');
console.log('================================');
console.log('⚠️  This script will DELETE ALL DATA from ALL TABLES in the caresync database');
console.log('⚠️  This action cannot be undone!');
console.log('');
console.log('Starting truncation in 3 seconds...');
console.log('Press Ctrl+C to cancel');

setTimeout(() => {
  truncateAllTables();
}, 3000);