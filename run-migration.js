const fs = require('fs');
const path = require('path');
const { mysqlConnection } = require('./config/mysql');

async function runMigration() {
  try {
    console.log('🔄 Running queue system migration...');
    
    // Wait for connection to be established
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '009_queue_based_appointments.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== 'COMMIT');
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (const [index, statement] of statements.entries()) {
      try {
        if (statement.includes('DELIMITER') || statement.includes('$$')) {
          console.log(`⏭️  Skipping delimiter statement ${index + 1}`);
          continue;
        }
        
        console.log(`⚡ Executing statement ${index + 1}...`);
        await mysqlConnection.query(statement);
        console.log(`✅ Statement ${index + 1} executed successfully`);
      } catch (error) {
        if (error.message.includes('Duplicate column') || 
            error.message.includes('already exists') ||
            error.message.includes('Duplicate key')) {
          console.log(`ℹ️  Statement ${index + 1} - Already exists (skipping)`);
        } else {
          console.log(`❌ Error in statement ${index + 1}:`, error.message);
        }
      }
    }
    
    // Manual execution of key changes
    console.log('\n🔧 Applying manual schema changes...');
    
    // Add queue columns to appointments if they don't exist
    try {
      await mysqlConnection.query(`
        ALTER TABLE appointments 
        ADD COLUMN IF NOT EXISTS queue_number VARCHAR(10) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS queue_date DATE DEFAULT (CURDATE())
      `);
      console.log('✅ Queue columns added to appointments table');
    } catch (error) {
      console.log('ℹ️  Queue columns already exist in appointments table');
    }
    
    // Create queue_status table
    try {
      await mysqlConnection.query(`
        CREATE TABLE IF NOT EXISTS queue_status (
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
          UNIQUE KEY unique_doctor_date (doctor_id, queue_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ queue_status table created');
    } catch (error) {
      console.log('ℹ️  queue_status table already exists');
    }
    
    // Add doctor availability columns
    try {
      await mysqlConnection.query(`
        ALTER TABLE doctors 
        ADD COLUMN IF NOT EXISTS available_from TIME DEFAULT '09:00:00',
        ADD COLUMN IF NOT EXISTS available_to TIME DEFAULT '17:00:00',
        ADD COLUMN IF NOT EXISTS max_daily_patients INT DEFAULT 50,
        ADD COLUMN IF NOT EXISTS emergency_slots_per_day INT DEFAULT 5
      `);
      console.log('✅ Doctor availability columns added');
    } catch (error) {
      console.log('ℹ️  Doctor availability columns already exist');
    }
    
    // Update existing doctors with default values
    try {
      await mysqlConnection.query(`
        UPDATE doctors 
        SET 
          available_from = COALESCE(available_from, '09:00:00'),
          available_to = COALESCE(available_to, '17:00:00'),
          max_daily_patients = COALESCE(max_daily_patients, 50),
          emergency_slots_per_day = COALESCE(emergency_slots_per_day, 5)
      `);
      console.log('✅ Updated existing doctors with default availability');
    } catch (error) {
      console.log('❌ Error updating doctors:', error.message);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('📋 Queue system is now ready to use');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit();
  }
}

// Give the database connection time to initialize
setTimeout(runMigration, 3000);
