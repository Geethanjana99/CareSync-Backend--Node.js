const { mysqlConnection } = require('./config/mysql');
const bcrypt = require('bcrypt');

async function createTestUser() {
  try {
    await mysqlConnection.connect();
    
    // Hash password
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    const testEmail = 'test.doctor@example.com';
    
    console.log('Creating test doctor user...');
    
    // First, delete existing user if exists
    await mysqlConnection.query('DELETE FROM users WHERE email = ?', [testEmail]);
    
    // Create test user
    const userResult = await mysqlConnection.query(
      'INSERT INTO users (id, name, email, password_hash, role, phone, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        'test-doctor-id-123',
        'Test Doctor',
        testEmail,
        hashedPassword,
        'doctor',
        '1234567890',
        true
      ]
    );
    
    console.log('User created successfully');
    
    // Create doctor record
    await mysqlConnection.query(
      'INSERT INTO doctors (id, user_id, doctor_id, specialty, license_number, years_of_experience, working_hours, availability_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)',
      [
        'test-doctor-db-id-123',
        'test-doctor-id-123',
        'DOC123',
        'General Medicine',
        'LICENSE123',
        5,
        JSON.stringify({
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' },
          saturday: { start: '10:00', end: '14:00' },
          sunday: { start: '10:00', end: '14:00' }
        }),
        'available'
      ]
    );
    
    console.log('Doctor record created successfully');
    
    // Create test patient user
    const patientHashedPassword = await bcrypt.hash('testpass123', 10);
    const patientEmail = 'test.patient@example.com';
    
    await mysqlConnection.query('DELETE FROM users WHERE email = ?', [patientEmail]);
    
    await mysqlConnection.query(
      'INSERT INTO users (id, name, email, password_hash, role, phone, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        'test-patient-id-123',
        'Test Patient',
        patientEmail,
        patientHashedPassword,
        'patient',
        '0987654321',
        true
      ]
    );
    
    console.log('Patient user created successfully');
    
    // Create patient record
    await mysqlConnection.query(
      'INSERT INTO patients (id, user_id, date_of_birth, gender, medical_history, allergies, emergency_contact_name, emergency_contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)',
      [
        'test-patient-db-id-123',
        'test-patient-id-123',
        '1990-01-01',
        'Other',
        'None',
        'None',
        'Emergency Contact',
        '1111111111'
      ]
    );
    
    console.log('Patient record created successfully');
    
    console.log('\n✅ Test users created:');
    console.log('Doctor: test.doctor@example.com / testpass123');
    console.log('Patient: test.patient@example.com / testpass123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();
