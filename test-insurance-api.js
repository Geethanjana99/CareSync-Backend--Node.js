// Test the insurance claims API endpoint
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/insurance-claims',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
};

console.log('Testing insurance claims API endpoint...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('Response:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        console.log(`✅ Successfully fetched ${result.data.length} insurance claims`);
        result.data.forEach((claim, index) => {
          console.log(`${index + 1}. ${claim.id} - ${claim.patient_name} - $${claim.amount}`);
        });
      } else {
        console.log('❌ API returned error:', result.error);
      }
    } catch (error) {
      console.log('❌ Failed to parse JSON response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('Make sure the backend server is running on port 5000');
});

req.end();
