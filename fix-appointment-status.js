const { mysqlConnection } = require('./config/mysql');

async function fixAppointmentStatus() {
  try {
    await mysqlConnection.connect();
  } catch (error) {
    console.log('Database already connected:', error.message);
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    
    console.log('🔧 Fixing appointment status for paid appointments...');
    
    // Update appointments to have 'pending' status instead of 'scheduled'
    const result = await mysqlConnection.query(
      `UPDATE appointments 
       SET status = 'pending' 
       WHERE (appointment_date = ? OR queue_date = ?) 
       AND payment_status = 'paid' 
       AND status = 'scheduled'`,
      [today, today]
    );
    
    console.log(`✅ Updated ${result ? result.affectedRows : 0} appointments to pending status`);
    
    // Verify the update
    const verification = await mysqlConnection.query(
      `SELECT id, appointment_id, status, payment_status, queue_number, is_emergency 
       FROM appointments 
       WHERE (appointment_date = ? OR queue_date = ?) AND payment_status = 'paid'`,
      [today, today]
    );
    
    console.log('📊 Current paid appointments:', verification);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixAppointmentStatus();