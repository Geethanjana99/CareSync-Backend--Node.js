const mysql = require('mysql2/promise');

async function fixMissingDoctorRecords() {
  let connection;
  try {
    console.log('=== FIXING MISSING DOCTOR RECORDS ===\n');
    
    connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('Database connected successfully!\n');
    
    // Get users with doctor role but no doctor record
    const [missingRecords] = await connection.execute(`
      SELECT u.id, u.name, u.email 
      FROM users u 
      LEFT JOIN doctors d ON u.id = d.user_id 
      WHERE u.role = 'doctor' AND d.user_id IS NULL
    `);
    
    console.log(`Found ${missingRecords.length} users with missing doctor records:`);
    missingRecords.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ID: ${user.id}`);
    });
    
    if (missingRecords.length === 0) {
      console.log('No missing doctor records found!');
      return;
    }
    
    console.log('\nCreating missing doctor records...\n');
    
    // Get the latest doctor_id to continue the sequence
    const [latestDoctor] = await connection.execute(
      'SELECT doctor_id FROM doctors ORDER BY created_at DESC LIMIT 1'
    );
    
    let doctorIdCounter = 800; // Start from a safe number
    if (latestDoctor.length > 0) {
      const latestId = latestDoctor[0].doctor_id;
      if (latestId.startsWith('D')) {
        const numberPart = parseInt(latestId.replace('D', ''));
        if (!isNaN(numberPart)) {
          doctorIdCounter = numberPart + 1;
        }
      }
    }
    
    console.log(`Starting doctor ID counter from: D${doctorIdCounter.toString().padStart(3, '0')}\n`);
    
    // Create doctor records for each missing user
    for (const user of missingRecords) {
      const doctorId = `D${doctorIdCounter.toString().padStart(3, '0')}`;
      
      try {
        await connection.execute(`
          INSERT INTO doctors (
            id,
            user_id,
            doctor_id,
            specialty,
            license_number,
            years_of_experience,
            consultation_fee,
            languages_spoken,
            bio,
            status,
            availability_status,
            created_at,
            updated_at
          ) VALUES (
            UUID(),
            ?,
            ?,
            'General Medicine',
            ?,
            5,
            2500.00,
            JSON_ARRAY('English'),
            'General practitioner with comprehensive medical care experience.',
            'active',
            'available',
            NOW(),
            NOW()
          )
        `, [
          user.id,
          doctorId,
          `LIC${Date.now()}${Math.floor(Math.random() * 1000)}`
        ]);
        
        console.log(`✅ Created doctor record for ${user.name} - Doctor ID: ${doctorId}`);
        doctorIdCounter++;
        
      } catch (error) {
        console.error(`❌ Failed to create doctor record for ${user.name}:`, error.message);
      }
    }
    
    console.log('\n=== VERIFICATION ===');
    const [verificationCheck] = await connection.execute(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email,
        d.doctor_id,
        d.specialty,
        CASE 
          WHEN d.user_id IS NULL THEN 'STILL_MISSING'
          WHEN d.user_id = u.id THEN 'FIXED'
          ELSE 'ERROR'
        END as status
      FROM users u 
      LEFT JOIN doctors d ON u.id = d.user_id 
      WHERE u.role = 'doctor'
      ORDER BY u.created_at DESC
      LIMIT 20
    `);
    
    console.log('\nLatest doctor-user relationships:');
    verificationCheck.forEach((record, index) => {
      const statusIcon = record.status === 'FIXED' ? '✅' : record.status === 'STILL_MISSING' ? '❌' : '⚠️';
      console.log(`${index + 1}. ${statusIcon} ${record.user_name} - ${record.status} - Doctor ID: ${record.doctor_id || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit();
  }
}

fixMissingDoctorRecords();
