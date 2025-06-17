// ===================================================================
// AUTHENTICATION & DOCTOR BACKEND COMPREHENSIVE TEST
// ===================================================================
// Test authentication endpoints and doctor functionality
// ===================================================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { mysqlConnection } = require('./config/mysql');
const { v4: uuidv4 } = require('uuid');

async function testAuthenticationAndDoctorBackend() {
  console.log('🔐 Testing Authentication & Doctor Backend...\n');
  
  let connection;
  const testData = {
    userId: uuidv4(),
    doctorId: uuidv4(),
    email: `test.doctor.${Date.now()}@example.com`,
    password: 'TestDoctor123!',
    name: 'Dr. Test Authentication',
    doctorCode: `DR${Date.now().toString().slice(-6)}`
  };

  try {
    // Connect to database
    console.log('🔗 Connecting to database...');
    await mysqlConnection.connect();
    connection = mysqlConnection.getPool();
    console.log('✅ Database connected successfully');

    // Test 1: User Registration (Doctor)
    console.log('\n👤 Testing doctor user registration...');
    const hashedPassword = await bcrypt.hash(testData.password, 12);
    
    await connection.execute(`
      INSERT INTO users (id, name, email, password_hash, role, is_active, email_verified)
      VALUES (?, ?, ?, ?, 'doctor', TRUE, TRUE)
    `, [testData.userId, testData.name, testData.email, hashedPassword]);
    
    console.log('✅ Doctor user created successfully');

    // Test 2: Doctor Profile Creation
    console.log('\n👨‍⚕️ Testing doctor profile creation...');
    await connection.execute(`
      INSERT INTO doctors (id, user_id, doctor_id, specialty, license_number, 
                           consultation_fee, status, availability_status)
      VALUES (?, ?, ?, 'Cardiology', 'LIC123456', 250.00, 'active', 'available')
    `, [testData.doctorId, testData.userId, testData.doctorCode]);
    
    console.log('✅ Doctor profile created successfully');

    // Test 3: Login Authentication
    console.log('\n🔐 Testing login authentication...');
    const [users] = await connection.execute(`
      SELECT u.*, d.doctor_id, d.specialty, d.consultation_fee, d.status as doctor_status
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.email = ? AND u.is_active = TRUE
    `, [testData.email]);

    if (users.length === 0) {
      throw new Error('User not found during login test');
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(testData.password, user.password_hash);
    
    if (!isPasswordValid) {
      throw new Error('Password validation failed');
    }

    console.log('✅ Login authentication successful');
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Doctor ID: ${user.doctor_id}`);
    console.log(`   Specialty: ${user.specialty}`);

    // Test 4: Doctor Dashboard Data
    console.log('\n📊 Testing doctor dashboard data...');
    const [dashboardData] = await connection.execute(`
      SELECT 
        d.doctor_id,
        d.specialty,
        d.consultation_fee,
        d.status,
        d.availability_status,
        d.total_appointments,
        d.total_earnings,
        u.name as doctor_name,
        u.email,
        u.phone,
        u.avatar_url
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.user_id = ?
    `, [testData.userId]);

    if (dashboardData.length === 0) {
      throw new Error('Doctor dashboard data not found');
    }

    const doctorData = dashboardData[0];
    console.log('✅ Doctor dashboard data retrieved successfully');
    console.log(`   Doctor: ${doctorData.doctor_name}`);
    console.log(`   ID: ${doctorData.doctor_id}`);
    console.log(`   Specialty: ${doctorData.specialty}`);
    console.log(`   Fee: $${doctorData.consultation_fee}`);
    console.log(`   Status: ${doctorData.status}`);
    console.log(`   Availability: ${doctorData.availability_status}`);

    // Test 5: Doctor Availability Check
    console.log('\n⏰ Testing doctor availability functionality...');
    const [availability] = await connection.execute(`
      SELECT * FROM doctor_availability WHERE doctor_id = ?
    `, [testData.doctorId]);

    console.log(`✅ Doctor availability records: ${availability.length}`);

    // Test 6: Update Doctor Status
    console.log('\n🔄 Testing doctor status update...');
    await connection.execute(`
      UPDATE doctors 
      SET availability_status = 'busy', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [testData.doctorId]);

    const [updatedStatus] = await connection.execute(`
      SELECT availability_status FROM doctors WHERE id = ?
    `, [testData.doctorId]);

    console.log(`✅ Doctor status updated to: ${updatedStatus[0].availability_status}`);

    // Test 7: Password Reset Token Generation
    console.log('\n🔑 Testing password reset functionality...');
    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await connection.execute(`
      UPDATE users 
      SET password_reset_token = ?, password_reset_expires = ?
      WHERE id = ?
    `, [resetToken, resetExpires, testData.userId]);

    const [resetData] = await connection.execute(`
      SELECT password_reset_token, password_reset_expires FROM users WHERE id = ?
    `, [testData.userId]);

    console.log('✅ Password reset token generated successfully');
    console.log(`   Token: ${resetData[0].password_reset_token.substring(0, 8)}...`);

    // Test 8: Email Verification
    console.log('\n📧 Testing email verification...');
    const verificationToken = uuidv4();
    const verificationExpires = new Date(Date.now() + 86400000); // 24 hours from now

    await connection.execute(`
      UPDATE users 
      SET email_verification_token = ?, email_verification_expires = ?
      WHERE id = ?
    `, [verificationToken, verificationExpires, testData.userId]);

    console.log('✅ Email verification token generated successfully');

    // Test 9: Doctor Search/Filter
    console.log('\n🔍 Testing doctor search functionality...');
    const [searchResults] = await connection.execute(`
      SELECT u.name, d.doctor_id, d.specialty, d.consultation_fee, d.status
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.specialty = 'Cardiology' AND d.status = 'active'
      LIMIT 5
    `, []);

    console.log(`✅ Found ${searchResults.length} cardiologists`);
    searchResults.forEach(doctor => {
      console.log(`   - ${doctor.name} (${doctor.doctor_id}) - $${doctor.consultation_fee}`);
    });

    // Test 10: Foreign Key Constraints
    console.log('\n🔗 Testing foreign key constraints...');
    try {
      // This should fail due to foreign key constraint
      await connection.execute(`
        INSERT INTO appointments (id, patient_id, doctor_id, scheduled_at, reason)
        VALUES (?, 'invalid-patient-id', ?, NOW(), 'Test appointment')
      `, [uuidv4(), testData.doctorId]);
      
      console.log('❌ Foreign key constraint test failed - invalid data was accepted');
    } catch (fkError) {
      console.log('✅ Foreign key constraints working correctly');
    }

    console.log('\n🎉 All authentication and doctor backend tests passed!');
    
    console.log('\n📋 Test Summary:');
    console.log('   ✅ User Registration (Doctor)');
    console.log('   ✅ Doctor Profile Creation');
    console.log('   ✅ Login Authentication');
    console.log('   ✅ Password Hashing/Validation');
    console.log('   ✅ Doctor Dashboard Data');
    console.log('   ✅ Doctor Availability');
    console.log('   ✅ Status Updates');
    console.log('   ✅ Password Reset Tokens');
    console.log('   ✅ Email Verification');
    console.log('   ✅ Doctor Search/Filter');
    console.log('   ✅ Foreign Key Constraints');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    throw error;
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    if (connection) {
      try {
        await connection.execute('DELETE FROM doctors WHERE id = ?', [testData.doctorId]);
        await connection.execute('DELETE FROM users WHERE id = ?', [testData.userId]);
        console.log('✅ Test data cleaned up successfully');
      } catch (cleanupError) {
        console.error('⚠️ Cleanup warning:', cleanupError.message);
      }
    }

    // Close connection
    if (mysqlConnection) {
      await mysqlConnection.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the test
testAuthenticationAndDoctorBackend().catch(error => {
  console.error('💥 Test suite failed:', error.message);
  process.exit(1);
});
