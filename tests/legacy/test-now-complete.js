const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Function to get patient token
async function getPatientToken() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'patient1@gmail.com',
            password: 'Password@123'
        });
        
        if (response.data.success && response.data.data && response.data.data.token) {
            return response.data.data.token;
        }
        throw new Error('Failed to get patient token');
    } catch (error) {
        console.error('Patient login error:', error.message);
        throw error;
    }
}

// Function to get doctor token  
async function getDoctorToken() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@gmail.com',
            password: 'admin123'
        });
        
        if (response.data.success && response.data.data && response.data.data.token) {
            return response.data.data.token;
        }
        throw new Error('Failed to get admin token');
    } catch (error) {
        console.error('Admin login error:', error.message);
        throw error;
    }
}

async function testNowLogicScenarios() {
    try {
        console.log('=== TESTING "NOW" LOGIC SCENARIOS ===\n');
        
        // Get patient token and check current position
        console.log('1. Getting patient current position...');
        const patientToken = await getPatientToken();
        axios.defaults.headers.common['Authorization'] = `Bearer ${patientToken}`;
        
        let response = await axios.get(`${BASE_URL}/patients/queue/position`);
        let appointment = response.data.data[0];
        
        console.log(`   Patient Queue Number: ${appointment.queueNumber}`);
        console.log(`   Current Serving: ${appointment.currentNumber}`);
        console.log(`   Status: ${appointment.message}`);
        console.log(`   Estimated Time: ${appointment.estimatedWaitingTime}`);
        
        // Get doctor token
        console.log('\n2. Getting admin access...');
        const doctorToken = await getDoctorToken();
        
        // Update current serving number to match patient's queue number
        console.log('\n3. Updating current serving number to test "Your turn" scenario...');
        axios.defaults.headers.common['Authorization'] = `Bearer ${doctorToken}`;
        
        const doctorId = appointment.doctorId;
        const updateResponse = await axios.put(`${BASE_URL}/doctors/queue/current`, {
            doctorId: doctorId,
            currentNumber: appointment.queueNumber, // Set to patient's queue number
            date: new Date().toISOString().split('T')[0]
        });
        
        if (updateResponse.data.success) {
            console.log(`   ✅ Updated current serving to: ${appointment.queueNumber}`);
        } else {
            console.log(`   ❌ Failed to update: ${updateResponse.data.message}`);
        }
        
        // Test with patient token again
        console.log('\n4. Testing patient position after update...');
        axios.defaults.headers.common['Authorization'] = `Bearer ${patientToken}`;
        
        response = await axios.get(`${BASE_URL}/patients/queue/position`);
        appointment = response.data.data[0];
        
        console.log(`   Patient Queue Number: ${appointment.queueNumber}`);
        console.log(`   Current Serving: ${appointment.currentNumber}`);
        console.log(`   Currently Serving: ${appointment.currentlyServing}`);
        console.log(`   Status: ${appointment.message}`);
        console.log(`   Estimated Time: ${appointment.estimatedWaitingTime}`);
        
        // Analyze the result
        console.log('\n=== ANALYSIS ===');
        if (appointment.currentlyServing && appointment.estimatedWaitingTime === "now") {
            console.log('✅ "NOW" LOGIC WORKING: When current_number = queue_number, shows "now"');
        } else {
            console.log('❌ "NOW" LOGIC ISSUE:');
            console.log(`   Currently Serving: ${appointment.currentlyServing}`);
            console.log(`   Estimated Time: ${appointment.estimatedWaitingTime} (should be "now")`);
        }
        
        // Reset current serving number back to 0 for cleanup
        console.log('\n5. Resetting current serving number...');
        axios.defaults.headers.common['Authorization'] = `Bearer ${doctorToken}`;
        
        await axios.put(`${BASE_URL}/doctors/queue/current`, {
            doctorId: doctorId,
            currentNumber: 0,
            date: new Date().toISOString().split('T')[0]
        });
        
        console.log('   ✅ Reset current serving to 0');
        
    } catch (error) {
        console.error('❌ Error testing now logic:', error.message);
        if (error.response && error.response.data) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testNowLogicScenarios().then(() => {
    console.log('\n✅ Testing completed!');
}).catch(error => {
    console.error('❌ Test failed:', error);
});