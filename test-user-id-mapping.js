// Test script to check if diabetes_predictions should use user_id instead
const mysql = require('mysql2/promise');

async function checkUserIdMapping() {
  try {
    console.log('🔍 Checking user_id mapping for health predictions...');
    
    const connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    // Check if patient_id in diabetes_predictions matches user_id in users table
    console.log('\n1. Testing if patient_id in diabetes_predictions matches user_id in users:');
    const testQuery = `
      SELECT 
        dp.id,
        dp.patient_id,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        p.patient_id as patient_code,
        p.date_of_birth
      FROM diabetes_predictions dp
      LEFT JOIN users u ON dp.patient_id = u.id
      LEFT JOIN patients p ON u.id = p.user_id
      LIMIT 3
    `;
    
    const [results] = await connection.execute(testQuery);
    console.log('Results with user_id matching:');
    results.forEach((result, i) => {
      console.log(`   Record ${i + 1}:`, {
        diabetes_patient_id: result.patient_id,
        matched_user_id: result.user_id,
        user_name: result.user_name,
        user_email: result.user_email,
        patient_code: result.patient_code
      });
    });
    
    await connection.end();
    console.log('\n✅ User ID mapping check completed!');
    
  } catch (error) {
    console.error('❌ Error checking user ID mapping:', error.message);
  }
}

checkUserIdMapping();