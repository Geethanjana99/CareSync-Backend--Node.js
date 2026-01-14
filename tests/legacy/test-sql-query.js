// Test script to verify the SQL query works by making a direct call
const mysql = require('mysql2/promise');

async function testPatientsQuery() {
  try {
    console.log('🔍 Testing patients query directly...');
    
    const connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    // Test the basic query
    const whereClause = "WHERE u.role = 'patient' AND u.is_active = 1";
    const countParams = [];
    const dataParams = [20, 0]; // limit, offset
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      INNER JOIN patients p ON u.id = p.user_id
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.created_at,
        u.is_active,
        p.patient_id,
        p.date_of_birth,
        p.gender,
        p.address,
        p.emergency_contact_name,
        p.emergency_contact_phone,
        p.status
      FROM users u
      INNER JOIN patients p ON u.id = p.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    console.log('Count query:', countQuery);
    console.log('Count params:', countParams);
    
    const [countResult] = await connection.execute(countQuery, countParams);
    console.log('✅ Count result:', countResult[0]);
    
    console.log('Data query:', dataQuery);
    console.log('Data params:', dataParams);
    
    const [patients] = await connection.execute(dataQuery, dataParams);
    console.log('✅ Found patients:', patients.length);
    console.log('Sample patient:', patients[0] || 'No patients found');
    
    await connection.end();
    console.log('✅ SQL query test completed successfully!');
    
  } catch (error) {
    console.error('❌ SQL query test failed:', error.message);
  }
}

testPatientsQuery();