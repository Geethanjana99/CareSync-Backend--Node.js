const connectMySQL = require('./config/mysql');
const { mysqlConnection } = require('./config/mysql');
const { v4: uuidv4 } = require('uuid');

async function createMissingDoctorRecords() {
  try {
    await connectMySQL();
    
    console.log('Finding doctor users without doctor records...');
    
    // Get all doctor users without doctor records
    const doctorUsersWithoutRecords = await mysqlConnection.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.role = 'doctor' AND d.id IS NULL
    `);
    
    console.log(`Found ${doctorUsersWithoutRecords.length} doctor users without doctor records:`);
    doctorUsersWithoutRecords.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
    });
    
    if (doctorUsersWithoutRecords.length === 0) {
      console.log('No missing doctor records to create.');
      return;
    }
    
    console.log('\nCreating missing doctor records...');
    
    for (const user of doctorUsersWithoutRecords) {
      const doctorId = uuidv4();
      
      await mysqlConnection.query(`
        INSERT INTO doctors (
          id, 
          user_id, 
          doctor_id,
          specialty, 
          license_number, 
          years_of_experience, 
          consultation_fee, 
          status, 
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        doctorId,
        user.id,
        `DOC${Date.now()}${Math.random().toString(36).substr(2, 3).toUpperCase()}`, // Generate doctor_id
        'General Medicine', // Default specialty
        `LIC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, // Generate license number
        0, // Default years of experience
        100.00, // Default consultation fee
        'active' // Default status
      ]);
      
      console.log(`✅ Created doctor record for ${user.name} with ID: ${doctorId}`);
    }
    
    console.log('\n✅ All missing doctor records have been created!');
    
    // Verify the fix
    console.log('\nVerifying the fix...');
    const remainingMissing = await mysqlConnection.query(`
      SELECT COUNT(*) as missing_count
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.role = 'doctor' AND d.id IS NULL
    `);
    
    console.log(`Remaining doctor users without records: ${remainingMissing[0]?.missing_count || remainingMissing?.missing_count || 0}`);
    
  } catch (error) {
    console.error('Error creating doctor records:', error);
  } finally {
    process.exit();
  }
}

createMissingDoctorRecords();
