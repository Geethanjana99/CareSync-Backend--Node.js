// ===================================================================
// CREATE TEST DATA VIA API
// ===================================================================
// This script creates sample doctors and patients using API endpoints
// ===================================================================

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testDoctors = [
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@clinic.com',
    password: 'Doctor123!',
    phone: '0771234567',
    role: 'doctor',
    specialty: 'Cardiology',
    licenseNumber: 'CAR001',
    consultationFee: 2500,
    experience: 10,
    education: 'MD from University of Colombo',
    bio: 'Experienced cardiologist specializing in preventive care and cardiac surgery.'
  },
  {
    name: 'Dr. Michael Chen',
    email: 'michael.chen@clinic.com',
    password: 'Doctor123!',
    phone: '0771234568',
    role: 'doctor',
    specialty: 'Pediatrics',
    licenseNumber: 'PED001',
    consultationFee: 2000,
    experience: 8,
    education: 'MD from University of Peradeniya',
    bio: 'Pediatric specialist with expertise in child development and immunization.'
  },
  {
    name: 'Dr. Priya Patel',
    email: 'priya.patel@clinic.com',
    password: 'Doctor123!',
    phone: '0771234569',
    role: 'doctor',
    specialty: 'Dermatology',
    licenseNumber: 'DER001',
    consultationFee: 2200,
    experience: 12,
    education: 'MD from University of Kelaniya',
    bio: 'Dermatologist specializing in skin conditions and cosmetic procedures.'
  },
  {
    name: 'Dr. David Wilson',
    email: 'david.wilson@clinic.com',
    password: 'Doctor123!',
    phone: '0771234570',
    role: 'doctor',
    specialty: 'Orthopedics',
    licenseNumber: 'ORT001',
    consultationFee: 3000,
    experience: 15,
    education: 'MD from University of Sri Jayewardenepura',
    bio: 'Orthopedic surgeon with expertise in joint replacement and sports medicine.'
  },
  {
    name: 'Dr. Lisa Thompson',
    email: 'lisa.thompson@clinic.com',
    password: 'Doctor123!',
    phone: '0771234571',
    role: 'doctor',
    specialty: 'Neurology',
    licenseNumber: 'NEU001',
    consultationFee: 3500,
    experience: 18,
    education: 'MD from University of Ruhuna',
    bio: 'Neurologist specializing in brain and nervous system disorders.'
  }
];

const testPatient = {
  name: 'John Test Patient',
  email: 'patient.test@example.com',
  password: 'Patient123!',
  phone: '0771234580',
  role: 'patient'
};

async function createTestDataViaAPI() {
  console.log('🌱 Creating test data via API endpoints...\n');
  
  try {
    // Create test doctors
    console.log('👨‍⚕️ Creating test doctors...');
    
    for (const doctor of testDoctors) {
      try {
        const response = await axios.post(`${BASE_URL}/auth/register`, doctor, { 
          timeout: 10000 
        });
        
        if (response.data.success) {
          console.log(`✅ Created doctor: ${doctor.name} (${doctor.specialty})`);
        } else {
          console.log(`❌ Failed to create doctor ${doctor.name}: ${response.data.message}`);
        }
        
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          if (error.response.data.message.includes('already exists')) {
            console.log(`⚠️ Doctor ${doctor.name} already exists, skipping...`);
          } else {
            console.log(`❌ Error creating doctor ${doctor.name}: ${error.response.data.message}`);
          }
        } else {
          console.log(`❌ Error creating doctor ${doctor.name}: ${error.message}`);
        }
      }
    }
    
    // Create test patient
    console.log('\n👤 Creating test patient...');
    
    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, testPatient, { 
        timeout: 10000 
      });
      
      if (response.data.success) {
        console.log(`✅ Created patient: ${testPatient.name}`);
      } else {
        console.log(`❌ Failed to create patient ${testPatient.name}: ${response.data.message}`);
      }
      
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        if (error.response.data.message.includes('already exists')) {
          console.log(`⚠️ Patient ${testPatient.name} already exists, skipping...`);
        } else {
          console.log(`❌ Error creating patient ${testPatient.name}: ${error.response.data.message}`);
        }
      } else {
        console.log(`❌ Error creating patient ${testPatient.name}: ${error.message}`);
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
    console.error('❌ Error creating test data:', error.message);
  }
}

// Run the script
createTestDataViaAPI();
