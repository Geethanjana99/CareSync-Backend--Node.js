const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDoctors() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('👨‍⚕️ Checking doctors in database...');
    
    // Get doctors with their user information
    const [doctors] = await connection.execute(`
      SELECT 
        d.id as doctor_id, 
        d.doctor_id as doctor_number,
        u.email, 
        u.name,
        d.specialty,
        d.availability_status,
        d.status
      FROM doctors d 
      JOIN users u ON d.user_id = u.id 
      WHERE d.status = 'active'
      LIMIT 5
    `);
    
    console.log('Available doctors:');
    doctors.forEach(doc => {
      console.log(`  - ID: ${doc.doctor_id}`);
      console.log(`    Email: ${doc.email}`);
      console.log(`    Name: ${doc.name}`);
      console.log(`    Specialty: ${doc.specialty}`);
      console.log(`    Status: ${doc.availability_status}`);
      console.log(`    ---`);
    });
    
    if (doctors.length === 0) {
      console.log('❌ No active doctors found in database!');
    }
    
  } finally {
    await connection.end();
  }
}

checkDoctors().catch(console.error);
