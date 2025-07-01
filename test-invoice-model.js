const { mysqlConnection } = require('./config/mysql');
const Invoice = require('./models/Invoice');

async function testInvoiceModel() {
  try {
    // Connect to database first
    await mysqlConnection.connect();
    
    console.log('Testing Invoice model findById method...');
    
    // Get an existing invoice ID
    const allInvoices = await mysqlConnection.query('SELECT * FROM invoices LIMIT 1');
    if (allInvoices.length === 0) {
      console.log('No invoices found in database');
      return;
    }
    
    const testInvoiceId = allInvoices[0].id;
    console.log('Testing with invoice ID:', testInvoiceId);
    
    // Test the Invoice model's findById method
    console.log('\nTesting Invoice.findById...');
    const invoice = await Invoice.findById(testInvoiceId);
    
    console.log('Invoice.findById result:', invoice);
    console.log('Invoice is null?', invoice === null);
    console.log('Invoice is undefined?', invoice === undefined);
    
    if (invoice) {
      console.log('Invoice found:', {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        status: invoice.status
      });
    } else {
      console.log('Invoice NOT found by model method');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testInvoiceModel();
