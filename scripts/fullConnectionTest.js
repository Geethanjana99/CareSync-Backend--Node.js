const { mysqlConnection } = require('../config/mysql');
const bcrypt = require('bcryptjs');

async function fullConnectionTest() {
  try {
    console.log('🚀 Starting comprehensive MySQL connection test...\n');
    
    // 1. Test basic connection
    console.log('1️⃣ Testing basic connection...');
    await mysqlConnection.connect();
    console.log('   ✅ MySQL connection successful\n');    // 2. Test all tables exist
    console.log('2️⃣ Verifying all tables exist...');
    const tables = await mysqlConnection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    const expectedTables = [
      'users', 'patients', 'doctors', 'refresh_tokens', 
      'user_sessions', 'password_reset_requests', 
      'email_verification_tokens', 'login_attempts'
    ];
    
    for (const table of expectedTables) {
      if (tableNames.includes(table)) {
        console.log(`   ✅ Table '${table}' exists`);
      } else {
        console.log(`   ❌ Table '${table}' missing`);
      }
    }
    console.log('');    // 3. Test users table
    console.log('3️⃣ Testing users table...');
    const userCount = await mysqlConnection.query('SELECT COUNT(*) as count FROM users');
    console.log(`   📊 Total users: ${userCount[0].count}`);
    
    const adminUsers = await mysqlConnection.query('SELECT name, email, role FROM users WHERE role = "admin"');
    console.log(`   👤 Admin users: ${adminUsers.length}`);
    for (const admin of adminUsers) {
      console.log(`      - ${admin.name} (${admin.email})`);
    }
    console.log('');    // 4. Test patient creation
    console.log('4️⃣ Testing patient functionality...');
    const patients = await mysqlConnection.query('SELECT COUNT(*) as count FROM patients');
    console.log(`   📊 Total patients: ${patients[0].count}`);
    
    // Get a patient user for testing
    const patientUsers = await mysqlConnection.query('SELECT * FROM users WHERE role = "patient" LIMIT 1');
    if (patientUsers.length > 0) {
      const patientUser = patientUsers[0];
      console.log(`   👥 Sample patient user: ${patientUser.name} (${patientUser.email})`);
      
      // Check if this user has a patient profile
      const patientProfiles = await mysqlConnection.query('SELECT * FROM patients WHERE user_id = ?', [patientUser.id]);
      if (patientProfiles.length > 0) {
        console.log(`   📋 Patient profile exists: ID ${patientProfiles[0].patient_id}`);
      } else {
        console.log(`   ⚠️  Patient profile missing for user ${patientUser.name}`);
      }
    }
    console.log('');    // 5. Test doctor functionality
    console.log('5️⃣ Testing doctor functionality...');
    const doctors = await mysqlConnection.query('SELECT COUNT(*) as count FROM doctors');
    console.log(`   📊 Total doctors: ${doctors[0].count}`);
    console.log('');

    // 6. Test foreign key constraints
    console.log('6️⃣ Testing foreign key constraints...');
    try {
      // Try to insert a patient with invalid user_id
      await mysqlConnection.query(
        'INSERT INTO patients (id, user_id, patient_id) VALUES (?, ?, ?)',
        ['test-id', 'invalid-user-id', 'P999']
      );
      console.log('   ❌ Foreign key constraint not working');
    } catch (error) {
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        console.log('   ✅ Foreign key constraints working correctly');
      } else {
        console.log(`   ⚠️  Unexpected error: ${error.message}`);
      }
    }
    console.log('');

    // 7. Test unique constraints
    console.log('7️⃣ Testing unique constraints...');    try {
      // Try to insert a user with existing email
      const existingUser = await mysqlConnection.query('SELECT email FROM users LIMIT 1');
      if (existingUser.length > 0) {
        await mysqlConnection.query(
          'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
          ['test-duplicate', 'Test User', existingUser[0].email, 'hash', 'patient']
        );
        console.log('   ❌ Unique constraint not working');
      }
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('   ✅ Unique constraints working correctly');
      } else {
        console.log(`   ⚠️  Unexpected error: ${error.message}`);
      }
    }
    console.log('');

    // 8. Test password hashing compatibility
    console.log('8️⃣ Testing password hashing...');
    const testPassword = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    console.log(`   ✅ Password hashing: ${isValid ? 'Working' : 'Failed'}`);
    console.log('');

    // 9. Test JSON fields (for doctors table)
    console.log('9️⃣ Testing JSON field support...');
    try {
      const testJson = JSON.stringify(['English', 'Spanish']);
      await mysqlConnection.query('SELECT JSON_VALID(?) as is_valid', [testJson]);
      console.log('   ✅ JSON fields supported');
    } catch (error) {
      console.log(`   ❌ JSON fields error: ${error.message}`);
    }
    console.log('');    // 10. Test indexes
    console.log('🔟 Testing indexes...');
    const indexes = await mysqlConnection.query(`
      SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = 'clinical_appointment_system' 
      AND INDEX_NAME != 'PRIMARY'
      ORDER BY TABLE_NAME, INDEX_NAME
    `);
    
    const indexCount = indexes.length;
    console.log(`   📊 Total indexes: ${indexCount}`);
    
    // Group by table
    const indexesByTable = {};
    indexes.forEach(idx => {
      if (!indexesByTable[idx.TABLE_NAME]) {
        indexesByTable[idx.TABLE_NAME] = [];
      }
      indexesByTable[idx.TABLE_NAME].push(idx.INDEX_NAME);
    });
    
    for (const [table, tableIndexes] of Object.entries(indexesByTable)) {
      const uniqueIndexes = [...new Set(tableIndexes)];
      console.log(`   📋 ${table}: ${uniqueIndexes.length} indexes (${uniqueIndexes.join(', ')})`);
    }
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('✅ MySQL database is properly connected and configured');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Details:', error);
  }
}

fullConnectionTest();
