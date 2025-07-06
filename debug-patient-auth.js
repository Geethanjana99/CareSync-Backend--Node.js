const axios = require('axios');
const jwt = require('jsonwebtoken');
const { mysqlConnection } = require('./config/mysql');

async function debugPatientAuth() {
  try {
    console.log('Debugging patient authentication...');
    
    // Initialize connection
    await mysqlConnection.connect();
    
    // Get all users and their roles
    const allUsers = await mysqlConnection.query('SELECT id, name, email, role FROM users WHERE is_active = true');
    console.log('All active users:');
    console.table(allUsers);
    
    // Get all patients
    const allPatients = await mysqlConnection.query('SELECT user_id, patient_id, status FROM patients');
    console.log('All patients:');
    console.table(allPatients);
    
    // Check if every user with role 'patient' has a patient record
    const patientUsers = allUsers.filter(u => u.role === 'patient');
    console.log(`\nFound ${patientUsers.length} patient users`);
    
    for (const user of patientUsers) {
      const patientRecord = await mysqlConnection.query('SELECT * FROM patients WHERE user_id = ?', [user.id]);
      console.log(`Patient ${user.name} (${user.email}) has record: ${patientRecord.length > 0 ? 'YES' : 'NO'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Debug error:', error);
    process.exit(1);
  }
}

debugPatientAuth();
