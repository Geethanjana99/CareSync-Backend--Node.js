const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'mysql-22de9abc-johndeere1972-e8a8.b.aivencloud.com',
  port: 22066,
  user: 'avnadmin',
  password: 'AVNS_1eFpPy5mCqhbOqQ_JNo',
  database: 'caresync',
  ssl: {
    rejectUnauthorized: false
  }
};

async function runSimpleMigration() {
  let connection;
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check if queue_date column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'caresync' 
      AND TABLE_NAME = 'appointments' 
      AND COLUMN_NAME = 'queue_date'
    `);

    if (columns.length === 0) {
      console.log('📝 Adding queue_date column to appointments table...');
      await connection.execute(`
        ALTER TABLE appointments 
        ADD COLUMN queue_date DATE NOT NULL DEFAULT (CURDATE())
      `);
      console.log('✅ Added queue_date column');
    } else {
      console.log('ℹ️  queue_date column already exists');
    }

    // Check if queue_number column exists
    const [queueNumberColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'caresync' 
      AND TABLE_NAME = 'appointments' 
      AND COLUMN_NAME = 'queue_number'
    `);

    if (queueNumberColumns.length === 0) {
      console.log('📝 Adding queue_number column to appointments table...');
      await connection.execute(`
        ALTER TABLE appointments 
        ADD COLUMN queue_number VARCHAR(10) DEFAULT NULL
      `);
      console.log('✅ Added queue_number column');
    } else {
      console.log('ℹ️  queue_number column already exists');
    }

    // Check if is_emergency column exists
    const [emergencyColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'caresync' 
      AND TABLE_NAME = 'appointments' 
      AND COLUMN_NAME = 'is_emergency'
    `);

    if (emergencyColumns.length === 0) {
      console.log('📝 Adding is_emergency column to appointments table...');
      await connection.execute(`
        ALTER TABLE appointments 
        ADD COLUMN is_emergency BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Added is_emergency column');
    } else {
      console.log('ℹ️  is_emergency column already exists');
    }

    // Check if queue_status table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'caresync' 
      AND TABLE_NAME = 'queue_status'
    `);

    if (tables.length === 0) {
      console.log('📝 Creating queue_status table...');
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
          FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
          UNIQUE KEY unique_doctor_date (doctor_id, queue_date),
          INDEX idx_queue_date (queue_date),
          INDEX idx_doctor_date (doctor_id, queue_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Created queue_status table');
    } else {
      console.log('ℹ️  queue_status table already exists');
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

runSimpleMigration();
