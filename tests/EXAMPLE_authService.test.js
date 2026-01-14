/**
 * Auth Service Unit Tests
 * Tests authentication business logic in isolation
 * ============================================
 */

const authService = require('../../../src/services/authService');
const { ValidationError, UnauthorizedError } = require('../../../src/utils/errors');

// Mock dependencies
jest.mock('../../../src/models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const User = require('../../../src/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('should successfully register a new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'John Doe',
        role: 'patient'
      };

      User.findByEmail.mockResolvedValue(null); // User doesn't exist
      bcrypt.hash.mockResolvedValue('hashed_password');
      User.create.mockResolvedValue({
        id: '123',
        ...userData,
        password: 'hashed_password'
      });

      const result = await authService.register(userData);

      expect(result).toHaveProperty('id');
      expect(result.email).toBe(userData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, expect.any(Number));
      expect(User.create).toHaveBeenCalled();
    });

    it('should throw ValidationError if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123'
      };

      User.findByEmail.mockResolvedValue({ id: '456', email: userData.email });

      await expect(authService.register(userData))
        .rejects
        .toThrow(ValidationError);

      expect(User.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if email is invalid', async () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123'
      };

      await expect(authService.register(invalidData))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw ValidationError if password is weak', async () => {
      const weakData = {
        email: 'user@example.com',
        password: '123' // Too short and weak
      };

      await expect(authService.register(weakData))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('login()', () => {
    it('should return tokens for valid credentials', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'SecurePass123!'
      };

      const mockUser = {
        id: '123',
        email: credentials.email,
        password: 'hashed_password'
      };

      User.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');

      const result = await authService.login(credentials);

      expect(result).toHaveProperty('accessToken', 'access_token');
      expect(result).toHaveProperty('refreshToken', 'refresh_token');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        credentials.password,
        mockUser.password
      );
    });

    it('should throw UnauthorizedError if user not found', async () => {
      User.findByEmail.mockResolvedValue(null);

      await expect(authService.login({
        email: 'nonexistent@example.com',
        password: 'password'
      }))
        .rejects
        .toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if password is incorrect', async () => {
      const mockUser = {
        id: '123',
        email: 'user@example.com',
        password: 'hashed_password'
      };

      User.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.login({
        email: 'user@example.com',
        password: 'wrong_password'
      }))
        .rejects
        .toThrow(UnauthorizedError);
    });
  });

  describe('validateToken()', () => {
    it('should return decoded token for valid JWT', async () => {
      const token = 'valid.jwt.token';
      const decoded = { userId: '123', email: 'user@example.com' };

      jwt.verify.mockReturnValue(decoded);

      const result = authService.validateToken(token);

      expect(result).toEqual(decoded);
      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
    });

    it('should throw UnauthorizedError for invalid token', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => authService.validateToken('invalid.token'))
        .toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for expired token', () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => authService.validateToken('expired.token'))
        .toThrow(UnauthorizedError);
    });
  });

  describe('refreshToken()', () => {
    it('should return new access token for valid refresh token', async () => {
      const refreshToken = 'valid.refresh.token';
      const decoded = { userId: '123' };
      const newAccessToken = 'new.access.token';

      jwt.verify.mockReturnValue(decoded);
      User.findById.mockResolvedValue({ id: '123', email: 'user@example.com' });
      jwt.sign.mockReturnValue(newAccessToken);

      const result = await authService.refreshToken(refreshToken);

      expect(result.accessToken).toBe(newAccessToken);
      expect(jwt.verify).toHaveBeenCalledWith(
        refreshToken,
        process.env.JWT_REFRESH_SECRET
      );
    });

    it('should throw UnauthorizedError for invalid refresh token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken('invalid.token'))
        .rejects
        .toThrow(UnauthorizedError);
    });
  });

  describe('changePassword()', () => {
    it('should update password successfully', async () => {
      const userId = '123';
      const oldPassword = 'OldPass123!';
      const newPassword = 'NewPass456!';

      const mockUser = {
        id: userId,
        password: 'hashed_old_password',
        updatePassword: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('hashed_new_password');

      await authService.changePassword(userId, oldPassword, newPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        oldPassword,
        mockUser.password
      );
      expect(mockUser.updatePassword).toHaveBeenCalledWith('hashed_new_password');
    });

    it('should throw UnauthorizedError if current password is incorrect', async () => {
      const mockUser = {
        id: '123',
        password: 'hashed_password'
      };

      User.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.changePassword('123', 'wrong_password', 'new_password'))
        .rejects
        .toThrow(UnauthorizedError);
    });
  });
});
