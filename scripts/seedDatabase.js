const { mysqlConnection } = require('../config/mysql');
const { mongoConnection } = require('../config/mongodb');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

class DatabaseSeeder {
  static async seedUsers() {
    logger.info('Seeding users...');
    
    const users = [
      {
        name: 'Admin User',
        email: 'admin@caresync.com',
        password: 'admin123',
        role: 'admin',
        phone: '+1234567890',
        email_verified: true
      },
      {
        name: 'Dr. John Smith',
        email: 'dr.smith@caresync.com',
        password: 'doctor123',
        role: 'doctor',
        phone: '+1234567891',
        email_verified: true
      },
      {
        name: 'Dr. Sarah Johnson',
        email: 'dr.johnson@caresync.com',
        password: 'doctor123',
        role: 'doctor',
        phone: '+1234567892',
        email_verified: true
      },
      {
        name: 'Dr. Michael Brown',
        email: 'dr.brown@caresync.com',
        password: 'doctor123',
        role: 'doctor',
        phone: '+1234567893',
        email_verified: true
      },
      {
        name: 'Alice Wilson',
        email: 'alice.wilson@email.com',
        password: 'patient123',
        role: 'patient',
        phone: '+1234567894',
        email_verified: true
      },
      {
        name: 'Bob Davis',
        email: 'bob.davis@email.com',
        password: 'patient123',
        role: 'patient',
        phone: '+1234567895',
        email_verified: true
      },
      {
        name: 'Carol Martinez',
        email: 'carol.martinez@email.com',
        password: 'patient123',
        role: 'patient',
        phone: '+1234567896',
        email_verified: true
      },
      {
        name: 'David Lee',
        email: 'david.lee@email.com',
        password: 'patient123',
        role: 'patient',
        phone: '+1234567897',
        email_verified: true
      }
    ];

    const savedUsers = [];
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        ...userData,
        password_hash: hashedPassword
      });
      const savedUser = await user.save();
      savedUsers.push(savedUser);
      logger.info(`Created user: ${userData.name} (${userData.email})`);
    }

    return savedUsers;
  }

  static async seedDoctors(users) {
    logger.info('Seeding doctors...');
    
    const doctorUsers = users.filter(user => user.role === 'doctor');
    const specialties = ['Cardiology', 'Dermatology', 'Orthopedics'];
    
    const doctors = [
      {
        user_id: doctorUsers[0].id,
        license_number: 'MD001234',
        specialization: specialties[0],
        experience_years: 15,
        education: 'MD from Harvard Medical School, Residency at Johns Hopkins',
        bio: 'Experienced cardiologist specializing in interventional cardiology and heart disease prevention.',
        consultation_fee: 200.00,
        clinic_address: '123 Medical Center Dr, Suite 100',
        availability_hours: JSON.stringify({
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '15:00' }
        }),
        is_approved: true,
        rating: 4.8,
        total_appointments: 1250
      },
      {
        user_id: doctorUsers[1].id,
        license_number: 'MD005678',
        specialization: specialties[1],
        experience_years: 12,
        education: 'MD from Stanford Medical School, Dermatology Residency at UCSF',
        bio: 'Board-certified dermatologist with expertise in medical and cosmetic dermatology.',
        consultation_fee: 180.00,
        clinic_address: '456 Health Plaza, Floor 3',
        availability_hours: JSON.stringify({
          monday: { start: '08:00', end: '16:00' },
          tuesday: { start: '08:00', end: '16:00' },
          wednesday: { start: '08:00', end: '16:00' },
          thursday: { start: '08:00', end: '16:00' },
          friday: { start: '08:00', end: '14:00' }
        }),
        is_approved: true,
        rating: 4.9,
        total_appointments: 980
      },
      {
        user_id: doctorUsers[2].id,
        license_number: 'MD009012',
        specialization: specialties[2],
        experience_years: 18,
        education: 'MD from Mayo Medical School, Orthopedic Surgery Residency at Cleveland Clinic',
        bio: 'Orthopedic surgeon specializing in sports medicine and joint replacement.',
        consultation_fee: 250.00,
        clinic_address: '789 Sports Medicine Center',
        availability_hours: JSON.stringify({
          monday: { start: '07:00', end: '15:00' },
          tuesday: { start: '07:00', end: '15:00' },
          wednesday: { start: '07:00', end: '15:00' },
          thursday: { start: '07:00', end: '15:00' },
          friday: { start: '07:00', end: '12:00' }
        }),
        is_approved: true,
        rating: 4.7,
        total_appointments: 756
      }
    ];

    const savedDoctors = [];
    for (const doctorData of doctors) {
      const doctor = new Doctor(doctorData);
      const savedDoctor = await doctor.save();
      savedDoctors.push(savedDoctor);
      
      const user = users.find(u => u.id === doctorData.user_id);
      logger.info(`Created doctor profile for: ${user.name}`);
    }

    return savedDoctors;
  }

  static async seedPatients(users) {
    logger.info('Seeding patients...');
    
    const patientUsers = users.filter(user => user.role === 'patient');
    
    const patients = [
      {
        user_id: patientUsers[0].id,
        date_of_birth: '1985-03-15',
        gender: 'Female',
        address: '123 Elm Street, Springfield, IL 62701',
        emergency_contact_name: 'John Wilson',
        emergency_contact_phone: '+1234567801',
        medical_history: 'Hypertension, managed with medication',
        allergies: 'Penicillin',
        current_medications: 'Lisinopril 10mg daily',
        insurance_provider: 'Blue Cross Blue Shield',
        insurance_policy_number: 'BCBS123456789',
        blood_type: 'A+',
        height: 165,
        weight: 68
      },
      {
        user_id: patientUsers[1].id,
        date_of_birth: '1978-08-22',
        gender: 'Male',
        address: '456 Oak Avenue, Springfield, IL 62702',
        emergency_contact_name: 'Jane Davis',
        emergency_contact_phone: '+1234567802',
        medical_history: 'Type 2 Diabetes, well controlled',
        allergies: 'None known',
        current_medications: 'Metformin 500mg twice daily',
        insurance_provider: 'Aetna',
        insurance_policy_number: 'AET987654321',
        blood_type: 'O+',
        height: 180,
        weight: 85
      },
      {
        user_id: patientUsers[2].id,
        date_of_birth: '1992-12-05',
        gender: 'Female',
        address: '789 Pine Road, Springfield, IL 62703',
        emergency_contact_name: 'Roberto Martinez',
        emergency_contact_phone: '+1234567803',
        medical_history: 'Asthma since childhood',
        allergies: 'Shellfish, pollen',
        current_medications: 'Albuterol inhaler as needed',
        insurance_provider: 'Cigna',
        insurance_policy_number: 'CIG456789123',
        blood_type: 'B+',
        height: 158,
        weight: 55
      },
      {
        user_id: patientUsers[3].id,
        date_of_birth: '1990-06-18',
        gender: 'Male',
        address: '321 Maple Drive, Springfield, IL 62704',
        emergency_contact_name: 'Susan Lee',
        emergency_contact_phone: '+1234567804',
        medical_history: 'No significant medical history',
        allergies: 'None known',
        current_medications: 'None',
        insurance_provider: 'United Healthcare',
        insurance_policy_number: 'UHC789123456',
        blood_type: 'AB+',
        height: 175,
        weight: 72
      }
    ];

    const savedPatients = [];
    for (const patientData of patients) {
      const patient = new Patient(patientData);
      const savedPatient = await patient.save();
      savedPatients.push(savedPatient);
      
      const user = users.find(u => u.id === patientData.user_id);
      logger.info(`Created patient profile for: ${user.name}`);
    }

    return savedPatients;
  }

  static async seedAppointments(doctors, patients) {
    logger.info('Seeding appointments...');
    
    const appointments = [
      {
        patient_id: patients[0].id,
        doctor_id: doctors[0].id,
        appointment_date: '2025-06-15',
        appointment_time: '10:00:00',
        duration_minutes: 30,
        type: 'consultation',
        status: 'completed',
        reason: 'Regular checkup and blood pressure monitoring',
        notes: 'Patient doing well on current medication. Continue current treatment.',
        fee: 200.00
      },
      {
        patient_id: patients[1].id,
        doctor_id: doctors[0].id,
        appointment_date: '2025-06-16',
        appointment_time: '14:30:00',
        duration_minutes: 45,
        type: 'consultation',
        status: 'completed',
        reason: 'Diabetic management consultation',
        notes: 'HbA1c levels stable. Discussed diet and exercise plan.',
        fee: 200.00
      },
      {
        patient_id: patients[2].id,
        doctor_id: doctors[1].id,
        appointment_date: '2025-06-18',
        appointment_time: '11:00:00',
        duration_minutes: 30,
        type: 'consultation',
        status: 'completed',
        reason: 'Skin condition evaluation',
        notes: 'Minor eczema. Prescribed topical treatment.',
        fee: 180.00
      },
      {
        patient_id: patients[0].id,
        doctor_id: doctors[2].id,
        appointment_date: '2025-06-22',
        appointment_time: '09:30:00',
        duration_minutes: 60,
        type: 'consultation',
        status: 'confirmed',
        reason: 'Knee pain evaluation',
        notes: null,
        fee: 250.00
      },
      {
        patient_id: patients[3].id,
        doctor_id: doctors[0].id,
        appointment_date: '2025-06-25',
        appointment_time: '15:00:00',
        duration_minutes: 30,
        type: 'consultation',
        status: 'confirmed',
        reason: 'Preventive health screening',
        notes: null,
        fee: 200.00
      },
      {
        patient_id: patients[1].id,
        doctor_id: doctors[1].id,
        appointment_date: '2025-06-28',
        appointment_time: '10:30:00',
        duration_minutes: 30,
        type: 'follow-up',
        status: 'pending',
        reason: 'Follow-up for previous skin consultation',
        notes: null,
        fee: 180.00
      }
    ];

    const savedAppointments = [];
    for (const appointmentData of appointments) {
      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();
      savedAppointments.push(savedAppointment);
      
      const patient = patients.find(p => p.id === appointmentData.patient_id);
      const doctor = doctors.find(d => d.id === appointmentData.doctor_id);
      logger.info(`Created appointment: Patient ${patient.patient_id} with Doctor (ID: ${doctor.id}) on ${appointmentData.appointment_date}`);
    }

    return savedAppointments;
  }

  static async createTables() {
    logger.info('Creating database tables...');

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'doctor', 'patient') NOT NULL,
        avatar_url VARCHAR(500),
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        email_verified BOOLEAN DEFAULT FALSE,
        last_login DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    const createPatientsTable = `
      CREATE TABLE IF NOT EXISTS patients (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        patient_id VARCHAR(20) UNIQUE NOT NULL,
        date_of_birth DATE,
        gender ENUM('Male', 'Female', 'Other'),
        address TEXT,
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(20),
        medical_history TEXT,
        allergies TEXT,
        current_medications TEXT,
        insurance_provider VARCHAR(255),
        insurance_policy_number VARCHAR(100),
        blood_type VARCHAR(5),
        height INT,
        weight DECIMAL(5,2),
        occupation VARCHAR(255),
        marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed'),
        preferred_language VARCHAR(50) DEFAULT 'English',
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    const createDoctorsTable = `
      CREATE TABLE IF NOT EXISTS doctors (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        license_number VARCHAR(50) UNIQUE NOT NULL,
        specialization VARCHAR(255) NOT NULL,
        experience_years INT,
        education TEXT,
        bio TEXT,
        consultation_fee DECIMAL(10,2),
        clinic_address TEXT,
        availability_hours JSON,
        is_approved BOOLEAN DEFAULT FALSE,
        rating DECIMAL(3,2) DEFAULT 0.00,
        total_reviews INT DEFAULT 0,
        total_appointments INT DEFAULT 0,
        total_earnings DECIMAL(12,2) DEFAULT 0.00,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    const createAppointmentsTable = `
      CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(36) PRIMARY KEY,
        patient_id VARCHAR(36) NOT NULL,
        doctor_id VARCHAR(36) NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        duration_minutes INT DEFAULT 30,
        type ENUM('consultation', 'follow-up', 'emergency', 'procedure') DEFAULT 'consultation',
        status ENUM('pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show') DEFAULT 'pending',
        reason TEXT,
        notes TEXT,
        fee DECIMAL(10,2),
        payment_status ENUM('pending', 'paid', 'partially_paid', 'refunded') DEFAULT 'pending',
        confirmation_code VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        UNIQUE KEY unique_doctor_appointment (doctor_id, appointment_date, appointment_time)
      )
    `;

    const createBillingTable = `
      CREATE TABLE IF NOT EXISTS billing (
        id VARCHAR(36) PRIMARY KEY,
        appointment_id VARCHAR(36) NOT NULL,
        patient_id VARCHAR(36) NOT NULL,
        doctor_id VARCHAR(36) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        tax_amount DECIMAL(10,2) DEFAULT 0.00,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method ENUM('cash', 'card', 'insurance', 'transfer') DEFAULT 'card',
        payment_status ENUM('pending', 'paid', 'partially_paid', 'refunded', 'failed') DEFAULT 'pending',
        transaction_id VARCHAR(100),
        invoice_number VARCHAR(50) UNIQUE,
        due_date DATE,
        paid_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
      )
    `;

    const createReviewsTable = `
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(36) PRIMARY KEY,
        appointment_id VARCHAR(36) NOT NULL,
        patient_id VARCHAR(36) NOT NULL,
        doctor_id VARCHAR(36) NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        is_anonymous BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        UNIQUE KEY unique_review (appointment_id, patient_id)
      )
    `;

    const tables = [
      { name: 'users', query: createUsersTable },
      { name: 'patients', query: createPatientsTable },
      { name: 'doctors', query: createDoctorsTable },
      { name: 'appointments', query: createAppointmentsTable },
      { name: 'billing', query: createBillingTable },
      { name: 'reviews', query: createReviewsTable }
    ];

    for (const table of tables) {
      await mysqlConnection.query(table.query);
      logger.info(`Created table: ${table.name}`);
    }
  }

  static async seedDatabase() {
    try {
      logger.info('Starting database seeding...');

      // Create tables
      await this.createTables();

      // Clear existing data (in reverse order of dependencies)
      await mysqlConnection.query('SET FOREIGN_KEY_CHECKS = 0');
      await mysqlConnection.query('TRUNCATE TABLE reviews');
      await mysqlConnection.query('TRUNCATE TABLE billing');
      await mysqlConnection.query('TRUNCATE TABLE appointments');
      await mysqlConnection.query('TRUNCATE TABLE doctors');
      await mysqlConnection.query('TRUNCATE TABLE patients');
      await mysqlConnection.query('TRUNCATE TABLE users');
      await mysqlConnection.query('SET FOREIGN_KEY_CHECKS = 1');

      // Seed data
      const users = await this.seedUsers();
      const doctors = await this.seedDoctors(users);
      const patients = await this.seedPatients(users);
      const appointments = await this.seedAppointments(doctors, patients);

      logger.info('Database seeding completed successfully!');
      logger.info(`Created ${users.length} users, ${doctors.length} doctors, ${patients.length} patients, ${appointments.length} appointments`);

      return {
        users: users.length,
        doctors: doctors.length,
        patients: patients.length,
        appointments: appointments.length
      };
    } catch (error) {
      logger.error('Database seeding failed:', error);
      throw error;
    }
  }
}

// Run seeder if called directly
if (require.main === module) {
  DatabaseSeeder.seedDatabase()
    .then((result) => {
      logger.info('Seeding completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = DatabaseSeeder;