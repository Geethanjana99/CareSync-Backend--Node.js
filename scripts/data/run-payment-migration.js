// Migration script to add payment status column to appointments table
const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration for Aiven
const dbConfig = {
  host: process.env.MYSQL_HOST || 'caresyncdb-caresync.e.aivencloud.com',
  port: process.env.MYSQL_PORT || 16006,
  user: process.env.MYSQL_USER || 'avnadmin',
  password: process.env.MYSQL_PASSWORD || 'AVNS_6xeaVpCVApextDTAKfU',
  database: process.env.MYSQL_DATABASE || 'caresync',
  ssl: {
    rejectUnauthorized: false
  }
};

async function runMigration() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully!');

    // Read migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, 'migrations', '012_add_payment_status_to_appointments.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL commands by delimiter
    const commands = migrationSQL
      .split(';')
      .filter(cmd => cmd.trim() && !cmd.trim().startsWith('--') && cmd.trim() !== 'DELIMITER //')
      .map(cmd => cmd.trim());

    console.log(`📝 Found ${commands.length} SQL commands to execute`);

    // Execute each command
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command && command.length > 0) {
        try {
          console.log(`🔄 Executing command ${i + 1}/${commands.length}...`);
          
          // Handle DELIMITER commands for triggers
          if (command.includes('CREATE TRIGGER')) {
            // For triggers, we need to handle them specially
            const triggerSQL = command.replace(/DELIMITER \/\//g, '').replace(/\/\//g, '');
            await connection.execute(triggerSQL);
          } else {
            await connection.execute(command);
          }
          
          console.log(`✅ Command ${i + 1} executed successfully`);
        } catch (error) {
          console.log(`⚠️  Command ${i + 1} failed (might already exist): ${error.message}`);
        }
      }
    }

    // Verify the changes
    console.log('\n📊 Verifying migration...');
    
    // Check if payment_status column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'caresync' 
      AND TABLE_NAME = 'appointments' 
      AND COLUMN_NAME = 'payment_status'
    `);

    if (columns.length > 0) {
      console.log('✅ payment_status column added successfully:');
      console.log('   Type:', columns[0].DATA_TYPE);
      console.log('   Default:', columns[0].COLUMN_DEFAULT);
    } else {
      console.log('❌ payment_status column not found');
    }

    // Check indexes
    const [indexes] = await connection.execute(`
      SELECT INDEX_NAME, COLUMN_NAME
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = 'caresync' 
      AND TABLE_NAME = 'appointments' 
      AND INDEX_NAME IN ('idx_payment_status', 'idx_doctor_date_queue_payment')
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `);

    console.log('📈 Indexes created:');
    indexes.forEach(idx => {
      console.log(`   ${idx.INDEX_NAME}: ${idx.COLUMN_NAME}`);
    });

    // Show sample data with payment status
    const [sampleData] = await connection.execute(`
      SELECT 
        appointment_id,
        queue_number,
        is_emergency,
        payment_status,
        status,
        consultation_fee
      FROM appointments 
      WHERE queue_number IS NOT NULL 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log('\n📋 Sample appointments with payment status:');
    sampleData.forEach(apt => {
      const queueDisplay = apt.is_emergency ? `E-${apt.queue_number}` : apt.queue_number;
      const feeDisplay = apt.consultation_fee ? `$${apt.consultation_fee}` : 'No fee';
      console.log(`   Queue #${queueDisplay} | Payment: ${apt.payment_status} | Status: ${apt.status} | Fee: ${feeDisplay}`);
    });

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 Database connection closed');
    }
  }
}

// Run the migration
runMigration();
