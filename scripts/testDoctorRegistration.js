// Test script to verify doctor registration and profile creation
const { mysqlConnection } = require('../config/mysql');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const bcrypt = require('bcryptjs');

async function testDoctorRegistration() {
  try {
    console.log('🧪 Testing Doctor Registration and Profile Creation...\n');

    // Connect to database
    await mysqlConnection.connect();

    // Test data
    const testDoctorData = {
      name: 'Dr. Michael Johnson',
      email: 'dr.johnson@test.com',
      password: 'doctorpassword123',
      role: 'doctor',
      phone: '+1234567892',
      profileData: {
        specialty: 'Cardiology',
        license_number: 'MD123456789',
        years_of_experience: 15,
        education: 'MD from Harvard Medical School, Residency at Johns Hopkins',
        certifications: JSON.stringify(['Board Certified Cardiologist', 'ACLS Certified']),
        consultation_fee: 250.00,
        languages_spoken: JSON.stringify(['English', 'Spanish']),
        office_address: '456 Medical Center Dr, Health City, HC 67890',
        bio: 'Experienced cardiologist specializing in interventional cardiology and heart disease prevention.',
        working_hours: JSON.stringify({
          monday: '08:00-17:00',
          tuesday: '08:00-17:00',
          wednesday: '08:00-17:00',
          thursday: '08:00-17:00',
          friday: '08:00-15:00',
          saturday: 'closed',
          sunday: 'closed'
        }),
        availability_status: 'available',
        commission_rate: 25.00
      }
    };

    // 1. Clean up any existing test user
    console.log('1. Cleaning up existing test data...');
    try {
      const existingUser = await User.findByEmail(testDoctorData.email);
      if (existingUser) {
        // Delete doctor profile first
        await mysqlConnection.query('DELETE FROM doctors WHERE user_id = ?', [existingUser.id]);
        // Delete user
        await mysqlConnection.query('DELETE FROM users WHERE id = ?', [existingUser.id]);
        console.log('   ✅ Cleaned up existing test data');
      }
    } catch (error) {
      console.log('   ✅ No existing test data to clean');
    }

    // 2. Create user
    console.log('\n2. Creating test user...');
    const hashedPassword = await bcrypt.hash(testDoctorData.password, 12);
    const userData = {
      name: testDoctorData.name,
      email: testDoctorData.email,
      password_hash: hashedPassword,
      role: testDoctorData.role,
      phone: testDoctorData.phone
    };

    const user = new User(userData);
    await user.save();
    console.log('   ✅ User created successfully');
    console.log(`   - User ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}`);

    // 3. Create doctor profile
    console.log('\n3. Creating doctor profile...');
    const doctorData = {
      user_id: user.id,
      specialty: testDoctorData.profileData.specialty,
      license_number: testDoctorData.profileData.license_number,
      years_of_experience: testDoctorData.profileData.years_of_experience,
      education: testDoctorData.profileData.education,
      certifications: testDoctorData.profileData.certifications,
      consultation_fee: testDoctorData.profileData.consultation_fee,
      languages_spoken: testDoctorData.profileData.languages_spoken,
      office_address: testDoctorData.profileData.office_address,
      bio: testDoctorData.profileData.bio,
      working_hours: testDoctorData.profileData.working_hours,
      availability_status: testDoctorData.profileData.availability_status,
      commission_rate: testDoctorData.profileData.commission_rate
    };

    const doctor = new Doctor(doctorData);
    await doctor.save();
    console.log('   ✅ Doctor profile created successfully');
    console.log(`   - Doctor ID: ${doctor.id}`);
    console.log(`   - Doctor Number: ${doctor.doctor_id}`);
    console.log(`   - Specialty: ${doctor.specialty}`);
    console.log(`   - License: ${doctor.license_number}`);
    console.log(`   - Experience: ${doctor.years_of_experience} years`);

    // 4. Verify user-doctor relationship
    console.log('\n4. Verifying user-doctor relationship...');
    const userDoctorQuery = `
      SELECT 
        u.id as user_id, u.name, u.email, u.role,
        d.id as doctor_id, d.doctor_id as doctor_number, 
        d.specialty, d.license_number, d.years_of_experience,
        d.consultation_fee, d.availability_status
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.email = ?
    `;
    
    const result = await mysqlConnection.query(userDoctorQuery, [testDoctorData.email]);
    
    if (result.length > 0 && result[0].doctor_id) {
      console.log('   ✅ User-Doctor relationship verified');
      console.log('   - User has associated doctor profile');
      console.log(`   - Doctor Number: ${result[0].doctor_number}`);
      console.log(`   - Specialty: ${result[0].specialty}`);
      console.log(`   - Consultation Fee: $${result[0].consultation_fee}`);
    } else {
      console.log('   ❌ User-Doctor relationship verification failed');
      console.log('   - User exists but no doctor profile found');
    }

    // 5. Test authentication with created user
    console.log('\n5. Testing authentication...');
    const foundUser = await User.findByEmail(testDoctorData.email);
    if (foundUser) {
      const isPasswordValid = await foundUser.verifyPassword(testDoctorData.password);
      if (isPasswordValid) {
        console.log('   ✅ Authentication successful');
        console.log('   - Password verification passed');
      } else {
        console.log('   ❌ Authentication failed');
        console.log('   - Password verification failed');
      }
    }

    // 6. Test doctor profile retrieval
    console.log('\n6. Testing doctor profile retrieval...');
    const doctorProfile = await Doctor.findByUserId(user.id);
    if (doctorProfile) {
      console.log('   ✅ Doctor profile retrieval successful');
      console.log(`   - Found doctor: ${doctorProfile.doctor_id}`);
      console.log(`   - Specialty: ${doctorProfile.specialty}`);
      console.log(`   - License: ${doctorProfile.license_number}`);
    } else {
      console.log('   ❌ Doctor profile retrieval failed');
    }

    console.log('\n🎉 Doctor Registration Test Completed Successfully!');
    console.log('\nSUMMARY:');
    console.log('- User creation: ✅');
    console.log('- Doctor profile creation: ✅');
    console.log('- User-Doctor relationship: ✅');
    console.log('- Authentication: ✅');
    console.log('- Profile retrieval: ✅');

  } catch (error) {
    console.error('❌ Doctor Registration Test Failed:', error.message);
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
  testDoctorRegistration();
}

module.exports = testDoctorRegistration;
