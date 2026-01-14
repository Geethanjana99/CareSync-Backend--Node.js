/**
 * Test Helpers & Utilities
 * Common functions used across test suites
 * ======================================
 */

const User = require('../src/models/User');
const Appointment = require('../src/models/Appointment');
const Doctor = require('../src/models/Doctor');
const Patient = require('../src/models/Patient');
const { generateToken } = require('../src/utils/jwt');

/**
 * Clean up test database
 * Clears all collections/tables
 */
const cleanupDatabase = async () => {
  try {
    // For MongoDB models
    const models = [User, Appointment, Doctor, Patient];
    for (const model of models) {
      if (model.deleteMany) {
        await model.deleteMany({});
      } else if (model.truncate) {
        await model.truncate();
      }
    }
  } catch (error) {
    console.error('Database cleanup error:', error);
    throw error;
  }
};

/**
 * Create test user with optional token
 * @param {Object} userData - User data
 * @returns {Object} - User and token
 */
const createTestUser = async (userData = {}) => {
  const defaultData = {
    email: `test-${Date.now()}@example.com`,
    password: 'SecurePass123!',
    name: 'Test User',
    role: 'patient',
    ...userData
  };

  const user = await User.create(defaultData);
  const token = generateToken(user.id, process.env.JWT_EXPIRE);

  return { user, token };
};

/**
 * Create test doctor with profile
 * @param {Object} doctorData - Doctor data
 * @returns {Object} - Doctor and token
 */
const createTestDoctor = async (doctorData = {}) => {
  const userData = {
    email: `doctor-${Date.now()}@example.com`,
    password: 'SecurePass123!',
    name: 'Dr. Test',
    role: 'doctor',
    ...doctorData
  };

  const doctor = await User.create(userData);
  
  // Create doctor profile
  await Doctor.create({
    userId: doctor.id,
    specialization: doctorData.specialization || 'General Medicine',
    experienceYears: doctorData.experienceYears || 5,
    consultationFee: doctorData.consultationFee || 5000,
    qualifications: doctorData.qualifications || ['MBBS']
  });

  const token = generateToken(doctor.id, process.env.JWT_EXPIRE);

  return { doctor: { ...doctor, ...doctorData }, token };
};

/**
 * Create test appointment
 * @param {String} patientId - Patient ID
 * @param {String} doctorId - Doctor ID
 * @param {Object} appointmentData - Appointment data
 * @returns {Object} - Created appointment
 */
const createTestAppointment = async (patientId, doctorId, appointmentData = {}) => {
  const defaultData = {
    patientId,
    doctorId,
    appointmentDate: '2026-02-15',
    appointmentTime: '10:00 AM',
    reason: 'Regular checkup',
    status: 'pending',
    ...appointmentData
  };

  return Appointment.create(defaultData);
};

/**
 * Sleep function for async operations
 * @param {Number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wait for async operation with timeout
 * @param {Function} fn - Async function to execute
 * @param {Number} timeout - Timeout in milliseconds
 * @param {String} message - Timeout message
 */
const waitFor = async (fn, timeout = 5000, message = 'Operation timed out') => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const result = await fn();
      if (result) return result;
    } catch (error) {
      // Continue waiting
    }
    await sleep(100);
  }
  throw new Error(message);
};

/**
 * Create mock response object
 * @returns {Object} - Mock response
 */
const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    end: jest.fn(),
    locals: {}
  };
  return res;
};

/**
 * Create mock request object
 * @param {Object} overrides - Override properties
 * @returns {Object} - Mock request
 */
const createMockRequest = (overrides = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  };
};

/**
 * Assert response structure
 * @param {Object} response - Response object
 * @param {Object} expectedStructure - Expected keys and types
 */
const assertResponseStructure = (response, expectedStructure) => {
  Object.entries(expectedStructure).forEach(([key, type]) => {
    expect(response).toHaveProperty(key);
    if (type !== 'any') {
      expect(typeof response[key]).toBe(type);
    }
  });
};

/**
 * Compare dates without time
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {Boolean} - Dates are equal
 */
const areDatesEqual = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

/**
 * Generate random email
 * @returns {String} - Random email
 */
const generateRandomEmail = () => {
  return `test-${Math.random().toString(36).substring(7)}@example.com`;
};

/**
 * Generate random phone number
 * @returns {String} - Random phone number
 */
const generateRandomPhone = () => {
  return `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
};

/**
 * Assert error response
 * @param {Object} response - Response object
 * @param {Number} expectedStatus - Expected HTTP status
 * @param {String} expectedErrorMessage - Expected error message (partial)
 */
const assertErrorResponse = (response, expectedStatus, expectedErrorMessage) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('error');
  if (expectedErrorMessage) {
    expect(response.body.error.toLowerCase()).toContain(expectedErrorMessage.toLowerCase());
  }
};

/**
 * Seed database with test data
 * @returns {Object} - Created test data
 */
const seedTestDatabase = async () => {
  const { user: patient1, token: patientToken1 } = await createTestUser({
    email: 'patient1@example.com',
    role: 'patient'
  });

  const { user: patient2, token: patientToken2 } = await createTestUser({
    email: 'patient2@example.com',
    role: 'patient'
  });

  const { doctor: doctor1, token: doctorToken1 } = await createTestDoctor({
    email: 'doctor1@example.com',
    specialization: 'Cardiology'
  });

  const { doctor: doctor2, token: doctorToken2 } = await createTestDoctor({
    email: 'doctor2@example.com',
    specialization: 'Neurology'
  });

  const { user: admin, token: adminToken } = await createTestUser({
    email: 'admin@example.com',
    role: 'admin'
  });

  return {
    patients: [
      { user: patient1, token: patientToken1 },
      { user: patient2, token: patientToken2 }
    ],
    doctors: [
      { user: doctor1, token: doctorToken1 },
      { user: doctor2, token: doctorToken2 }
    ],
    admin: { user: admin, token: adminToken }
  };
};

module.exports = {
  cleanupDatabase,
  createTestUser,
  createTestDoctor,
  createTestAppointment,
  sleep,
  waitFor,
  createMockResponse,
  createMockRequest,
  assertResponseStructure,
  areDatesEqual,
  generateRandomEmail,
  generateRandomPhone,
  assertErrorResponse,
  seedTestDatabase
};
