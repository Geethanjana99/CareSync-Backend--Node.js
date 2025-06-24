const { mysqlConnection } = require('./config/mysql');

async function testLogin() {
  console.log('Testing login and API access...\n');

  try {
    await mysqlConnection.connect();

    // Test login with a patient account
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },      body: JSON.stringify({
        email: 'patient.test.new@example.com',
        password: 'Password123!' // Correct test password
      })
    });    if (!loginResponse.ok) {
      console.log('❌ Login failed with Password123!, trying "password"...');
      
      const loginResponse2 = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'patient.test.new@example.com',
          password: 'password'
        })
      });

      if (!loginResponse2.ok) {
        const errorText = await loginResponse2.text();
        console.log('❌ Login failed with "password" too:', errorText);
        console.log('Need to check what the actual password is for test users.');
        return;
      }

      const loginData2 = await loginResponse2.json();
      console.log('Login response data:', loginData2);
      var authToken = loginData2.data?.token || loginData2.token;
      console.log('✅ Login successful with "password"');
    } else {
      const loginData = await loginResponse.json();
      console.log('Login response data:', loginData);
      var authToken = loginData.data?.token || loginData.token;
      console.log('✅ Login successful with "Password123!"');
    }

    // Test the available slots endpoint with authentication
    console.log('\n2. Testing available slots API...');
    const slotsResponse = await fetch('http://localhost:5000/api/appointments/available-slots?doctorId=26b6953c-871e-4873-8cd7-827d6290cd83&date=2025-06-26', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!slotsResponse.ok) {
      const errorText = await slotsResponse.text();
      console.log('❌ Slots API failed:', errorText);
      return;
    }

    const slotsData = await slotsResponse.json();
    console.log('✅ Slots API successful:', slotsData);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLogin().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
