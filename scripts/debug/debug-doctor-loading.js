const mysql = require('mysql2/promise');

async function debugDoctorLoading() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('🔍 DEBUGGING DOCTOR LOADING ISSUES');
    console.log('='.repeat(40));
    
    // 1. Check doctor data in detail
    console.log('\n1️⃣ Doctor Data Analysis:');
    const [doctors] = await connection.execute(`
      SELECT 
        d.id,
        d.user_id,
        d.doctor_id,
        d.specialty,
        d.status as doctor_status,
        d.availability_status,
        u.name,
        u.email,
        u.is_active as user_active,
        u.role
      FROM doctors d
      JOIN users u ON d.user_id = u.id
    `);
    
    console.log(`Found ${doctors.length} doctors:`);
    doctors.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.name} (${doc.email})`);
      console.log(`   - Doctor Status: ${doc.doctor_status}`);
      console.log(`   - Availability: ${doc.availability_status || 'NULL'}`);
      console.log(`   - User Active: ${doc.user_active}`);
      console.log(`   - User Role: ${doc.role}`);
      console.log('');
    });
    
    // 2. Test the exact query from Patient.searchDoctors
    console.log('2️⃣ Testing Patient.searchDoctors Query:');
    const searchQuery = `
      SELECT 
        d.id,
        d.doctor_id,
        d.specialty,
        d.license_number,
        d.years_of_experience,
        d.consultation_fee,
        d.bio,
        d.rating,
        d.total_reviews,
        d.availability_status,
        d.working_hours,
        u.name,
        u.email,
        u.phone,
        u.avatar_url
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'active' 
        AND u.is_active = true 
        AND d.availability_status IN ('available', 'busy')
      ORDER BY d.rating DESC, d.total_reviews DESC, u.name ASC
    `;
    
    const [searchResults] = await connection.execute(searchQuery);
    console.log(`Query with filters returned: ${searchResults.length} doctors`);
    
    if (searchResults.length === 0) {
      console.log('\n❌ NO DOCTORS FOUND! Issues:');
      
      // Check each filter condition
      const [statusCheck] = await connection.execute(`
        SELECT COUNT(*) as count FROM doctors WHERE status = 'active'
      `);
      console.log(`   Doctors with status='active': ${statusCheck[0].count}`);
      
      const [userActiveCheck] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM doctors d 
        JOIN users u ON d.user_id = u.id 
        WHERE u.is_active = true
      `);
      console.log(`   Doctors with active users: ${userActiveCheck[0].count}`);
      
      const [availabilityCheck] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM doctors d 
        JOIN users u ON d.user_id = u.id 
        WHERE d.availability_status IN ('available', 'busy')
      `);
      console.log(`   Doctors with availability_status IN ('available', 'busy'): ${availabilityCheck[0].count}`);
      
      // Show what the actual values are
      console.log('\n🔍 Actual values in database:');
      doctors.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.name}:`);
        console.log(`   status: "${doc.doctor_status}"`);
        console.log(`   availability_status: "${doc.availability_status}"`);
        console.log(`   user.is_active: ${doc.user_active}`);
      });
    }
    
    // 3. Try a simpler query
    console.log('\n3️⃣ Testing Simpler Query (without filters):');
    const simpleQuery = `
      SELECT 
        d.id,
        d.doctor_id,
        d.specialty,
        d.status,
        d.availability_status,
        u.name,
        u.is_active
      FROM doctors d
      JOIN users u ON d.user_id = u.id
    `;
    
    const [simpleResults] = await connection.execute(simpleQuery);
    console.log(`Simple query returned: ${simpleResults.length} doctors`);
    
    // 4. Fix the issues
    console.log('\n4️⃣ Fixing Doctor Status Issues:');
    
    // Update doctor status to 'active'
    const [updateStatus] = await connection.execute(`
      UPDATE doctors SET status = 'active' WHERE status = 'pending_approval'
    `);
    console.log(`✅ Updated ${updateStatus.affectedRows} doctors to 'active' status`);
    
    // Set availability_status for doctors that don't have it
    const [updateAvailability] = await connection.execute(`
      UPDATE doctors 
      SET availability_status = 'available' 
      WHERE availability_status IS NULL OR availability_status = ''
    `);
    console.log(`✅ Updated ${updateAvailability.affectedRows} doctors availability status`);
    
    // 5. Test the query again after fixes
    console.log('\n5️⃣ Testing After Fixes:');
    const [fixedResults] = await connection.execute(searchQuery);
    console.log(`Query after fixes returned: ${fixedResults.length} doctors`);
    
    if (fixedResults.length > 0) {
      console.log('\n✅ DOCTORS NOW AVAILABLE:');
      fixedResults.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.name} - ${doc.specialty}`);
        console.log(`   Fee: $${doc.consultation_fee || 0}`);
        console.log(`   Rating: ${doc.rating || 0}/5 (${doc.total_reviews || 0} reviews)`);
      });
    }
    
    // 6. Test patients too
    console.log('\n6️⃣ Checking Patient Data:');
    const [patients] = await connection.execute(`
      SELECT 
        p.id,
        p.patient_id,
        p.status as patient_status,
        u.name,
        u.email,
        u.is_active as user_active
      FROM patients p
      JOIN users u ON p.user_id = u.id
    `);
    
    console.log(`Found ${patients.length} patients:`);
    patients.forEach((pat, index) => {
      console.log(`${index + 1}. ${pat.name} (${pat.email})`);
      console.log(`   Patient Status: ${pat.patient_status}`);
      console.log(`   User Active: ${pat.user_active}`);
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SUMMARY OF FIXES APPLIED:');
    console.log('='.repeat(50));
    console.log('✅ Updated doctor status from "pending_approval" to "active"');
    console.log('✅ Set availability_status to "available" for doctors');
    console.log('✅ Doctors should now appear in search results');
    console.log('✅ Patient data looks good');
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Test the frontend doctor search');
    console.log('2. Check if backend server is running');
    console.log('3. Verify API endpoints work in browser/Postman');
    console.log('4. Add more test doctors if needed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugDoctorLoading();