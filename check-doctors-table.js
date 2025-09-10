const connectMySQL = require('./config/mysql');
const { mysqlConnection } = require('./config/mysql');

async function checkDoctorsTable() {
  try {
    await connectMySQL();
    console.log('Doctors table structure:');
    const structure = await mysqlConnection.query('DESCRIBE doctors');
    structure.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default} ${col.Extra}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkDoctorsTable();
