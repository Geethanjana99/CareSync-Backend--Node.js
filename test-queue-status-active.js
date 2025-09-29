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

async function checkQueueStatusActive() {
  let connection;
  
  try {
    console.log('🔍 Checking queue status is_active values...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully!');
    
    // Get current date
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Checking for queue status on: ${today}`);
    
    // Check all queue_status records and their is_active values
    console.log('\n📋 Checking queue_status is_active values:');
    console.log('==========================================');
    const [queues] = await connection.execute(`
      SELECT 
        qs.id,
        qs.doctor_id,
        qs.queue_date,
        qs.is_active,
        qs.current_number,
        u.name as doctor_name,
        d.specialty
      FROM queue_status qs
      JOIN doctors d ON qs.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      ORDER BY qs.queue_date DESC, qs.created_at DESC
      LIMIT 10
    `);
    
    if (queues.length > 0) {
      console.log(`Found ${queues.length} queue status records:`);
      queues.forEach((queue, index) => {
        console.log(`\n${index + 1}. Doctor: ${queue.doctor_name}`);
        console.log(`   Queue Date: ${queue.queue_date}`);
        console.log(`   is_active Raw: ${queue.is_active} (Type: ${typeof queue.is_active})`);
        console.log(`   Boolean(is_active): ${Boolean(queue.is_active)}`);
        console.log(`   Current Number: ${queue.current_number}`);
      });
      
      // Test the backend conversion logic
      console.log('\n🔧 Testing Backend Conversion Logic:');
      console.log('====================================');
      
      const testQueue = queues[0];
      console.log(`Testing with: Doctor ${testQueue.doctor_name}`);
      console.log(`Raw is_active: ${testQueue.is_active} (${typeof testQueue.is_active})`);
      
      // Simulate the backend doctorController.js logic
      const queueStatus = {
        id: testQueue.id,
        doctor_id: testQueue.doctor_id,
        is_active: Boolean(testQueue.is_active), // This is the key conversion
        queue_date: testQueue.queue_date,
        current_number: testQueue.current_number
      };
      
      console.log('Backend response would be:');
      console.log(JSON.stringify(queueStatus, null, 2));
      
      // Test different boolean values
      console.log('\n🧪 Testing Different Boolean Scenarios:');
      console.log('======================================');
      
      const testScenarios = [
        { name: 'MySQL TINYINT 1', value: 1 },
        { name: 'MySQL TINYINT 0', value: 0 },
        { name: 'Boolean true', value: true },
        { name: 'Boolean false', value: false },
        { name: 'String "1"', value: '1' },
        { name: 'String "0"', value: '0' },
        { name: 'null', value: null },
        { name: 'undefined', value: undefined }
      ];
      
      testScenarios.forEach(scenario => {
        const result = Boolean(scenario.value);
        console.log(`${scenario.name}: ${scenario.value} → Boolean() = ${result}`);
      });
      
    } else {
      console.log('❌ No queue status records found');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the check
checkQueueStatusActive().catch(console.error);