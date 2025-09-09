const { mysqlConnection } = require('./config/mysql');

async function testDoctors() {
  try {
    console.log('Connecting to database...');
    await mysqlConnection.connect();
    
    console.log('Testing doctors table...');
    
    // First, check if there are any doctors
    const countResult = await mysqlConnection.query('SELECT COUNT(*) as count FROM doctors');
    console.log('Total doctors in database:', countResult[0]);
    
    // Check active doctors
    const activeCountResult = await mysqlConnection.query("SELECT COUNT(*) as count FROM doctors WHERE status = 'active'");
    console.log('Active doctors:', activeCountResult[0]);
    
    // Check if users table has active users
    const usersCountResult = await mysqlConnection.query("SELECT COUNT(*) as count FROM users WHERE is_active = true");
    console.log('Active users:', usersCountResult[0]);
    
    // Try the actual query used in Doctor.findAll()
    const query = `
      SELECT d.*, u.name, u.email, u.phone, u.avatar_url, u.created_at
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'active' AND u.is_active = true
      ORDER BY d.rating DESC, d.total_reviews DESC, u.name ASC
    `;
    
    console.log('Executing actual query...');
    const result = await mysqlConnection.query(query);
    console.log('Query result count:', result.length);
    console.log('First result:', result[0] || 'No results');
    
  } catch (error) {
    console.error('Error testing doctors:', error);
  } finally {
    process.exit();
  }
}

testDoctors();
