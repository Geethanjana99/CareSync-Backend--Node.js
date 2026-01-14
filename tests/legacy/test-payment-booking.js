// Test script for appointment booking with payment functionality
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

async function testPaymentBooking() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully!');

    // Get a test doctor
    const [doctors] = await connection.execute(`
      SELECT d.id, u.name, d.specialty, d.consultation_fee 
      FROM doctors d 
      JOIN users u ON d.user_id = u.id 
      WHERE d.consultation_fee > 0
      LIMIT 1
    `);

    if (doctors.length === 0) {
      console.log('❌ No doctors with consultation fees found');
      return;
    }

    const doctor = doctors[0];
    console.log(`👨‍⚕️ Testing with doctor: ${doctor.name} (${doctor.specialty}) - Fee: $${doctor.consultation_fee}`);

    // Get a test patient
    const [patients] = await connection.execute(`
      SELECT p.id, u.name 
      FROM patients p 
      JOIN users u ON p.user_id = u.id 
      LIMIT 1
    `);

    if (patients.length === 0) {
      console.log('❌ No patients found');
      return;
    }

    const patient = patients[0];
    console.log(`👤 Testing with patient: ${patient.name}`);

    const today = new Date().toISOString().split('T')[0];
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const appointmentIdPaid = `PAY${timestamp}`;
    const appointmentIdCounter = `CTR${timestamp}`;

    // Test 1: Book appointment with immediate payment
    console.log('\n🧪 Test 1: Booking appointment with immediate payment...');
    
    try {
      await connection.execute(`
        INSERT INTO appointments (
          appointment_id, patient_id, doctor_id, appointment_date, queue_date,
          queue_number, appointment_type, status, reason_for_visit, 
          consultation_fee, payment_status, is_emergency
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        appointmentId + '-PAID', // P for Paid
        patient.id,
        doctor.id,
        today,
        today,
        99,
        'consultation',
        'scheduled',
        'Payment system test - immediate payment',
        doctor.consultation_fee,
        'paid',
        false
      ]);

      // Create billing record for paid appointment
      const invoiceNumber = `INV-TEST-${Date.now()}`;
      await connection.execute(`
        INSERT INTO billing (
          appointment_id, patient_id, doctor_id, invoice_number, 
          amount, tax_amount, total_amount, payment_method, 
          payment_status, transaction_id, payment_gateway, paid_at
        ) SELECT id, patient_id, doctor_id, ?, ?, 0, ?, 'card', 'paid', ?, 'stripe', NOW()
        FROM appointments 
        WHERE appointment_id = ?
      `, [
        invoiceNumber,
        doctor.consultation_fee,
        doctor.consultation_fee,
        `TXN-TEST-${Date.now()}`,
        appointmentId + '-PAID'
      ]);

      console.log('✅ Appointment with immediate payment created successfully');
      console.log(`   Appointment ID: ${appointmentId}-PAID`);
      console.log(`   Payment Status: paid`);
      console.log(`   Amount: $${doctor.consultation_fee}`);
      console.log(`   Invoice: ${invoiceNumber}`);
    } catch (error) {
      console.log('❌ Failed to create paid appointment:', error.message);
    }

    // Test 2: Book appointment with pay at counter
    console.log('\n🧪 Test 2: Booking appointment with pay at counter...');
    
    try {
      await connection.execute(`
        INSERT INTO appointments (
          appointment_id, patient_id, doctor_id, appointment_date, queue_date,
          queue_number, appointment_type, status, reason_for_visit, 
          consultation_fee, payment_status, is_emergency
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        appointmentId + '-COUNTER',
        patient.id,
        doctor.id,
        today,
        today,
        100,
        'consultation',
        'scheduled',
        'Payment system test - pay at counter',
        doctor.consultation_fee,
        'unpaid',
        false
      ]);

      console.log('✅ Appointment with pay at counter created successfully');
      console.log(`   Appointment ID: ${appointmentId}-COUNTER`);
      console.log(`   Payment Status: unpaid (pay at counter)`);
      console.log(`   Amount: $${doctor.consultation_fee}`);
    } catch (error) {
      console.log('❌ Failed to create counter payment appointment:', error.message);
    }

    // Test 3: Verify data integrity
    console.log('\n📊 Test 3: Verifying payment data integrity...');
    
    const [testAppointments] = await connection.execute(`
      SELECT 
        a.appointment_id,
        a.payment_status,
        a.consultation_fee,
        b.invoice_number,
        b.payment_method,
        b.total_amount as billing_amount,
        u.name as patient_name,
        d.name as doctor_name
      FROM appointments a
      LEFT JOIN billing b ON a.id = b.appointment_id
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN doctors doc ON a.doctor_id = doc.id
      JOIN users d ON doc.user_id = d.id
      WHERE a.appointment_id LIKE ?
      ORDER BY a.created_at DESC
    `, [`${appointmentId}%`]);

    console.log('\n📋 Test Results Summary:');
    console.log('========================');
    testAppointments.forEach(apt => {
      const paymentIcon = apt.payment_status === 'paid' ? '✅' : '❌';
      const billingStatus = apt.invoice_number ? '📄 Billed' : '⏳ No Bill';
      
      console.log(`${paymentIcon} ${apt.appointment_id}`);
      console.log(`   Patient: ${apt.patient_name} | Doctor: ${apt.doctor_name}`);
      console.log(`   Payment: ${apt.payment_status} | Fee: $${apt.consultation_fee}`);
      console.log(`   Billing: ${billingStatus} ${apt.invoice_number ? `(${apt.invoice_number})` : ''}`);
      if (apt.billing_amount) {
        console.log(`   Method: ${apt.payment_method} | Amount: $${apt.billing_amount}`);
      }
      console.log('');
    });

    // Test 4: Payment status update simulation
    console.log('🧪 Test 4: Testing payment status update...');
    
    const counterAppointment = testAppointments.find(a => a.appointment_id.includes('COUNTER'));
    if (counterAppointment) {
      // Simulate patient paying at counter
      await connection.execute(`
        UPDATE appointments 
        SET payment_status = 'paid', updated_at = NOW()
        WHERE appointment_id = ?
      `, [counterAppointment.appointment_id]);

      // Create billing record for counter payment
      const counterInvoice = `INV-COUNTER-${Date.now()}`;
      await connection.execute(`
        INSERT INTO billing (
          appointment_id, patient_id, doctor_id, invoice_number, 
          amount, tax_amount, total_amount, payment_method, 
          payment_status, transaction_id, payment_gateway, paid_at
        ) SELECT id, patient_id, doctor_id, ?, ?, 0, ?, 'cash', 'paid', ?, 'counter', NOW()
        FROM appointments 
        WHERE appointment_id = ?
      `, [
        counterInvoice,
        doctor.consultation_fee,
        doctor.consultation_fee,
        `TXN-COUNTER-${Date.now()}`,
        counterAppointment.appointment_id
      ]);

      console.log(`✅ Counter payment processed: ${counterAppointment.appointment_id}`);
      console.log(`   Status changed from 'unpaid' to 'paid'`);
      console.log(`   Invoice created: ${counterInvoice}`);
    }

    console.log('\n🎉 Payment booking system test completed successfully!');
    console.log('\n📱 You can now test the full UI flow:');
    console.log('   1. Go to Book Appointment page');
    console.log('   2. Select doctor and date');
    console.log('   3. Fill appointment details');
    console.log('   4. Choose payment option (Pay Now or Pay at Counter)');
    console.log('   5. Complete booking and see payment status');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 Database connection closed');
    }
  }
}

// Run the test
testPaymentBooking();
