const jwt = require('jsonwebtoken');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugToken() {
  try {
    console.log('Debug token issue...');
    
    // Login to get token
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
    
    if (loginResponse.status === 200) {
      const loginData = await loginResponse.json();
      console.log('Login successful');
      console.log('Token:', loginData.data.token);
      console.log('Token length:', loginData.data.token.length);
      
      // Try to decode the token
      try {
        const decoded = jwt.decode(loginData.data.token, { complete: true });
        console.log('Decoded token:', decoded);
        
        // Try to verify it
        const verified = jwt.verify(loginData.data.token, process.env.JWT_SECRET);
        console.log('Verified token:', verified);
      } catch (error) {
        console.log('Token decode/verify error:', error.message);
      }
      
      // Test the token manually
      const testHeader = loginData.data.token.split('.')[0];
      console.log('Token header:', testHeader);
      
      try {
        const headerDecoded = Buffer.from(testHeader, 'base64').toString();
        console.log('Header decoded:', headerDecoded);
      } catch (err) {
        console.log('Header decode error:', err.message);
      }
    } else {
      console.log('Login failed');
    }
    
  } catch (error) {
    console.error('Error debugging token:', error);
  }
}

debugToken();
