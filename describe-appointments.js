const { mysqlConnection } = require('./config/mysql');

async function describeAppointmentsTable() {
  try {
    console.log('Describing appointments table...');
    
    // Initialize the connection
    await mysqlConnection.connect();
    console.log('Database connected successfully');
    
    // Describe the table
    const columns = await mysqlConnection.query('DESCRIBE appointments');
    console.log('Appointments table columns:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field} (${col.Type}) - ${col.Null} - ${col.Key} - ${col.Default}`);
    });
    
  } catch (error) {
    console.error('Error describing table:', error);
  }
  
  process.exit(0);
}

describeAppointmentsTable();
