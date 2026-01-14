const { mysqlConnection } = require('./config/mysql');

async function testAppointmentStructure() {
    console.log('🔍 Testing appointment data structure...');
    
    try {
        // Test the exact query from the backend
        const query = `
            SELECT a.*, 
                   p.patient_id, pu.name as patient_name, pu.phone as patient_phone,
                   d.doctor_id, du.name as doctor_name, d.specialty
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users pu ON p.user_id = pu.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users du ON d.user_id = du.id
            WHERE DATE(a.queue_date) = CURDATE()
            AND d.user_id = (SELECT id FROM users WHERE email = 'doctor@gmail.com')
            LIMIT 1
        `;

        const results = await mysqlConnection.query(query);
        
        if (results.length > 0) {
            console.log('✅ Found appointment data');
            console.log('\n📋 Appointment structure:');
            console.log('Fields available:', Object.keys(results[0]));
            console.log('\n🔍 Full appointment data:');
            console.log(JSON.stringify(results[0], null, 2));
            
            console.log('\n👤 Patient-related fields:');
            const appointment = results[0];
            console.log('- patient_name:', appointment.patient_name);
            console.log('- patient_phone:', appointment.patient_phone);
            console.log('- patient_id (from patients table):', appointment.patient_id);
        } else {
            console.log('❌ No appointments found for today');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit();
    }
}

testAppointmentStructure();