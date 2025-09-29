const mysql = require('mysql2/promise');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testPaymentStatusIssue() {
  try {
    console.log('🔍 Testing payment status issue...');
    
    // First, let's create a test appointment with 'paid' status
    const testData = {
      doctorId: '1', // Using existing doctor
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentType: 'consultation',
      reasonForVisit: 'Test payment status issue',
      symptoms: 'Testing if paid status becomes unpaid',
      priority: 'medium',
      paymentMethod: 'card',
      paymentStatus: 'paid'  // This should stay 'paid'
    };

    console.log('\n📤 Sending appointment data:');
    console.log(`   paymentStatus: ${testData.paymentStatus}`);
    console.log(`   paymentMethod: ${testData.paymentMethod}`);

    // Simulate what the backend receives by destructuring like the controller does
    const {
      doctorId,
      appointmentDate,
      appointmentType = 'consultation',
      reasonForVisit,
      symptoms,
      priority = 'medium',
      paymentMethod = 'counter',
      paymentStatus = 'unpaid'  // This is the problematic default!
    } = testData;

    console.log('\n📥 Backend destructured values:');
    console.log(`   paymentStatus: ${paymentStatus}`);
    console.log(`   paymentMethod: ${paymentMethod}`);

    // Check if the issue is in the destructuring
    if (testData.paymentStatus !== paymentStatus) {
      console.log('\n❌ ISSUE FOUND: Default value override!');
      console.log(`   Original: ${testData.paymentStatus}`);
      console.log(`   After destructuring: ${paymentStatus}`);
    } else {
      console.log('\n✅ Destructuring works correctly');
    }

    // Test case 2: Missing paymentStatus field
    console.log('\n🧪 Test 2: Missing paymentStatus field');
    const testData2 = {
      doctorId: '1',
      appointmentDate: new Date().toISOString().split('T')[0],
      reasonForVisit: 'Test missing payment status',
      // paymentStatus intentionally missing
    };

    const {
      paymentStatus: paymentStatus2 = 'unpaid'
    } = testData2;

    console.log(`   Missing paymentStatus defaults to: ${paymentStatus2}`);

    // Test case 3: Undefined paymentStatus
    console.log('\n🧪 Test 3: Undefined paymentStatus');
    const testData3 = {
      doctorId: '1',
      appointmentDate: new Date().toISOString().split('T')[0],
      reasonForVisit: 'Test undefined payment status',
      paymentStatus: undefined
    };

    const {
      paymentStatus: paymentStatus3 = 'unpaid'
    } = testData3;

    console.log(`   Undefined paymentStatus defaults to: ${paymentStatus3}`);

    console.log('\n📊 Analysis:');
    console.log('The issue is NOT in the destructuring default values.');
    console.log('The frontend is correctly sending paymentStatus: "paid"');
    console.log('Something else must be causing the issue...');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPaymentStatusIssue().then(() => {
  process.exit(0);
});