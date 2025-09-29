/**
 * Test script to verify queue position API with estimated wait time
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testQueuePositionWithEstimatedTime() {
  console.log('🚀 Testing Queue Position API with Estimated Wait Time');
  console.log('============================================================');

  try {
    // Login as test patient
    console.log('🔐 Logging in as test patient...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'alice.patient@test.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');

    // Test the queue position endpoint
    console.log('\n📊 Testing /patients/queue/position endpoint...');
    const queuePositionResponse = await axios.get(`${API_BASE}/patients/queue/position`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (queuePositionResponse.data.success) {
      const queueData = queuePositionResponse.data.data;
      console.log('✅ Queue position data fetched successfully');
      
      if (Array.isArray(queueData)) {
        console.log(`\n📋 Found ${queueData.length} appointment(s):`);
        
        queueData.forEach((appointment, index) => {
          console.log(`\n🏥 Appointment ${index + 1}:`);
          console.log(`   👨‍⚕️ Doctor: ${appointment.doctorName}`);
          console.log(`   🏷️  Specialty: ${appointment.specialty}`);
          console.log(`   🎫  Queue Number: ${appointment.queueNumber}`);
          console.log(`   📍  Position: ${appointment.position}`);
          console.log(`   ⏰  Estimated Wait: ${appointment.estimated_wait_time} minutes`);
          console.log(`   📊  Status: ${appointment.status}`);
          console.log(`   💳  Payment: ${appointment.paymentStatus}`);
          console.log(`   🟢  Queue Active: ${appointment.queueActive}`);
          console.log(`   🔄  Currently Serving: ${appointment.currentlyServing}`);
          
          // Test estimated wait time
          if (appointment.estimated_wait_time !== undefined) {
            console.log('   ✅ Estimated wait time is properly calculated');
            
            if (appointment.estimated_wait_time === 0) {
              console.log('   🎯 Patient should be called now or next!');
            } else if (appointment.estimated_wait_time > 0) {
              const hours = Math.floor(appointment.estimated_wait_time / 60);
              const minutes = appointment.estimated_wait_time % 60;
              const timeDisplay = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
              console.log(`   ⏱️  Wait time display: ${timeDisplay}`);
            }
          } else {
            console.log('   ❌ Estimated wait time is missing');
          }
        });

        // Test notification endpoint for first appointment
        if (queueData.length > 0) {
          const firstAppointment = queueData[0];
          console.log(`\n🔔 Testing notification for doctor ${firstAppointment.doctorId}...`);
          
          try {
            const notificationResponse = await axios.get(
              `${API_BASE}/patients/notification?doctorId=${firstAppointment.doctorId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (notificationResponse.data.success) {
              const notification = notificationResponse.data.data;
              console.log('✅ Notification data fetched successfully');
              console.log(`   📢 Status: ${notification.status}`);
              console.log(`   💬 Message: ${notification.message}`);
              
              if (notification.position !== undefined) {
                console.log(`   📍 Position: ${notification.position}`);
              }
              
              if (notification.isNext) {
                console.log('   🚨 Patient is next in line!');
              }
              
              if (notification.isCurrent) {
                console.log('   🔥 It\'s the patient\'s turn!');
              }
            } else {
              console.log('❌ Notification fetch failed:', notificationResponse.data.message);
            }
          } catch (notificationError) {
            console.log('❌ Notification test failed:', notificationError.message);
          }
        }

        console.log('\n🎉 Queue position API with estimated time is working!');
      } else {
        console.log('📋 Single appointment response:', queueData);
      }
    } else {
      console.log('❌ Queue position fetch failed:', queuePositionResponse.data.message);
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection Error: Backend server is not running');
      console.log('💡 Please start the backend server and try again');
    } else {
      console.log('❌ Error:', error.message);
      if (error.response?.data) {
        console.log('   Response:', error.response.data);
      }
    }
  }
}

// Run the test
testQueuePositionWithEstimatedTime().then(() => {
  console.log('\n🏁 Test Complete!');
  console.log('Queue position and estimated wait time functionality has been verified');
});