const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function setupQueueTestData() {
  try {
    console.log('🚀 Setting up Queue-Based Appointment System Test Data...\n');

    // Step 1: Create doctor account
    console.log('1. Creating doctor account...');
    const doctorData = {
      name: 'Dr. Queue Test',
      email: 'doctor@gmail.com',
      password: 'Doctor@123',
      role: 'doctor',
      phone: '0712345678',
      specialty: 'General Medicine',
      license_number: 'MD12345',
      years_of_experience: 8,
      consultation_fee: 3500.00,
      bio: 'General practitioner specializing in family medicine.'
    };

    try {
      await axios.post(`${BASE_URL}/api/auth/register`, doctorData);
      console.log('✅ Doctor account created');
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️  Doctor account already exists');
      } else {
        console.log('❌ Error creating doctor:', error.response?.data?.message);
      }
    }

    // Step 2: Login as doctor
    console.log('\n2. Logging in as doctor...');
    const doctorLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: doctorData.email,
      password: doctorData.password
    });

    if (!doctorLogin.data.success) {
      throw new Error('Doctor login failed');
    }

    const doctorToken = doctorLogin.data.data.token;
    const doctorUserId = doctorLogin.data.data.user.id;
    console.log('✅ Doctor login successful');

    // Step 3: Get doctor profile to get doctor ID
    const doctorProfile = await axios.get(`${BASE_URL}/api/doctors/profile`, {
      headers: { 'Authorization': `Bearer ${doctorToken}` }
    });
    const doctorId = doctorProfile.data.data.id;
    console.log(`✅ Doctor ID: ${doctorId}`);

    // Step 4: Create multiple patient accounts
    console.log('\n3. Creating patient accounts...');
    const patients = [
      { name: 'John Regular', email: 'john.regular@test.com', phone: '0723456789' },
      { name: 'Mary Emergency', email: 'mary.emergency@test.com', phone: '0723456790' },
      { name: 'Peter Queue', email: 'peter.queue@test.com', phone: '0723456791' },
      { name: 'Sarah Patient', email: 'sarah.patient@test.com', phone: '0723456792' },
      { name: 'Tom Emergency2', email: 'tom.emergency@test.com', phone: '0723456793' }
    ];

    const patientTokens = [];
    
    for (const [index, patientInfo] of patients.entries()) {
      const patientData = {
        name: patientInfo.name,
        email: patientInfo.email,
        password: 'Patient@123',
        role: 'patient',
        phone: patientInfo.phone,
        date_of_birth: '1990-01-15',
        gender: 'male',
        address: `${index + 1}23 Patient Street, Nairobi`
      };

      try {
        await axios.post(`${BASE_URL}/api/auth/register`, patientData);
        console.log(`✅ Patient ${patientInfo.name} created`);
      } catch (error) {
        if (error.response?.data?.message?.includes('already exists')) {
          console.log(`ℹ️  Patient ${patientInfo.name} already exists`);
        }
      }

      // Login patient and store token
      const patientLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: patientData.email,
        password: patientData.password
      });

      if (patientLogin.data.success) {
        patientTokens.push({
          token: patientLogin.data.data.token,
          name: patientInfo.name,
          email: patientInfo.email
        });
      }
    }

    // Step 5: Book queue-based appointments for today
    console.log('\n4. Booking queue-based appointments for today...');
    const today = new Date().toISOString().split('T')[0];

    const appointments = [
      {
        patientIndex: 0,
        isEmergency: false,
        reason: 'Regular health checkup',
        symptoms: 'General wellness check'
      },
      {
        patientIndex: 1,
        isEmergency: true,
        reason: 'Severe chest pain',
        symptoms: 'Chest pain, shortness of breath'
      },
      {
        patientIndex: 2,
        isEmergency: false,
        reason: 'Follow-up consultation',
        symptoms: 'Follow-up for previous condition'
      },
      {
        patientIndex: 3,
        isEmergency: false,
        reason: 'Vaccination',
        symptoms: 'Routine vaccination'
      },
      {
        patientIndex: 4,
        isEmergency: true,
        reason: 'High fever',
        symptoms: 'High fever, headache, body aches'
      }
    ];

    for (const [index, apt] of appointments.entries()) {
      try {
        const patientToken = patientTokens[apt.patientIndex];
        
        const appointmentData = {
          doctorId: doctorId,
          appointmentDate: today,
          appointmentType: 'consultation',
          reasonForVisit: apt.reason,
          symptoms: apt.symptoms,
          priority: apt.isEmergency ? 'urgent' : 'medium',
          isEmergency: apt.isEmergency
        };

        const response = await axios.post(`${BASE_URL}/api/patients/appointments/queue`, appointmentData, {
          headers: { 'Authorization': `Bearer ${patientToken.token}` }
        });

        if (response.data.success) {
          const appointment = response.data.data.appointment;
          console.log(`✅ ${apt.isEmergency ? 'Emergency' : 'Regular'} appointment booked for ${patientToken.name}`);
          console.log(`   Queue Number: ${appointment.queue_number} | Status: ${appointment.status}`);
        }
      } catch (error) {
        console.log(`❌ Error booking appointment ${index + 1}:`, error.response?.data?.message);
      }
    }

    // Step 6: Test doctor dashboard with queue data
    console.log('\n5. Testing doctor dashboard...');
    const dashboardResponse = await axios.get(`${BASE_URL}/api/doctors/dashboard`, {
      headers: { 'Authorization': `Bearer ${doctorToken}` }
    });

    if (dashboardResponse.data.success) {
      const data = dashboardResponse.data.data;
      console.log('📊 Doctor Dashboard Results:');
      console.log(`   Doctor: ${data.doctor.name} (${data.doctor.specialty})`);
      console.log(`   Today's Appointments: ${data.todayAppointments.total}`);
      console.log(`   - Pending: ${data.todayAppointments.pending}`);
      console.log(`   - In Progress: ${data.todayAppointments.inProgress}`);
      console.log(`   - Completed: ${data.todayAppointments.completed}`);

      if (data.todayAppointments.appointments.length > 0) {
        console.log('\n📅 Today\'s Queue:');
        data.todayAppointments.appointments.forEach((apt, i) => {
          const emergencyFlag = apt.isEmergency ? '🚨' : '📋';
          console.log(`   ${i + 1}. ${emergencyFlag} ${apt.patientName} - Queue #${apt.queueNumber}`);
          console.log(`      Status: ${apt.status} | Reason: ${apt.reason}`);
        });
      }
    }

    // Step 7: Test queue summary
    console.log('\n6. Testing queue summary...');
    const queueResponse = await axios.get(`${BASE_URL}/api/doctors/queue/summary`, {
      headers: { 'Authorization': `Bearer ${doctorToken}` }
    });

    if (queueResponse.data.success) {
      const queue = queueResponse.data.data;
      console.log('🏥 Queue Summary:');
      console.log(`   Date: ${queue.date}`);
      console.log(`   Current Number: ${queue.currentNumber}`);
      console.log(`   Current Emergency: ${queue.currentEmergencyNumber}`);
      console.log(`   Total Patients: ${queue.totalPatients}`);
      console.log(`   Emergency Patients: ${queue.emergencyPatients}`);
      console.log(`   Regular Patients: ${queue.regularPatients}`);
      console.log(`   Emergency Slots Used: ${queue.emergencySlotsUsed}/${queue.maxEmergencySlots}`);
    }

    console.log('\n🎉 Queue-based appointment system setup complete!');
    console.log('\n🔑 Login Credentials:');
    console.log(`   Doctor: doctor@gmail.com / Doctor@123`);
    console.log(`   Patient Example: john.regular@test.com / Patient@123`);
    console.log('\n🌐 Test URLs:');
    console.log(`   Doctor Dashboard: http://localhost:5174/doctor/dashboard`);
    console.log(`   Patient Dashboard: http://localhost:5174/patient/dashboard`);

  } catch (error) {
    console.error('❌ Setup failed:', error.response?.data || error.message);
  }
}

setupQueueTestData();
