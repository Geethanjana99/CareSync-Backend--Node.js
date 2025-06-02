const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const mysql = require('../config/mysql');

describe('Clinical Appointment System API', () => {
  let server;
  let patientToken;
  let doctorToken;
  let adminToken;
  let testPatient;
  let testDoctor;
  let testAdmin;

  beforeAll(async () => {
    // Start server
    server = app.listen(5001);
    
    // Create test users
    testPatient = await User.create({
      ...global.testUtils.generateTestUser(),
      role: 'patient'
    });

    testDoctor = await User.create({
      ...global.testUtils.generateTestDoctor(),
      role: 'doctor'
    });

    testAdmin = await User.create({
      ...global.testUtils.generateTestUser(),
      role: 'admin',
      email: `admin.${Date.now()}@example.com`
    });

    // Get authentication tokens
    const patientLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: testPatient.email,
        password: 'TestPassword123!'
      });
    patientToken = patientLogin.body.token;

    const doctorLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: testDoctor.email,
        password: 'TestPassword123!'
      });
    doctorToken = doctorLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: testAdmin.email,
        password: 'TestPassword123!'
      });
    adminToken = adminLogin.body.token;
  });

  afterAll(async () => {
    // Clean up
    await User.delete(testPatient.id);
    await User.delete(testDoctor.id);
    await User.delete(testAdmin.id);
    
    if (server) {
      await server.close();
    }
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new patient', async () => {
        const userData = global.testUtils.generateTestUser();
        
        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.user).toHaveProperty('id');
        expect(response.body.user.email).toBe(userData.email);
        expect(response.body.user.role).toBe('patient');
        expect(response.body).toHaveProperty('token');

        // Cleanup
        await User.delete(response.body.user.id);
      });

      it('should not register user with existing email', async () => {
        const userData = {
          ...global.testUtils.generateTestUser(),
          email: testPatient.email
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already exists');
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'invalid-email',
            password: '123'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: testPatient.email,
            password: 'TestPassword123!'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe(testPatient.email);
      });

      it('should reject invalid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: testPatient.email,
            password: 'wrongpassword'
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Invalid credentials');
      });
    });

    describe('GET /api/auth/profile', () => {
      it('should get user profile with valid token', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.user.id).toBe(testPatient.id);
      });

      it('should reject request without token', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Appointment Endpoints', () => {
    let testAppointment;

    describe('POST /api/appointments', () => {
      it('should create a new appointment', async () => {
        const appointmentData = {
          doctorId: testDoctor.id,
          appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          appointmentTime: '10:00',
          duration: 30,
          type: 'consultation',
          symptoms: 'Test symptoms'
        };

        const response = await request(app)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${patientToken}`)
          .send(appointmentData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.appointment).toHaveProperty('id');
        expect(response.body.appointment.patientId).toBe(testPatient.id);
        expect(response.body.appointment.doctorId).toBe(testDoctor.id);

        testAppointment = response.body.appointment;
      });

      it('should reject appointment without authentication', async () => {
        const appointmentData = {
          doctorId: testDoctor.id,
          appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          appointmentTime: '10:00'
        };

        const response = await request(app)
          .post('/api/appointments')
          .send(appointmentData)
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/appointments', () => {
      it('should get patient appointments', async () => {
        const response = await request(app)
          .get('/api/appointments')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.appointments)).toBe(true);
      });

      it('should get doctor appointments', async () => {
        const response = await request(app)
          .get('/api/appointments')
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.appointments)).toBe(true);
      });
    });

    describe('PUT /api/appointments/:id', () => {
      it('should update appointment status', async () => {
        if (!testAppointment) return;

        const response = await request(app)
          .put(`/api/appointments/${testAppointment.id}`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ status: 'confirmed' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.appointment.status).toBe('confirmed');
      });
    });
  });

  describe('Patient Endpoints', () => {
    describe('GET /api/patients/dashboard', () => {
      it('should get patient dashboard data', async () => {
        const response = await request(app)
          .get('/api/patients/dashboard')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.dashboard).toHaveProperty('upcomingAppointments');
        expect(response.body.dashboard).toHaveProperty('recentAppointments');
        expect(response.body.dashboard).toHaveProperty('totalAppointments');
      });
    });

    describe('GET /api/patients/doctors', () => {
      it('should search for doctors', async () => {
        const response = await request(app)
          .get('/api/patients/doctors')
          .set('Authorization', `Bearer ${patientToken}`)
          .query({ specialty: 'Cardiology' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.doctors)).toBe(true);
      });
    });
  });

  describe('Doctor Endpoints', () => {
    describe('GET /api/doctors/dashboard', () => {
      it('should get doctor dashboard data', async () => {
        const response = await request(app)
          .get('/api/doctors/dashboard')
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.dashboard).toHaveProperty('todayAppointments');
        expect(response.body.dashboard).toHaveProperty('upcomingAppointments');
        expect(response.body.dashboard).toHaveProperty('totalPatients');
      });
    });

    describe('GET /api/doctors/patients', () => {
      it('should get doctor patients', async () => {
        const response = await request(app)
          .get('/api/doctors/patients')
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.patients)).toBe(true);
      });
    });
  });

  describe('Admin Endpoints', () => {
    describe('GET /api/admin/dashboard', () => {
      it('should get admin dashboard data', async () => {
        const response = await request(app)
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.dashboard).toHaveProperty('totalUsers');
        expect(response.body.dashboard).toHaveProperty('totalAppointments');
        expect(response.body.dashboard).toHaveProperty('totalDoctors');
        expect(response.body.dashboard).toHaveProperty('totalPatients');
      });

      it('should reject non-admin users', async () => {
        const response = await request(app)
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access denied');
      });
    });

    describe('GET /api/admin/users', () => {
      it('should get all users for admin', async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.users)).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to auth endpoints', async () => {
      // Make multiple rapid requests to test rate limiting
      const promises = Array(10).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(promises);
      
      // At least one should be rate limited
      const rateLimited = responses.some(response => response.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });
});