const { mysqlConnection } = require('./config/mysql');
const Invoice = require('./models/Invoice');

async function testFilters() {
  try {
    console.log('Connecting to database...');
    await mysqlConnection.connect();
    
    // Simulate the exact filters from the API call
    const filters = {
        status: undefined,
        patient_name: undefined,
        start_date: undefined,
        end_date: undefined,
        limit: 50
    };
    
    console.log('Filters:', filters);
    console.log('Testing Invoice.findAll with these filters...');
    const invoices = await Invoice.findAll(filters);
    
    console.log('Invoices found:', invoices.length);
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testFilters();
