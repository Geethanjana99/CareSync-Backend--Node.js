const { mysqlConnection } = require('./config/mysql');

async function checkLoginUsers() {
  try {
    await mysqlConnection.connect();
    
    console.log('=== Available Test Users ===');
    const users = await mysqlConnection.query('SELECT name, email, role FROM users WHERE is_active = true AND (role = ? OR role = ?) LIMIT 5', ['doctor', 'patient']);
    
    users.forEach((user, i) => {
      console.log(`${i+1}. ${user.role.toUpperCase()}: ${user.name} (${user.email})`);
    });
    
    console.log('\n💡 You can login with any of these users to test the system.');
    console.log('🔍 Check the database for passwords or create a new account.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLoginUsers();
