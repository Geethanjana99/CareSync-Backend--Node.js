// ===================================================================
// LOCAL DATABASE SETUP
// ===================================================================
// Set up local MySQL database for CareSync
// ===================================================================

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupLocalDatabase() {
  console.log('🔧 Setting up local MySQL database...\n');

  try {
    // 1. Connect to MySQL without database to create it
    console.log('1️⃣ Connecting to MySQL server...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '', // Empty password for local XAMPP
    });

    console.log('✅ Connected to MySQL server');

    // 2. Create database if it doesn't exist
    console.log('\n2️⃣ Creating database...');
    await connection.execute('CREATE DATABASE IF NOT EXISTS caresync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ Database "caresync" created/verified');

    // 3. Use the database
    await connection.execute('USE caresync');

    // 4. Check if tables exist
    console.log('\n3️⃣ Checking existing tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`Found ${tables.length} existing tables`);

    if (tables.length === 0) {
      console.log('\n4️⃣ Creating database schema...');
      
      // Read and execute the migration file
      const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
      if (fs.existsSync(migrationPath)) {
        const schema = fs.readFileSync(migrationPath, 'utf8');
        
        // Split by semicolons and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
          try {
            await connection.execute(statement);
          } catch (error) {
            console.log(`⚠️ Statement execution warning: ${error.message}`);
          }
        }
        
        console.log('✅ Database schema created from migration file');
      } else {
        console.log('⚠️ Migration file not found, creating basic tables...');
        
        // Create basic tables if migration file doesn't exist
        await connection.execute(`
          CREATE TABLE users (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('patient', 'doctor', 'admin', 'billing') NOT NULL,
            phone VARCHAR(20),
            is_active BOOLEAN DEFAULT true,
            email_verified BOOLEAN DEFAULT false,
            avatar_url TEXT,
            last_login TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        
        await connection.execute(`
          CREATE TABLE patients (
            patient_id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            date_of_birth DATE,
            gender ENUM('male', 'female', 'other'),
            address TEXT,
            emergency_contact_name VARCHAR(255),
            emergency_contact_phone VARCHAR(20),
            medical_history TEXT,
            status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
        
        await connection.execute(`
          CREATE TABLE doctors (
            doctor_id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            specialty VARCHAR(255) NOT NULL,
            license_number VARCHAR(255) UNIQUE NOT NULL,
            years_of_experience INT,
            education TEXT,
            consultation_fee DECIMAL(10,2),
            status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
        
        console.log('✅ Basic tables created');
      }
    }

    // 5. Test the connection with our app's connection class
    console.log('\n5️⃣ Testing application database connection...');
    await connection.end();
    
    // Import and test our app's connection
    const { mysqlConnection } = require('./config/mysql');
    await mysqlConnection.connect();
    
    const testQuery = await mysqlConnection.query('SELECT 1 as test');
    console.log('✅ Application database connection working');

    // 6. Check current data
    console.log('\n6️⃣ Current database status:');
    const userCount = await mysqlConnection.query('SELECT COUNT(*) as count FROM users');
    console.log(`   Users: ${userCount[0].count}`);

    console.log('\n🎉 Local database setup complete!');
    console.log('📋 Next steps:');
    console.log('   1. Restart the backend server: npm start');
    console.log('   2. Try logging in or registering a new user');
    console.log('   3. Check server logs for any remaining issues');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 MySQL Access Denied:');
      console.error('   1. Make sure MySQL is running (XAMPP Control Panel)');
      console.error('   2. Check MySQL username/password in .env file');
      console.error('   3. Try connecting via phpMyAdmin first');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 MySQL Connection Refused:');
      console.error('   1. Start MySQL service in XAMPP Control Panel');
      console.error('   2. Check if MySQL is running on port 3306');
      console.error('   3. Verify firewall settings');
    }
    
    throw error;
  }
}

// Run the setup
setupLocalDatabase().catch(error => {
  console.error('💥 Database setup failed');
  process.exit(1);
});
