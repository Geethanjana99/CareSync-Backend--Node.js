const { mysqlConnection } = require('./config/mysql');
const Invoice = require('./models/Invoice');

async function testInvoiceFindAll() {
  try {
    console.log('Connecting to database...');
    await mysqlConnection.connect();
    
    console.log('Testing Invoice.findAll()...');
    const invoices = await Invoice.findAll({});
    
    console.log('Invoices found:', invoices.length);
    if (invoices.length > 0) {
      console.log('First invoice:', invoices[0]);
    }
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testInvoiceFindAll();
