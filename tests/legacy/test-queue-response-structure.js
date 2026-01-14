// Simple test to check the Queue Position API response structure
const { mysqlConnection } = require('./config/mysql');

async function testQueuePositionResponse() {
  try {
    console.log('🧪 Testing Queue Position Response Structure...\n');
    
    // Get a patient with appointments
    const patientQuery = `
      SELECT p.id, p.user_id, u.name, u.email
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE u.name = 'Kashmila Dharmasiri'
      LIMIT 1
    `;
    
    const [patient] = await mysqlConnection.query(patientQuery);
    
    if (!patient) {
      console.log('❌ No test patient found');
      return;
    }
    
    console.log(`👤 Found patient: ${patient.name} (ID: ${patient.id})`);
    
    // Get appointments for this patient
    const appointmentQuery = `
      SELECT 
        a.*,
        u.name as doctor_name,
        d.specialty
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = ?
      ORDER BY a.queue_date DESC
      LIMIT 1
    `;
    
    const [appointment] = await mysqlConnection.query(appointmentQuery, [patient.id]);
    
    if (!appointment) {
      console.log('❌ No appointments found for patient');
      return;
    }
    
    console.log('📋 Found appointment:');
    console.log(`   Queue Number: ${appointment.queue_number}`);
    console.log(`   Doctor: ${appointment.doctor_name}`);
    console.log(`   Status: ${appointment.status}`);
    console.log(`   Payment: ${appointment.payment_status}`);
    console.log(`   Queue Date: ${appointment.queue_date}`);
    
    // Get queue status
    const queueStatusQuery = `
      SELECT * FROM queue_status 
      WHERE doctor_id = ? AND queue_date = ?
    `;
    
    const [queueStatus] = await mysqlConnection.query(queueStatusQuery, [
      appointment.doctor_id, 
      appointment.queue_date
    ]);
    
    console.log('\n📊 Queue Status:');
    if (queueStatus) {
      console.log(`   Current Number: ${queueStatus.current_number}`);
      console.log(`   Current Emergency: ${queueStatus.current_emergency_number}`);
      console.log(`   Active: ${queueStatus.is_active}`);
      console.log(`   Regular Count: ${queueStatus.regular_count}`);
    } else {
      console.log('   No queue status found');
    }
    
    // Calculate position (similar to backend logic)
    let position = 0;
    if (queueStatus && queueStatus.is_active) {
      // Count paid patients ahead
      const positionQuery = `
        SELECT COUNT(*) as position
        FROM appointments 
        WHERE doctor_id = ? 
          AND queue_date = ? 
          AND is_emergency = FALSE 
          AND payment_status = 'paid'
          AND status IN ('pending', 'in-progress')
          AND CAST(queue_number AS UNSIGNED) < CAST(? AS UNSIGNED)
      `;
      
      const [positionResult] = await mysqlConnection.query(positionQuery, [
        appointment.doctor_id,
        appointment.queue_date,
        appointment.queue_number
      ]);
      
      position = positionResult.position;
    }
    
    console.log('\n🎯 Expected API Response Structure:');
    const expectedResponse = {
      success: true,
      data: {
        queueNumber: appointment.queue_number,
        isEmergency: appointment.is_emergency,
        status: appointment.status,
        paymentStatus: appointment.payment_status,
        position: position + 1,  // Backend adds 1
        doctorId: appointment.doctor_id,
        doctorName: appointment.doctor_name,
        specialty: appointment.specialty,
        queueActive: queueStatus ? queueStatus.is_active : false,
        currentlyServing: position === 0,
        nextPatient: position === 0,
        queueStatus: queueStatus ? {
          is_active: Boolean(queueStatus.is_active),
          current_number: queueStatus.current_number,
          current_emergency_number: queueStatus.current_emergency_number,
          available_from: queueStatus.available_from,
          available_to: queueStatus.available_to,
          queue_date: queueStatus.queue_date
        } : null,
        currentNumber: queueStatus ? queueStatus.current_number : '0',
        currentEmergencyNumber: queueStatus ? queueStatus.current_emergency_number : 'E0'
      }
    };
    
    console.log(JSON.stringify(expectedResponse, null, 2));
    
    console.log('\n✅ Key properties for frontend mapping:');
    console.log(`   position: ${expectedResponse.data.position} -> should map to queue_position`);
    console.log(`   currentNumber: ${expectedResponse.data.currentNumber} -> should map to current_number`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mysqlConnection.end();
  }
}

testQueuePositionResponse();