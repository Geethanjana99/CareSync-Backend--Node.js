const { mysqlConnection } = require('./config/mysql');
const bcrypt = require('bcrypt');

async function createTestDoctorUser() {
  try {
    console.log('Creating test doctor user...');
    
    // Initialize the connection
    await mysqlConnection.connect();
    console.log('Database connected successfully');
    
    const testEmail = 'testdoctor@example.com';
    const testPassword = 'testpass123';
    
    // Check if user already exists
    const existingUser = await mysqlConnection.query('SELECT * FROM users WHERE email = ?', [testEmail]);
    
    if (existingUser.length > 0) {
      console.log('Test doctor user already exists, updating password...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      
      // Update the password
      await mysqlConnection.query('UPDATE users SET password_hash = ? WHERE email = ?', [hashedPassword, testEmail]);
      
      console.log('Test doctor password updated successfully');
      console.log('Email:', testEmail);
      console.log('Password:', testPassword);
      
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    // Create new user
    const userId = await mysqlConnection.query(`
      INSERT INTO users (name, email, password_hash, role, is_active, email_verified)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['Test Doctor', testEmail, hashedPassword, 'doctor', 1, 1]);
    
    console.log('Test doctor user created successfully');
    
    // Get the user ID
    const newUser = await mysqlConnection.query('SELECT * FROM users WHERE email = ?', [testEmail]);
    const newUserId = newUser[0].id;
    
    // Create doctor record
    const doctorId = 'D' + Math.floor(Math.random() * 1000);
    await mysqlConnection.query(`
      INSERT INTO doctors (user_id, doctor_id, specialty, license_number, years_of_experience, 
                          education, consultation_fee, languages_spoken, office_address, bio, 
                          availability_status, commission_rate, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newUserId, doctorId, 'General Medicine', 'LIC' + Date.now(), 5,
      'MBBS', 1500.00, JSON.stringify(['English']), 'Test Clinic', 'Test doctor for queue system',
      'available', 25.00, 'active'
    ]);
    
    console.log('Test doctor record created successfully');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('Doctor ID:', doctorId);
    
  } catch (error) {
    console.error('Error creating test doctor user:', error);
  }
  
  process.exit(0);
}

createTestDoctorUser();
