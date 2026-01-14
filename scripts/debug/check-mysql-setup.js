const mysql = require('mysql2/promise');

async function checkDatabaseSetup() {
  let connection;
  
  try {
    // First try to connect to MySQL server without specifying a database
    console.log('🔍 Checking MySQL server connection...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });
    
    console.log('✅ MySQL server is running and accessible');
    
    // Check if caresync database exists
    console.log('\n🔍 Checking for caresync database...');
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbNames = databases.map(db => Object.values(db)[0]);
    
    console.log('📋 Available databases:');
    dbNames.forEach(dbName => console.log(`  - ${dbName}`));
    
    const caresyncExists = dbNames.includes('caresync');
    
    if (caresyncExists) {
      console.log('\n✅ caresync database exists');
      
      // Switch to caresync database and check tables
      await connection.execute('USE caresync');
      const [tables] = await connection.execute('SHOW TABLES');
      
      console.log(`\n📊 caresync database has ${tables.length} tables:`);
      if (tables.length > 0) {
        tables.forEach(table => console.log(`  - ${Object.values(table)[0]}`));
        
        // Check data in tables
        console.log('\n📈 Data in tables:');
        for (const table of tables) {
          const tableName = Object.values(table)[0];
          try {
            const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
            console.log(`  ${tableName}: ${rows[0].count} rows`);
          } catch (error) {
            console.log(`  ${tableName}: Error - ${error.message}`);
          }
        }
      } else {
        console.log('  (No tables found)');
      }
      
      console.log('\n✅ Ready to truncate tables');
      
    } else {
      console.log('\n❌ caresync database does NOT exist');
      console.log('💡 You need to create the database first. Options:');
      console.log('   1. Run: node scripts/setupDatabase.js');
      console.log('   2. Or manually create: CREATE DATABASE caresync;');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to MySQL server');
      console.log('💡 Please ensure MySQL is running on localhost:3306');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('❌ Access denied');
      console.log('💡 Please check MySQL username/password (currently using root with no password)');
    } else {
      console.log('❌ Database error:', error.message);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabaseSetup();