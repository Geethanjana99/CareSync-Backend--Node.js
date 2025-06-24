const { mysqlConnection } = require('./config/mysql');
const { v4: uuidv4 } = require('uuid');

async function createDoctorAvailability() {
  console.log('Creating doctor availability records...\n');

  try {
    await mysqlConnection.connect();
    const pool = mysqlConnection.getPool();
    const connection = await pool.getConnection();

    // Get all active doctors
    const [doctors] = await connection.execute(`
      SELECT id, doctor_id, specialty 
      FROM doctors 
      WHERE status = 'active'
    `);

    console.log(`Found ${doctors.length} active doctors`);

    // Define standard working hours
    const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const workingHours = {
      morning: { start: '09:00:00', end: '12:00:00' },
      afternoon: { start: '14:00:00', end: '17:00:00' }
    };

    let totalRecords = 0;

    for (const doctor of doctors) {
      console.log(`\nCreating availability for Dr. ${doctor.doctor_id} (${doctor.specialty})`);
      
      for (const day of workingDays) {
        // Morning session
        const morningId = uuidv4();
        await connection.execute(`
          INSERT INTO doctor_availability (
            id, doctor_id, day_of_week, start_time, end_time, 
            slot_duration, max_appointments_per_slot, is_active, 
            effective_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          morningId,
          doctor.id,
          day,
          workingHours.morning.start,
          workingHours.morning.end,
          30, // 30-minute slots
          1,  // 1 appointment per slot
          1,  // active
          '2025-01-01' // effective from start of year
        ]);

        // Afternoon session
        const afternoonId = uuidv4();
        await connection.execute(`
          INSERT INTO doctor_availability (
            id, doctor_id, day_of_week, start_time, end_time, 
            slot_duration, max_appointments_per_slot, is_active, 
            effective_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          afternoonId,
          doctor.id,
          day,
          workingHours.afternoon.start,
          workingHours.afternoon.end,
          30, // 30-minute slots
          1,  // 1 appointment per slot
          1,  // active
          '2025-01-01' // effective from start of year
        ]);

        totalRecords += 2;
        console.log(`  ✅ ${day}: ${workingHours.morning.start}-${workingHours.morning.end}, ${workingHours.afternoon.start}-${workingHours.afternoon.end}`);
      }
    }

    // Verify records were created
    const [verification] = await connection.execute(`
      SELECT 
        d.doctor_id,
        d.specialty,
        da.day_of_week,
        da.start_time,
        da.end_time
      FROM doctor_availability da
      JOIN doctors d ON da.doctor_id = d.id
      ORDER BY d.doctor_id, 
        FIELD(da.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
        da.start_time
      LIMIT 10
    `);

    console.log(`\n✅ Successfully created ${totalRecords} availability records`);
    console.log('\nSample availability records:');
    verification.forEach(record => {
      console.log(`  - Dr. ${record.doctor_id} (${record.specialty}): ${record.day_of_week} ${record.start_time}-${record.end_time}`);
    });

    // Test the availability method
    console.log('\n🧪 Testing availability retrieval...');
    const testDoctorId = doctors[0].id;
    const testDate = '2025-06-25'; // Wednesday
    
    const [availableSlots] = await connection.execute(`
      SELECT start_time, end_time, slot_duration, max_appointments_per_slot
      FROM doctor_availability
      WHERE doctor_id = ? AND day_of_week = 'Wednesday' AND is_active = true
      AND effective_date <= ? AND (expiry_date IS NULL OR expiry_date >= ?)
    `, [testDoctorId, testDate, testDate]);

    console.log(`Found ${availableSlots.length} availability windows for ${testDate}:`);
    availableSlots.forEach(slot => {
      console.log(`  - ${slot.start_time} to ${slot.end_time} (${slot.slot_duration}min slots, max ${slot.max_appointments_per_slot} per slot)`);
    });

    connection.release();

  } catch (error) {
    console.error('❌ Error creating availability:', error.message);
    console.error(error.stack);
  }
}

createDoctorAvailability().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
