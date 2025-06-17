// ===================================================================
// BACKEND AIVEN.IO CONNECTION TEST
// ===================================================================
// Test the backend's connection to Aiven.io database
// ===================================================================

require('dotenv').config();
const { mysqlConnection } = require('./config/mysql');

async function testBackendConnection() {
  console.log('🔌 Testing Backend Connection to Aiven.io Database...\n');
  
  try {
    // Display configuration
    console.log('📊 Database Configuration:');
    console.log(`   Host: ${process.env.MYSQL_HOST}`);
    console.log(`   Port: ${process.env.MYSQL_PORT}`);
    console.log(`   Database: ${process.env.MYSQL_DATABASE}`);
    console.log(`   User: ${process.env.MYSQL_USER}`);
    console.log(`   SSL: ${process.env.MYSQL_SSL}`);
    console.log('');

    // Test MySQL connection using backend config
    console.log('🔗 Connecting to MySQL via backend config...');
    await mysqlConnection.connect();
    console.log('✅ Backend MySQL connection successful!');

    // Test a simple query
    console.log('\n📋 Testing basic query...');
    const pool = mysqlConnection.getPool();
    const [result] = await pool.execute('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ?', [process.env.MYSQL_DATABASE]);
    console.log(`✅ Database has ${result[0].table_count} tables`);

    // Test users table
    console.log('\n👥 Testing users table access...');
    const [users] = await pool.execute('SELECT COUNT(*) as user_count FROM users');
    console.log(`✅ Found ${users[0].user_count} users in database`);

    // Test medical_specialties table
    console.log('\n🏥 Testing medical specialties...');
    const [specialties] = await pool.execute('SELECT name FROM medical_specialties LIMIT 5');
    console.log('✅ Available specialties:');
    specialties.forEach(spec => console.log(`   - ${spec.name}`));

    // Test connection pool
    console.log('\n🔄 Testing connection pool...');
    const poolStats = pool.pool;
    console.log(`✅ Pool status: ${poolStats._allConnections.length} connections, ${poolStats._freeConnections.length} free`);    // Close connection
    await mysqlConnection.close();
    console.log('\n🔌 Connection closed successfully');
    
    console.log('\n🎉 All backend connection tests passed!');
    
  } catch (error) {
    console.error('❌ Backend connection test failed:', error.message);
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    if (error.errno) {
      console.error(`   Error Number: ${error.errno}`);
    }
    process.exit(1);
  }
}

// Run the test
testBackendConnection();
