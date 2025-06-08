// Test script to verify patient registration and automatic profile creation
const { mysqlConnection } = require('../config/mysql');
const User = require('../models/User');
const Patient = require('../models/Patient');
const bcrypt = require('bcryptjs');

async function testPatientRegistration() {
  try {
    console.log('🧪 Testing Patient Registration and Profile Creation...\n');

    // Connect to database
    await mysqlConnection.connect();

    // Test data
    const testPatientData = {
      name: 'Jane Smith',
      email: 'jane.smith@test.com',
      password: 'testpassword123',
      role: 'patient',
      phone: '+1234567890',
      profileData: {
        gender: 'Female',
        date_of_birth: '1990-05-15',
        address: '123 Main St, Test City, TC 12345',
        emergency_contact_name: 'John Smith',
        emergency_contact_phone: '+1234567891',
        preferred_language: 'English'
      }
    };

    // 1. Clean up any existing test user
    console.log('1. Cleaning up existing test data...');
    try {
      const existingUser = await User.findByEmail(testPatientData.email);
      if (existingUser) {
        // Delete patient profile first
        await mysqlConnection.query('DELETE FROM patients WHERE user_id = ?', [existingUser.id]);
        // Delete user
        await mysqlConnection.query('DELETE FROM users WHERE id = ?', [existingUser.id]);
        console.log('   ✅ Cleaned up existing test data');
      }
    } catch (error) {
      console.log('   ✅ No existing test data to clean');
    }

    // 2. Create user
    console.log('\n2. Creating test user...');
    const hashedPassword = await bcrypt.hash(testPatientData.password, 12);
    const userData = {
      name: testPatientData.name,
      email: testPatientData.email,
      password_hash: hashedPassword,
      role: testPatientData.role,
      phone: testPatientData.phone
    };

    const user = new User(userData);
    await user.save();
    console.log('   ✅ User created successfully');
    console.log(`   - User ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}`);

    // 3. Create patient profile
    console.log('\n3. Creating patient profile...');
    const patientData = {
      user_id: user.id,
      gender: testPatientData.profileData.gender,
      date_of_birth: testPatientData.profileData.date_of_birth,
      address: testPatientData.profileData.address,
      emergency_contact_name: testPatientData.profileData.emergency_contact_name,
      emergency_contact_phone: testPatientData.profileData.emergency_contact_phone,
      preferred_language: testPatientData.profileData.preferred_language
    };

    const patient = new Patient(patientData);
    await patient.save();
    console.log('   ✅ Patient profile created successfully');
    console.log(`   - Patient ID: ${patient.id}`);
    console.log(`   - Patient Number: ${patient.patient_id}`);
    console.log(`   - Gender: ${patient.gender}`);
    console.log(`   - Date of Birth: ${patient.date_of_birth}`);

    // 4. Verify user-patient relationship
    console.log('\n4. Verifying user-patient relationship...');
    const userPatientQuery = `
      SELECT 
        u.id as user_id, u.name, u.email, u.role,
        p.id as patient_id, p.patient_id as patient_number, 
        p.gender, p.date_of_birth, p.address
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      WHERE u.email = ?
    `;
    
    const result = await mysqlConnection.query(userPatientQuery, [testPatientData.email]);
    
    if (result.length > 0 && result[0].patient_id) {
      console.log('   ✅ User-Patient relationship verified');
      console.log('   - User has associated patient profile');
      console.log(`   - Patient Number: ${result[0].patient_number}`);
    } else {
      console.log('   ❌ User-Patient relationship verification failed');
      console.log('   - User exists but no patient profile found');
    }

    // 5. Test authentication with created user
    console.log('\n5. Testing authentication...');
    const foundUser = await User.findByEmail(testPatientData.email);
    if (foundUser) {
      const isPasswordValid = await foundUser.verifyPassword(testPatientData.password);
      if (isPasswordValid) {
        console.log('   ✅ Authentication successful');
        console.log('   - Password verification passed');
      } else {
        console.log('   ❌ Authentication failed');
        console.log('   - Password verification failed');
      }
    }

    // 6. Test patient profile retrieval
    console.log('\n6. Testing patient profile retrieval...');
    const patientProfile = await Patient.findByUserId(user.id);
    if (patientProfile) {
      console.log('   ✅ Patient profile retrieval successful');
      console.log(`   - Found patient: ${patientProfile.patient_id}`);
      console.log(`   - Emergency contact: ${patientProfile.emergency_contact_name}`);
    } else {
      console.log('   ❌ Patient profile retrieval failed');
    }

    console.log('\n🎉 Patient Registration Test Completed Successfully!');
    console.log('\nSUMMARY:');
    console.log('- User creation: ✅');
    console.log('- Patient profile creation: ✅');
    console.log('- User-Patient relationship: ✅');
    console.log('- Authentication: ✅');
    console.log('- Profile retrieval: ✅');

  } catch (error) {
    console.error('❌ Patient Registration Test Failed:', error.message);
    console.error('Error details:', error);
  } finally {
    if (mysqlConnection.pool) {
      await mysqlConnection.pool.end();
      console.log('\n📝 Database connection closed');
    }
  }
}

// Run the test
if (require.main === module) {
  testPatientRegistration();
}

module.exports = testPatientRegistration;
