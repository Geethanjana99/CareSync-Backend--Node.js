#!/usr/bin/env node
/**
 * Test Diabetes Prediction Database Fix
 * Verify that the column mapping fix works correctly
 */

const DiabetesPrediction = require('./models/DiabetesPrediction');

async function testDatabaseFix() {
  console.log('🧪 Testing Diabetes Prediction Database Fix...\n');

  try {
    // Create a test prediction
    console.log('📝 Creating test prediction...');
    const testPrediction = await DiabetesPrediction.create({
      patientId: '12345678-1234-1234-1234-123456789012', // Using a dummy UUID
      adminId: '87654321-4321-4321-4321-210987654321',   // Using a dummy UUID
      pregnancies: 2,
      glucose: 140,
      bmi: 28.1,
      age: 35,
      insulin: 150,
      notes: 'Test prediction for database fix'
    });

    console.log(`✅ Test prediction created with ID: ${testPrediction.id}`);

    // Test updating with camelCase properties
    console.log('🔄 Testing update with camelCase properties...');
    await testPrediction.update({
      predictionResult: 1,
      predictionProbability: 0.75,
      riskLevel: 'high',
      status: 'processed',
      processedAt: new Date(),
      notes: 'Test prediction updated successfully'
    });

    console.log('✅ Update with camelCase properties successful');

    // Reload and verify
    await testPrediction.reload();
    console.log(`📊 Updated prediction result: ${testPrediction.predictionResult}`);
    console.log(`📊 Updated probability: ${testPrediction.predictionProbability}`);
    console.log(`📊 Updated risk level: ${testPrediction.riskLevel}`);
    console.log(`📊 Updated status: ${testPrediction.status}`);

    // Clean up - delete the test record
    console.log('🧹 Cleaning up test data...');
    const { mysqlConnection } = require('./config/mysql');
    await mysqlConnection.query('DELETE FROM diabetes_predictions WHERE id = ?', [testPrediction.id]);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Database fix test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

if (require.main === module) {
  testDatabaseFix().catch(console.error);
}

module.exports = { testDatabaseFix };
