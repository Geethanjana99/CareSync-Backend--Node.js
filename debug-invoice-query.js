const { mysqlConnection } = require('./config/mysql');

async function testInvoiceQuery() {
  try {
    console.log('Connecting to database...');
    await mysqlConnection.connect();
    
    console.log('Testing direct query...');
    const testId = '33105cc2-a71c-40cc-b076-2c5f79935165';
    
    // Test the exact query that's failing
    const query = 'SELECT * FROM invoices WHERE id = ?';
    console.log('Executing query:', query);
    console.log('With parameter:', testId);
    
    const result = await mysqlConnection.query(query, [testId]);
    console.log('Raw result:', result);
    console.log('Result type:', typeof result);
    console.log('Is array?', Array.isArray(result));
    console.log('Length:', result?.length);
    
    if (result && result.length > 0) {
      console.log('First record:', result[0]);
    } else {
      console.log('No records found');
    }
    
    // Also test a query that should return multiple results
    console.log('\n--- Testing findAll query ---');
    const allQuery = 'SELECT * FROM invoices LIMIT 2';
    const allResult = await mysqlConnection.query(allQuery, []);
    console.log('All invoices result:', allResult);
    console.log('All invoices length:', allResult?.length);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testInvoiceQuery();
