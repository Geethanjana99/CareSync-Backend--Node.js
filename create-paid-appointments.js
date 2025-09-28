const { mysqlConnection } = require('./config/mysql');

async function addTestPaidAppointments() {
  try {
    await mysqlConnection.connect();
  } catch (error) {
    console.log('Database already connected or connection failed:', error.message);
  }

  try {
    console.log('🔍 Checking existing appointments...');
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Check for existing appointments today
    const existing = await mysqlConnection.query(
      'SELECT * FROM appointments WHERE appointment_date = ? OR queue_date = ?',
      [today, today]
    );
    
    console.log(`Found ${existing ? existing.length : 0} existing appointments for today (${today})`);
    
    if (existing && existing.length > 0) {
      // Update existing appointments to have paid status
      console.log('💳 Updating existing appointments to paid status...');
      const updateResult = await mysqlConnection.query(
        'UPDATE appointments SET payment_status = ? WHERE (appointment_date = ? OR queue_date = ?) AND payment_status != ?',
        ['paid', today, today, 'paid']
      );
      console.log(`✅ Updated ${updateResult ? updateResult.affectedRows : 0} appointments to paid status`);
    } else {
      // Create some test appointments for today with paid status
      console.log('➕ Creating new test appointments with paid status...');
      
      // Get a doctor ID (assuming there's at least one doctor)
      const doctors = await mysqlConnection.query('SELECT id FROM doctors LIMIT 1');
      if (!doctors || doctors.length === 0) {
        console.log('❌ No doctors found. Please create a doctor first.');
        return;
      }
      const doctorId = doctors[0].id;
      
      // Get some patients
      const patients = await mysqlConnection.query('SELECT id FROM patients LIMIT 3');
      if (!patients || patients.length === 0) {
        console.log('❌ No patients found. Please create patients first.');
        return;
      }
      
      // Create appointments for each patient
      for (let i = 0; i < patients.length; i++) {
        const patient = patients[i];
        const appointmentId = `APT-${Date.now()}-${i + 1}`;
        
        await mysqlConnection.query(`
          INSERT INTO appointments (
            id, appointment_id, patient_id, doctor_id, appointment_date,
            appointment_type, status, reason_for_visit, symptoms, priority,
            notes, consultation_fee, payment_status, queue_number, is_emergency, queue_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          appointmentId,
          appointmentId,
          patient.id,
          doctorId,
          today,
          'consultation',
          'scheduled',
          'Regular checkup',
          'None',
          'normal',
          'Test appointment',
          100.00,
          'paid', // This is the key - setting it to paid!
          i + 1,
          false,
          today
        ]);
        
        console.log(`✅ Created paid appointment ${i + 1} for patient ${patient.id}`);
      }
    }
    
    // Verify the appointments
    const finalCheck = await mysqlConnection.query(
      'SELECT id, appointment_id, patient_id, doctor_id, payment_status, queue_number FROM appointments WHERE (appointment_date = ? OR queue_date = ?) AND payment_status = ?',
      [today, today, 'paid']
    );
    
    console.log(`🎉 Final check: ${finalCheck ? finalCheck.length : 0} paid appointments ready for today`);
    console.log('Paid appointments:', finalCheck);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Connection is managed by the config, no need to close
  }
}

addTestPaidAppointments();