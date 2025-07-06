const { mysqlConnection } = require('./config/mysql');

async function checkAndCreateTables() {
  try {
    // Initialize the MySQL connection first
    console.log('Initializing MySQL connection...');
    await mysqlConnection.connect();
    
    // First, check what tables exist
    console.log('Checking existing tables...');
    const result = await mysqlConnection.query('SHOW TABLES');
    console.log('Existing tables:', result);

    // Check if invoices table exists
    const invoicesExists = result.some(row => Object.values(row)[0] === 'invoices');
    console.log('Invoices table exists:', invoicesExists);

    // Check if invoice_items table exists
    const itemsExists = result.some(row => Object.values(row)[0] === 'invoice_items');
    console.log('Invoice_items table exists:', itemsExists);

    if (!itemsExists) {
      console.log('Creating invoice_items table...');
      const createInvoiceItemsTable = `
        CREATE TABLE IF NOT EXISTS invoice_items (
          id VARCHAR(36) PRIMARY KEY,
          invoice_id VARCHAR(36) NOT NULL,
          description VARCHAR(255) NOT NULL,
          quantity INT NOT NULL DEFAULT 1,
          rate DECIMAL(10,2) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
          INDEX idx_invoice_id (invoice_id)
        )
      `;
      
      await mysqlConnection.query(createInvoiceItemsTable);
      console.log('✅ Invoice items table created successfully');
    }

    console.log('✅ Database setup completed');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAndCreateTables();
