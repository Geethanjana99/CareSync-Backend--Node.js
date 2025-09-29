// Test script for queue management workflow
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let doctorToken = '';
let patientToken = '';

// Test credentials
const doctorCredentials = {
    email: 'doctor@gmail.com',
    password: 'Passwordd123!'
};

const patientCredentials = {
    email: 'kashmila@gmail.com', 
    password: 'Password123!'
};

async function login(credentials, userType) {
    try {
        console.log(`🔐 Logging in ${userType}...`);
        const response = await axios.post(`${API_BASE}/auth/login`, credentials);
        
        if (response.data.success) {
            console.log(`✅ ${userType} login successful`);
            return response.data.token;
        } else {
            console.log(`❌ ${userType} login failed:`, response.data.message);
            return null;
        }
    } catch (error) {
        console.log(`❌ ${userType} login error:`, error.response?.data?.message || error.message);
        return null;
    }
}

async function testDoctorEndpoints() {
    console.log('\n📋 Testing Doctor Endpoints:');
    console.log('================================');

    try {
        // Get today's appointments
        console.log('1. Getting today\'s appointments...');
        const appointmentsResponse = await axios.get(`${API_BASE}/doctors/appointments/today`, {
            headers: { Authorization: `Bearer ${doctorToken}` }
        });
        
        if (appointmentsResponse.data.success) {
            console.log(`✅ Found ${appointmentsResponse.data.data?.appointments?.length || 0} appointments today`);
            appointmentsResponse.data.data?.appointments?.forEach((apt, i) => {
                console.log(`   ${i+1}. Patient: Queue #${apt.queueNumber} - Payment: ${apt.paymentStatus} - Status: ${apt.status}`);
            });
        } else {
            console.log('❌ Failed to get appointments:', appointmentsResponse.data.message);
        }

        // Get queue status
        console.log('\n2. Getting queue status...');
        const queueStatusResponse = await axios.get(`${API_BASE}/doctors/queue/status`, {
            headers: { Authorization: `Bearer ${doctorToken}` }
        });
        
        if (queueStatusResponse.data.success) {
            const status = queueStatusResponse.data.data;
            console.log(`✅ Queue Status - Active: ${status?.is_active || false}`);
            if (status) {
                console.log(`   Current Number: ${status.current_number}`);
                console.log(`   Current Emergency: ${status.current_emergency_number}`);
            }
        } else {
            console.log('❌ Failed to get queue status:', queueStatusResponse.data.message);
        }

        // Start queue
        console.log('\n3. Starting queue...');
        const startQueueResponse = await axios.post(`${API_BASE}/doctors/queue/start`, {}, {
            headers: { Authorization: `Bearer ${doctorToken}` }
        });
        
        if (startQueueResponse.data.success) {
            console.log('✅ Queue started successfully');
            console.log(`   Paid patients count: ${startQueueResponse.data.data?.paidPatientsCount || 0}`);
        } else {
            console.log('❌ Failed to start queue:', startQueueResponse.data.message);
        }

        // Get queue after starting (should filter paid patients only)
        console.log('\n4. Getting queue after start (paid patients only)...');
        const queueResponse = await axios.get(`${API_BASE}/doctors/queue`, {
            headers: { Authorization: `Bearer ${doctorToken}` }
        });
        
        if (queueResponse.data.success) {
            const queue = queueResponse.data.data;
            console.log(`✅ Queue retrieved - Showing ${queue.displayedPatients} paid patients out of ${queue.totalPatients} total`);
            console.log(`   Filtered: ${queue.isFiltered ? 'Yes' : 'No'}`);
            queue.appointments?.forEach((apt, i) => {
                console.log(`   ${i+1}. Queue #${apt.queue_number} - ${apt.patient_name} - Payment: ${apt.payment_status}`);
            });
        } else {
            console.log('❌ Failed to get queue:', queueResponse.data.message);
        }

        // Get next paid patient
        console.log('\n5. Getting next paid patient...');
        const nextPatientResponse = await axios.get(`${API_BASE}/doctors/queue/next-patient`, {
            headers: { Authorization: `Bearer ${doctorToken}` }
        });
        
        if (nextPatientResponse.data.success) {
            const patient = nextPatientResponse.data.data.patient;
            console.log(`✅ Next paid patient: Queue #${patient.queue_number} - ${patient.patient_name}`);
            console.log(`   Type: ${nextPatientResponse.data.data.type}`);
        } else {
            console.log('❌ Failed to get next patient:', nextPatientResponse.data.message);
        }

    } catch (error) {
        console.log('❌ Doctor endpoint error:', error.response?.data?.message || error.message);
    }
}

