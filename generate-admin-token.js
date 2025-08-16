const jwt = require('jsonwebtoken');

// Load environment variables
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_make_it_very_long_and_secure_development_key_2025';

// Create admin token with real admin user ID
const adminPayload = {
  id: '0c137036-97e3-47f7-9af8-2df141ab20de', // Real admin user ID from database
  email: 'admin@caresync.com',
  role: 'admin',
  name: 'Admin User'
};

const token = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '24h' });

console.log('🔑 Admin JWT Token Generated:');
console.log('===================================');
console.log(token);
console.log('===================================');
console.log('\n📝 Token Payload:');
console.log(JSON.stringify(adminPayload, null, 2));
console.log('\n⏰ Expires in: 24 hours');
console.log('🔐 Use this token in Authorization header: Bearer ' + token);
