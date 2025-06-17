require('dotenv').config();
const jwt = require('jsonwebtoken');
const { mysqlConnection } = require('./config/mysql');
const User = require('./models/User');

async function debugAuthFlow() {
  try {
    console.log('🔍 Debugging Authentication Flow...\n');

    await mysqlConnection.connect();
    
    // Step 1: Find the test doctor user
    console.log('1. Finding test doctor user...');
    const user = await User.findByEmail('test.doctor@clinicalapp.com');
    if (!user) {
      console.log('❌ Test doctor user not found');
      return;
    }
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      is_active: user.is_active
    });

    // Step 2: Generate JWT token (simulating login)
    console.log('\n2. Generating JWT token...');
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    console.log('✅ Token generated:', token.substring(0, 50) + '...');

    // Step 3: Decode the token
    console.log('\n3. Decoding JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded:', decoded);

    // Step 4: Simulate auth middleware query
    console.log('\n4. Testing auth middleware query...');
    const query = `
      SELECT u.*, 
             p.patient_id, p.status as patient_status,
             d.doctor_id, d.specialty, d.status as doctor_status
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.id = ? AND u.is_active = true
    `;
    
    const users = await mysqlConnection.query(query, [decoded.userId]);
    
    if (users.length === 0) {
      console.log('❌ No user found with auth middleware query');
      return;
    }

    const authUser = users[0];
    console.log('✅ Auth middleware query result:');
    console.log('User data:', {
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role,
      patient_status: authUser.patient_status,
      doctor_status: authUser.doctor_status,
      doctorId: authUser.doctor_id,
      patientId: authUser.patient_id
    });

    // Step 5: Check if account is suspended
    console.log('\n5. Checking account status...');
    if (authUser.patient_status === 'suspended' || authUser.doctor_status === 'suspended') {
      console.log('❌ Account is suspended');
      return;
    }
    console.log('✅ Account is not suspended');

    // Step 6: Simulate req.user object creation
    console.log('\n6. Creating req.user object...');
    const reqUser = {
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role,
      patientId: authUser.patient_id,
      doctorId: authUser.doctor_id,
      specialty: authUser.specialty,
      avatarUrl: authUser.avatar_url
    };
    console.log('✅ req.user object:', reqUser);

    // Step 7: Test authorization check
    console.log('\n7. Testing authorization for doctor role...');
    const allowedRoles = ['doctor'];
    const hasPermission = allowedRoles.includes(reqUser.role);
    console.log(`✅ Role check: user.role='${reqUser.role}', allowed=${allowedRoles.join(',')}, hasPermission=${hasPermission}`);

    if (!hasPermission) {
      console.log('❌ Authorization denied!');
    } else {
      console.log('✅ Authorization granted!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error in auth flow:', error);
    process.exit(1);
  }
}

debugAuthFlow();
