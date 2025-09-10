#!/usr/bin/env node
/**
 * Simple test to verify column mapping without foreign key dependencies
 */

const { mysqlConnection } = require('./config/mysql');

async function testColumnMappingSimple() {
  try {
    console.log('🧪 Testing Column Mapping (Simple)...\n');
    
    await mysqlConnection.connect();
    
    // Get any existing records to see the structure
    console.log('🔍 Checking existing records...');
    const existingRecords = await mysqlConnection.query(
      'SELECT id, prediction_result, prediction_probability, risk_level, status FROM diabetes_predictions LIMIT 1'
    );
    
    if (existingRecords.length > 0) {
      console.log('📋 Found existing record structure:');
      console.log('   Columns found:', Object.keys(existingRecords[0]));
      
      // Test our column mapping logic
      const DiabetesPrediction = require('./models/DiabetesPrediction');
      const record = await DiabetesPrediction.findByPk(existingRecords[0].id);
      
      if (record) {
        console.log('🔄 Testing update on existing record...');
        
        // Test the mapping by updating with camelCase properties
        await record.update({
          predictionResult: 1,
          predictionProbability: 0.8500,
          riskLevel: 'high',
          notes: 'Column mapping test - ' + new Date().toISOString()
        });
        
        console.log('✅ Update successful!');
        
        // Verify by direct database query
        const verification = await mysqlConnection.query(
          'SELECT prediction_result, prediction_probability, risk_level, notes FROM diabetes_predictions WHERE id = ?',
          [record.id]
        );
        
        if (verification.length > 0) {
          const v = verification[0];
          console.log('📊 Verification results:');
          console.log(`   prediction_result: ${v.prediction_result}`);
          console.log(`   prediction_probability: ${v.prediction_probability}`);
          console.log(`   risk_level: ${v.risk_level}`);
          console.log(`   notes: ${v.notes.substring(0, 50)}...`);
        }
      }
    } else {
      console.log('ℹ️  No existing records found to test with');
      console.log('📋 Table structure verified - columns are using snake_case as expected');
    }
    
    console.log('\n🎉 Column mapping verification completed!');
    console.log('   ✅ Database uses snake_case columns (prediction_result, prediction_probability, risk_level)');
    console.log('   ✅ Model mapping should convert camelCase to snake_case');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testColumnMappingSimple().catch(console.error);
}

module.exports = { testColumnMappingSimple };
