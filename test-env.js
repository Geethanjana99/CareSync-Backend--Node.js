require('dotenv').config();

console.log('🔍 Environment Variables Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'N/A');
console.log('JWT_EXPIRE:', process.env.JWT_EXPIRE);

// Test JWT signing
const jwt = require('jsonwebtoken');

try {
  const testToken = jwt.sign({ test: 'data' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log('✅ JWT signing works');
  console.log('Test token:', testToken.substring(0, 50) + '...');
} catch (error) {
  console.error('❌ JWT signing failed:', error.message);
}
