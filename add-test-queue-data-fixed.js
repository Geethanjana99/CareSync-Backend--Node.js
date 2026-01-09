const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const dbConfig = {
  host: process.env.MYSQL_HOST || 'caresyncdb-caresync.e.aivencloud.com',
  port: process.env.MYSQL_PORT || 16006,
  user: process.env.MYSQL_USER || 'avnadmin',
  password: process.env.MYSQL_PASSWORD || 'AVNS_6xeaVpCVApextDTAKfU',
  database: process.env.MYSQL_DATABASE || 'caresync',
  ssl: {
    rejectUnauthorized: false
  }
};

async function addQueueTestData() {
  let connection;
  
  try {
    console.log('🚀 Adding test queue data for today...');
    
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
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
    console.log(`👨‍⚕️ Found doctor: ${doctor.name} (ID: ${doctor.id})`);
    
    // Find the patient (kashmila@gmail.com)
    const patientQuery = `
      SELECT p.id, u.name, u.email 
      FROM patients p 
      JOIN users u ON p.user_id = u.id 
      WHERE u.email = 'kashmila@gmail.com'
    `;
    const [patients] = await connection.execute(patientQuery);
    
    if (patients.length === 0) {
      console.error('❌ Patient with email kashmila@gmail.com not found');
      return;
    }
    
    const patient = patients[0];
    console.log(`👤 Found patient: ${patient.name} (ID: ${patient.id})`);
    
    // Get current max queue number for today
    const queueQuery = `
      SELECT COALESCE(MAX(queue_number), 0) as max_queue 
      FROM appointments 
      WHERE queue_date = ? AND doctor_id = ?
    `;
    const [queueResult] = await connection.execute(queueQuery, [today, doctor.id]);
    const currentMaxQueue = queueResult[0]?.max_queue || 0;
    console.log(`🔢 Current max queue number for today: ${currentMaxQueue}`);
    
    // Create test appointments for today
    const shortId = Date.now().toString().slice(-6); // Last 6 digits
    const appointments = [
      {
        appointment_id: `TST${shortId}E`,
        patient_id: patient.id,
        doctor_id: doctor.id,
        appointment_date: today,
        queue_date: today,
        queue_number: currentMaxQueue + 1,
        appointment_type: 'consultation',
        status: 'scheduled',
        reason_for_visit: 'Queue Test - Emergency',
        symptoms: 'Emergency appointment for queue testing',
        priority: 'high',
        is_emergency: true,
        consultation_fee: '150.00',
        payment_status: 'unpaid',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        appointment_id: `TST${parseInt(shortId) + 1}F`,
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
        appointment_id: `TST${parseInt(shortId) + 2}R`,
        patient_id: patient.id,
        doctor_id: doctor.id,
        appointment_date: today,
        queue_date: today,
        queue_number: currentMaxQueue + 3,
        appointment_type: 'consultation',
        status: 'confirmed',
        reason_for_visit: 'Queue Test - Regular',
        symptoms: 'Regular appointment for queue testing',
        priority: 'low',
        is_emergency: false,
        consultation_fee: '100.00',
        payment_status: 'paid',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    // Insert appointments
    console.log('📝 Creating test appointments...');
    for (const appointment of appointments) {
      const appointmentId = uuidv4();
      
      const insertQuery = `
        INSERT INTO appointments (
          id, appointment_id, patient_id, doctor_id, appointment_date, queue_date, 
          queue_number, status, reason_for_visit, symptoms, priority, 
          is_emergency, consultation_fee, payment_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(insertQuery, [
        appointmentId,
        appointment.appointment_id,
        appointment.patient_id,
        appointment.doctor_id,
        appointment.appointment_date,
        appointment.queue_date,
        appointment.queue_number,
        appointment.status,
        appointment.reason_for_visit,
        appointment.symptoms,
        appointment.priority,
        appointment.is_emergency,
        appointment.consultation_fee,
        appointment.payment_status,
        appointment.created_at,
        appointment.updated_at
      ]);
      
      console.log(`✅ Created ${appointment.is_emergency ? 'EMERGENCY' : 'REGULAR'} appointment - Queue #${appointment.queue_number}`);
    }
    
    console.log('\n🎉 Successfully added test queue data!');
    console.log(`📊 Summary:`);
    console.log(`   • Doctor: ${doctor.name} (${doctor.email})`);
    console.log(`   • Patient: ${patient.name} (${patient.email})`);
    console.log(`   • Date: ${today}`);
    console.log(`   • Appointments created: ${appointments.length}`);
    console.log(`   • Queue numbers: ${currentMaxQueue + 1} to ${currentMaxQueue + appointments.length}`);
    
    console.log('\n✅ You can now test:');
    console.log('1. Patient queue position checking');
    console.log('2. Doctor queue management');
    console.log('3. Emergency vs regular appointment prioritization');
    console.log('4. Queue status updates');
    
  } catch (error) {
    console.error('❌ Error adding test data:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  addQueueTestData();
}

module.exports = addQueueTestData;