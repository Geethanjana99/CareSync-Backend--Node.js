// ===================================================================
// MYSQL CONNECTION DIAGNOSTIC AND FIX
// ===================================================================
// Check MySQL status and fix connection issues
// ===================================================================

const mysql = require('mysql2/promise');
const { execSync } = require('child_process');

async function diagnoseMySQLConnection() {
  console.log('🔍 Diagnosing MySQL Connection Issues...\n');

  // 1. Check if MySQL services are running
  console.log('1️⃣ Checking MySQL Service Status:');
  
  try {
    // Check different possible MySQL service names
    const possibleServices = ['mysql', 'mysql80', 'mysqld', 'MySQL80'];
    let mysqlRunning = false;
    
    for (const service of possibleServices) {
      try {
        const result = execSync(`sc query ${service}`, { encoding: 'utf8', stdio: 'pipe' });
        if (result.includes('RUNNING')) {
          console.log(`   ✅ ${service} service is RUNNING`);
          mysqlRunning = true;
          break;
        }
      } catch (error) {
        // Service doesn't exist, continue
      }
    }
    
    if (!mysqlRunning) {
      console.log('   ❌ No MySQL service found running');
      console.log('   💡 Solutions:');
      console.log('      1. Start XAMPP and click "Start" next to MySQL');
      console.log('      2. Or install MySQL Workbench/Server');
      console.log('      3. Or use alternative database (SQLite)');
    }
  } catch (error) {
    console.log('   ⚠️ Could not check service status:', error.message);
  }

  // 2. Check if port 3306 is available
  console.log('\n2️⃣ Checking Port 3306 Availability:');
  try {
    const portCheck = execSync('netstat -an | findstr :3306', { encoding: 'utf8', stdio: 'pipe' });
    if (portCheck.includes('LISTENING')) {
      console.log('   ✅ Port 3306 is in use (MySQL likely running)');
      console.log('   Port details:', portCheck.trim());
    } else {
      console.log('   ❌ Port 3306 not listening (MySQL not running)');
    }
  } catch (error) {
    console.log('   ❌ Port 3306 not in use (MySQL not running)');
  }
  // 3. Test Aiven.io connection configuration
  console.log('\n3️⃣ Testing Aiven.io Connection:');
  
  // First, check for existing .env file
  let aivenConfig = null;
  try {
    require('dotenv').config();
    if (process.env.MYSQL_HOST && process.env.MYSQL_HOST.includes('aiven.io')) {
      aivenConfig = {
        name: 'Aiven.io (from .env)',
        config: {
          host: process.env.MYSQL_HOST,
          port: parseInt(process.env.MYSQL_PORT) || 3306,
          user: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD,
          database: process.env.MYSQL_DATABASE || 'caresync',
          ssl: process.env.MYSQL_SSL !== 'false'
        }
      };
    }
  } catch (error) {
    console.log('   ⚠️ Could not load .env file');
  }

  const connectionConfigs = [];
  
  if (aivenConfig) {
    connectionConfigs.push(aivenConfig);
  } else {
    console.log('   ⚠️ No Aiven.io configuration found in .env file');
    console.log('   💡 Please provide your Aiven.io credentials:');
    console.log('      - Host (e.g., mysql-xxxxx.a.aivencloud.com)');
    console.log('      - Port (usually 3306)');
    console.log('      - Username');
    console.log('      - Password');
    console.log('      - Database name');
  }

  let workingConfig = null;

  for (const { name, config } of connectionConfigs) {
    try {
      console.log(`   Testing ${name}...`);
      const connection = await mysql.createConnection({
        ...config,
        connectTimeout: 5000,
        acquireTimeout: 5000
      });
      
      await connection.execute('SELECT 1');
      await connection.end();
      
      console.log(`   ✅ ${name} - CONNECTION SUCCESSFUL!`);
      workingConfig = { name, config };
      break;
    } catch (error) {
      console.log(`   ❌ ${name} - Failed: ${error.code || error.message}`);
    }
  }

  // 4. Generate .env configuration
  if (workingConfig) {
    console.log('\n4️⃣ Generating Working Configuration:');
    console.log(`   Found working configuration: ${workingConfig.name}`);
    
    const envConfig = `
# Working MySQL Configuration - ${workingConfig.name}
MYSQL_HOST=${workingConfig.config.host}
MYSQL_PORT=${workingConfig.config.port}
MYSQL_USER=${workingConfig.config.user}
MYSQL_PASSWORD=${workingConfig.config.password}
MYSQL_DATABASE=caresync
MYSQL_SSL=false
MYSQL_CONNECTION_LIMIT=10

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRE=30d

# Bcrypt Configuration
BCRYPT_ROUNDS=12

# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5175

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-password
`;

    console.log('   📝 Save this configuration to your .env file:');
    console.log(envConfig);
    
    // Try to create database
    console.log('\n5️⃣ Setting up Database:');
    try {
      const connection = await mysql.createConnection(workingConfig.config);
      
      // Create database
      await connection.execute('CREATE DATABASE IF NOT EXISTS caresync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      console.log('   ✅ Database "caresync" created/verified');
      
      // Switch to database
      await connection.execute('USE caresync');
      
      // Create basic users table for testing
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role ENUM('patient', 'doctor', 'admin', 'billing') NOT NULL DEFAULT 'patient',
          phone VARCHAR(20),
          is_active BOOLEAN DEFAULT true,
          email_verified BOOLEAN DEFAULT false,
          avatar_url TEXT,
          last_login TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✅ Users table created/verified');
      
      await connection.end();
      
      console.log('\n🎉 Database setup complete!');
      console.log('📋 Next steps:');
      console.log('   1. Update your .env file with the working configuration above');
      console.log('   2. Restart your backend server: npm start');
      console.log('   3. Test login/registration');
      
    } catch (error) {
      console.log('   ❌ Database setup failed:', error.message);
    }
    
  } else {
    console.log('\n❌ No working MySQL configuration found!');
    console.log('\n💡 Solutions:');
    console.log('   1. Install and start XAMPP');
    console.log('   2. Install MySQL Workbench');
    console.log('   3. Use alternative: SQLite (no server needed)');
    console.log('   4. Use cloud database (MongoDB Atlas, PlanetScale, etc.)');
  }
}

// Run diagnosis
diagnoseMySQLConnection().catch(error => {
  console.error('💥 Diagnosis failed:', error.message);
  process.exit(1);
});
