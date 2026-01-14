// Test script to check mixed patient_id formats
const mysql = require('mysql2/promise');

async function checkMixedPatientIds() {
  try {
    console.log('🔍 Checking mixed patient_id formats...');
    
    const connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    // Check different formats of patient_id in diabetes_predictions
    console.log('\n1. All unique patient_id formats in diabetes_predictions:');
    const [patientIds] = await connection.execute("SELECT DISTINCT patient_id FROM diabetes_predictions");
    console.log('   Patient IDs:', patientIds.map(p => p.patient_id));
    
    // Test each format type
    console.log('\n2. Testing each format:');
    for (const { patient_id } of patientIds) {
      console.log(`\n   Testing patient_id: ${patient_id}`);
      
      // Try matching as patient_code in patients table  
      const [patientMatch] = await connection.execute(`
        SELECT p.patient_id, p.user_id, u.name, u.email, u.phone, p.date_of_birth 
        FROM patients p 
        LEFT JOIN users u ON p.user_id = u.id 
        WHERE p.patient_id = ?
      `, [patient_id]);
      
      if (patientMatch.length > 0) {
        console.log(`     ✅ Found as patient_code:`, {
          name: patientMatch[0].name,
          email: patientMatch[0].email,
          phone: patientMatch[0].phone
        });
      } else {
        // Try matching as user_id in users table
        const [userMatch] = await connection.execute(`
          SELECT u.id, u.name, u.email, u.phone, p.patient_id, p.date_of_birth 
          FROM users u 
          LEFT JOIN patients p ON u.id = p.user_id 
          WHERE u.id = ?
        `, [patient_id]);
        
        if (userMatch.length > 0) {
          console.log(`     ✅ Found as user_id:`, {
            name: userMatch[0].name,
            email: userMatch[0].email,
            phone: userMatch[0].phone,
            patient_code: userMatch[0].patient_id
          });
        } else {
          console.log(`     ❌ No match found for ${patient_id}`);
        }
      }
    }
    
    await connection.end();
    console.log('\n✅ Mixed patient ID check completed!');
    
  } catch (error) {
    console.error('❌ Error checking mixed patient IDs:', error.message);
  }
}

checkMixedPatientIds();