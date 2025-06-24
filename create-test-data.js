// ===================================================================
// CREATE TEST DATA FOR APPOINTMENT BOOKING
// ===================================================================
// This script creates sample doctors and patients for testing
// ===================================================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database configuration for Aiven.io
const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: process.env.MYSQL_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  charset: 'utf8mb4'
};

const testDoctors = [
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@clinic.com',
    password: 'Doctor123!',
    phone: '0771234567',
    specialty: 'Cardiology',
    licenseNumber: 'CAR001',
    consultationFee: 2500,
    experience: 10,
    bio: 'Experienced cardiologist specializing in preventive care and cardiac surgery.',
    availabilityStatus: 'available'
  },
  {
    name: 'Dr. Michael Chen',
    email: 'michael.chen@clinic.com',
    password: 'Doctor123!',
    phone: '0771234568',
    specialty: 'Pediatrics',
    licenseNumber: 'PED001',
    consultationFee: 2000,
    experience: 8,
    bio: 'Pediatric specialist with expertise in child development and immunization.',
    availabilityStatus: 'available'
  },
  {
    name: 'Dr. Priya Patel',
    email: 'priya.patel@clinic.com',
    password: 'Doctor123!',
    phone: '0771234569',
    specialty: 'Dermatology',
    licenseNumber: 'DER001',
    consultationFee: 2200,
    experience: 12,
    bio: 'Dermatologist specializing in skin conditions and cosmetic procedures.',
    availabilityStatus: 'available'
  },
  {
    name: 'Dr. David Wilson',
    email: 'david.wilson@clinic.com',
    password: 'Doctor123!',
    phone: '0771234570',
    specialty: 'Orthopedics',
    licenseNumber: 'ORT001',
    consultationFee: 3000,
    experience: 15,
    bio: 'Orthopedic surgeon with expertise in joint replacement and sports medicine.',
    availabilityStatus: 'available'
  },
  {
    name: 'Dr. Lisa Thompson',
    email: 'lisa.thompson@clinic.com',
    password: 'Doctor123!',
    phone: '0771234571',
    specialty: 'Neurology',
    licenseNumber: 'NEU001',
    consultationFee: 3500,
    experience: 18,
    bio: 'Neurologist specializing in brain and nervous system disorders.',
    availabilityStatus: 'available'
  }
];

const testPatient = {
  name: 'John Test Patient',
  email: 'patient.test@example.com',
  password: 'Patient123!',
  phone: '0771234580',
  gender: 'male',
  dateOfBirth: '1990-05-15',
  address: '123 Test Street, Colombo 01',
  emergencyContactName: 'Jane Test',
  emergencyContactPhone: '0771234581'
};

async function createTestData() {
  console.log('🌱 Creating test data for appointment booking...\n');
  
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to Aiven.io MySQL database');
    
    // Create test doctors
    console.log('\n👨‍⚕️ Creating test doctors...');
    
    for (const doctor of testDoctors) {
      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(doctor.password, 10);
          // Insert user record
        const [userResult] = await connection.execute(
          `INSERT INTO users (first_name, last_name, email, password_hash, role, phone, is_active, email_verified) 
           VALUES (?, ?, ?, ?, 'doctor', ?, true, true)`,
          [doctor.name.split(' ')[1] || doctor.name, doctor.name.split(' ')[0], doctor.email, hashedPassword, doctor.phone]
        );
        
        const userId = userResult.insertId;
        
        // Insert doctor profile
        await connection.execute(
          `INSERT INTO doctors (
            user_id, specialty, license_number, consultation_fee, 
            years_of_experience, bio, availability_status
           ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            userId, doctor.specialty, doctor.licenseNumber, doctor.consultationFee,
            doctor.experience, doctor.bio, doctor.availabilityStatus
          ]
        );
        
        console.log(`✅ Created doctor: ${doctor.name} (${doctor.specialty})`);
        
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️ Doctor ${doctor.name} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating doctor ${doctor.name}:`, error.message);
        }
      }
    }
    
    // Create test patient
    console.log('\n👤 Creating test patient...');
    
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(testPatient.password, 10);
        // Insert user record
      const [userResult] = await connection.execute(
        `INSERT INTO users (first_name, last_name, email, password_hash, role, phone, is_active, email_verified) 
         VALUES (?, ?, ?, ?, 'patient', ?, true, true)`,
        [testPatient.name.split(' ')[1] || testPatient.name, testPatient.name.split(' ')[0], testPatient.email, hashedPassword, testPatient.phone]
      );
      
      const userId = userResult.insertId;
      
      // Insert patient profile
      await connection.execute(
        `INSERT INTO patients (
          user_id, gender, date_of_birth, address, 
          emergency_contact_name, emergency_contact_phone
         ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId, testPatient.gender, testPatient.dateOfBirth, testPatient.address,
          testPatient.emergencyContactName, testPatient.emergencyContactPhone
        ]
      );
      
      console.log(`✅ Created patient: ${testPatient.name}`);
      
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`⚠️ Patient ${testPatient.name} already exists, skipping...`);
      } else {
        console.error(`❌ Error creating patient ${testPatient.name}:`, error.message);
      }
    }
    
    console.log('\n🎉 Test data creation completed!');
    console.log('\n📝 Test Credentials:');
    console.log('Patient Login:');
    console.log(`  Email: ${testPatient.email}`);
    console.log(`  Password: ${testPatient.password}`);
    console.log('\nDoctor Logins:');
    testDoctors.forEach(doctor => {
      console.log(`  ${doctor.name}: ${doctor.email} / ${doctor.password}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

// Run the script
createTestData();
