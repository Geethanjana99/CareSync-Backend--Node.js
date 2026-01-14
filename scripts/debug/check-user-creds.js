const { mysqlConnection } = require('./config/mysql');

async function checkUserCredentials() {
  try {
    const query = `
      SELECT u.email, u.role, d.name as doctor_name
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.role = 'doctor'
      LIMIT 5
    `;
    
    const [users] = await mysqlConnection.execute(query);
    console.log('Doctor users in database:');
    users.forEach(user => {
      console.log(`- Email: ${user.email}, Name: ${user.doctor_name || 'N/A'}`);
    });
    
    // Let's try creating a user with a known password
    console.log('\nNote: Most likely the password is "password123" for test accounts.');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUserCredentials();