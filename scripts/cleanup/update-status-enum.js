const { mysqlConnection } = require('./config/mysql');

async function updateStatusEnum() {
  try {
    await mysqlConnection.connect();
    const pool = mysqlConnection.getPool();
    const connection = await pool.getConnection();
    
    console.log('📋 Checking current table structure:');
    
    // Check current table structure
    const [columns] = await connection.execute('DESCRIBE insurance_claims');
    const statusColumn = columns.find(col => col.Field === 'status');
    console.log('Current status column:', statusColumn);
    
    // Update the ENUM to include 'paid'
    const alterQuery = `
      ALTER TABLE insurance_claims 
      MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'processing', 'paid') 
      DEFAULT 'pending'
    `;
    
    console.log('\n🔧 Updating status ENUM to include "paid"...');
    await connection.execute(alterQuery);
    console.log('✅ Status ENUM updated successfully!');
    
    // Verify the change
    const [updatedColumns] = await connection.execute('DESCRIBE insurance_claims');
    const updatedStatusColumn = updatedColumns.find(col => col.Field === 'status');
    console.log('\nUpdated status column:', updatedStatusColumn);
    
    // Now update the claims from pending to paid
    console.log('\n💰 Updating claims from pending to paid...');
    const updateQuery = 'UPDATE insurance_claims SET status = ? WHERE status = ?';
    const [updateResult] = await connection.execute(updateQuery, ['paid', 'pending']);
    
    console.log(`✅ Updated ${updateResult.affectedRows} claims from 'pending' to 'paid'`);
    
    // Check final results
    const [finalClaims] = await connection.execute('SELECT id, patient_name, amount, status FROM insurance_claims');
    console.log('\n📊 Final insurance claims:');
    console.table(finalClaims);
    
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateStatusEnum();
