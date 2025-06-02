const request = require('supertest');
const app = require('../server');
const { mysqlConnection } = require('../config/mysql');
const DatabaseSeeder = require('../scripts/seedDatabase');

// Test database configuration
process.env.NODE_ENV = 'test';
process.env.MYSQL_DATABASE = 'clinical_appointment_test_db';
process.env.MONGODB_URI = 'mongodb://localhost:27017/clinical_appointment_test_reports';

describe('Authentication Endpoints', () => {
  let server;
  let testUser;

  beforeAll(async () => {
    // Setup test database
    await DatabaseSeeder.createTables();
    server = app.listen(0);
  });

  afterAll(async () => {
    // Cleanup
    if (server) {
      server.close();
    }
    await mysqlConnection.end();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await mysqlConnection.query('SET FOREIGN_KEY_CHECKS = 0');
    await mysqlConnection.query('TRUNCATE TABLE users');
    await mysqlConnection.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'patient',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'patient',
        phone: '+1234567890'
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'patient',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      testUser = response.body.data.user;
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Appointment Endpoints', () => {
  let server;
  let authToken;
  let patientUser;
  let doctorUser;

  beforeAll(async () => {
    await DatabaseSeeder.createTables();
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
    await mysqlConnection.end();
  });

  beforeEach(async () => {
    // Clear test data
    await mysqlConnection.query('SET FOREIGN_KEY_CHECKS = 0');
    await mysqlConnection.query('TRUNCATE TABLE appointments');
    await mysqlConnection.query('TRUNCATE TABLE doctors');
    await mysqlConnection.query('TRUNCATE TABLE patients');
    await mysqlConnection.query('TRUNCATE TABLE users');
    await mysqlConnection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create test patient
    const patientResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Patient',
        email: 'patient@example.com',
        password: 'password123',
        role: 'patient',
        phone: '+1234567890'
      });

    patientUser = patientResponse.body.data.user;
    authToken = patientResponse.body.data.token;

    // Create test doctor
    const doctorResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Doctor',
        email: 'doctor@example.com',
        password: 'password123',
        role: 'doctor',
        phone: '+1234567891'
      });

    doctorUser = doctorResponse.body.data.user;
  });

  describe('GET /api/appointments', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return appointments for authenticated user', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

describe('Patient Endpoints', () => {
  let server;
  let authToken;
  let patientUser;

  beforeAll(async () => {
    await DatabaseSeeder.createTables();
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
    await mysqlConnection.end();
  });

  beforeEach(async () => {
    // Create test patient
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Patient',
        email: 'patient@example.com',
        password: 'password123',
        role: 'patient',
        phone: '+1234567890'
      });

    patientUser = response.body.data.user;
    authToken = response.body.data.token;
  });

  describe('GET /api/patients/profile', () => {
    it('should return patient profile', async () => {
      const response = await request(app)
        .get('/api/patients/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});

describe('Doctor Endpoints', () => {
  let server;
  let authToken;
  let doctorUser;

  beforeAll(async () => {
    await DatabaseSeeder.createTables();
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
    await mysqlConnection.end();
  });

  beforeEach(async () => {
    // Create test doctor
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Doctor',
        email: 'doctor@example.com',
        password: 'password123',
        role: 'doctor',
        phone: '+1234567890'
      });

    doctorUser = response.body.data.user;
    authToken = response.body.data.token;
  });

  describe('GET /api/doctors/profile', () => {
    it('should return doctor profile', async () => {
      const response = await request(app)
        .get('/api/doctors/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});
