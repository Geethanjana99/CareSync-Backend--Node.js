const Appointment = require('./models/Appointment');

async function testAppointmentModel() {
  try {
    console.log('Testing Appointment.findAll method...');
    
    // Wait a bit for the server to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const appointments = await Appointment.findAll({ limit: 10 });
    console.log('✅ Appointments found:', appointments.length);
    console.log('📋 Sample appointments:', JSON.stringify(appointments, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing appointment model:', error);
  }
  
  process.exit(0);
}

testAppointmentModel();
