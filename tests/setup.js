// Test setup file
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce logging during tests

// Global test timeout
jest.setTimeout(30000);

// Mock external services during testing
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  }))
}));

jest.mock('twilio', () => {
  const mockTwilio = {
    messages: {
      create: jest.fn().mockResolvedValue({ sid: 'test-message-sid' })
    }
  };
  return jest.fn(() => mockTwilio);
});

// Global test teardown
afterAll(async () => {
  // Clean up any global resources
  await new Promise(resolve => setTimeout(resolve, 500));
});
