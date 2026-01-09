const { mysqlConnection } = require('./config/mysql');

async function updateClaimStatus() {
  try {
    await mysqlConnection.connect();
    const pool = mysqlConnection.getPool();
    const connection = await pool.getConnection();
    
    console.log('📋 Current insurance claims status:');
    
    // Check current claims
    const [currentClaims] = await connection.execute('SELECT id, patient_name, amount, status FROM insurance_claims');
    console.table(currentClaims);
    
    // Update all pending claims to paid
    const updateQuery = 'UPDATE insurance_claims SET status = ? WHERE status = ?';
    const [updateResult] = await connection.execute(updateQuery, ['paid', 'pending']);
    
    console.log(`✅ Updated ${updateResult.affectedRows} claims from 'pending' to 'paid'`);
    
    // Check updated claims
    const [updatedClaims] = await connection.execute('SELECT id, patient_name, amount, status FROM insurance_claims');
    console.log('\n📊 Updated insurance claims:');
    console.table(updatedClaims);
    
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating claim status:', error);
    process.exit(1);
  }
}

updateClaimStatus();
