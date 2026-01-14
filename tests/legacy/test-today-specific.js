// Test today's doctor appointments specifically
const { mysqlConnection } = require('./config/mysql');
const axios = require('axios');

async function testTodayAppointments() {
  try {
    console.log('🧪 Testing Today\'s Doctor Appointments...\n');
    
    // Initialize MySQL connection first
    console.log('🔌 Connecting to MySQL...');
    await mysqlConnection.connect();
    console.log('✅ MySQL connected successfully');
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Today's date: ${today}`);
    
    // 1. Check if there are ANY appointments for today
    console.log('\n1️⃣ Checking total appointments for today...');
    const totalQuery = `
      SELECT COUNT(*) as total FROM appointments WHERE queue_date = ?
    `;
    const [totalResult] = await mysqlConnection.query(totalQuery, [today]);
    console.log(`📊 Total appointments for today: ${totalResult.total}`);
    
    if (totalResult.total === 0) {
      console.log('\n🔍 No appointments for today. Checking recent dates...');
      const recentQuery = `
        SELECT queue_date, COUNT(*) as count
        FROM appointments
        GROUP BY queue_date
        ORDER BY queue_date DESC
        LIMIT 5
      `;
      const recentResults = await mysqlConnection.query(recentQuery);
      console.log('Recent appointment dates:');
      recentResults.forEach(row => {
        console.log(`  - ${row.queue_date}: ${row.count} appointments`);
      });
      
      // Let's create a test appointment for today
      console.log('\n🔧 Creating test appointment for today...');
      
      // Get first doctor and patient
      const [doctor] = await mysqlConnection.query('SELECT id FROM doctors LIMIT 1');
      const [patient] = await mysqlConnection.query('SELECT id FROM patients LIMIT 1');
      
      if (doctor && patient) {
        const insertQuery = `
          INSERT INTO appointments (
            id, appointment_id, doctor_id, patient_id, queue_date, queue_number,
            status, payment_status, is_emergency, reason_for_visit
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const appointmentId = 'test-' + Date.now();
        const testAppointment = [
          appointmentId,
          'APT-TEST-001',
          doctor.id,
          patient.id,
          today,
          '1',
          'confirmed',
          'paid',
          false,
          'Test appointment for today'
        ];
        
        await mysqlConnection.query(insertQuery, testAppointment);
        console.log('✅ Test appointment created successfully');
      }
    }
    
    // 2. Get a doctor to test with
    console.log('\n2️⃣ Finding doctors with appointments today...');
    const doctorsWithApptsQuery = `
      SELECT d.id, d.user_id, u.name, u.email, COUNT(a.id) as appointment_count
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      JOIN appointments a ON d.id = a.doctor_id
      WHERE a.queue_date = ?
      GROUP BY d.id, d.user_id, u.name, u.email
      ORDER BY appointment_count DESC
    `;
    const doctorsWithAppts = await mysqlConnection.query(doctorsWithApptsQuery, [today]);
    
    if (doctorsWithAppts.length === 0) {
      console.log('❌ No doctors found with appointments today');
      return;
    }
    
    console.log('📋 Doctors with appointments today:');
    doctorsWithAppts.forEach((doc, i) => {
      console.log(`  ${i + 1}. ${doc.name} - ${doc.appointment_count} appointments`);
    });
    
    const doctor = doctorsWithAppts[0]; // Use the doctor with most appointments
    console.log(`\n👨‍⚕️ Testing with doctor: ${doctor.name} (ID: ${doctor.id})`);
    
    // Also get all doctors for comparison
    console.log('\n📋 All doctors in system:');
    const allDoctorsQuery = `SELECT d.id, u.name FROM doctors d JOIN users u ON d.user_id = u.id LIMIT 5`;
    const allDoctors = await mysqlConnection.query(allDoctorsQuery);
    allDoctors.forEach((doc, i) => {
      console.log(`  ${i + 1}. ${doc.name} (ID: ${doc.id})`);
    });
    
    // 3. Test the exact query from getTodayAppointments controller
    console.log('\n3️⃣ Testing controller query...');
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
        a.symptoms,
        pu.name as patient_name,
        pu.phone as patient_phone,
        pu.email as patient_email,
        du.name as doctor_name,
        d.specialty
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE a.doctor_id = ? AND a.queue_date = ?
      ORDER BY a.is_emergency DESC, CAST(a.queue_number AS UNSIGNED) ASC
    `;
    
    const appointments = await mysqlConnection.query(appointmentsQuery, [doctor.id, today]);
    console.log(`📋 Appointments found for doctor ${doctor.name}: ${appointments.length}`);
    
    if (appointments.length > 0) {
      console.log('✅ Appointments details:');
      appointments.forEach((apt, i) => {
        console.log(`  ${i + 1}. ${apt.patient_name} - Queue: ${apt.queue_number} - Status: ${apt.status}`);
      });
    } else {
      console.log('❌ No appointments found for this doctor today');
      
      // Check if this doctor has appointments on other dates
      const otherDatesQuery = `
        SELECT queue_date, COUNT(*) as count
        FROM appointments
        WHERE doctor_id = ?
        GROUP BY queue_date
        ORDER BY queue_date DESC
        LIMIT 5
      `;
      const otherDates = await mysqlConnection.query(otherDatesQuery, [doctor.id]);
      if (otherDates.length > 0) {
        console.log('\n📅 Doctor has appointments on other dates:');
        otherDates.forEach(row => {
          console.log(`  - ${row.queue_date}: ${row.count} appointments`);
        });
      }
    }
    
    // 4. Test API login and endpoints
    console.log('\n4️⃣ Testing API endpoints...');
    try {
      // Login with the doctor
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: doctor.email,
        password: 'password123' // Default test password
      });
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.token;
        console.log('✅ Doctor login successful');
        
        // Test dashboard endpoint
        const dashboardResponse = await axios.get('http://localhost:5000/api/doctors/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (dashboardResponse.data.success) {
          const dashboardData = dashboardResponse.data.data;
          console.log('📊 Dashboard data:');
          console.log(`  - Today's total: ${dashboardData.todayAppointments?.total || 0}`);
          console.log(`  - Appointments array: ${dashboardData.todayAppointments?.appointments?.length || 0} items`);
        }
        
        // Test today's appointments endpoint
        const todayResponse = await axios.get('http://localhost:5000/api/doctors/appointments/today', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📋 Today\'s appointments API response:');
        console.log(`  - Success: ${todayResponse.data.success}`);
        console.log(`  - Count: ${todayResponse.data.data?.length || 0}`);
        
        if (todayResponse.data.data && todayResponse.data.data.length > 0) {
          console.log('  - Sample appointments:');
          todayResponse.data.data.slice(0, 3).forEach((apt, i) => {
            console.log(`    ${i + 1}. ${apt.name} - ${apt.status} - Queue: ${apt.queue_number}`);
          });
        }
        
      } else {
        console.log('❌ Doctor login failed:', loginResponse.data.message);
      }
      
    } catch (apiError) {
      console.log('❌ API test failed:', apiError.message);
      if (apiError.response) {
        console.log('Response status:', apiError.response.status);
        console.log('Response data:', apiError.response.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit();
  }
}

testTodayAppointments();