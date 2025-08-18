const mysql = require('mysql2/promise');

// Use Aiven.io database configuration (same as server)
const dbConfig = {
  host: 'caresyncdb-caresync.e.aivencloud.com',
  port: 16006,
  user: 'avnadmin',
  password: 'AVNS_6xeaVpCVApextDTAKfU',
  database: 'caresync',
  ssl: {
    rejectUnauthorized: false
  }
};

async function checkAndFixDatabase() {
  let connection;
  try {
    console.log('🔗 Connecting to local database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check current appointments table structure
    console.log('📋 Checking appointments table structure...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'caresync' 
      AND TABLE_NAME = 'appointments'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('Current appointments table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    // Check if queue_status table exists
    console.log('\n📋 Checking if queue_status table exists...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'caresync' 
      AND TABLE_NAME = 'queue_status'
    `);

    if (tables.length === 0) {
      console.log('❌ queue_status table does not exist. Creating...');
      await connection.execute(`
        CREATE TABLE queue_status (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          doctor_id VARCHAR(36) NOT NULL,
          queue_date DATE NOT NULL,
          current_number VARCHAR(10) DEFAULT '0',
          current_emergency_number VARCHAR(10) DEFAULT 'E0',
          max_emergency_slots INT DEFAULT 5,
          emergency_used INT DEFAULT 0,
          regular_count INT DEFAULT 0,
          available_from TIME DEFAULT '09:00:00',
          available_to TIME DEFAULT '17:00:00',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_queue_date (queue_date),
          INDEX idx_doctor_date (doctor_id, queue_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Created queue_status table');
    } else {
      console.log('✅ queue_status table already exists');
    }

    // Check for queue-related columns in appointments
    const queueColumns = ['queue_number', 'is_emergency', 'queue_date'];
    for (const colName of queueColumns) {
      const [colExists] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'caresync' 
        AND TABLE_NAME = 'appointments' 
        AND COLUMN_NAME = ?
      `, [colName]);

      if (colExists.length === 0) {
        console.log(`📝 Adding ${colName} column to appointments table...`);
        let alterQuery = '';
        switch(colName) {
          case 'queue_number':
            alterQuery = 'ALTER TABLE appointments ADD COLUMN queue_number VARCHAR(10) DEFAULT NULL';
            break;
          case 'is_emergency':
            alterQuery = 'ALTER TABLE appointments ADD COLUMN is_emergency BOOLEAN DEFAULT FALSE';
            break;
          case 'queue_date':
            alterQuery = 'ALTER TABLE appointments ADD COLUMN queue_date DATE NOT NULL DEFAULT (CURDATE())';
            break;
        }
        await connection.execute(alterQuery);
        console.log(`✅ Added ${colName} column`);
      } else {
        console.log(`ℹ️  ${colName} column already exists`);
      }
    }

    // Remove obsolete time-slot columns
    console.log('\n🗑️  Removing obsolete time-slot columns...');
    
    const columnsToRemove = ['appointment_time', 'duration', 'estimated_wait_time', 'actual_wait_time'];
    
    for (const colName of columnsToRemove) {
      try {
        const [colExists] = await connection.execute(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'appointments' 
          AND COLUMN_NAME = ?
        `, [colName]);

        if (colExists.length > 0) {
          console.log(`📝 Removing ${colName} column from appointments table...`);
          await connection.execute(`ALTER TABLE appointments DROP COLUMN ${colName}`);
          console.log(`✅ Removed ${colName} column`);
        } else {
          console.log(`ℹ️  ${colName} column already removed`);
        }
      } catch (error) {
        console.log(`❌ Error removing ${colName} column:`, error.message);
      }
    }

    console.log('\n🎉 Database structure updated successfully!');

  } catch (error) {
    console.error('❌ Database operation failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

checkAndFixDatabase();
