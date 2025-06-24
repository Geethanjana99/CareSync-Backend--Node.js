const { mysqlConnection } = require('./config/mysql');

async function checkDatabaseStructure() {
  console.log('Checking Database Structure...\n');

  try {
    await mysqlConnection.connect();
    const pool = mysqlConnection.getPool();
    const connection = await pool.getConnection();

    // Check existing tables
    console.log('1. Checking available tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Available tables:', tables.map(row => Object.values(row)[0]));

    // Check users table structure
    console.log('\n2. Checking users table structure...');
    const [userColumns] = await connection.execute('DESCRIBE users');
    console.log('Users table columns:');
    userColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    // Check patients table structure
    console.log('\n3. Checking patients table structure...');
    const [patientColumns] = await connection.execute('DESCRIBE patients');
    console.log('Patients table columns:');
    patientColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    // Check sample data
    console.log('\n4. Checking sample data...');
    const [users] = await connection.execute('SELECT * FROM users LIMIT 2');
    console.log('Sample users:', users);

    const [patients] = await connection.execute('SELECT * FROM patients LIMIT 2');
    console.log('Sample patients:', patients);

    connection.release();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabaseStructure().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
