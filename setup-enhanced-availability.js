#!/usr/bin/env node

const { runEnhancedAvailabilityMigration } = require('./run-enhanced-availability-migration');
const { runAllTests } = require('./test-enhanced-availability-api');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function showWelcomeMessage() {
  console.clear();
  colorLog('cyan', '╔══════════════════════════════════════════════════════════════╗');
  colorLog('cyan', '║              Enhanced Availability System Setup              ║');
  colorLog('cyan', '║                Clinical Appointment System                   ║');
  colorLog('cyan', '╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  colorLog('bright', '🚀 Welcome to the Enhanced Doctor Availability Management System!');
  console.log('');
  colorLog('yellow', 'This setup will:');
  console.log('   ✅ Run database migrations for enhanced availability features');
  console.log('   ✅ Add new tables for default hours and date overrides');
  console.log('   ✅ Create stored procedures for availability checking');
  console.log('   ✅ Set up API endpoints for advanced availability management');
  console.log('   ✅ Test all new functionality');
  console.log('');
}

async function checkPrerequisites() {
  colorLog('blue', '🔍 Checking prerequisites...');
  
  // Check if .env file exists
  const fs = require('fs');
  if (!fs.existsSync('.env')) {
    colorLog('red', '❌ .env file not found. Please create one with database credentials.');
    colorLog('yellow', 'Required environment variables:');
    console.log('   DB_HOST=localhost');
    console.log('   DB_USER=your_username');
    console.log('   DB_PASSWORD=your_password');
    console.log('   DB_NAME=clinical_appointment_system');
    process.exit(1);
  }
  
  // Check database connection
  try {
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'clinical_appointment_system'
    });
    
    await connection.execute('SELECT 1');
    await connection.end();
    colorLog('green', '✅ Database connection successful');
  } catch (error) {
    colorLog('red', '❌ Database connection failed:');
    console.log('   ', error.message);
    colorLog('yellow', 'Please check your database credentials and ensure MySQL is running.');
    process.exit(1);
  }
  
  // Check if required tables exist
  try {
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'clinical_appointment_system'
    });
    
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('users', 'doctors', 'appointments')
    `, [process.env.DB_NAME || 'clinical_appointment_system']);
    
    await connection.end();
    
    if (tables.length < 3) {
      colorLog('red', '❌ Required base tables not found. Please run the initial migration first.');
      process.exit(1);
    }
    
    colorLog('green', '✅ Base tables found');
  } catch (error) {
    colorLog('red', '❌ Error checking tables:', error.message);
    process.exit(1);
  }
}

async function runSetup() {
  try {
    await showWelcomeMessage();
    await checkPrerequisites();
    
    colorLog('blue', '🔧 Starting Enhanced Availability System Migration...');
    console.log('');
    
    // Run the migration
    await runEnhancedAvailabilityMigration();
    
    colorLog('green', '\n✅ Migration completed successfully!');
    
    // Ask user if they want to run tests
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const runTests = await new Promise((resolve) => {
      rl.question(colorLog('yellow', '\n🧪 Would you like to run API tests? (y/N): '), (answer) => {
        rl.close();
        resolve(answer.toLowerCase().startsWith('y'));
      });
    });
    
    if (runTests) {
      colorLog('blue', '\n🧪 Running API Tests...');
      console.log('');
      
      // Note: Tests require a running server and test doctor account
      colorLog('yellow', '⚠️  Note: API tests require:');
      console.log('   - Backend server running on port 5000');
      console.log('   - Test doctor account with email: doctor@test.com');
      console.log('   - Test doctor password: TestPassword123!');
      console.log('');
      
      const proceedWithTests = await new Promise((resolve) => {
        const rl2 = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        rl2.question('Proceed with tests? (y/N): ', (answer) => {
          rl2.close();
          resolve(answer.toLowerCase().startsWith('y'));
        });
      });
      
      if (proceedWithTests) {
        await runAllTests();
      } else {
        colorLog('yellow', '⏭️  Skipping API tests');
      }
    } else {
      colorLog('yellow', '⏭️  Skipping API tests');
    }
    
    colorLog('green', '\n🎉 Enhanced Availability System Setup Complete!');
    console.log('');
    colorLog('bright', 'New features available:');
    console.log('   📅 Default available hours management');
    console.log('   🗓️  Weekly schedule customization');
    console.log('   🚫 Date-specific overrides and unavailability');
    console.log('   ⏰ Advanced time slot management');
    console.log('   🔍 Real-time availability checking');
    console.log('   📊 Enhanced dashboard integration');
    console.log('');
    colorLog('bright', 'API Endpoints added:');
    console.log('   GET    /api/doctors/availability/settings');
    console.log('   PUT    /api/doctors/availability/default-hours');
    console.log('   PUT    /api/doctors/availability/weekly-schedule');
    console.log('   POST   /api/doctors/availability/date-override');
    console.log('   DELETE /api/doctors/availability/date-override/:date');
    console.log('   PUT    /api/doctors/availability/status');
    console.log('   GET    /api/doctors/availability/slots/:date');
    console.log('   GET    /api/doctors/availability/check/:date/:time');
    console.log('   POST   /api/doctors/availability/apply-defaults');
    console.log('');
    colorLog('cyan', '💡 Next steps:');
    console.log('   1. Start your backend server: npm run dev');
    console.log('   2. Start your frontend: npm run dev');
    console.log('   3. Login as a doctor and visit /doctor/availability');
    console.log('   4. Configure your default hours and weekly schedule');
    console.log('   5. Test date overrides and unavailability features');
    console.log('');
    colorLog('bright', 'Happy scheduling! 🏥✨');
    
  } catch (error) {
    colorLog('red', '\n❌ Setup failed:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  runSetup();
}

module.exports = { runSetup };
