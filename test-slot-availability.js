const { mysqlConnection } = require('./config/mysql');
const Appointment = require('./models/Appointment');

async function testSlotAvailability() {
  console.log('Testing slot availability...\n');

  try {
    await mysqlConnection.connect();
    const pool = mysqlConnection.getPool();
    const connection = await pool.getConnection();

    // Get a doctor ID
    const [doctors] = await connection.execute('SELECT id, doctor_id FROM doctors LIMIT 1');
    if (doctors.length === 0) {
      console.log('❌ No doctors found');
      return;
    }

    const doctorId = doctors[0].id;
    const testDate = '2025-06-26'; // Thursday
    const testTime = '10:00:00';

    console.log(`Testing availability for Doctor ${doctors[0].doctor_id}`);
    console.log(`Date: ${testDate}, Time: ${testTime}\n`);

    // Test 1: Check if the isSlotAvailable method works
    console.log('1. Testing isSlotAvailable method directly...');
    try {
      const isAvailable = await Appointment.isSlotAvailable(doctorId, testDate, testTime);
      console.log(`✅ Slot is available: ${isAvailable}`);
    } catch (error) {
      console.log(`❌ Error in isSlotAvailable: ${error.message}`);
      console.log(error.stack);
    }

    // Test 2: Check what the query returns manually
    console.log('\n2. Testing the SQL query manually...');
    try {
      const query = `
        SELECT COUNT(*) as count FROM appointments 
        WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
        AND status NOT IN ('cancelled', 'no-show')
      `;      const [result] = await connection.execute(query, [doctorId, testDate, testTime]);
      console.log(`✅ Manual query result:`, result[0]);
      console.log(`   Count type: ${typeof result[0].count}, Value: ${result[0].count}`);
      console.log(`   Slot should be available: ${parseInt(result[0].count) === 0}`);
    } catch (error) {
      console.log(`❌ Error in manual query: ${error.message}`);
    }

    // Test 3: Check existing appointments for this doctor
    console.log('\n3. Checking existing appointments for this doctor...');
    try {
      const [appointments] = await connection.execute(`
        SELECT appointment_date, appointment_time, status
        FROM appointments 
        WHERE doctor_id = ?
        ORDER BY appointment_date, appointment_time
      `, [doctorId]);
      console.log(`Found ${appointments.length} appointments for this doctor:`);
      appointments.forEach(apt => {
        console.log(`  - ${apt.appointment_date.toISOString().split('T')[0]} ${apt.appointment_time} (${apt.status})`);
      });
    } catch (error) {
      console.log(`❌ Error checking appointments: ${error.message}`);
    }    // Test 4: Test the mysqlConnection.query method
    console.log('\n4. Testing mysqlConnection.query method...');
    try {
      const testQuery = 'SELECT 1 as test';
      const result = await mysqlConnection.query(testQuery, []);
      console.log(`✅ mysqlConnection.query works:`, result);
    } catch (error) {
      console.log(`❌ Error in mysqlConnection.query: ${error.message}`);
      console.log(error.stack);
    }

    // Test 5: Test getAvailableSlots method
    console.log('\n5. Testing getAvailableSlots method...');
    try {
      const availableSlots = await Appointment.getAvailableSlots(doctorId, testDate);
      console.log(`✅ Available slots for ${testDate}:`, availableSlots);
      console.log(`   Found ${availableSlots.length} available slots`);
    } catch (error) {
      console.log(`❌ Error in getAvailableSlots: ${error.message}`);
      console.log(error.stack);
    }

    connection.release();

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testSlotAvailability().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
