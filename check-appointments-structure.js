const { mysqlConnection } = require('./config/mysql');

async function checkTable() {
  try {
    await mysqlConnection.connect();
    const structure = await mysqlConnection.query('DESCRIBE appointments');
    console.log('Appointments table structure:');
    structure.forEach((col, i) => {
      console.log(`${i+1}. ${col.Field} - ${col.Type} - Null: ${col.Null} - Default: ${col.Default}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTable();
