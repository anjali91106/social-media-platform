/**
 * Jest Setup File
 * Global test setup and configuration
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test timeout
jest.setTimeout(10000);

// Mock Cloudinary for tests
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
      upload: jest.fn().mockResolvedValue({
        secure_url: 'https://example.com/test.jpg',
        public_id: 'test_public_id'
      })
    }
  }
}));

// Mock multer for tests
jest.mock('multer', () => ({
  single: jest.fn(),
  array: jest.fn(),
  fields: jest.fn()
}));

// Mock socket.io for tests
jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    use: jest.fn(),
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn()
    })),
    close: jest.fn()
  }))
}));

// Global test helpers
global.createTestUser = async (userData = {}) => {
  const User = require('../models/User');
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123!@#',
    ...userData
  };
  
  return await User.create(defaultUser);
};

global.createTestPost = async (userId, postData = {}) => {
  const Post = require('../models/Post');
  const defaultPost = {
    caption: 'Test post',
    userId,
    ...postData
  };
  
  return await Post.create(defaultPost);
};

global.generateTestToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// Cleanup function for tests
global.cleanupTestData = async () => {
  const User = require('../models/User');
  const Post = require('../models/Post');
  
  await User.deleteMany({});
  await Post.deleteMany({});
};

// Error handling for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Error handling for uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
