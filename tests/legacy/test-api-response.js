// Test the actual admin health predictions API endpoint
const mysql = require('mysql2/promise');

async function testActualAPI() {
  try {
    console.log('🔍 Testing the actual API response...');
    
    const connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    // First, let's see what actual data we have
    console.log('\n1. Current diabetes_predictions data:');
    const [predictions] = await connection.execute(`
      SELECT id, patient_id, status, pregnancies, glucose, bmi, age 
      FROM diabetes_predictions 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    predictions.forEach((pred, i) => {
      console.log(`   Record ${i + 1}: patient_id=${pred.patient_id}, status=${pred.status}`);
    });
    
    // Test the exact query used in AdminHealthPredictionController
    console.log('\n2. Testing the exact query from the controller:');
    const page = 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const whereClause = '';
    
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
      ${whereClause}
      ORDER BY dp.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const [results] = await connection.execute(query, []);
    
    console.log(`\n   Query returned ${results.length} results:`);
    results.forEach((result, i) => {
      console.log(`\n   Result ${i + 1}:`);
      console.log(`     patient_id: ${result.patient_id}`);
      console.log(`     patient_name: ${result.patient_name || 'NULL'}`);
      console.log(`     patient_email: ${result.patient_email || 'NULL'}`);
      console.log(`     patient_phone: ${result.patient_phone || 'NULL'}`);
      console.log(`     patient_dob: ${result.patient_dob || 'NULL'}`);
      console.log(`     status: ${result.status}`);
      console.log(`     risk_level: ${result.risk_level}`);
      console.log(`     prediction_probability: ${result.prediction_probability}`);
      
      // Show what the processed data would look like
      const processedPatientInfo = {
        name: result.patient_name || 'Unknown Patient',
        email: result.patient_email || 'N/A',
        phone: result.patient_phone || 'N/A',
        dateOfBirth: result.patient_dob || 'N/A'
      };
      console.log(`     Processed patientInfo:`, processedPatientInfo);
    });
    
    await connection.end();
    console.log('\n✅ API test completed!');
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testActualAPI();