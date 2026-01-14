const mysql = require('mysql2/promise');

// Database connection configuration (using Aiven cloud database)
const dbConfig = {
  host: process.env.MYSQL_HOST || 'caresyncdb-caresync.e.aivencloud.com',
  port: process.env.MYSQL_PORT || 16006,
  user: process.env.MYSQL_USER || 'avnadmin',
  password: process.env.MYSQL_PASSWORD || 'AVNS_6xeaVpCVApextDTAKfU',
  database: process.env.MYSQL_DATABASE || 'caresync',
  ssl: {
    rejectUnauthorized: false
  }
};

async function checkQueueData() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully!');
    
    // Check queue_status table
    console.log('\n📋 Checking queue_status table:');
    console.log('==================================');
    const [queueStatus] = await connection.execute(`
      SELECT 
        qs.*,
        u.name as doctor_name,
        d.specialty
      FROM queue_status qs
      JOIN doctors d ON qs.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      ORDER BY qs.queue_date DESC, qs.created_at DESC
      LIMIT 10
    `);
    
    if (queueStatus.length > 0) {
      console.log(`Found ${queueStatus.length} queue status records:`);
      queueStatus.forEach((queue, index) => {
        console.log(`\n${index + 1}. Doctor: ${queue.doctor_name} (${queue.specialty})`);
        console.log(`   Queue Date: ${queue.queue_date}`);
        console.log(`   Current Number: ${queue.current_number}`);
        console.log(`   Current Emergency: ${queue.current_emergency_number}`);
        console.log(`   Emergency Used: ${queue.emergency_used}/${queue.max_emergency_slots}`);
        console.log(`   Regular Count: ${queue.regular_count}`);
        console.log(`   Available: ${queue.available_from} - ${queue.available_to}`);
        console.log(`   Active: ${queue.is_active ? 'Yes' : 'No'}`);
        console.log(`   Created: ${queue.created_at}`);
      });
    } else {
      console.log('❌ No queue status records found');
    }
    
    // Check appointments with queue numbers
    console.log('\n🏥 Checking appointments with queue numbers:');
    console.log('===============================================');
    const [appointments] = await connection.execute(`
      SELECT 
        a.id,
        a.appointment_id,
        a.queue_number,
        a.is_emergency,
        a.payment_status,
        a.consultation_fee,
        a.status,
        a.appointment_date,
        a.queue_date,
        a.reason_for_visit,
        pu.name as patient_name,
        du.name as doctor_name,
        d.specialty
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE a.queue_number IS NOT NULL
      ORDER BY a.queue_date DESC, a.is_emergency DESC, a.queue_number ASC
      LIMIT 15
    `);
    
    if (appointments.length > 0) {
      console.log(`Found ${appointments.length} appointments with queue numbers:`);
      appointments.forEach((apt, index) => {
        const queueNum = apt.is_emergency ? `E${apt.queue_number}` : apt.queue_number;
        const emergencyFlag = apt.is_emergency ? '🚨' : '📋';
        const paymentIcon = apt.payment_status === 'paid' ? '✅' : 
                           apt.payment_status === 'partially_paid' ? '⚠️' : 
                           apt.payment_status === 'refunded' ? '🔄' : '❌';
        const feeDisplay = apt.consultation_fee ? `$${apt.consultation_fee}` : 'No fee';
        
        console.log(`\n${index + 1}. ${emergencyFlag} Queue #${queueNum} - ${apt.patient_name}`);
        console.log(`   Doctor: ${apt.doctor_name} (${apt.specialty})`);
        console.log(`   Status: ${apt.status} | Payment: ${paymentIcon} ${apt.payment_status} | Fee: ${feeDisplay}`);
        console.log(`   Date: ${apt.appointment_date} | Queue Date: ${apt.queue_date}`);
        console.log(`   Reason: ${apt.reason_for_visit || 'Not specified'}`);
        console.log(`   Emergency: ${apt.is_emergency ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('❌ No appointments with queue numbers found');
    }
    
    // Check today's queue activity
    console.log('\n📅 Today\'s Queue Activity:');
    console.log('============================');
    const today = new Date().toISOString().split('T')[0];
    const [todayQueue] = await connection.execute(`
      SELECT 
        a.queue_number,
        a.is_emergency,
        a.status,
        a.created_at,
        pu.name as patient_name,
        du.name as doctor_name,
        d.specialty
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE a.queue_date = ? AND a.queue_number IS NOT NULL
      ORDER BY a.is_emergency DESC, a.queue_number ASC
    `, [today]);
    
    if (todayQueue.length > 0) {
      console.log(`Found ${todayQueue.length} appointments in today's queue:`);
      todayQueue.forEach((apt, index) => {
        const queueNum = apt.is_emergency ? `E${apt.queue_number}` : apt.queue_number;
        const emergencyFlag = apt.is_emergency ? '🚨' : '📋';
        console.log(`${index + 1}. ${emergencyFlag} #${queueNum} - ${apt.patient_name} | ${apt.doctor_name} | ${apt.status}`);
      });
    } else {
      console.log('❌ No appointments found for today\'s queue');
    }
    
    // Check queue statistics
    console.log('\n📊 Queue System Statistics:');
    console.log('============================');
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_queue_records,
        COUNT(DISTINCT doctor_id) as doctors_with_queues,
        SUM(emergency_used) as total_emergency_used,
        SUM(regular_count) as total_regular_count,
        AVG(max_emergency_slots) as avg_emergency_slots
      FROM queue_status
    `);
    
    if (stats.length > 0) {
      const stat = stats[0];
      console.log(`📋 Total Queue Records: ${stat.total_queue_records}`);
      console.log(`👨‍⚕️ Doctors with Queues: ${stat.doctors_with_queues}`);
      console.log(`🚨 Total Emergency Appointments: ${stat.total_emergency_used}`);
      console.log(`📝 Total Regular Appointments: ${stat.total_regular_count}`);
      console.log(`⚡ Average Emergency Slots: ${stat.avg_emergency_slots}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking queue data:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔒 Database connection closed');
    }
  }
}

// Run the check
checkQueueData();
