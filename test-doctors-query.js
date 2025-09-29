// Test script to verify the doctors SQL query works
const mysql = require('mysql2/promise');

async function testDoctorsQuery() {
  try {
    console.log('🔍 Testing doctors query directly...');
    
    const connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    // Test the basic query
    const whereClause = "WHERE u.role = 'doctor' AND u.is_active = 1";
    const countParams = [];
    const dataParams = [];
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      INNER JOIN doctors d ON u.id = d.user_id
      ${whereClause}
    `;
    
    const limitNum = 20;
    const offset = 0;
    
    const dataQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.created_at,
        u.is_active,
        d.doctor_id,
        d.specialty,
        d.license_number,
        d.years_of_experience,
        d.education,
        d.certifications,
        d.consultation_fee,
        d.working_hours,
        d.availability_status,
        d.status,
        d.rating,
        d.total_reviews
      FROM users u
      INNER JOIN doctors d ON u.id = d.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    
    console.log('Count query:', countQuery);
    console.log('Count params:', countParams);
    
    const [countResult] = await connection.execute(countQuery, countParams);
    console.log('✅ Count result:', countResult[0]);
    
    console.log('Data query:', dataQuery);
    console.log('Data params:', dataParams);
    
    const [doctors] = await connection.execute(dataQuery, dataParams);
    console.log('✅ Found doctors:', doctors.length);
    if (doctors.length > 0) {
      console.log('Sample doctor:', {
        name: doctors[0].name,
        specialty: doctors[0].specialty,
        status: doctors[0].status
      });
    }
    
    await connection.end();
    console.log('✅ Doctors SQL query test completed successfully!');
    
  } catch (error) {
    console.error('❌ Doctors SQL query test failed:', error.message);
  }
}

testDoctorsQuery();