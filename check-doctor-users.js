const { mysqlConnection } = require('./config/mysql');

async function checkDoctorUsers() {
  try {
    console.log('Checking doctor users...');
    
    // Initialize the connection
    await mysqlConnection.connect();
    console.log('Database connected successfully');
    
    // Get all users who are doctors
    const doctorUsers = await mysqlConnection.query(`
      SELECT u.id, u.email, u.name, u.role, d.doctor_id, d.specialty
      FROM users u
      JOIN doctors d ON u.id = d.user_id
      WHERE u.role = 'doctor'
      LIMIT 10
    `);
    
    console.log('Doctor users found:', doctorUsers.length);
    doctorUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.name} - ${user.doctor_id} - ${user.specialty}`);
    });
    
    // Try to get a password hash for one of them
    if (doctorUsers.length > 0) {
      const userWithPassword = await mysqlConnection.query(`
        SELECT email, password_hash, salt
        FROM users
        WHERE id = ?
      `, [doctorUsers[0].id]);
      
      console.log('First doctor user password info:');
      console.log('Email:', userWithPassword[0].email);
      console.log('Has password hash:', !!userWithPassword[0].password_hash);
      console.log('Has salt:', !!userWithPassword[0].salt);
    }
    
  } catch (error) {
    console.error('Error checking doctor users:', error);
  }
  
  process.exit(0);
}

checkDoctorUsers();
