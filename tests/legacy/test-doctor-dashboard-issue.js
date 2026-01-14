const { mysqlConnection } = require('./config/mysql');
const axios = require('axios');

async function testDoctorDashboardIssue() {
  try {
    console.log('🧪 Testing Doctor Dashboard Issue...\n');
    
    // Initialize MySQL connection
    await mysqlConnection.connect();
    console.log('✅ MySQL connected successfully');
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Today's date: ${today}`);
    
    // 1. Check if doctor@gmail.com exists and get doctor details
    console.log('\n1️⃣ Checking doctor@gmail.com account...');
    const doctorQuery = `
      SELECT u.id as user_id, u.name, u.email, u.role, d.id as doctor_id
      FROM users u 
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.email = 'doctor@gmail.com'
    `;
    const [doctor] = await mysqlConnection.query(doctorQuery);
    
    if (!doctor) {
      console.log('❌ Doctor account doctor@gmail.com not found');
      return;
    }
    
    console.log(`✅ Doctor found: ${doctor.name}`);
    console.log(`   - User ID: ${doctor.user_id}`);
    console.log(`   - Doctor ID: ${doctor.doctor_id}`);
    console.log(`   - Role: ${doctor.role}`);
    
    if (!doctor.doctor_id) {
      console.log('❌ User exists but no doctor profile found');
      return;
    }
    
    // 2. Check appointments for this specific doctor
    console.log('\n2️⃣ Checking appointments for this doctor...');
    const appointmentsQuery = `
      SELECT 
        a.id,
        a.appointment_id,
        a.patient_id,
        a.queue_number,
        a.status,
        a.payment_status,
        a.is_emergency,
        a.reason_for_visit,
        pu.name as patient_name,
        pu.phone as patient_phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      WHERE a.doctor_id = ? AND a.queue_date = ?
      ORDER BY a.is_emergency DESC, CAST(a.queue_number AS UNSIGNED) ASC
    `;
    
    const appointments = await mysqlConnection.query(appointmentsQuery, [doctor.doctor_id, today]);
    console.log(`📋 Appointments found: ${appointments.length}`);
    
    if (appointments.length > 0) {
      console.log('✅ Appointment details:');
      appointments.forEach((apt, i) => {
        console.log(`  ${i + 1}. ${apt.patient_name} - Queue: ${apt.queue_number} - Status: ${apt.status} - Payment: ${apt.payment_status}`);
      });
    } else {
      console.log('❌ No appointments found for this doctor today');
      
      // Check appointments on other dates
      const otherDatesQuery = `
        SELECT queue_date, COUNT(*) as count
        FROM appointments
        WHERE doctor_id = ?
        GROUP BY queue_date
        ORDER BY queue_date DESC
        LIMIT 5
      `;
      const otherDates = await mysqlConnection.query(otherDatesQuery, [doctor.doctor_id]);
      if (otherDates.length > 0) {
        console.log('\n📅 Doctor has appointments on other dates:');
        otherDates.forEach(row => {
          console.log(`  - ${row.queue_date}: ${row.count} appointments`);
        });
      } else {
        console.log('❌ No appointments found for this doctor on any date');
      }
    }
    
    // 3. Test API login
    console.log('\n3️⃣ Testing API login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'doctor@gmail.com',
      password: 'Doctor@123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.token;
    const loggedUser = loginResponse.data.user;
    console.log('✅ Login successful');
    console.log(`   - User ID: ${loggedUser.id}`);
    console.log(`   - Name: ${loggedUser.name}`);
    console.log(`   - Role: ${loggedUser.role}`);
    
    // 4. Test Dashboard API
    console.log('\n4️⃣ Testing Dashboard API...');
    const dashboardResponse = await axios.get('http://localhost:5000/api/doctors/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Dashboard Response Status:', dashboardResponse.status);
    console.log('Dashboard Success:', dashboardResponse.data.success);
    
    if (dashboardResponse.data.success) {
      const dashboardData = dashboardResponse.data.data;
      console.log('📊 Dashboard Data:');
      console.log(`   - Today's Total: ${dashboardData.todayAppointments?.total || 0}`);
      console.log(`   - Completed: ${dashboardData.todayAppointments?.completed || 0}`);
      console.log(`   - Pending: ${dashboardData.todayAppointments?.pending || 0}`);
      console.log(`   - In Progress: ${dashboardData.todayAppointments?.inProgress || 0}`);
      console.log(`   - Appointments Array Length: ${dashboardData.todayAppointments?.appointments?.length || 0}`);
      
      if (dashboardData.todayAppointments?.appointments?.length > 0) {
        console.log('\n✅ Dashboard appointments:');
        dashboardData.todayAppointments.appointments.forEach((apt, i) => {
          console.log(`  ${i + 1}. ${apt.patientName} - ${apt.status} - ID: ${apt.appointmentId}`);
        });
      } else {
        console.log('❌ Dashboard shows no appointments in appointments array');
      }
      
      // Check doctor info in dashboard
      console.log('\n👨‍⚕️ Doctor info from dashboard:');
      console.log(`   - Doctor ID: ${dashboardData.doctor?.id}`);
      console.log(`   - Name: ${dashboardData.doctor?.name}`);
    } else {
      console.log('❌ Dashboard API failed:', dashboardResponse.data.message);
    }
    
    // 5. Test Today's Appointments API directly
    console.log('\n5️⃣ Testing Today\'s Appointments API...');
    const todayResponse = await axios.get('http://localhost:5000/api/doctors/appointments/today', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Today\'s Appointments Response Status:', todayResponse.status);
    console.log('Today\'s Appointments Success:', todayResponse.data.success);
    console.log('Today\'s Appointments Count:', todayResponse.data.data?.length || 0);
    
    if (todayResponse.data.data && todayResponse.data.data.length > 0) {
      console.log('\n✅ Today\'s appointments API response:');
      todayResponse.data.data.forEach((apt, i) => {
        console.log(`  ${i + 1}. ${apt.name} - ${apt.status} - Queue: ${apt.queue_number}`);
      });
    } else {
      console.log('❌ Today\'s appointments API returned no data');
      console.log('Response structure:', JSON.stringify(todayResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    process.exit();
  }
}

testDoctorDashboardIssue();