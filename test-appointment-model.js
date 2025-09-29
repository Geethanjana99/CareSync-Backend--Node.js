const Appointment = require('./models/Appointment');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testAppointmentModel() {
  try {
    console.log('🧪 Testing Appointment model payment status...');
    
    // Initialize the database connection first
    const { mysqlConnection } = require('./config/mysql');
    await mysqlConnection.connect();
    console.log('✅ Database connected');
    
    // Test appointment data with paid status
    const appointmentData = {
      patient_id: '66e0b4b55b5eda3535a8ceef', // Existing patient ID
      doctor_id: 1,
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_type: 'consultation',
      reason_for_visit: 'Test payment status fix',
      symptoms: 'Testing if paid status is preserved',
      priority: 'medium',
      consultation_fee: 50,
      payment_status: 'paid',  // This should stay 'paid'
      status: 'scheduled'
    };

    console.log('\n📤 Creating appointment with:');
    console.log(`   payment_status: ${appointmentData.payment_status}`);
    
    // Create the appointment object
    const appointment = new Appointment(appointmentData);
    
    console.log('\n📋 Appointment object payment_status:');
    console.log(`   appointment.payment_status: ${appointment.payment_status}`);
    
    // Test the payment_status || 'unpaid' logic
    const paymentStatusValue = appointment.payment_status || 'unpaid';
    console.log(`   payment_status || 'unpaid': ${paymentStatusValue}`);
    
    if (paymentStatusValue === 'paid') {
      console.log('✅ SUCCESS: Payment status is preserved in the Appointment object!');
    } else {
      console.log(`❌ FAILED: Payment status became "${paymentStatusValue}" instead of "paid"`);
    }

    // Actually create the appointment in database
    console.log('\n💾 Creating appointment in database...');
    const createdAppointment = await Appointment.createQueueAppointment(appointmentData);
    
    console.log(`   Created appointment ID: ${createdAppointment.appointment_id}`);
    
    // Query the database to verify
    const [results] = await mysqlConnection.query(
      'SELECT appointment_id, payment_status FROM appointments WHERE appointment_id = ?',
      [createdAppointment.appointment_id]
    );
    
    if (results.length > 0) {
      console.log(`   Database payment_status: ${results[0].payment_status}`);
      
      if (results[0].payment_status === 'paid') {
        console.log('🎉 SUCCESS: Payment status is correctly stored as "paid" in database!');
      } else {
        console.log(`❌ FAILED: Database shows "${results[0].payment_status}" instead of "paid"`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAppointmentModel().then(() => {
  process.exit(0);
});