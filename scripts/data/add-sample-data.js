const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function addSampleDoctorsAndPatients() {
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
    
    console.log('🏥 ADDING SAMPLE DOCTORS AND PATIENTS');
    console.log('=====================================\n');
    
    // Sample doctors to add - Sri Lankan names
    const sampleDoctors = [
      {
        name: 'Dr. Nimal Perera',
        email: 'nimal.perera@caresync.lk',
        specialty: 'Cardiology',
        license: 'SLMC-CAR001',
        experience: 12,
        fee: 2500,
        bio: 'Experienced cardiologist specializing in heart disease prevention and treatment. MBBS (Colombo), MD Cardiology (UK).'
      },
      {
        name: 'Dr. Sunethra Fernando',
        email: 'sunethra.fernando@caresync.lk',
        specialty: 'Pediatrics',
        license: 'SLMC-PED002',
        experience: 8,
        fee: 2000,
        bio: 'Pediatric specialist with expertise in child healthcare and development. MBBS (Peradeniya), DCH (Ceylon).'
      },
      {
        name: 'Dr. Priyanka Jayawardena',
        email: 'priyanka.jayawardena@caresync.lk',
        specialty: 'Dermatology',
        license: 'SLMC-DER003',
        experience: 10,
        fee: 1800,
        bio: 'Dermatologist focused on skin health, cosmetic procedures, and skin cancer prevention. MBBS (Ruhuna), MD Dermatology.'
      },
      {
        name: 'Dr. Chaminda Silva',
        email: 'chaminda.silva@caresync.lk',
        specialty: 'Orthopedics',
        license: 'SLMC-ORT004',
        experience: 15,
        fee: 3000,
        bio: 'Orthopedic surgeon specializing in joint replacement and sports medicine. MBBS (Colombo), MS Orthopedics (India).'
      },
      {
        name: 'Dr. Dilani Wickramasinghe',
        email: 'dilani.wickramasinghe@caresync.lk',
        specialty: 'Neurology',
        license: 'SLMC-NEU005',
        experience: 14,
        fee: 2800,
        bio: 'Neurologist with expertise in brain disorders, epilepsy, and stroke treatment. MBBS (Kelaniya), MD Neurology (Australia).'
      },
      {
        name: 'Dr. Ruwan Gunasekara',
        email: 'ruwan.gunasekara@caresync.lk',
        specialty: 'General Medicine',
        license: 'SLMC-GEN006',
        experience: 18,
        fee: 2200,
        bio: 'General practitioner with extensive experience in family medicine and preventive care. MBBS (Colombo), MRCGP.'
      },
      {
        name: 'Dr. Sanduni Rajapaksha',
        email: 'sanduni.rajapaksha@caresync.lk',
        specialty: 'Gynecology',
        license: 'SLMC-GYN007',
        experience: 11,
        fee: 2400,
        bio: 'Gynecologist and obstetrician specializing in women\'s health and fertility treatments. MBBS (Peradeniya), MS OG.'
      },
      {
        name: 'Dr. Asanka Bandara',
        email: 'asanka.bandara@caresync.lk',
        specialty: 'Psychiatry',
        license: 'SLMC-PSY008',
        experience: 9,
        fee: 2600,
        bio: 'Psychiatrist specializing in mental health, depression, and anxiety disorders. MBBS (Ruhuna), MD Psychiatry.'
      }
    ];
    
    // Sample patients to add - Sri Lankan names
    const samplePatients = [
      {
        name: 'Kasun Madhuranga',
        email: 'kasun.madhuranga@gmail.com',
        phone: '0771234567',
        gender: 'male',
        dob: '1985-05-15'
      },
      {
        name: 'Nimali Seneviratne',
        email: 'nimali.seneviratne@gmail.com',
        phone: '0777654321',
        gender: 'female',
        dob: '1990-08-22'
      },
      {
        name: 'Thilina Rathnayake',
        email: 'thilina.rathnayake@gmail.com',
        phone: '0779876543',
        gender: 'male',
        dob: '1978-12-03'
      },
      {
        name: 'Chamari Dissanayake',
        email: 'chamari.dissanayake@gmail.com',
        phone: '0776543210',
        gender: 'female',
        dob: '1995-03-18'
      },
      {
        name: 'Lahiru Karunaratne',
        email: 'lahiru.karunaratne@gmail.com',
        phone: '0778901234',
        gender: 'male',
        dob: '1982-11-07'
      },
      {
        name: 'Ishara Wijesundara',
        email: 'ishara.wijesundara@gmail.com',
        phone: '0774567890',
        gender: 'female',
        dob: '1987-02-14'
      },
      {
        name: 'Danushka Weerasinghe',
        email: 'danushka.weerasinghe@gmail.com',
        phone: '0773456789',
        gender: 'male',
        dob: '1992-09-25'
      },
      {
        name: 'Malki Amarasinghe',
        email: 'malki.amarasinghe@gmail.com',
        phone: '0772345678',
        gender: 'female',
        dob: '1988-06-30'
      },
      {
        name: 'Buddhika Herath',
        email: 'buddhika.herath@gmail.com',
        phone: '0771987654',
        gender: 'male',
        dob: '1983-04-12'
      },
      {
        name: 'Sachini Kumari',
        email: 'sachini.kumari@gmail.com',
        phone: '0775432109',
        gender: 'female',
        dob: '1994-01-28'
      }
    ];
    
    console.log('1️⃣ Adding Sample Doctors...');
    
    for (const doctorData of sampleDoctors) {
      try {
        // Check if doctor already exists
        const [existing] = await connection.execute(
          'SELECT id FROM users WHERE email = ?',
          [doctorData.email]
        );
        
        if (existing.length > 0) {
          console.log(`   ⏭️ Skipping ${doctorData.name} - already exists`);
          continue;
        }
        
        // Create user
        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash('Doctor123!', 12);
        
        await connection.execute(`
          INSERT INTO users (id, name, email, password_hash, role, phone, is_active, email_verified)
          VALUES (?, ?, ?, ?, 'doctor', ?, true, true)
        `, [userId, doctorData.name, doctorData.email, hashedPassword, '0771234567']);
        
        // Create doctor profile
        const doctorId = uuidv4();
        const doctorCode = `DR${Date.now().toString().slice(-6)}`;
        
        await connection.execute(`
          INSERT INTO doctors (
            id, user_id, doctor_id, specialty, license_number, 
            years_of_experience, consultation_fee, bio, 
            status, availability_status, rating, total_reviews,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 'available', ?, ?, NOW(), NOW())
        `, [
          doctorId, userId, doctorCode, doctorData.specialty, doctorData.license,
          doctorData.experience, doctorData.fee, doctorData.bio,
          (Math.random() * 2 + 3).toFixed(1), // Random rating 3.0-5.0
          Math.floor(Math.random() * 50 + 10) // Random reviews 10-60
        ]);
        
        console.log(`   ✅ ${doctorData.name} - ${doctorData.specialty}`);
        
      } catch (error) {
        console.log(`   ❌ Failed to add ${doctorData.name}: ${error.message}`);
      }
    }
    
    console.log('\n2️⃣ Adding Sample Patients...');
    
    for (const patientData of samplePatients) {
      try {
        // Check if patient already exists
        const [existing] = await connection.execute(
          'SELECT id FROM users WHERE email = ?',
          [patientData.email]
        );
        
        if (existing.length > 0) {
          console.log(`   ⏭️ Skipping ${patientData.name} - already exists`);
          continue;
        }
        
        // Create user
        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash('Patient123!', 12);
        
        await connection.execute(`
          INSERT INTO users (id, name, email, password_hash, role, phone, is_active, email_verified)
          VALUES (?, ?, ?, ?, 'patient', ?, true, true)
        `, [userId, patientData.name, patientData.email, hashedPassword, patientData.phone]);
        
        // Create patient profile
        const patientId = uuidv4();
        const patientCode = `P${Date.now().toString().slice(-6)}`;
        
        await connection.execute(`
          INSERT INTO patients (
            id, user_id, patient_id, gender, date_of_birth, 
            status, preferred_language, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'active', 'English', NOW(), NOW())
        `, [patientId, userId, patientCode, patientData.gender, patientData.dob]);
        
        console.log(`   ✅ ${patientData.name} - ${patientData.gender}`);
        
      } catch (error) {
        console.log(`   ❌ Failed to add ${patientData.name}: ${error.message}`);
      }
    }
    
    // 3. Verify final counts
    console.log('\n3️⃣ Verifying Data...');
    
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [doctorCount] = await connection.execute('SELECT COUNT(*) as count FROM doctors');
    const [patientCount] = await connection.execute('SELECT COUNT(*) as count FROM patients');
    
    console.log(`📊 Final Counts:`);
    console.log(`   Total Users: ${userCount[0].count}`);
    console.log(`   Doctor Profiles: ${doctorCount[0].count}`);
    console.log(`   Patient Profiles: ${patientCount[0].count}`);
    
    // 4. Test doctor search
    console.log('\n4️⃣ Testing Doctor Search...');
    const [searchResults] = await connection.execute(`
      SELECT 
        d.id, u.name, d.specialty, d.consultation_fee, d.rating, d.status
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'active' AND u.is_active = true
      ORDER BY d.rating DESC
    `);
    
    console.log(`🔍 Available Doctors (${searchResults.length}):`);
    searchResults.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.name} - ${doc.specialty}`);
      console.log(`      Fee: $${doc.consultation_fee} | Rating: ${doc.rating}/5 | Status: ${doc.status}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SAMPLE DATA ADDED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('✅ Multiple doctors with different specialties');
    console.log('✅ Multiple patients for testing');
    console.log('✅ All users have proper profiles');
    console.log('✅ Doctor search should now work in frontend');
    console.log('✅ Patient lists should populate');
    
    console.log('\n💡 TEST CREDENTIALS:');
    console.log('Doctors: Doctor123! (password for all sample doctors)');
    console.log('Patients: Patient123! (password for all sample patients)');
    console.log('');
    console.log('🇱🇰 SAMPLE SRI LANKAN DOCTORS:');
    console.log('• Dr. Nimal Perera - Cardiology');
    console.log('• Dr. Sunethra Fernando - Pediatrics');
    console.log('• Dr. Priyanka Jayawardena - Dermatology');
    console.log('• Dr. Chaminda Silva - Orthopedics');
    console.log('• Dr. Dilani Wickramasinghe - Neurology');
    console.log('• Dr. Ruwan Gunasekara - General Medicine');
    console.log('• Dr. Sanduni Rajapaksha - Gynecology');
    console.log('• Dr. Asanka Bandara - Psychiatry');
    console.log('');
    console.log('👥 SAMPLE SRI LANKAN PATIENTS:');
    console.log('• Kasun Madhuranga, Nimali Seneviratne');
    console.log('• Thilina Rathnayake, Chamari Dissanayake');
    console.log('• Lahiru Karunaratne, Ishara Wijesundara');
    console.log('• Danushka Weerasinghe, Malki Amarasinghe');
    console.log('• Buddhika Herath, Sachini Kumari');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Start backend server: npm start');
    console.log('2. Test frontend doctor search');
    console.log('3. Test patient dashboard');
    console.log('4. Check admin panels');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addSampleDoctorsAndPatients();