const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testApiDirectly() {
  try {
    console.log('Testing API directly...');
    
    // First, let's try to login and get a token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testdoctor@example.com',
        password: 'testpass123'
      })
    });
    
    console.log('Login response status:', loginResponse.status);
    
    if (loginResponse.status === 200) {
      const loginData = await loginResponse.json();
      console.log('Login successful:', loginData);
      
      // Now try to get today's appointments
      const appointmentsResponse = await fetch('http://localhost:5000/api/doctor/appointments/today', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.data.token}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Appointments response status:', appointmentsResponse.status);
      
      if (appointmentsResponse.status === 200) {
        const appointmentsData = await appointmentsResponse.json();
        console.log('Appointments data:', appointmentsData);
      } else {
        const errorData = await appointmentsResponse.text();
        console.log('Appointments error:', errorData);
      }
    } else {
      const errorData = await loginResponse.text();
      console.log('Login error:', errorData);
    }
    
  } catch (error) {
    console.error('Error testing API directly:', error);
  }
}

testApiDirectly();
