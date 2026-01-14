// Test script to check health predictions data structure
const mysql = require('mysql2/promise');

async function checkHealthPredictionsData() {
  try {
    console.log('🔍 Checking health predictions data structure...');
    
    const connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    // First, check the diabetes_predictions table structure
    console.log('\n1. Checking diabetes_predictions table structure:');
    const [dpColumns] = await connection.execute("DESCRIBE diabetes_predictions");
    dpColumns.forEach(col => console.log(`   - ${col.Field} (${col.Type})`));
    
    // Check some sample diabetes_predictions data
    console.log('\n2. Sample diabetes_predictions data:');
    const [dpSample] = await connection.execute("SELECT * FROM diabetes_predictions LIMIT 2");
    if (dpSample.length > 0) {
      console.log('   Sample record:', {
        id: dpSample[0].id,
        patient_id: dpSample[0].patient_id,
        status: dpSample[0].status
      });
    }
    
    // Check the current query from AdminHealthPredictionController
    console.log('\n3. Testing the current admin query:');
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
        u.name as patient_name,
        u.email as patient_email,
        u.phone as patient_phone,
        p.date_of_birth as patient_dob,
        au.name as admin_name,
        -- Check if there's doctor certification
        apc.id as certification_id,
        apc.certification_status
      FROM diabetes_predictions dp
      LEFT JOIN patients p ON dp.patient_id = p.patient_id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN users au ON dp.admin_id = au.id
      LEFT JOIN ai_prediction_certifications apc ON dp.id = apc.prediction_id
      ORDER BY dp.created_at DESC
      LIMIT 2
    `;
    
    const [results] = await connection.execute(query);
    console.log('   Query results count:', results.length);
    if (results.length > 0) {
      console.log('   First result patient info:', {
        patient_id: results[0].patient_id,
        patient_name: results[0].patient_name,
        patient_email: results[0].patient_email,
        patient_phone: results[0].patient_phone,
        patient_dob: results[0].patient_dob
      });
    }
    
    // Check if there are patients with matching patient_id
    console.log('\n4. Checking patients table for matching IDs:');
    const [patients] = await connection.execute("SELECT patient_id, user_id FROM patients LIMIT 5");
    console.log('   Sample patient IDs:', patients.map(p => ({ patient_id: p.patient_id, user_id: p.user_id })));
    
    // Check the specific patient_id from diabetes_predictions
    if (dpSample.length > 0) {
      const testPatientId = dpSample[0].patient_id;
      console.log(`\n5. Looking for patient_id '${testPatientId}' in patients table:`);
      const [matchingPatient] = await connection.execute(
        "SELECT p.patient_id, p.user_id, u.name, u.email, u.phone, p.date_of_birth FROM patients p LEFT JOIN users u ON p.user_id = u.id WHERE p.patient_id = ?", 
        [testPatientId]
      );
      if (matchingPatient.length > 0) {
        console.log('   Found matching patient:', matchingPatient[0]);
      } else {
        console.log('   ❌ No matching patient found!');
      }
    }
    
    await connection.end();
    console.log('\n✅ Health predictions data check completed!');
    
  } catch (error) {
    console.error('❌ Error checking health predictions data:', error.message);
  }
}

checkHealthPredictionsData();
