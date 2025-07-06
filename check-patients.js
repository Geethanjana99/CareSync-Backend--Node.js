const mysql = require('mysql2/promise');

async function checkPatients() {
  try {
    const connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    const [users] = await connection.execute("SELECT id, name, email, role FROM users WHERE role = 'patient' LIMIT 5");
    console.log('Available patients:');
    users.forEach(user => console.log(`- ${user.email} (${user.name})`));
    
    // Also check if patient.test@example.com exists
    const [testPatient] = await connection.execute("SELECT * FROM users WHERE email = 'patient.test@example.com'");
    
    if (testPatient.length > 0) {
      console.log('\n✅ patient.test@example.com exists');
      console.log('Details:', testPatient[0]);
    } else {
      console.log('\n❌ patient.test@example.com does not exist');
    }
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPatients();
