const { mysqlConnection } = require('./config/mysql');
const DoctorController = require('./controllers/doctorController');

async function testDateFiltering() {
  try {
    await mysqlConnection.connect();
    console.log('🧪 Testing Date Filtering Fix...\n');
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Testing with date: ${today}`);
    
    // Mock request/response objects for getAppointmentHistory
    const mockReq = {
      user: {
        id: '5db5ac56-dd67-4bf8-b411-7db35f5f5abc' // Geeth's user ID
      },
      query: {
        startDate: today,
        endDate: today,
        limit: 100
      }
    };
    
    let appointmentHistory = null;
    const mockRes = {
      json: (data) => {
        appointmentHistory = data;
        console.log('✅ getAppointmentHistory response received');
      },
      status: () => mockRes
    };
    
    const mockNext = (error) => {
      console.error('❌ getAppointmentHistory error:', error);
    };
    
    console.log('1️⃣ Testing getAppointmentHistory with date filtering...');
    await DoctorController.getAppointmentHistory(mockReq, mockRes, mockNext);
    
    if (appointmentHistory && appointmentHistory.success) {
      console.log('\n📊 Appointment History Results:');
      console.log(`   - Success: ${appointmentHistory.success}`);
      console.log(`   - Count: ${appointmentHistory.data?.length || 0}`);
      
      if (appointmentHistory.data && appointmentHistory.data.length > 0) {
        console.log('\n📋 Appointments found:');
        appointmentHistory.data.forEach((apt, i) => {
          console.log(`  ${i + 1}. ${apt.patient_name} - Queue: ${apt.queue_number} - Status: ${apt.status}`);
        });
      } else {
        console.log('❌ No appointments found with date filtering');
      }
    } else {
      console.log('❌ getAppointmentHistory failed');
      if (appointmentHistory) {
        console.log('Response:', JSON.stringify(appointmentHistory, null, 2));
      }
    }
    
    // Also test with a different date to make sure it doesn't return today's appointments
    console.log('\n2️⃣ Testing with tomorrow\'s date (should return 0 results)...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    const mockReqTomorrow = {
      user: {
        id: '5db5ac56-dd67-4bf8-b411-7db35f5f5abc'
      },
      query: {
        startDate: tomorrowString,
        endDate: tomorrowString,
        limit: 100
      }
    };
    
    let tomorrowHistory = null;
    const mockResTomorrow = {
      json: (data) => {
        tomorrowHistory = data;
      },
      status: () => mockResTomorrow
    };
    
    await DoctorController.getAppointmentHistory(mockReqTomorrow, mockResTomorrow, mockNext);
    
    if (tomorrowHistory && tomorrowHistory.success) {
      console.log(`📅 Tomorrow (${tomorrowString}) appointments: ${tomorrowHistory.data?.length || 0}`);
      if ((tomorrowHistory.data?.length || 0) === 0) {
        console.log('✅ Date filtering is working correctly - no appointments for tomorrow');
      } else {
        console.log('⚠️ Found appointments for tomorrow (unexpected)');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit();
  }
}

testDateFiltering();