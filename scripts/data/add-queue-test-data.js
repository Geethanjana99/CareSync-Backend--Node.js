const mysql = require('mysql2/promise');
con    // Find the patient (kashmila@gmail.com)
    const patientQuery = `
      SELECT p.id, u.name, u.email 
      FROM patients p 
      JOIN users u ON p.user_id = u.id 
      WHERE u.email = 'kashmila@gmail.com'
    `;
    const [patients] = await connection.execute(patientQuery); uuidv4 } = require('uuid');
require('dotenv').config();

async function addQueueTestData() {
  let connection = null;
  
  try {
    console.log('🚀 Adding test queue data for today...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    console.log('🔗 Connected to database');
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Today's date: ${today}`);
    
    // Find the doctor (doctor@gmail.com)
    const doctorQuery = `
      SELECT d.id, d.doctor_id, u.name, u.email 
      FROM doctors d 
      JOIN users u ON d.user_id = u.id 
      WHERE u.email = 'doctor@gmail.com'
    `;
    const [doctors] = await connection.execute(doctorQuery);
    
    if (doctors.length === 0) {
      console.error('❌ Doctor with email doctor@gmail.com not found');
      return;
    }
    
    const doctor = doctors[0];
    console.log(`👨‍⚕️ Found doctor: ${doctor.name} (${doctor.doctor_id})`);
    
    // Find the patient (kashmila@gmail.com)
    const patientQuery = `
      SELECT p.id, p.patient_id, u.name, u.email 
      FROM patients p 
      JOIN users u ON p.user_id = u.id 
      WHERE u.email = 'kashmila@gmail.com'
    `;
    const patients = await mysqlConnection.query(patientQuery);
    
    if (patients.length === 0) {
      console.error('❌ Patient with email kashmila@gmail.com not found');
      return;
    }
    
    const patient = patients[0];
    console.log(`👤 Found patient: ${patient.name} (${patient.patient_id})`);
    
    // Get current max queue number for today
    const maxQueueQuery = `
      SELECT MAX(queue_number) as max_queue 
      FROM appointments 
      WHERE doctor_id = ? AND queue_date = ?
    `;
    const maxQueueResult = await mysqlConnection.query(maxQueueQuery, [doctor.id, today]);
    const currentMaxQueue = maxQueueResult[0]?.max_queue || 0;
    
    console.log(`📊 Current max queue number: ${currentMaxQueue}`);
    
    // Create test appointments for today
    const testAppointments = [
      {
        id: uuidv4(),
        appointment_id: `APT-TEST-${Date.now()}-1`,
        patient_id: patient.id,
        doctor_id: doctor.id,
        appointment_date: today,
        queue_date: today,
        queue_number: currentMaxQueue + 1,
        appointment_type: 'consultation',
        status: 'scheduled',
        reason_for_visit: 'Queue Test - Regular Consultation',
        symptoms: 'Test symptoms for queue management',
        priority: 'medium',
        is_emergency: false,
        consultation_fee: '100.00',
        payment_status: 'unpaid',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        appointment_id: `APT-TEST-${Date.now()}-2`,
        patient_id: patient.id,
        doctor_id: doctor.id,
        appointment_date: today,
        queue_date: today,
        queue_number: currentMaxQueue + 2,
        appointment_type: 'consultation',
        status: 'scheduled', 
        reason_for_visit: 'Queue Test - Follow-up',
        symptoms: 'Follow-up appointment for queue testing',
        priority: 'medium',
        is_emergency: false,
        consultation_fee: '100.00',
        payment_status: 'unpaid',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        appointment_id: `APT-TEST-${Date.now()}-3`,
        patient_id: patient.id,
        doctor_id: doctor.id,
        appointment_date: today,
        queue_date: today,
        queue_number: currentMaxQueue + 3,
        appointment_type: 'emergency',
        status: 'scheduled',
        reason_for_visit: 'Queue Test - Emergency Case',
        symptoms: 'Emergency test case for queue priority',
        priority: 'high',
        is_emergency: true,
        consultation_fee: '200.00',
        payment_status: 'unpaid',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    // Insert appointments
    const insertQuery = `
      INSERT INTO appointments (
        id, appointment_id, patient_id, doctor_id, appointment_date, queue_date,
        queue_number, appointment_type, status, reason_for_visit, symptoms, 
        priority, is_emergency, consultation_fee, payment_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    for (let i = 0; i < testAppointments.length; i++) {
      const apt = testAppointments[i];
      await mysqlConnection.query(insertQuery, [
        apt.id, apt.appointment_id, apt.patient_id, apt.doctor_id, 
        apt.appointment_date, apt.queue_date, apt.queue_number,
        apt.appointment_type, apt.status, apt.reason_for_visit,
        apt.symptoms, apt.priority, apt.is_emergency,
        apt.consultation_fee, apt.payment_status, apt.created_at, apt.updated_at
      ]);
      
      console.log(`✅ Added appointment ${i + 1}: Queue #${apt.queue_number} (${apt.is_emergency ? 'Emergency' : 'Regular'})`);
    }
    
    // Initialize or update queue status for the doctor today
    const queueStatusQuery = `
      INSERT INTO queue_status (doctor_id, queue_date, current_regular_number, current_emergency_number, 
                               total_regular_appointments, total_emergency_appointments, status, updated_at)
      VALUES (?, ?, 0, 'E0', ?, ?, 'active', ?)
      ON DUPLICATE KEY UPDATE
        total_regular_appointments = total_regular_appointments + ?,
        total_emergency_appointments = total_emergency_appointments + ?,
        updated_at = ?
    `;
    
    const regularCount = testAppointments.filter(apt => !apt.is_emergency).length;
    const emergencyCount = testAppointments.filter(apt => apt.is_emergency).length;
    
    await mysqlConnection.query(queueStatusQuery, [
      doctor.id, today, regularCount, emergencyCount, new Date(),
      regularCount, emergencyCount, new Date()
    ]);
    
    console.log(`📋 Updated queue status: ${regularCount} regular, ${emergencyCount} emergency appointments`);
    
    // Display summary
    console.log('\n🎉 Test data added successfully!');
    console.log('\n📊 Summary:');
    console.log(`👨‍⚕️ Doctor: ${doctor.name} (${doctor.doctor_id})`);
    console.log(`👤 Patient: ${patient.name} (${patient.patient_id})`);
    console.log(`📅 Date: ${today}`);
    console.log(`🔢 Queue numbers: ${currentMaxQueue + 1} to ${currentMaxQueue + testAppointments.length}`);
    console.log(`📋 Total appointments added: ${testAppointments.length}`);
    console.log(`🆘 Emergency appointments: ${emergencyCount}`);
    console.log(`📝 Regular appointments: ${regularCount}`);
    
    console.log('\n🧪 Test credentials:');
    console.log('👨‍⚕️ Doctor login: doctor@gmail.com / Passwordd123!');
    console.log('👤 Patient login: kashmila@gmail.com / Password123!');
    
    console.log('\n✅ You can now test:');
    console.log('1. Patient queue position checking');
    console.log('2. Doctor queue management');
    console.log('3. Emergency vs regular appointment prioritization');
    console.log('4. Queue status updates');
    
  } catch (error) {
    console.error('❌ Error adding test data:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
addQueueTestData();