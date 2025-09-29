const mysql = require('mysql2/promise');

async function testFilteredQuery() {
  try {
    console.log('🧪 Testing the filtered health predictions query...\n');
    
    const connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });

    console.log('✅ Connected to database');

    // Test the NEW filtered query that should only return records with valid patient data
    const newQuery = `
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
      WHERE (u.id IS NOT NULL OR u2.id IS NOT NULL)
      ORDER BY dp.created_at DESC 
      LIMIT 10 OFFSET 0
    `;

    console.log('🔍 Testing NEW filtered query (should only show records with valid patient data)...');
    const filteredResults = await connection.execute(newQuery);
    
    console.log(`\n📊 Filtered Results: ${filteredResults[0].length} records found`);
    console.log('=' .repeat(80));

    filteredResults[0].forEach((row, index) => {
      console.log(`\n📝 Record ${index + 1}:`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Patient ID: ${row.patient_id}`);
      console.log(`   Patient Name: ${row.patient_name || 'NULL'}`);
      console.log(`   Patient Email: ${row.patient_email || 'NULL'}`);
      console.log(`   Patient Phone: ${row.patient_phone || 'NULL'}`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Risk Level: ${row.risk_level}`);
      console.log(`   Created: ${row.created_at}`);
    });

    // Compare with old query (no filtering)
    const oldQuery = `
      SELECT 
        dp.id,
        dp.patient_id,
        dp.status,
        dp.risk_level,
        COALESCE(u.name, u2.name) as patient_name,
        COALESCE(u.email, u2.email) as patient_email
      FROM diabetes_predictions dp
      LEFT JOIN patients p ON dp.patient_id = p.patient_id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN users u2 ON dp.patient_id = u2.id
      LEFT JOIN patients p2 ON u2.id = p2.user_id
      ORDER BY dp.created_at DESC
    `;

    console.log('\n\n🔍 Comparing with OLD unfiltered query (shows all records including orphaned)...');
    const allResults = await connection.execute(oldQuery);
    
    console.log(`📊 Unfiltered Results: ${allResults[0].length} records found`);
    console.log('=' .repeat(80));

    allResults[0].forEach((row, index) => {
      const hasValidPatient = row.patient_name !== null;
      console.log(`\n📝 Record ${index + 1}: ${hasValidPatient ? '✅ VALID' : '❌ ORPHANED'}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Patient ID: ${row.patient_id}`);
      console.log(`   Patient Name: ${row.patient_name || 'NULL'}`);
      console.log(`   Patient Email: ${row.patient_email || 'NULL'}`);
    });

    console.log('\n🎯 Summary:');
    console.log(`   Total records in database: ${allResults[0].length}`);
    console.log(`   Records with valid patient data: ${filteredResults[0].length}`);
    console.log(`   Orphaned records filtered out: ${allResults[0].length - filteredResults[0].length}`);

    if (filteredResults[0].length > 0 && filteredResults[0].every(r => r.patient_name !== null)) {
      console.log('\n🎉 SUCCESS: Filtering is working! All returned records have valid patient data.');
    } else {
      console.log('\n⚠️  Issue: Some records still have missing patient data.');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFilteredQuery();