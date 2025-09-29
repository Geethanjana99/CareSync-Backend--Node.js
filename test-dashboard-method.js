const { mysqlConnection } = require('./config/mysql');
const Doctor = require('./models/Doctor');
const User = require('./models/User');
const DoctorController = require('./controllers/doctorController');

async function testGetDashboardMethod() {
  try {
    await mysqlConnection.connect();
    console.log('🧪 Testing getDashboard Method Directly...\n');
    
    // Mock request/response objects
    const mockReq = {
      user: {
        id: '5db5ac56-dd67-4bf8-b411-7db35f5f5abc' // Geeth's user ID
      }
    };
    
    let dashboardData = null;
    const mockRes = {
      json: (data) => {
        dashboardData = data;
        console.log('✅ getDashboard response received');
      },
      status: () => mockRes
    };
    
    const mockNext = (error) => {
      console.error('❌ getDashboard error:', error);
    };
    
    console.log('1️⃣ Calling getDashboard method...');
    await DoctorController.getDashboard(mockReq, mockRes, mockNext);
    
    if (dashboardData && dashboardData.success) {
      console.log('\n📊 Dashboard Data Analysis:');
      const data = dashboardData.data;
      
      console.log('Doctor Info:');
      console.log(`  - ID: ${data.doctor.id}`);
      console.log(`  - Name: ${data.doctor.name}`);
      console.log(`  - Specialty: ${data.doctor.specialty}`);
      
      console.log('\nToday\'s Appointments:');
      console.log(`  - Total: ${data.todayAppointments.total}`);
      console.log(`  - Completed: ${data.todayAppointments.completed}`);
      console.log(`  - Pending: ${data.todayAppointments.pending}`);
      console.log(`  - In Progress: ${data.todayAppointments.inProgress}`);
      console.log(`  - Appointments Array Length: ${data.todayAppointments.appointments.length}`);
      
      if (data.todayAppointments.appointments.length > 0) {
        console.log('\n📋 Appointments Details:');
        data.todayAppointments.appointments.forEach((apt, i) => {
          console.log(`  ${i + 1}. ${apt.patientName}`);
          console.log(`     - ID: ${apt.id}`);
          console.log(`     - Appointment ID: ${apt.appointmentId}`);
          console.log(`     - Status: ${apt.status}`);
          console.log(`     - Queue Number: ${apt.queueNumber}`);
          console.log(`     - Reason: ${apt.reason}`);
        });
      } else {
        console.log('❌ No appointments in the appointments array');
      }
      
      console.log('\nUpcoming Appointments:');
      console.log(`  - Count: ${data.upcomingAppointments.length}`);
      
      console.log('\nStats:');
      console.log(`  - Total Patients: ${data.stats.totalPatients}`);
      console.log(`  - Total Appointments: ${data.stats.totalAppointments}`);
      console.log(`  - Monthly Earnings: ${data.stats.monthlyEarnings}`);
      
    } else {
      console.log('❌ getDashboard failed or returned no data');
      if (dashboardData) {
        console.log('Response:', JSON.stringify(dashboardData, null, 2));
      }
    }
    
    // Also test the helper method directly
    console.log('\n2️⃣ Testing getTodayAppointmentsWithDetails directly...');
    const doctorId = '11aedc76-46d6-4907-83ee-152d097196b8'; // Geeth's doctor ID
    const todayAppointments = await DoctorController.getTodayAppointmentsWithDetails(doctorId);
    
    console.log(`📋 Direct helper method result: ${todayAppointments.length} appointments`);
    if (todayAppointments.length > 0) {
      console.log('Raw appointment data:');
      todayAppointments.forEach((apt, i) => {
        console.log(`  ${i + 1}. ${apt.patient_name} - ${apt.status} - Queue: ${apt.queue_number}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit();
  }
}

testGetDashboardMethod();