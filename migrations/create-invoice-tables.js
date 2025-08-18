const { mysqlConnection } = require('../config/mysql');

async function createInvoiceTables() {
  try {    // Create invoices table
    const createInvoicesTable = `
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(36) PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        patient_name VARCHAR(255) NOT NULL,
        appointment_date DATE,
        due_date DATE NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
        notes TEXT,
        generated_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_generated_date (generated_date)
      )
    `;

    // Create invoice_items table
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

    await mysqlConnection.query(createInvoicesTable);
    console.log('✅ Invoices table created successfully');

    await mysqlConnection.query(createInvoiceItemsTable);
    console.log('✅ Invoice items table created successfully');

    console.log('✅ Invoice tables migration completed');
  } catch (error) {
    console.error('❌ Error creating invoice tables:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  createInvoiceTables()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createInvoiceTables };
