/**
 * Check existing users and create admin if needed
 */

const { mysqlConnection } = require('./config/mysql');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function checkAndCreateAdmin() {
  try {
    console.log('🔍 Checking for existing admin users...');
    
    // Check if any admin users exist
    const adminQuery = 'SELECT id, name, email, role FROM users WHERE role = "admin"';
    const admins = await mysqlConnection.query(adminQuery);
    
    if (admins.length > 0) {
      console.log(`✅ Found ${admins.length} admin user(s):`);
      admins.forEach(admin => {
        console.log(`   - ${admin.name} (${admin.email})`);
      });
      
      console.log('\n💡 Use one of these admin accounts to test:');
      console.log('   Email: ' + admins[0].email);
      console.log('   Password: (check your database or use the password you set)');
    } else {
      console.log('❌ No admin users found. Creating a test admin...');
      
      // Create a test admin user
      const adminData = {
        id: uuidv4(),
        name: 'Test Admin',
        email: 'admin@test.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        phone: '+1234567890',
        is_active: true,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const insertQuery = `
        INSERT INTO users (id, name, email, password, role, phone, is_active, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await mysqlConnection.query(insertQuery, [
        adminData.id,
        adminData.name,
        adminData.email,
        adminData.password,
        adminData.role,
        adminData.phone,
        adminData.is_active,
        adminData.email_verified,
        adminData.created_at,
        adminData.updated_at
      ]);
      
      console.log('✅ Test admin user created successfully!');
      console.log('   Email: admin@test.com');
      console.log('   Password: admin123');
      console.log('   Name: Test Admin');
    }
    
    // Also check for sample patient submissions
    console.log('\n🔍 Checking for patient health submissions...');
    const submissionsQuery = 'SELECT COUNT(*) as count FROM diabetes_predictions';
    const submissionCount = await mysqlConnection.query(submissionsQuery);
    console.log(`📊 Found ${submissionCount[0].count} patient health submissions in database`);
    
    if (submissionCount[0].count === 0) {
      console.log('💡 No patient submissions found. To test admin functionality:');
      console.log('   1. Login as a patient');
      console.log('   2. Go to Health Predictions page');
      console.log('   3. Submit some health data');
      console.log('   4. Then login as admin to process it');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mysqlConnection.end();
  }
}

checkAndCreateAdmin();