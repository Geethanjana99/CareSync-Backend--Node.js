const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Function to get a fresh token
async function getToken() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'patient1@gmail.com',
            password: 'Password@123'
        });
        
        console.log('✅ Login successful');
        
        if (response.data.success && response.data.data && response.data.data.token) {
            return response.data.data.token;
        } else if (response.data.token) {
            // Handle case where token is at root level
            return response.data.token;
        } else {
            throw new Error('Login failed: ' + (response.data.message || 'No token received'));
        }
    } catch (error) {
        console.error('Login error:', error.message);
        if (error.response && error.response.data) {
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
}

async function testQueueLogic() {
    try {
        console.log('Getting fresh authentication token...');
        const token = await getToken();
        console.log('✅ Successfully authenticated');
        
        // Set authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('Testing Enhanced Queue Position and Estimated Time Logic...\n');
        
        console.log(`Testing queue position for authenticated patient`);
        
        const response = await axios.get(`${BASE_URL}/patients/queue/position`);
        
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
        
        // Analyze the response
        const data = response.data;
        
        if (data.success) {
            console.log('\n=== QUEUE ANALYSIS ===');
            
            if (data.data && Array.isArray(data.data)) {
                console.log(`Found ${data.data.length} appointments:`);
                
                data.data.forEach((apt, index) => {
                    console.log(`\nAppointment ${index + 1}:`);
                    console.log(`  Doctor: ${apt.doctorName}`);
                    console.log(`  Specialty: ${apt.specialty}`);
                    console.log(`  Queue Number: ${apt.queueNumber}`);
                    console.log(`  Current Serving: ${apt.currentNumber || apt.queueStatus?.current_number}`);
                    console.log(`  Position: ${apt.position}`);
                    console.log(`  Message: ${apt.message}`);
                    console.log(`  Estimated Wait: ${apt.estimatedWaitingTime} minutes`);
                    console.log(`  Currently Serving: ${apt.currentlyServing}`);
                    console.log(`  Next Patient: ${apt.nextPatient}`);
                    
                    // Check if the logic is working correctly
                    if (apt.nextPatient) {
                        console.log(`  ✅ "You are next" logic: Working correctly!`);
                    } else if (apt.currentlyServing) {
                        console.log(`  ✅ "Currently serving" logic: Working correctly!`);
                    } else if (apt.position > 0) {
                        console.log(`  ✅ Position calculation: ${apt.position} patients ahead`);
                        const expectedTime = apt.position * 15;
                        console.log(`  ✅ Estimated time: ${apt.estimatedWaitingTime} minutes (expected: ${expectedTime} minutes) - ${apt.estimatedWaitingTime === expectedTime ? '✅ CORRECT' : '❌ INCORRECT'}`);
                    }
                });
            } else {
                console.log('Unexpected response structure');
                console.log('Data:', JSON.stringify(data.data, null, 2));
            }
        } else {
            console.log('❌ Request failed:', data.message);
        }
        
    } catch (error) {
        console.error('❌ Error testing queue logic:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Test with different patient IDs to see various scenarios
async function testMultiplePatients() {
    try {
        console.log('\n=== TESTING AUTHENTICATED PATIENT QUEUE ===\n');
        
        // Get fresh token for this test
        const token = await getToken();
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log(`\n--- Testing Authenticated Patient Queue ---`);
        try {
            const response = await axios.get(`${BASE_URL}/patients/queue/position`);
            if (response.data.success) {
                const data = response.data.data;
                if (Array.isArray(data)) {
                    console.log(`Found ${data.length} appointments`);
                    data.forEach((apt, index) => {
                        console.log(`  Appointment ${index + 1}: Queue: ${apt.queueNumber}, Current: ${apt.currentNumber || apt.queueStatus?.current_number}, Position: ${apt.position}, Next: ${apt.nextPatient}, Serving: ${apt.currentlyServing}, Wait: ${apt.estimatedWaitingTime}min`);
                    });
                } else {
                    console.log(`  Unexpected data structure:`, data);
                }
            } else {
                console.log(`  ❌ ${response.data.message}`);
            }
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
        }
    } catch (error) {
        console.error('❌ Error testing multiple patients:', error.message);
    }
}// Run the tests
testQueueLogic().then(() => {
    return testMultiplePatients();
}).then(() => {
    console.log('\n✅ Testing completed!');
}).catch(error => {
    console.error('❌ Test failed:', error);
});