async function testPatientEndpoints() {
    console.log('\n👤 Testing Patient Endpoints:');
    console.log('================================');

    try {
        // Get queue position
        console.log('1. Getting queue position...');
        const positionResponse = await axios.get(`${API_BASE}/patients/queue/position?doctorId=1`, {
            headers: { Authorization: `Bearer ${patientToken}` }
        });
        
        if (positionResponse.data.success) {
            const position = positionResponse.data.data;
            console.log(`✅ Queue position retrieved`);
            console.log(`   Queue Number: ${position.queueNumber}`);
            console.log(`   Position: ${position.position}`);
            console.log(`   Payment Status: ${position.paymentStatus}`);
            console.log(`   Queue Active: ${position.queueActive}`);
            console.log(`   Message: ${position.message}`);
        } else {
            console.log('❌ Failed to get position:', positionResponse.data.message);
        }

        // Get patient notification
        console.log('\n2. Getting patient notification...');
        const notificationResponse = await axios.get(`${API_BASE}/patients/queue/notification?doctorId=1`, {
            headers: { Authorization: `Bearer ${patientToken}` }
        });
        
        if (notificationResponse.data.success) {
            const notification = notificationResponse.data.data;
            console.log(`✅ Notification retrieved`);
            console.log(`   Status: ${notification.status}`);
            console.log(`   Message: ${notification.message}`);
            if (notification.position) {
                console.log(`   Position: ${notification.position}`);
                console.log(`   Is Next: ${notification.isNext}`);
            }
        } else {
            console.log('❌ Failed to get notification:', notificationResponse.data.message);
        }

    } catch (error) {
        console.log('❌ Patient endpoint error:', error.response?.data?.message || error.message);
    }
}

async function testStopQueue() {
    console.log('\n🛑 Testing Queue Stop:');
    console.log('========================');

    try {
        const stopResponse = await axios.post(`${API_BASE}/doctors/queue/stop`, {}, {
            headers: { Authorization: `Bearer ${doctorToken}` }
        });
        
        if (stopResponse.data.success) {
            console.log('✅ Queue stopped successfully');
            const stats = stopResponse.data.data.statistics;
            console.log(`   Total appointments: ${stats.totalAppointments}`);
            console.log(`   Completed appointments: ${stats.completedAppointments}`);
            console.log(`   Completed paid appointments: ${stats.completedPaidAppointments}`);
        } else {
            console.log('❌ Failed to stop queue:', stopResponse.data.message);
        }
    } catch (error) {
        console.log('❌ Stop queue error:', error.response?.data?.message || error.message);
    }
}

async function runWorkflowTest() {
    console.log('🚀 Starting Queue Management Workflow Test');
    console.log('==========================================\n');

    // Step 1: Login both users
    doctorToken = await login(doctorCredentials, 'Doctor');
    patientToken = await login(patientCredentials, 'Patient');

    if (!doctorToken) {
        console.log('❌ Cannot continue without doctor token');
        return;
    }

    if (!patientToken) {
        console.log('⚠️ Continuing without patient token (will skip patient tests)');
    }

    // Step 2: Test doctor workflow
    await testDoctorEndpoints();

    // Step 3: Test patient workflow (if token available)
    if (patientToken) {
        await testPatientEndpoints();
    }

    // Step 4: Test stop queue
    await testStopQueue();

    console.log('\n✅ Workflow test completed!');
}

// Run the test
runWorkflowTest().catch(console.error);
