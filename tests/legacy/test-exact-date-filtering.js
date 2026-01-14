const { mysqlConnection } = require('./config/mysql');
const DoctorController = require('./controllers/doctorController');

async function testExactDateFiltering() {
  try {
    await mysqlConnection.connect();
    console.log('🧪 Testing Exact Date Filtering...\n');
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    console.log(`📅 Today: ${today}`);
    console.log(`📅 Tomorrow: ${tomorrowString}`);
    
    // Test exact date filtering for today
    const mockReq = {
      user: {
        id: '5db5ac56-dd67-4bf8-b411-7db35f5f5abc' // Geeth's user ID
      },
      query: {
        startDate: today,
        endDate: today, // Same as startDate - should trigger exact date matching
        limit: 100
      }
    };
    
    let todayResult = null;
    const mockRes = {
      json: (data) => {
        todayResult = data;
      },
      status: () => mockRes
    };
    
    const mockNext = (error) => {
      console.error('❌ Error:', error);
    };
    
    console.log('1️⃣ Testing exact date filtering for TODAY...');
    console.log(`   📝 Query: startDate=${today}, endDate=${today} (same date = exact match)`);
    
    await DoctorController.getAppointmentHistory(mockReq, mockRes, mockNext);
    
    if (todayResult && todayResult.success) {
      console.log(`✅ Today's appointments: ${todayResult.data?.length || 0}`);
      if (todayResult.data && todayResult.data.length > 0) {
        todayResult.data.forEach((apt, i) => {
          console.log(`   ${i + 1}. Patient: ${apt.patient_name || 'Unknown'} - Queue: ${apt.queue_number} - Status: ${apt.status}`);
        });
      }
    }
    
    // Test exact date filtering for tomorrow
    console.log('\n2️⃣ Testing exact date filtering for TOMORROW...');
    console.log(`   📝 Query: startDate=${tomorrowString}, endDate=${tomorrowString} (same date = exact match)`);
    
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
    
    let tomorrowResult = null;
    const mockResTomorrow = {
      json: (data) => {
        tomorrowResult = data;
      },
      status: () => mockResTomorrow
    };
    
    await DoctorController.getAppointmentHistory(mockReqTomorrow, mockResTomorrow, mockNext);
    
    if (tomorrowResult && tomorrowResult.success) {
      console.log(`✅ Tomorrow's appointments: ${tomorrowResult.data?.length || 0}`);
      if (tomorrowResult.data && tomorrowResult.data.length > 0) {
        tomorrowResult.data.forEach((apt, i) => {
          console.log(`   ${i + 1}. Patient: ${apt.patient_name || 'Unknown'} - Queue: ${apt.queue_number} - Status: ${apt.status}`);
        });
      }
    }
    
    // Test range filtering (different start and end dates)
    console.log('\n3️⃣ Testing date RANGE filtering...');
    console.log(`   📝 Query: startDate=${today}, endDate=${tomorrowString} (different dates = range match)`);
    
    const mockReqRange = {
      user: {
        id: '5db5ac56-dd67-4bf8-b411-7db35f5f5abc'
      },
      query: {
        startDate: today,
        endDate: tomorrowString, // Different from startDate - should trigger range filtering
        limit: 100
      }
    };
    
    let rangeResult = null;
    const mockResRange = {
      json: (data) => {
        rangeResult = data;
      },
      status: () => mockResRange
    };
    
    await DoctorController.getAppointmentHistory(mockReqRange, mockResRange, mockNext);
    
    if (rangeResult && rangeResult.success) {
      console.log(`✅ Range appointments (${today} to ${tomorrowString}): ${rangeResult.data?.length || 0}`);
      if (rangeResult.data && rangeResult.data.length > 0) {
        rangeResult.data.forEach((apt, i) => {
          console.log(`   ${i + 1}. Patient: ${apt.patient_name || 'Unknown'} - Queue: ${apt.queue_number} - Status: ${apt.status}`);
        });
      }
    }
    
    console.log('\n🎯 Summary:');
    console.log(`   📅 Today only: ${todayResult?.data?.length || 0} appointments`);
    console.log(`   📅 Tomorrow only: ${tomorrowResult?.data?.length || 0} appointments`);
    console.log(`   📅 Range (today + tomorrow): ${rangeResult?.data?.length || 0} appointments`);
    
    if ((rangeResult?.data?.length || 0) === (todayResult?.data?.length || 0) + (tomorrowResult?.data?.length || 0)) {
      console.log('✅ Exact date filtering is working correctly!');
    } else {
      console.log('⚠️ Date filtering may not be working as expected');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit();
  }
}

testExactDateFiltering();