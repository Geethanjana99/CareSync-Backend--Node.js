const { mysqlConnection } = require('./config/mysql');

async function testInvoiceQuery() {
  try {
    console.log('Connecting to database...');
    await mysqlConnection.connect();
    
    console.log('Testing direct query...');
    const query = 'SELECT * FROM invoices WHERE 1=1 ORDER BY created_at DESC';
    const result = await mysqlConnection.query(query, []);
    
    console.log('Query result:', result);
    console.log('Number of invoices:', result.length);
    
    if (result.length > 0) {
      console.log('First invoice:', result[0]);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testInvoiceQuery();
