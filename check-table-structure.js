const mysql = require('mysql2/promise');

async function checkTableStructure() {
  let connection;
  try {
    console.log('=== CHECKING TABLE STRUCTURES ===\n');
    
    connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('Database connected successfully!\n');
    
    console.log('1. Users table structure:');
    const [userCols] = await connection.execute('DESCRIBE users');
    console.log(userCols);
    
    console.log('\n2. Doctors table structure:');
    const [doctorCols] = await connection.execute('DESCRIBE doctors');
    console.log(doctorCols);
    
    console.log('\n3. Sample users data:');
    const [usersData] = await connection.execute('SELECT * FROM users WHERE role = ? LIMIT 3', ['doctor']);
    console.log(usersData);
    
    console.log('\n4. Sample doctors data:');
    const [doctorsData] = await connection.execute('SELECT * FROM doctors LIMIT 3');
    console.log(doctorsData);
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit();
  }
}

checkTableStructure();
