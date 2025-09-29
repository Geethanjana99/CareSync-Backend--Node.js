// Test the fixed admin health predictions query
const mysql = require('mysql2/promise');

async function testFixedHealthQuery() {
  try {
    console.log('🔍 Testing fixed admin health predictions query...');
    
    const connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    // Test the fixed query
    const query = `
      SELECT 
        dp.id,
        dp.patient_id,
        dp.admin_id,
        dp.pregnancies,
        dp.glucose,
        dp.bmi,
        dp.age,
        dp.insulin,
        dp.prediction_result,
        dp.prediction_probability,
        dp.risk_level,
        dp.status,
        dp.notes as patient_notes,
        dp.created_at,
        dp.updated_at,
        dp.processed_at,
        COALESCE(u.name, u2.name) as patient_name,
        COALESCE(u.email, u2.email) as patient_email,
        COALESCE(u.phone, u2.phone) as patient_phone,
        COALESCE(p.date_of_birth, p2.date_of_birth) as patient_dob,
        au.name as admin_name,
        -- Check if there's doctor certification
        apc.id as certification_id,
        apc.certification_status
      FROM diabetes_predictions dp
      -- First try: Join by patient_code (for cases like 'P001')
      LEFT JOIN patients p ON dp.patient_id = p.patient_id
      LEFT JOIN users u ON p.user_id = u.id
      -- Second try: Join by user_id (for UUID cases)
      LEFT JOIN users u2 ON dp.patient_id = u2.id
      LEFT JOIN patients p2 ON u2.id = p2.user_id
      -- Admin user join
      LEFT JOIN users au ON dp.admin_id = au.id
      LEFT JOIN ai_prediction_certifications apc ON dp.id = apc.prediction_id
      ORDER BY dp.created_at DESC
      LIMIT 5
    `;
    
    const [results] = await connection.execute(query);
    console.log(`\n✅ Query returned ${results.length} results:`);
    
    results.forEach((result, i) => {
      console.log(`\n   Record ${i + 1}:`);
      console.log(`     patient_id: ${result.patient_id}`);
      console.log(`     patient_name: ${result.patient_name || 'N/A'}`);
      console.log(`     patient_email: ${result.patient_email || 'N/A'}`);
      console.log(`     patient_phone: ${result.patient_phone || 'N/A'}`);
      console.log(`     patient_dob: ${result.patient_dob || 'N/A'}`);
      console.log(`     status: ${result.status}`);
    });
    
    await connection.end();
    console.log('\n✅ Fixed health query test completed!');
    
  } catch (error) {
    console.error('❌ Error testing fixed health query:', error.message);
  }
}

testFixedHealthQuery();
