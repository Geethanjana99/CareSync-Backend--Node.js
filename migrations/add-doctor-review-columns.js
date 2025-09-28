const { mysqlConnection } = require('../config/mysql');

/**
 * Add doctor review columns to diabetes_predictions table
 */
async function addDoctorReviewColumns() {
  console.log('🔄 Adding doctor review columns to diabetes_predictions table...');
  
  try {
    // Check if columns already exist
    const [columns] = await mysqlConnection.query(`
      SHOW COLUMNS FROM diabetes_predictions 
      WHERE Field IN ('doctor_notes', 'reviewed_by', 'reviewed_at')
    `);
    
    const existingColumns = columns.map(col => col.Field);
    
    // Add doctor_notes column if it doesn't exist
    if (!existingColumns.includes('doctor_notes')) {
      console.log('  ➕ Adding doctor_notes column...');
      await mysqlConnection.query(`
        ALTER TABLE diabetes_predictions 
        ADD COLUMN doctor_notes TEXT NULL AFTER notes
      `);
    }
    
    // Add reviewed_by column if it doesn't exist
    if (!existingColumns.includes('reviewed_by')) {
      console.log('  ➕ Adding reviewed_by column...');
      await mysqlConnection.query(`
        ALTER TABLE diabetes_predictions 
        ADD COLUMN reviewed_by VARCHAR(36) NULL AFTER doctor_notes
      `);
    }
    
    // Add reviewed_at column if it doesn't exist
    if (!existingColumns.includes('reviewed_at')) {
      console.log('  ➕ Adding reviewed_at column...');
      await mysqlConnection.query(`
        ALTER TABLE diabetes_predictions 
        ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by
      `);
    }
    
    // Add index for reviewed_by if column was added
    if (!existingColumns.includes('reviewed_by')) {
      console.log('  ➕ Adding index for reviewed_by...');
      await mysqlConnection.query(`
        ALTER TABLE diabetes_predictions 
        ADD INDEX idx_dp_reviewed_by (reviewed_by)
      `);
    }
    
    console.log('✅ Doctor review columns migration completed');
    
  } catch (error) {
    console.error('❌ Error adding doctor review columns:', error);
    throw error;
  }
}

async function main() {
  try {
    await addDoctorReviewColumns();
    console.log('🎉 Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { addDoctorReviewColumns };
