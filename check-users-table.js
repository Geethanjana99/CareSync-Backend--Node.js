const { mysqlConnection } = require('./config/mysql');

async function checkUsersTableStructure() {
  try {
    console.log('Checking users table structure...');
    
    // Initialize the connection
    await mysqlConnection.connect();
    console.log('Database connected successfully');
    
    // Describe the users table
    const columns = await mysqlConnection.query('DESCRIBE users');
    console.log('Users table columns:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field} (${col.Type}) - ${col.Null} - ${col.Key} - ${col.Default}`);
    });
    
    // Get first doctor user's details
    const doctorUsers = await mysqlConnection.query(`
      SELECT u.id, u.email, u.name, u.role, u.password_hash, d.doctor_id, d.specialty
      FROM users u
      JOIN doctors d ON u.id = d.user_id
      WHERE u.role = 'doctor'
      LIMIT 1
    `);
    
    if (doctorUsers.length > 0) {
      console.log('\nFirst doctor user details:');
      console.log('Email:', doctorUsers[0].email);
      console.log('Name:', doctorUsers[0].name);
      console.log('Doctor ID:', doctorUsers[0].doctor_id);
      console.log('Has password hash:', !!doctorUsers[0].password_hash);
      console.log('Password hash length:', doctorUsers[0].password_hash ? doctorUsers[0].password_hash.length : 0);
    }
    
  } catch (error) {
    console.error('Error checking users table structure:', error);
  }
  
  process.exit(0);
}

checkUsersTableStructure();
