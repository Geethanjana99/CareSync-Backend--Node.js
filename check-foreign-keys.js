const { mysqlConnection } = require('./config/mysql');

async function checkForeignKeys() {
  try {
    console.log('=== CHECKING FOREIGN KEY CONSTRAINTS ===\n');
    
    // Check foreign keys in doctors table
    console.log('1. Foreign keys in doctors table:');
    const [doctorFKs] = await mysqlConnection.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'doctors' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.log(doctorFKs);
    
    console.log('\n2. Doctors table structure:');
    const [doctorCols] = await mysqlConnection.query('DESCRIBE doctors');
    console.log(doctorCols);
    
    console.log('\n3. Users table structure:');
    const [userCols] = await mysqlConnection.query('DESCRIBE users');
    console.log(userCols);
    
    console.log('\n4. Check actual data relationship:');
    const [dataCheck] = await mysqlConnection.query(`
      SELECT 
        u.id as user_id, 
        u.username, 
        u.role,
        d.id as doctor_id,
        d.user_id as doctor_user_id
      FROM users u 
      LEFT JOIN doctors d ON u.id = d.user_id 
      WHERE u.role = 'doctor'
      LIMIT 3
    `);
    console.log(dataCheck);
    
    console.log('\n5. Check for orphaned records:');
    const [orphaned] = await mysqlConnection.query(`
      SELECT d.id, d.user_id, 'doctors' as table_name
      FROM doctors d 
      LEFT JOIN users u ON d.user_id = u.id 
      WHERE u.id IS NULL
      LIMIT 5
    `);
    console.log('Orphaned doctor records:', orphaned);
    
    console.log('\n6. Check all constraints in database:');
    const [allConstraints] = await mysqlConnection.query(`
      SELECT 
        TABLE_NAME,
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, CONSTRAINT_NAME
    `);
    console.log(allConstraints);
    
  } catch (error) {
    console.error('Error checking foreign keys:', error);
  } finally {
    process.exit();
  }
}

checkForeignKeys();
