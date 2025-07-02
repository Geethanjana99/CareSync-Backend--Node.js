const { mysqlConnection } = require('./config/mysql');

async function testInvoiceFindById() {
  try {
    // Connect to database first
    await mysqlConnection.connect();
    
    console.log('Testing Invoice findById method...');
    
    // First, get all invoices to see what's in the database
    console.log('\n1. Testing basic SELECT query:');
    const allInvoices = await mysqlConnection.query('SELECT * FROM invoices LIMIT 3');
    console.log('All invoices result:', allInvoices);
    console.log('Type of result:', typeof allInvoices);
    console.log('Is array:', Array.isArray(allInvoices));
    console.log('Length:', allInvoices.length);
    
    if (allInvoices.length > 0) {
      const firstInvoice = allInvoices[0];
      console.log('\nFirst invoice:', firstInvoice);
      console.log('First invoice ID:', firstInvoice.id);
      
      // Now test findById with that ID
      console.log('\n2. Testing findById query:');
      const query = 'SELECT * FROM invoices WHERE id = ?';
      const invoiceId = firstInvoice.id;
      
      console.log('Query:', query);
      console.log('Invoice ID:', invoiceId);
      
      const result = await mysqlConnection.query(query, [invoiceId]);
      console.log('FindById result:', result);
      console.log('FindById result type:', typeof result);
      console.log('FindById result length:', result.length);
      
      if (result.length > 0) {
        console.log('Found invoice:', result[0]);
      } else {
        console.log('No invoice found with that ID');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testInvoiceFindById();
