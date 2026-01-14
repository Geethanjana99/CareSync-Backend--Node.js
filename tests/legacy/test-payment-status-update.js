// Test script to verify payment status update functionality
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

async function testPaymentStatusUpdate() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully!');

    // Get today's appointments to test with
    const today = new Date().toISOString().split('T')[0];
    
    const [appointments] = await connection.execute(`
      SELECT 
        a.id,
        a.appointment_id,
        u.name as patient_name,
        a.queue_number,
        a.is_emergency,
        a.payment_status,
        a.consultation_fee
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.queue_date = ?
      ORDER BY a.is_emergency DESC, a.queue_number ASC
      LIMIT 3
    `, [today]);

    if (appointments.length === 0) {
      console.log('❌ No appointments found for today. Run add-test-queue-payment-data.js first.');
      return;
    }

    console.log('\n📋 Current appointments:');
    appointments.forEach(apt => {
      const queueDisplay = apt.is_emergency ? `E${apt.queue_number}` : apt.queue_number;
      console.log(`  Queue #${queueDisplay} | ${apt.patient_name} | Payment: ${apt.payment_status} | Fee: $${apt.consultation_fee}`);
    });

    // Test updating payment status
    const testAppointment = appointments[0];
    const newPaymentStatus = testAppointment.payment_status === 'paid' ? 'unpaid' : 'paid';
    
    console.log(`\n🔄 Testing payment status update for ${testAppointment.patient_name}...`);
    console.log(`   Changing from "${testAppointment.payment_status}" to "${newPaymentStatus}"`);

    // Update payment status directly in database (simulating API call)
    await connection.execute(`
      UPDATE appointments 
      SET payment_status = ?, updated_at = NOW()
      WHERE id = ?
    `, [newPaymentStatus, testAppointment.id]);

    // Verify the update
    const [updatedAppointment] = await connection.execute(`
      SELECT payment_status, updated_at
      FROM appointments 
      WHERE id = ?
    `, [testAppointment.id]);

    if (updatedAppointment[0].payment_status === newPaymentStatus) {
      console.log('✅ Payment status updated successfully!');
      console.log(`   New status: ${updatedAppointment[0].payment_status}`);
      console.log(`   Updated at: ${updatedAppointment[0].updated_at}`);
    } else {
      console.log('❌ Payment status update failed');
    }

    // Revert the change for clean test data
    await connection.execute(`
      UPDATE appointments 
      SET payment_status = ?
      WHERE id = ?
    `, [testAppointment.payment_status, testAppointment.id]);
    
    console.log('🔄 Reverted payment status for next test');

    // Show final queue with payment summary
    const [finalQueue] = await connection.execute(`
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
      WHERE a.queue_date = ?
      ORDER BY a.is_emergency DESC, a.queue_number ASC
    `, [today]);

    // Calculate payment statistics
    const paidCount = finalQueue.filter(a => a.payment_status === 'paid').length;
    const unpaidCount = finalQueue.filter(a => a.payment_status === 'unpaid').length;
    const partialCount = finalQueue.filter(a => a.payment_status === 'partially_paid').length;
    const refundedCount = finalQueue.filter(a => a.payment_status === 'refunded').length;
    const totalRevenue = finalQueue
      .filter(a => a.payment_status === 'paid')
      .reduce((sum, a) => sum + parseFloat(a.consultation_fee || 0), 0);

    console.log('\n📊 Payment Statistics Summary:');
    console.log('================================');
    console.log(`✅ Paid: ${paidCount} appointments`);
    console.log(`❌ Unpaid: ${unpaidCount} appointments`);
    console.log(`⚠️  Partially Paid: ${partialCount} appointments`);
    console.log(`🔄 Refunded: ${refundedCount} appointments`);
    console.log(`💰 Total Revenue: $${totalRevenue.toFixed(2)}`);

    console.log('\n🎉 Payment status functionality test completed!');
    console.log('\n📱 You can now test the full functionality in the doctor queue management UI.');

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
testPaymentStatusUpdate();
