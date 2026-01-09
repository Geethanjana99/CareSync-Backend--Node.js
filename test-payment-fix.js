const PatientController = require('./controllers/patientController');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Mock request and response objects
const createMockReq = (body, user) => ({
  body,
  user
});

const createMockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

async function testPaymentStatusFix() {
  try {
    console.log('🧪 Testing payment status fix...');
    
    // Create a test appointment with 'paid' status
    const appointmentData = {
      doctorId: '1', // Using existing doctor
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentType: 'consultation',
      reasonForVisit: 'Test payment status fix',
      symptoms: 'Testing if paid status is preserved',
      priority: 'medium',
      paymentMethod: 'card',
      paymentStatus: 'paid'  // This should stay 'paid'
    };

    const mockReq = createMockReq(appointmentData, { id: '66e0b4b55b5eda3535a8ceee' }); // Existing user
    const mockRes = createMockRes();
    const mockNext = (error) => {
      if (error) console.error('Error in middleware:', error);
    };

    console.log('\n📤 Creating appointment with payment status: paid');
    
    // Call the controller method
    await PatientController.bookQueueAppointment(mockReq, mockRes, mockNext);
    
    if (mockRes.statusCode === 201 && mockRes.jsonData?.success) {
      console.log('✅ Appointment created successfully');
      console.log(`   Payment Status in response: ${mockRes.jsonData.data.paymentStatus}`);
      
      // Check the database to see what was actually stored
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
          rejectUnauthorized: false
        }
      });

      const [appointments] = await connection.execute(
        'SELECT appointment_id, payment_status, payment_method FROM appointments WHERE appointment_id = ? ORDER BY created_at DESC LIMIT 1',
        [mockRes.jsonData.data.appointment.appointment_id]
      );

      if (appointments.length > 0) {
        const dbAppointment = appointments[0];
        console.log(`   Payment Status in DB: ${dbAppointment.payment_status}`);
        console.log(`   Payment Method in DB: ${dbAppointment.payment_method || 'null'}`);
        
        if (dbAppointment.payment_status === 'paid') {
          console.log('🎉 SUCCESS: Payment status is correctly stored as "paid"!');
        } else {
          console.log(`❌ FAILED: Payment status was stored as "${dbAppointment.payment_status}" instead of "paid"`);
        }
      }
      
      await connection.end();
    } else {
      console.log('❌ Failed to create appointment');
      console.log('Response:', mockRes.jsonData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPaymentStatusFix().then(() => {
  process.exit(0);
});