const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.MYSQL_DATABASE = 'clinical_appointment_system_test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/clinical_appointment_system_test';
process.env.REDIS_DB = '1';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock external services
jest.mock('../services/notificationService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  sendSMS: jest.fn().mockResolvedValue(true),
  sendAppointmentConfirmation: jest.fn().mockResolvedValue(true),
  sendAppointmentReminder: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../services/cacheService', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  flushall: jest.fn(),
  getDoctorAvailability: jest.fn(),
  setDoctorAvailability: jest.fn(),
  getAppointmentSlots: jest.fn(),
  setAppointmentSlots: jest.fn()
}));

// Console suppression for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Global test utilities
global.testUtils = {
  generateTestUser: () => ({
    firstName: 'Test',
    lastName: 'User',
    email: `test.user.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phone: '+1234567890',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    role: 'patient'
  }),

  generateTestDoctor: () => ({
    firstName: 'Dr. Test',
    lastName: 'Doctor',
    email: `test.doctor.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phone: '+1234567891',
    dateOfBirth: '1980-01-01',
    gender: 'female',
    role: 'doctor',
    specialization: 'Cardiology',
    licenseNumber: `LIC${Date.now()}`,
    experience: 10,
    consultationFee: 150.00
  }),

  generateTestAppointment: (patientId, doctorId) => ({
    patientId,
    doctorId,
    appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    appointmentTime: '10:00:00',
    duration: 30,
    type: 'consultation',
    symptoms: 'Test symptoms',
    status: 'scheduled'
  }),

  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Setup global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});