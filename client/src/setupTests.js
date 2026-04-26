/**
 * Jest Setup File for Frontend
 * Global test setup and mocking
 */

import '@testing-library/jest-dom';

// Mock IntersectionObserver for lazy loading components
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  callback,
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock fetch API
global.fetch = jest.fn();

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn().mockReturnValue({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    close: jest.fn(),
  }),
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

// Mock environment variables
process.env.VITE_API_URL = 'http://localhost:5000/api';
process.env.VITE_SOCKET_URL = 'http://localhost:5000';

// Global test helpers
global.createMockUser = (overrides = {}) => ({
  _id: 'user123',
  username: 'testuser',
  email: 'test@example.com',
  profilePic: 'https://example.com/pic.jpg',
  bio: 'Test user bio',
  followers: [],
  following: [],
  accessToken: 'test-token',
  refreshToken: 'refresh-token',
  ...overrides,
});

global.createMockPost = (overrides = {}) => ({
  _id: 'post123',
  caption: 'Test post',
  userId: {
    _id: 'user123',
    username: 'testuser',
    profilePic: 'https://example.com/pic.jpg',
  },
  media: [],
  likes: [],
  comments: [],
  tags: [],
  location: 'Test location',
  likeCount: 0,
  commentCount: 0,
  isLiked: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

global.createMockComment = (overrides = {}) => ({
  _id: 'comment123',
  text: 'Test comment',
  userId: {
    _id: 'user123',
    username: 'testuser',
    profilePic: 'https://example.com/pic.jpg',
  },
  postId: 'post123',
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Restore console after tests
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
});

// Error handling for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Error handling for uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
