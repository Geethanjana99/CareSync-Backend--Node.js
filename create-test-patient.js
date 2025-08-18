const axios = require('axios');

async function createTestPatient() {
  try {
    console.log('👤 Creating test patient...');
    
    const patientData = {
      name: 'Test Patient',
      email: `testpatient${Date.now()}@example.com`,
      password: 'Patient123!',
      phone: '0771234567',
      role: 'patient'
    };
    
    const response = await axios.post('http://localhost:5000/api/auth/register', patientData);
    
    if (response.data.success) {
      console.log('✅ Test patient created successfully!');
      console.log('📝 Patient Email:', patientData.email);
      console.log('📝 Patient Password:', patientData.password);
      console.log('\n🔗 You can now log in at: http://localhost:5173/login');
      console.log('📋 Then navigate to: http://localhost:5173/patient/book-appointment');
    } else {
      console.log('❌ Failed to create patient:', response.data.message);
    }
    
  } catch (error) {
    if (error.response && error.response.data) {
      console.error('❌ Registration failed:', error.response.data.message);
      if (error.response.data.errors) {
        console.log('📋 Validation errors:', error.response.data.errors);
      }
    } else {
      console.error('❌ Error creating patient:', error.message);
    }
  }
}

createTestPatient();
