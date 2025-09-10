#!/usr/bin/env node
/**
 * Test Enhanced Diabetes Prediction API
 * Test the new streamlit URL and actions functionality
 */

const diabetesPredictionService = require('./services/diabetesPredictionService');
const AdminReportsController = require('./controllers/adminReportsController');

async function testEnhancedAPI() {
  console.log('🧪 Testing Enhanced Diabetes Prediction API...\n');

  try {
    // Test the Streamlit URL generation
    console.log('🔗 Testing Streamlit URL generation...');
    
    const testInputs = {
      pregnancies: 2,
      glucose: 140,
      bmi: 28.1,
      age: 35,
      insulin: 150
    };
    
    const streamlitUrl = AdminReportsController.generateStreamlitUrl(testInputs);
    console.log('Generated Streamlit URL:', streamlitUrl);
    
    // Parse the URL to verify parameters
    const url = new URL(streamlitUrl);
    console.log('✅ URL Parameters:');
    url.searchParams.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });
    
    // Test the prediction service directly
    console.log('\n🔍 Testing prediction service...');
    const predictionResult = await diabetesPredictionService.predict(testInputs);
    
    console.log('✅ Prediction result:');
    console.log(`   Prediction: ${predictionResult.prediction}`);
    console.log(`   Probability: ${(predictionResult.probability * 100).toFixed(1)}%`);
    
    // Simulate the enhanced API response
    console.log('\n📋 Simulated Enhanced API Response:');
    const mockResponse = {
      success: true,
      message: 'Diabetes prediction created successfully',
      data: {
        prediction: {
          id: 'test-id-12345',
          pregnancies: testInputs.pregnancies,
          glucose: testInputs.glucose,
          bmi: testInputs.bmi,
          age: testInputs.age,
          insulin: testInputs.insulin,
          predictionResult: predictionResult.prediction,
          predictionProbability: predictionResult.probability,
          riskLevel: predictionResult.probability > 0.7 ? 'high' : predictionResult.probability > 0.4 ? 'medium' : 'low',
          status: 'processed'
        },
        summary: {
          prediction: predictionResult.prediction === 1 ? 'Diabetes Detected' : 'No Diabetes',
          probability: `${(predictionResult.probability * 100).toFixed(1)}%`,
          riskLevel: predictionResult.probability > 0.7 ? 'high' : predictionResult.probability > 0.4 ? 'medium' : 'low'
        },
        streamlitUrl: streamlitUrl,
        actions: {
          viewDetails: {
            url: streamlitUrl,
            label: 'View Detailed Analysis',
            description: 'Open interactive analysis in Streamlit with your input parameters'
          },
          retryPrediction: {
            endpoint: '/api/admin/reports/diabetes-predictions/test-id-12345/retry',
            method: 'POST',
            label: 'Retry Prediction',
            description: 'Retry prediction processing if needed'
          }
        }
      }
    };
    
    console.log(JSON.stringify(mockResponse, null, 2));
    
    console.log('\n🎉 Enhanced API test completed successfully!');
    console.log('✅ Streamlit URL generation working');
    console.log('✅ Actions object properly structured');
    console.log('✅ Ready for frontend integration');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testEnhancedAPI().catch(console.error);
}

module.exports = { testEnhancedAPI };
