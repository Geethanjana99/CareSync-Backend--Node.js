const mysql = require('mysql2/promise');
require('dotenv').config();

const runEnhancedAvailabilityMigration = async () => {
  let connection;
  
  try {
    console.log('🚀 Starting Enhanced Availability System Migration...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'caresyncdb-caresync.e.aivencloud.com',
      port: process.env.MYSQL_PORT || 16006,
      user: process.env.MYSQL_USER || 'avnadmin',
      password: process.env.MYSQL_PASSWORD || 'AVNS_6xeaVpCVApextDTAKfU',
      database: process.env.MYSQL_DATABASE || 'caresync',
      multipleStatements: true,
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    });

    console.log('✅ Database connection established');

    // Read and execute migration file
    const fs = require('fs').promises;
    const path = require('path');
    
    const migrationPath = path.join(__dirname, 'migrations', '010_enhanced_availability_system.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    console.log('📖 Migration file loaded');
    
    // Execute migration
    await connection.execute(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the changes
    console.log('\n🔍 Verifying migration results...');
    
    // Check new columns in doctors table
    const [doctorColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'doctors' 
      AND COLUMN_NAME IN ('default_start_time', 'default_end_time', 'availability_status', 'auto_accept_appointments')
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'clinical_appointment_system']);
    
    console.log('New doctor columns:');
    doctorColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (Default: ${col.COLUMN_DEFAULT})`);
    });
    
    // Check new tables
    const [newTables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_COMMENT 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('doctor_default_availability', 'doctor_date_overrides', 'doctor_availability_slots')
    `, [process.env.DB_NAME || 'clinical_appointment_system']);
    
    console.log('\nNew tables created:');
    newTables.forEach(table => {
      console.log(`  - ${table.TABLE_NAME}`);
    });
    
    // Check stored procedures
    const [procedures] = await connection.execute(`
      SELECT ROUTINE_NAME, ROUTINE_TYPE 
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_SCHEMA = ? 
      AND ROUTINE_NAME IN ('CheckDoctorAvailability', 'GenerateDoctorTimeSlots')
    `, [process.env.DB_NAME || 'clinical_appointment_system']);
    
    console.log('\nStored procedures created:');
    procedures.forEach(proc => {
      console.log(`  - ${proc.ROUTINE_NAME} (${proc.ROUTINE_TYPE})`);
    });
    
    // Check view
    const [views] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.VIEWS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'doctor_complete_availability'
    `, [process.env.DB_NAME || 'clinical_appointment_system']);
    
    if (views.length > 0) {
      console.log('\nViews created:');
      views.forEach(view => {
        console.log(`  - ${view.TABLE_NAME}`);
      });
    }
    
    // Test data verification
    const [defaultAvailCount] = await connection.execute(`
      SELECT COUNT(*) as count FROM doctor_default_availability
    `);
    
    const [overridesCount] = await connection.execute(`
      SELECT COUNT(*) as count FROM doctor_date_overrides
    `);
    
    console.log(`\nData verification:`);
    console.log(`  - Default availability records: ${defaultAvailCount[0].count}`);
    console.log(`  - Date override records: ${overridesCount[0].count}`);
    
    console.log('\n🎉 Enhanced Availability System Migration completed successfully!');
    console.log('\nNew features available:');
    console.log('  ✅ Default available hours management');
    console.log('  ✅ Date-specific overrides and unavailability');
    console.log('  ✅ Enhanced time slot management');
    console.log('  ✅ Automated availability checking');
    console.log('  ✅ Improved performance with indexes and views');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run the migration if this file is executed directly
if (require.main === module) {
  runEnhancedAvailabilityMigration();
}

module.exports = { runEnhancedAvailabilityMigration };
