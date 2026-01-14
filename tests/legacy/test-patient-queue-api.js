const axios = require('axios');

async function testPatientQueueAPI() {
  try {
    console.log('🔍 Testing Patient Queue Position API...');
    
    // First, let's check available patients
    const { mysqlConnection } = require('./config/mysql');
    
    const patientsQuery = `
      SELECT u.id, u.name, u.email
      FROM users u
      JOIN patients p ON u.id = p.user_id
      LIMIT 5
    `;
    
    const patients = await mysqlConnection.query(patientsQuery);
    console.log('📋 Available patients:', patients);
    
    if (patients.length > 0) {
      const patient = patients[0];
      console.log(`\n🧑‍⚕️ Testing with patient: ${patient.name} (ID: ${patient.id})`);
      
      // Test login to get token
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: patient.email,
        password: 'testpass' // Assuming test password
      });
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.token;
        
        // Test queue position API
        const queueResponse = await axios.get('http://localhost:5000/api/patients/queue/position', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('📊 Queue Position API Response:');
        console.log(JSON.stringify(queueResponse.data, null, 2));
      } else {
        console.log('❌ Login failed:', loginResponse.data);
      }
    }
    
    await mysqlConnection.end();
  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
  }
}

testPatientQueueAPI();