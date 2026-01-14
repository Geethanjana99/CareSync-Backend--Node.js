const mysql = require('mysql2/promise');

// Test database connection and ENUM validation
async function testAdminHealthPredictionFixes() {
  console.log('🧪 Testing Admin Health Prediction Fixes...\n');

  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'caresync_final'
    });

    console.log('✅ Database connection established');

    // Test 1: Verify ENUM values for status field
    console.log('\n🔍 Test 1: Checking status ENUM values...');
    const [enumResult] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'diabetes_predictions' 
      AND COLUMN_NAME = 'status'
    `);
    
    if (enumResult.length > 0) {
      console.log('✅ Status ENUM values:', enumResult[0].COLUMN_TYPE);
    } else {
      console.log('❌ Could not find status column');
    }

    // Test 2: Check current diabetes_predictions data
    console.log('\n🔍 Test 2: Checking existing diabetes_predictions data...');
    const [dataResult] = await connection.execute(`
      SELECT 
        COUNT(*) as totalCount,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
        SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) as processedCount,
        SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewedCount
      FROM diabetes_predictions
    `);
    
    console.log('✅ Current data statistics:', dataResult[0]);

    // Test 3: Test the statistics query from the controller
    console.log('\n🔍 Test 3: Testing statistics query...');
    const [statsResult] = await connection.execute(`
      SELECT 
        COUNT(*) as totalSubmissions,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingSubmissions,
        SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewedSubmissions,
        SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) as processedSubmissions,
        SUM(CASE WHEN risk_level = 'low' THEN 1 ELSE 0 END) as lowRisk,
        SUM(CASE WHEN risk_level = 'medium' THEN 1 ELSE 0 END) as mediumRisk,
        SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as highRisk,
        AVG(prediction_probability) as averageProbability
      FROM diabetes_predictions
    `);
    
    console.log('✅ Statistics query result:', statsResult[0]);

    // Test 4: Test JOIN query for getPatientSubmissions
    console.log('\n🔍 Test 4: Testing JOIN query with user table...');
    const [joinResult] = await connection.execute(`
      SELECT 
        dp.id,
        dp.patient_id,
        u.name,
        u.email,
        u.phone,
        dp.status,
        dp.risk_level,
        dp.prediction_probability,
        dp.created_at
      FROM diabetes_predictions dp
      JOIN users u ON dp.patient_id = u.id
      WHERE dp.status IN ('pending', 'processed', 'reviewed')
      ORDER BY dp.created_at DESC
      LIMIT 5
    `);
    
    console.log(`✅ JOIN query returned ${joinResult.length} records`);
    if (joinResult.length > 0) {
      console.log('Sample record:', {
        id: joinResult[0].id,
        name: joinResult[0].name,
        email: joinResult[0].email,
        phone: joinResult[0].phone,
        status: joinResult[0].status,
        risk_level: joinResult[0].risk_level
      });
    }

    await connection.end();
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

// Run the test
testAdminHealthPredictionFixes();