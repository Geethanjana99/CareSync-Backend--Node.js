// Check if UUID patient_ids exist in users table
const mysql = require('mysql2/promise');

async function checkUUIDPatientIds() {
  try {
    console.log('🔍 Checking UUID patient_ids in diabetes_predictions...');
    
    const connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    // Get the UUID-style patient_ids
    const uuidPatientIds = ['38b5d176-dde6-4f81-a0d7-6638fbc05b5a', 'a8aefe10-e392-4d66-a690-0c87db19d5f3'];
    
    for (const patientId of uuidPatientIds) {
      console.log(`\nChecking patient_id: ${patientId}`);
      
      // Check if this UUID exists in users table
      const [users] = await connection.execute("SELECT id, name, email, role FROM users WHERE id = ?", [patientId]);
      if (users.length > 0) {
        console.log(`  ✅ Found in users table:`, users[0]);
        
        // Check if there's a corresponding patient record
        const [patients] = await connection.execute("SELECT * FROM patients WHERE user_id = ?", [patientId]);
        if (patients.length > 0) {
          console.log(`  ✅ Has patient record:`, {
            patient_id: patients[0].patient_id,
            date_of_birth: patients[0].date_of_birth
          });
        } else {
          console.log(`  ❌ No patient record found`);
        }
      } else {
        console.log(`  ❌ Not found in users table`);
      }
      
      // Check if this might be an old/deleted user
      console.log(`  Searching for any traces of this ID...`);
      const [anyTable] = await connection.execute(`
        SELECT 'diabetes_predictions' as table_name, COUNT(*) as count FROM diabetes_predictions WHERE patient_id = ?
        UNION ALL
        SELECT 'users' as table_name, COUNT(*) as count FROM users WHERE id = ?
        UNION ALL 
        SELECT 'patients' as table_name, COUNT(*) as count FROM patients WHERE user_id = ?
      `, [patientId, patientId, patientId]);
      
      anyTable.forEach(result => {
        if (result.count > 0) {
          console.log(`    Found ${result.count} records in ${result.table_name}`);
        }
      });
    }
    
    // Also show some example valid user IDs for comparison
    console.log(`\nFor comparison, here are some valid user IDs:`);
    const [validUsers] = await connection.execute("SELECT id, name, email, role FROM users WHERE role = 'patient' LIMIT 3");
    validUsers.forEach(user => {
      console.log(`  ${user.id} - ${user.name} (${user.email})`);
    });
    
    await connection.end();
    console.log('\n✅ UUID patient ID check completed!');
    
  } catch (error) {
    console.error('❌ Error checking UUID patient IDs:', error.message);
  }
}

checkUUIDPatientIds();