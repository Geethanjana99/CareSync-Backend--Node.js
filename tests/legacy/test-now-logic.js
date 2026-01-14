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
            return response.data.token;
        } else {
            throw new Error('Login failed: ' + (response.data.message || 'No token received'));
        }
    } catch (error) {
        console.error('Login error:', error.message);
        throw error;
    }
}

// Test the "now" logic by checking different queue scenarios
async function testNowLogic() {
    try {
        console.log('Testing "now" logic for estimated waiting time...\n');
        
        const token = await getToken();
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Get current queue position
        console.log('=== CURRENT QUEUE STATUS ===');
        const response = await axios.get(`${BASE_URL}/patients/queue/position`);
        
        if (response.data.success) {
            const appointments = response.data.data;
            
            appointments.forEach((apt, index) => {
                console.log(`\nAppointment ${index + 1}:`);
                console.log(`  Doctor: ${apt.doctorName}`);
                console.log(`  Queue Number: ${apt.queueNumber}`);
                console.log(`  Current Serving: ${apt.currentNumber}`);
                console.log(`  Position: ${apt.position}`);
                console.log(`  Currently Serving: ${apt.currentlyServing}`);
                console.log(`  Next Patient: ${apt.nextPatient}`);
                console.log(`  Estimated Wait: ${apt.estimatedWaitingTime}`);
                console.log(`  Message: ${apt.message}`);
                
                // Analyze the logic
                console.log('\n  === LOGIC ANALYSIS ===');
                if (apt.currentlyServing) {
                    console.log(`  ✅ Your Turn: current_number (${apt.currentNumber}) = queue_number (${apt.queueNumber})`);
                    console.log(`  ✅ Estimated Time: ${apt.estimatedWaitingTime} ${apt.estimatedWaitingTime === "now" ? "✅ CORRECT" : "❌ SHOULD BE 'now'"}`);
                } else if (apt.nextPatient) {
                    console.log(`  ✅ You Are Next: current_number (${apt.currentNumber}) + 1 = queue_number (${apt.queueNumber})`);
                    console.log(`  ✅ Estimated Time: ${apt.estimatedWaitingTime} minutes ${apt.estimatedWaitingTime === 15 ? "✅ CORRECT" : "❌ SHOULD BE 15"}`);
                } else {
                    const expectedPosition = apt.queueNumber - parseInt(apt.currentNumber);
                    const expectedTime = expectedPosition * 15;
                    console.log(`  ✅ Waiting: position = ${apt.queueNumber} - ${apt.currentNumber} = ${expectedPosition}`);
                    console.log(`  ✅ Estimated Time: ${apt.estimatedWaitingTime} minutes (expected: ${expectedTime}) ${apt.estimatedWaitingTime === expectedTime ? "✅ CORRECT" : "❌ INCORRECT"}`);
                }
            });
        } else {
            console.log('❌ Failed to get queue position:', response.data.message);
        }
        
    } catch (error) {
        console.error('❌ Error testing now logic:', error.message);
        if (error.response && error.response.data) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Test to show what happens with different queue numbers
async function demonstrateLogic() {
    console.log('\n=== DEMONSTRATING LOGIC ===\n');
    
    console.log('Queue Logic Explanation:');
    console.log('1. When current_number = your_queue_number → "Your turn" → estimated_time = "now"');
    console.log('2. When current_number + 1 = your_queue_number → "You are next" → estimated_time = 15 minutes');
    console.log('3. Otherwise → position = your_queue_number - current_number → estimated_time = position * 15 minutes');
    
    console.log('\nExamples:');
    console.log('- Current serving: 1, Your queue: 1 → Your turn, Wait: "now"');
    console.log('- Current serving: 0, Your queue: 1 → You are next, Wait: 15 min');
    console.log('- Current serving: 0, Your queue: 3 → Position: 3, Wait: 45 min');
    console.log('- Current serving: 2, Your queue: 5 → Position: 3, Wait: 45 min');
}

// Run the tests
testNowLogic().then(() => {
    return demonstrateLogic();
}).then(() => {
    console.log('\n✅ Testing completed!');
}).catch(error => {
    console.error('❌ Test failed:', error);
});