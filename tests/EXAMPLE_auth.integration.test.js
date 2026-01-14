/**
 * Authentication Integration Tests
 * Tests the full authentication flow with real database and services
 * ===============================================================
 */

const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const { generateToken } = require('../../../src/utils/jwt');
const { cleanupDatabase } = require('../../helpers');

describe('Authentication Flow - Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database connection
    await cleanupDatabase();
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Close database connections
    await cleanupDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'John Doe',
        role: 'patient'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.user.role).toBe('patient');

      // Verify user was created in database
      const user = await User.findByEmail(newUser.email);
      expect(user).toBeDefined();
      expect(user.email).toBe(newUser.email);
    });

    it('should return 400 if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        name: 'John Doe',
        role: 'patient'
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });

    it('should return 400 if email is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'SecurePass123!',
          name: 'John Doe'
        })
        .expect(400);

      expect(response.body.error).toContain('email');
    });

    it('should return 400 if password is weak', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          password: '123', // Too weak
          name: 'John Doe'
        })
        .expect(400);

      expect(response.body.error).toContain('password');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
          role: 'patient'
        });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'SecurePass123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('testuser@example.com');
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body.error).toContain('Unauthorized');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!'
        })
        .expect(401);

      expect(response.body.error).toContain('Unauthorized');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
          role: 'patient'
        });

      refreshToken = response.body.refreshToken;
    });

    it('should return new access token for valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.accessToken).toBeTruthy();
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Protected Route Access', () => {
    let accessToken;
    let userId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'protectedtest@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
          role: 'patient'
        });

      accessToken = response.body.accessToken;
      userId = response.body.user.id;
    });

    it('should allow access to protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/patients/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
    });

    it('should return 401 if no token provided', async () => {
      const response = await request(app)
        .get('/api/patients/profile')
        .expect(401);

      expect(response.body.error).toContain('token');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/patients/profile')
        .set('Authorization', 'Bearer invalid.token')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = generateToken(userId, '1ms'); // Token expires immediately
      
      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .get('/api/patients/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error).toContain('Unauthorized');
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'logouttest@example.com',
          password: 'SecurePass123!',
          name: 'Test User'
        });

      accessToken = response.body.accessToken;
    });

    it('should successfully logout user', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toContain('success');
    });

    it('should invalidate token after logout', async () => {
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      // Try to use token after logout
      const response = await request(app)
        .get('/api/patients/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/change-password', () => {
    let accessToken;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'passwordtest@example.com',
          password: 'OldPass123!',
          name: 'Test User'
        });

      accessToken = response.body.accessToken;
    });

    it('should change password successfully', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: 'OldPass123!',
          newPassword: 'NewPass456!'
        })
        .expect(200);

      expect(response.body.message).toContain('success');
    });

    it('should login with new password after change', async () => {
      // Change password
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: 'OldPass123!',
          newPassword: 'NewPass456!'
        });

      // Login with new password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'passwordtest@example.com',
          password: 'NewPass456!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return 401 for incorrect old password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: 'WrongPassword123!',
          newPassword: 'NewPass456!'
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for weak new password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: 'OldPass123!',
          newPassword: '123' // Too weak
        })
        .expect(400);

      expect(response.body.error).toContain('password');
    });
  });
});
