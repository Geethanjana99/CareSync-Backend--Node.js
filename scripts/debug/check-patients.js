const { mysqlConnection } = require('./config/mysql');

async function checkPatients() {
  try {
    const result = await mysqlConnection.query(
      'SELECT u.email, u.name, u.role FROM users u WHERE u.role = "patient" LIMIT 5'
    );
    console.log('Available patients:');
    result.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.name} - ${patient.email}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkPatients();