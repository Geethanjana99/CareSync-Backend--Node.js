// ===================================================================
// AIVEN.IO MYSQL CONNECTION DIAGNOSTIC AND FIX
// ===================================================================
// Check Aiven.io MySQL connection and fix issues
// ===================================================================

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function diagnoseAivenConnection() {
  console.log('🔍 Diagnosing Aiven.io MySQL Connection Issues...\n');

  // 1. Check for .env file and Aiven configuration
  console.log('1️⃣ Checking .env Configuration:');
  
  const envPath = path.join(__dirname, '.env');
  let envConfig = {};
  
  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      console.log('   ✅ .env file found');
      
      // Parse env variables
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          envConfig[key.trim()] = value.trim().replace(/"/g, '');
        }
      });
      
      // Check for required Aiven variables
      const requiredVars = ['MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
      const missingVars = requiredVars.filter(v => !envConfig[v]);
      
      if (missingVars.length === 0) {
        console.log('   ✅ All required MySQL variables found in .env');
        console.log(`   📍 Host: ${envConfig.MYSQL_HOST}`);
        console.log(`   🔌 Port: ${envConfig.MYSQL_PORT}`);
        console.log(`   👤 User: ${envConfig.MYSQL_USER}`);
        console.log(`   🗄️  Database: ${envConfig.MYSQL_DATABASE}`);
        console.log(`   🔒 SSL: ${envConfig.MYSQL_SSL || 'true'}`);
      } else {
        console.log('   ❌ Missing required variables:', missingVars.join(', '));
        console.log('   💡 Add these to your .env file with your Aiven.io credentials');
        
        console.log('\n   📝 Example .env configuration for Aiven.io:');
        console.log('   MYSQL_HOST=your-mysql-service.aivencloud.com');
        console.log('   MYSQL_PORT=12345');
        console.log('   MYSQL_USER=avnadmin');
        console.log('   MYSQL_PASSWORD=your-secure-password');
        console.log('   MYSQL_DATABASE=defaultdb');
        console.log('   MYSQL_SSL=true');
        return;
      }
    } else {
      console.log('   ❌ .env file not found');
      console.log('   💡 Create .env file with your Aiven.io MySQL credentials');
      return;
    }
  } catch (error) {
    console.log('   ⚠️ Error reading .env file:', error.message);
    return;
  }

  // 2. Check internet connectivity
  console.log('\n2️⃣ Checking Internet Connectivity:');
  try {
    await new Promise((resolve, reject) => {
      const ping = spawn('ping', ['-n', '1', '8.8.8.8']);
      let hasOutput = false;
      
      ping.stdout.on('data', () => {
        hasOutput = true;
      });
      
      ping.on('close', (code) => {
        if (code === 0 && hasOutput) {
          console.log('   ✅ Internet connection is working');
          resolve();
        } else {
          console.log('   ❌ No internet connection');
          reject(new Error('No internet'));
        }
      });
      
      ping.on('error', (error) => {
        console.log('   ❌ Error checking internet:', error.message);
        reject(error);
      });
    });
  } catch (error) {
    console.log('   ❌ Internet connectivity issues - Cannot reach Aiven.io');
    return;
  }

  // 3. Test DNS resolution for Aiven host
  console.log('\n3️⃣ Testing DNS Resolution:');
  try {
    await new Promise((resolve, reject) => {
      const nslookup = spawn('nslookup', [envConfig.MYSQL_HOST]);
      let output = '';
      
      nslookup.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      nslookup.on('close', (code) => {
        if (code === 0 && output.includes('Address')) {
          console.log('   ✅ DNS resolution successful for', envConfig.MYSQL_HOST);
          resolve();
        } else {
          console.log('   ❌ DNS resolution failed for', envConfig.MYSQL_HOST);
          reject(new Error('DNS failed'));
        }
      });
    });
  } catch (error) {
    console.log('   ❌ Cannot resolve Aiven host - check hostname in .env');
  }

  // 4. Test Aiven.io connection
  console.log('\n4️⃣ Testing Aiven.io MySQL Connection:');
  
  const aivenConfig = {
    host: envConfig.MYSQL_HOST,
    port: parseInt(envConfig.MYSQL_PORT) || 3306,
    user: envConfig.MYSQL_USER,
    password: envConfig.MYSQL_PASSWORD,
    database: envConfig.MYSQL_DATABASE,
    ssl: envConfig.MYSQL_SSL !== 'false' ? {
      rejectUnauthorized: false
    } : false,
    connectTimeout: 15000,
    acquireTimeout: 15000,
    timeout: 15000
  };

  try {
    console.log('   🔄 Connecting to Aiven.io MySQL...');
    const connection = await mysql.createConnection(aivenConfig);
    console.log('   ✅ Successfully connected to Aiven.io MySQL!');
    
    // Test basic query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('   ✅ Basic query test passed');
    
    // Check if our tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`   ✅ Found ${tables.length} tables in database`);
    
    if (tables.length > 0) {
      console.log('   📋 Tables:', tables.map(t => Object.values(t)[0]).join(', '));
    }
    
    await connection.end();
    
    console.log('\n🎉 DIAGNOSIS COMPLETE - Aiven.io MySQL is working properly!');
    console.log('💡 Your login/registration issues might be due to:');
    console.log('   1. Backend server not running on port 5000');
    console.log('   2. Frontend API URLs pointing to wrong backend');
    console.log('   3. CORS issues between frontend and backend');
    
  } catch (error) {
    console.log('   ❌ Failed to connect to Aiven.io MySQL');
    console.log('   Error:', error.message);
    
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    
    if (error.code === 'ETIMEDOUT') {
      console.log('   1. ⏰ Connection timeout - possible causes:');
      console.log('      • Aiven service is down/suspended');
      console.log('      • Firewall blocking outbound connections');
      console.log('      • VPN/proxy interfering');
      console.log('      • Wrong host/port in .env');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('   1. 🚫 Access denied - check credentials:');
      console.log('      • Verify username and password in .env');
      console.log('      • Check if user has proper permissions');
      console.log('      • Ensure you\'re using the correct Aiven user');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   1. 🌐 Host not found:');
      console.log('      • Check MYSQL_HOST in .env');
      console.log('      • Verify Aiven service hostname');
      console.log('      • Check if service is running in Aiven console');
    } else {
      console.log('   1. ❓ Other error:', error.code || 'Unknown');
    }
    
    console.log('\n   💡 IMMEDIATE ACTIONS:');
    console.log('   1. Log into your Aiven.io console');
    console.log('   2. Check if your MySQL service is running');
    console.log('   3. Verify connection details match your .env');
    console.log('   4. Try connecting from Aiven console to test service');
    console.log('   5. Check if your IP is whitelisted (if IP filtering enabled)');
  }

  // 5. Additional checks
  console.log('\n5️⃣ Additional System Checks:');
  
  // Check if backend server is running
  try {
    const response = await fetch('http://localhost:5000/health');
    if (response.ok) {
      console.log('   ✅ Backend server is running on port 5000');
    } else {
      console.log('   ⚠️ Backend server responded but not healthy');
    }
  } catch (error) {
    console.log('   ❌ Backend server is not running on port 5000');
    console.log('   💡 Start backend with: node server.js');
  }
  
  // Check for node_modules
  if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log('   ✅ node_modules found');
  } else {
    console.log('   ❌ node_modules missing - run: npm install');
  }
}

// Handle fetch polyfill for older Node versions
async function setupFetch() {
  if (typeof fetch === 'undefined') {
    try {
      const { default: fetch } = await import('node-fetch');
      global.fetch = fetch;
    } catch (error) {
      // Fetch not available, skip HTTP checks
    }
  }
}

// Run the diagnosis
(async () => {
  try {
    await setupFetch();
    await diagnoseAivenConnection();
  } catch (error) {
    console.log('❌ Diagnostic failed:', error.message);
  }
})();
