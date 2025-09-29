const { mysqlConnection } = require('./config/mysql');

async function testDateIssue() {
  try {
    await mysqlConnection.connect();
    console.log('🔍 Testing Date Format Issue...\n');
    
    // Test different date queries
    console.log('1️⃣ Testing CURDATE() value:');
    const [curdateResult] = await mysqlConnection.query('SELECT CURDATE() as cur_date, NOW() as cur_datetime');
    console.log('CURDATE():', curdateResult.cur_date);
    console.log('NOW():', curdateResult.cur_datetime);
    
    console.log('\n2️⃣ Testing appointment queue_date values:');
    const queueDatesQuery = `
      SELECT DISTINCT queue_date, DATE(queue_date) as date_only, COUNT(*) as count
      FROM appointments 
      GROUP BY queue_date, DATE(queue_date)
      ORDER BY queue_date DESC 
      LIMIT 10
    `;
    const queueDates = await mysqlConnection.query(queueDatesQuery);
    console.log('Queue dates in database:');
    queueDates.forEach(row => {
      console.log(`- queue_date: ${row.queue_date} | DATE(queue_date): ${row.date_only} | count: ${row.count}`);
    });
    
    console.log('\n3️⃣ Testing the problematic query from getTodayAppointmentsWithDetails:');
    const doctorId = '11aedc76-46d6-4907-83ee-152d097196b8'; // Geeth's doctor ID
    
    // Original query with CURDATE()
    const originalQuery = `
      SELECT COUNT(*) as count
      FROM appointments a
      WHERE a.doctor_id = ? AND a.queue_date = CURDATE()
    `;
    const [originalResult] = await mysqlConnection.query(originalQuery, [doctorId]);
    console.log(`Original query (CURDATE()): ${originalResult.count} appointments`);
    
    // Modified query with today's date string
    const today = new Date().toISOString().split('T')[0];
    const modifiedQuery = `
      SELECT COUNT(*) as count
      FROM appointments a
      WHERE a.doctor_id = ? AND a.queue_date = ?
    `;
    const [modifiedResult] = await mysqlConnection.query(modifiedQuery, [doctorId, today]);
    console.log(`Modified query (${today}): ${modifiedResult.count} appointments`);
    
    // Test with DATE() function
    const dateQuery = `
      SELECT COUNT(*) as count
      FROM appointments a
      WHERE a.doctor_id = ? AND DATE(a.queue_date) = CURDATE()
    `;
    const [dateResult] = await mysqlConnection.query(dateQuery, [doctorId]);
    console.log(`DATE() function query: ${dateResult.count} appointments`);
    
    console.log('\n4️⃣ Full appointment data for this doctor:');
    const fullQuery = `
      SELECT a.id, a.queue_date, a.status, u.name as patient_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = ?
      ORDER BY a.queue_date DESC
      LIMIT 5
    `;
    const appointments = await mysqlConnection.query(fullQuery, [doctorId]);
    appointments.forEach(apt => {
      console.log(`- ${apt.patient_name}: ${apt.queue_date} (${apt.status})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

testDateIssue();