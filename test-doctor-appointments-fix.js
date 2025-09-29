// Test the fixed doctor appointments API
const { mysqlConnection } = require('./config/mysql');

async function testDoctorAppointmentsAPI() {
  try {
    console.log('🧪 Testing Fixed Doctor Appointments Query...\n');
    
    // Get a doctor to test with
    const doctorQuery = `
      SELECT d.id, d.user_id, u.name, u.email
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LIMIT 1
    `;
    
    const [doctor] = await mysqlConnection.query(doctorQuery);
    
    if (!doctor) {
      console.log('❌ No test doctor found');
      return;
    }
    
    console.log(`👨‍⚕️ Testing with doctor: ${doctor.name} (ID: ${doctor.id})`);
    
    const queueDate = new Date().toISOString().split('T')[0];
    console.log(`📅 Queue date: ${queueDate}`);
    
    // Test the fixed query directly
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
    
    const appointments = await mysqlConnection.query(appointmentsQuery, [doctor.id, queueDate]);
    
    console.log(`\n📋 Found ${appointments.length} appointments for today:`);
    
    if (appointments.length > 0) {
      appointments.forEach((apt, index) => {
        console.log(`\n${index + 1}. 📋 Queue #${apt.queue_number} - ${apt.patient_name}`);
        console.log(`   Patient ID: ${apt.patient_id}`);
        console.log(`   Phone: ${apt.patient_phone}`);
        console.log(`   Email: ${apt.patient_email}`);
        console.log(`   Status: ${apt.status}`);
        console.log(`   Payment: ${apt.payment_status}`);
        console.log(`   Emergency: ${apt.is_emergency ? 'Yes' : 'No'}`);
        console.log(`   Reason: ${apt.reason_for_visit}`);
      });
      
      console.log('\n✅ Query executed successfully - no SQL errors!');
    } else {
      console.log('   No appointments found for this doctor today');
      console.log('✅ Query executed successfully (empty result is OK)');
    }
    
  } catch (error) {
    console.error('❌ SQL Error:', error.message);
    console.error('Code:', error.code);
  } finally {
    await mysqlConnection.end();
  }
}

testDoctorAppointmentsAPI();