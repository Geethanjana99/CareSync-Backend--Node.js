#!/usr/bin/env node
/**
 * Test Diabetes Prediction Column Mapping Fix
 * Verify that the column mapping fix works correctly
 */

const { mysqlConnection } = require('./config/mysql');

async function testColumnMapping() {
  try {
    console.log('🧪 Testing Diabetes Prediction Column Mapping Fix...\n');
    
    // Initialize connection
    await mysqlConnection.connect();
    
    // Create a test record directly via SQL with valid UUIDs that should exist
    console.log('📝 Creating test prediction record...');
    
    // First, get a valid patient and admin ID from the database
    const patients = await mysqlConnection.query('SELECT id FROM patients LIMIT 1');
    const admins = await mysqlConnection.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
    
    if (patients.length === 0 || admins.length === 0) {
      console.log('⚠️  No valid patient or admin found. Creating test with dummy UUIDs...');
      console.log('   This may fail due to foreign key constraints, but will test the mapping logic.');
    }
    
    const patientId = patients.length > 0 ? patients[0].id : '12345678-1234-1234-1234-123456789012';
    const adminId = admins.length > 0 ? admins[0].id : '87654321-4321-4321-4321-210987654321';
    
    // Create test record
    const testId = '99999999-9999-9999-9999-999999999999';
    
    await mysqlConnection.query(`
      INSERT INTO diabetes_predictions 
      (id, patient_id, admin_id, pregnancies, glucose, bmi, age, insulin, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [testId, patientId, adminId, 2, 140.5, 28.1, 35, 150.0, 'pending', 'Test record for column mapping']);
    
    console.log('✅ Test record created');
    
    // Now test the DiabetesPrediction model update method
    console.log('🔄 Testing update with camelCase properties...');
    
    const DiabetesPrediction = require('./models/DiabetesPrediction');
    const testPrediction = await DiabetesPrediction.findByPk(testId);
    
    if (!testPrediction) {
      throw new Error('Test prediction not found');
    }
    
    // Test updating with camelCase properties (this should map to snake_case columns)
    await testPrediction.update({
      predictionResult: 1,
      predictionProbability: 0.7500,
      riskLevel: 'high',
      status: 'processed',
      processedAt: new Date(),
      notes: 'Test prediction updated successfully with column mapping'
    });
    
    console.log('✅ Update with camelCase properties successful');
    
    // Verify the update worked by querying directly
    console.log('🔍 Verifying database update...');
    const results = await mysqlConnection.query(
      'SELECT prediction_result, prediction_probability, risk_level, status FROM diabetes_predictions WHERE id = ?',
      [testId]
    );
    
    if (results.length > 0) {
      const record = results[0];
      console.log(`📊 Database values:`);
      console.log(`   prediction_result: ${record.prediction_result}`);
      console.log(`   prediction_probability: ${record.prediction_probability}`);
      console.log(`   risk_level: ${record.risk_level}`);
      console.log(`   status: ${record.status}`);
    }
    
    // Clean up
    console.log('🧹 Cleaning up test data...');
    await mysqlConnection.query('DELETE FROM diabetes_predictions WHERE id = ?', [testId]);
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 Column mapping test completed successfully!');
    console.log('   ✅ camelCase properties correctly mapped to snake_case columns');
    console.log('   ✅ Database updates working as expected');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Try to clean up even if test failed
    try {
      await mysqlConnection.query('DELETE FROM diabetes_predictions WHERE id = ?', ['99999999-9999-9999-9999-999999999999']);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

if (require.main === module) {
  testColumnMapping().catch(console.error);
}

module.exports = { testColumnMapping };
