#!/usr/bin/env node
/**
 * Test Diabetes Prediction Service
 * Quick test to verify the diabetes prediction service is working correctly
 */

const diabetesPredictionService = require('./services/diabetesPredictionService');

async function testDiabetesPrediction() {
  console.log('🧪 Testing Diabetes Prediction Service...\n');

  const testCases = [
    {
      name: 'Low Risk Patient',
      data: { pregnancies: 1, glucose: 85, bmi: 22.5, age: 25, insulin: 80 }
    },
    {
      name: 'Medium Risk Patient', 
      data: { pregnancies: 2, glucose: 140, bmi: 28.1, age: 35, insulin: 150 }
    },
    {
      name: 'High Risk Patient',
      data: { pregnancies: 6, glucose: 180, bmi: 35.0, age: 45, insulin: 200 }
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`🔍 Testing: ${testCase.name}`);
      console.log(`   Input: ${JSON.stringify(testCase.data)}`);
      
      const result = await diabetesPredictionService.predict(testCase.data);
      
      console.log(`   ✅ Result: Prediction=${result.prediction}, Probability=${(result.probability * 100).toFixed(1)}%`);
      console.log(`   Risk Level: ${result.probability > 0.7 ? 'High' : result.probability > 0.4 ? 'Medium' : 'Low'}\n`);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  // Test invalid input
  console.log('🔍 Testing: Invalid Input');
  try {
    await diabetesPredictionService.predict({ glucose: 'invalid' });
  } catch (error) {
    console.log(`   ✅ Validation working: ${error.message}\n`);
  }

  // Test model info
  console.log('🔍 Testing: Model Info');
  try {
    const info = await diabetesPredictionService.getModelInfo();
    console.log(`   ✅ Model Info: ${JSON.stringify(info, null, 2)}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  console.log('🎉 Diabetes Prediction Service test completed!');
}

if (require.main === module) {
  testDiabetesPrediction().catch(console.error);
}

module.exports = { testDiabetesPrediction };
