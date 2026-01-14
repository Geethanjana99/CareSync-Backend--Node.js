const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing login...');
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'patient1@gmail.com',
            password: 'Password@123'
        });
        
        console.log('Login response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('Login error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testLogin();