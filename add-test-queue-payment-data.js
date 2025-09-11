// Test script to add sample queue data with payment statuses
const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration for Aiven
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

async function addTestQueueData() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully!');

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Adding test data for date:', today);

    // Find a doctor to add appointments for
    const [doctors] = await connection.execute(`
      SELECT d.id, u.name, d.specialty 
      FROM doctors d 
      JOIN users u ON d.user_id = u.id 
      LIMIT 1
    `);

    if (doctors.length === 0) {
      console.log('❌ No doctors found in database');
      return;
    }

    const doctor = doctors[0];
    console.log(`👨‍⚕️ Using doctor: ${doctor.name} (${doctor.specialty})`);

    // Find some patients to create appointments for
    const [patients] = await connection.execute(`
      SELECT p.id, u.name, u.phone 
      FROM patients p 
      JOIN users u ON p.user_id = u.id 
      LIMIT 5
    `);

    if (patients.length === 0) {
      console.log('❌ No patients found in database');
      return;
    }

    console.log(`👥 Found ${patients.length} patients for test appointments`);

    // Create queue status for today if it doesn't exist
    const [existingQueue] = await connection.execute(`
      SELECT * FROM queue_status 
      WHERE doctor_id = ? AND queue_date = ?
    `, [doctor.id, today]);

    if (existingQueue.length === 0) {
      await connection.execute(`
        INSERT INTO queue_status (
          doctor_id, queue_date, current_number, current_emergency_number, 
          max_emergency_slots, emergency_used, regular_count, 
          available_from, available_to, is_active
        ) VALUES (?, ?, 0, 'E0', 5, 0, 0, '09:00:00', '17:00:00', 1)
      `, [doctor.id, today]);
      console.log('✅ Created queue status for today');
    }

    // Sample payment statuses to test
    const paymentStatuses = ['unpaid', 'paid', 'partially_paid', 'unpaid', 'paid'];
    const appointmentTypes = ['consultation', 'follow-up', 'emergency', 'consultation', 'consultation'];
    const isEmergencyFlags = [false, false, true, false, false];
    const queueNumbers = [1, 2, 1, 3, 4]; // Emergency will use E1
    const consultationFees = [100.00, 75.00, 150.00, 80.00, 90.00];

    console.log('📋 Creating test appointments...');

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const appointmentId = `APT-${Date.now()}-${i}`;
      
      try {
        await connection.execute(`
          INSERT INTO appointments (
            appointment_id, patient_id, doctor_id, appointment_date, queue_date,
            queue_number, appointment_type, status, reason_for_visit, 
            is_emergency, consultation_fee, payment_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          appointmentId,
          patient.id,
          doctor.id,
          today,
          today,
          queueNumbers[i],
          appointmentTypes[i],
          'scheduled',
          isEmergencyFlags[i] ? 'Emergency consultation' : 'Regular checkup',
          isEmergencyFlags[i],
          consultationFees[i],
          paymentStatuses[i]
        ]);

        console.log(`✅ Created appointment for ${patient.name}: Queue #${isEmergencyFlags[i] ? 'E' : ''}${queueNumbers[i]} | Payment: ${paymentStatuses[i]} | Fee: $${consultationFees[i]}`);
      } catch (error) {
        console.log(`⚠️  Failed to create appointment for ${patient.name}:`, error.message);
      }
    }

    // Update queue status with current counts
    const [emergencyCount] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE doctor_id = ? AND queue_date = ? AND is_emergency = 1
    `, [doctor.id, today]);

    const [regularCount] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE doctor_id = ? AND queue_date = ? AND is_emergency = 0
    `, [doctor.id, today]);

    await connection.execute(`
      UPDATE queue_status 
      SET emergency_used = ?, regular_count = ?
      WHERE doctor_id = ? AND queue_date = ?
    `, [emergencyCount[0].count, regularCount[0].count, doctor.id, today]);

    console.log('📊 Updated queue statistics');

    // Show today's queue summary
    const [todaysQueue] = await connection.execute(`
      SELECT 
        a.appointment_id,
        u.name as patient_name,
        a.queue_number,
        a.is_emergency,
        a.payment_status,
        a.consultation_fee,
        a.status
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = ? AND a.queue_date = ?
      ORDER BY a.is_emergency DESC, a.queue_number ASC
    `, [doctor.id, today]);

    console.log('\n🎯 Today\'s Queue Summary:');
    console.log('================================');
    todaysQueue.forEach(apt => {
      const queueDisplay = apt.is_emergency ? `E${apt.queue_number}` : apt.queue_number;
      const paymentBadge = apt.payment_status === 'paid' ? '✅' : 
                          apt.payment_status === 'partially_paid' ? '⚠️' : '❌';
      console.log(`${paymentBadge} Queue #${queueDisplay} | ${apt.patient_name} | ${apt.payment_status} | $${apt.consultation_fee} | ${apt.status}`);
    });

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📱 You can now test the payment status functionality in the doctor queue management panel.');

  } catch (error) {
    console.error('❌ Error adding test data:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 Database connection closed');
    }
  }
}

// Run the script
addTestQueueData();
