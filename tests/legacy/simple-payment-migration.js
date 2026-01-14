// Simple migration script to add payment status column to appointments table
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

async function runSimpleMigration() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully!');

    // Step 1: Add payment_status column
    console.log('🔄 Adding payment_status column...');
    try {
      await connection.execute(`
        ALTER TABLE \`appointments\` 
        ADD COLUMN \`payment_status\` ENUM('unpaid', 'paid', 'partially_paid', 'refunded') 
        DEFAULT 'unpaid' 
        AFTER \`consultation_fee\`
      `);
      console.log('✅ payment_status column added successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ payment_status column already exists');
      } else {
        throw error;
      }
    }

    // Step 2: Add indexes
    console.log('🔄 Adding indexes...');
    try {
      await connection.execute(`
        ALTER TABLE \`appointments\` 
        ADD INDEX \`idx_payment_status\` (\`payment_status\`)
      `);
      console.log('✅ idx_payment_status index added');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✅ idx_payment_status index already exists');
      } else {
        console.log('⚠️  Index creation failed:', error.message);
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE \`appointments\` 
        ADD INDEX \`idx_doctor_date_queue_payment\` (\`doctor_id\`, \`appointment_date\`, \`queue_number\`, \`payment_status\`)
      `);
      console.log('✅ idx_doctor_date_queue_payment index added');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✅ idx_doctor_date_queue_payment index already exists');
      } else {
        console.log('⚠️  Composite index creation failed:', error.message);
      }
    }

    // Step 3: Update existing appointments to have payment status based on billing table
    console.log('🔄 Updating existing appointment payment statuses...');
    const [updateResult] = await connection.execute(`
      UPDATE \`appointments\` a
      LEFT JOIN \`billing\` b ON a.id = b.appointment_id
      SET a.payment_status = CASE 
          WHEN b.payment_status = 'paid' THEN 'paid'
          WHEN b.payment_status = 'partially_paid' THEN 'partially_paid'
          WHEN b.payment_status = 'refunded' THEN 'refunded'
          ELSE 'unpaid'
      END
      WHERE a.payment_status = 'unpaid'
    `);
    console.log(`✅ Updated ${updateResult.affectedRows} appointments with payment status`);

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
      console.log('✅ payment_status column verified:');
      console.log('   Type:', columns[0].DATA_TYPE);
      console.log('   Default:', columns[0].COLUMN_DEFAULT);
    } else {
      console.log('❌ payment_status column not found');
    }

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
      LIMIT 10
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
runSimpleMigration();
