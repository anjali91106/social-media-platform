# Testing Documentation

## Overview

This document provides comprehensive information about the testing strategy, setup, and execution for the social media platform. The project uses a multi-layered testing approach with unit tests, integration tests, and end-to-end tests.

## Testing Stack

### Backend Testing
- **Jest**: Testing framework with assertion library and mocking
- **Supertest**: HTTP assertion library for API testing
- **MongoDB Memory Server**: In-memory MongoDB for testing
- **Socket.io-client**: Testing real-time WebSocket functionality

### Frontend Testing
- **Jest**: Testing framework
- **React Testing Library**: Component testing with user-centric approach
- **JSDOM**: DOM environment for browser simulation
- **MSW (Mock Service Worker)**: API mocking for frontend tests

### Coverage Requirements
- **Minimum Coverage**: 80% for all files
- **Critical Files**: 90%+ coverage (authentication, posts, users)
- **Integration Tests**: Full API endpoint coverage
- **Component Tests**: All React components with user interactions

---

## Backend Testing

### Test Structure

```
server/tests/
├── auth.test.js          # Authentication endpoint tests
├── posts.test.js         # Post functionality tests
├── users.test.js         # User management tests
├── socket.test.js        # Socket.io integration tests
├── setup.js              # Test configuration and mocks
└── jest.config.js        # Jest configuration
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

### Test Configuration

**jest.config.js**
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'middlewares/**/*.js',
    'utils/**/*.js',
    'config/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

### Test Setup and Mocks

**tests/setup.js**
```javascript
// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock Cloudinary
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
```

### Authentication Tests

**Key Test Cases:**
- User registration with valid/invalid data
- Login with correct/incorrect credentials
- Token refresh functionality
- Protected route access
- Token expiration handling

**Example Test:**
```javascript
describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#'
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.username).toBe('testuser');
    expect(response.body.data.accessToken).toBeDefined();
  });

  it('should return validation error for missing fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'test' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('required');
  });
});
```

### Posts Tests

**Key Test Cases:**
- Post creation with/without media
- Post retrieval with pagination
- Post search functionality
- Like/unlike operations
- Post deletion (authorization)
- Feed filtering (following users)

**Example Test:**
```javascript
describe('POST /api/posts', () => {
  it('should create a new post successfully', async () => {
    const postData = {
      caption: 'This is a test post',
      tags: ['test', 'post'],
      location: 'Test Location'
    };

    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(postData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.caption).toBe(postData.caption);
  });
});
```

### Socket.io Tests

**Key Test Cases:**
- Socket authentication
- Real-time notifications
- Typing indicators
- Online user tracking
- Post room management

**Example Test:**
```javascript
describe('Socket Authentication', () => {
  it('should authenticate user successfully', (done) => {
    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
  });

  it('should reject connection with invalid token', (done) => {
    const invalidSocket = Client(`http://localhost:${port}`, {
      auth: { token: 'invalid-token' }
    });

    invalidSocket.on('connect_error', (error) => {
      expect(error.message).toContain('Invalid authentication token');
      invalidSocket.close();
      done();
    });
  });
});
```

---

## Frontend Testing

### Test Structure

```
client/src/
├── components/
│   └── __tests__/
│       ├── OptimizedImage.test.jsx
│       └── Comments.test.jsx
├── pages/
│   └── __tests__/
│       ├── HomeFeed.test.jsx
│       ├── Login.test.jsx
│       └── Profile.test.jsx
├── setupTests.js         # Test configuration
└── jest.config.js        # Jest configuration
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

### Test Configuration

**jest.config.js**
```javascript
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1'
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx}'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/setupTests.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Test Setup and Mocks

**src/setupTests.js**
```javascript
import '@testing-library/jest-dom';

// Mock IntersectionObserver for lazy loading
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

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn().mockReturnValue({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
}));

// Global test helpers
global.createMockUser = (overrides = {}) => ({
  _id: 'user123',
  username: 'testuser',
  email: 'test@example.com',
  profilePic: 'https://example.com/pic.jpg',
  accessToken: 'test-token',
  ...overrides,
});
```

### Component Tests

**Key Test Cases:**
- Component rendering
- User interactions
- State changes
- Props handling
- Error states
- Loading states

**Example Test:**
```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OptimizedImage from '../OptimizedImage';

describe('OptimizedImage Component', () => {
  const defaultProps = {
    src: 'https://example.com/test-image.jpg',
    alt: 'Test image'
  };

  it('renders placeholder initially', () => {
    render(<OptimizedImage {...defaultProps} />);
    
    const placeholder = screen.getByRole('img', { hidden: true });
    expect(placeholder).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml'));
  });

  it('loads image when in viewport', async () => {
    render(<OptimizedImage {...defaultProps} />);
    
    // Simulate image entering viewport
    const mockEntry = { isIntersecting: true, target: {} };
    
    // Trigger intersection observer callback
    const observerCallback = global.IntersectionObserver.mock.calls[0][0];
    observerCallback([mockEntry]);
    
    await waitFor(() => {
      const actualImage = screen.getByRole('img');
      expect(actualImage).toHaveAttribute('src', defaultProps.src);
    });
  });
});
```

### Page Tests

**Key Test Cases:**
- Page navigation
- API integration
- User authentication flows
- Data fetching and display
- Error handling
- Real-time updates

**Example Test:**
```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import HomeFeed from '../HomeFeed';

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('HomeFeed Component', () => {
  it('renders loading state initially', () => {
    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders posts after loading', async () => {
    // Mock API responses
    jest.mock('../../services/api', () => ({
      postsAPI: {
        getAllPosts: jest.fn().mockResolvedValue({
          data: {
            data: {
              posts: [mockPost],
              pagination: { currentPage: 1, totalPages: 1 }
            }
          }
        })
      }
    }));

    render(
      <TestWrapper>
        <HomeFeed />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test post')).toBeInTheDocument();
    });
  });
});
```

---

## Integration Testing

### API Integration Tests

**Test Scenarios:**
- Full user registration and login flow
- Post creation and retrieval
- Follow/unfollow relationships
- Real-time notifications
- File upload workflows

**Example Integration Test:**
```javascript
describe('User Registration and Login Flow', () => {
  let userData;
  let loginResponse;

  it('should register a new user', async () => {
    userData = {
      username: 'integrationuser',
      email: 'integration@example.com',
      password: 'Test123!@#'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.username).toBe(userData.username);
  });

  it('should login the registered user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    
    loginResponse = response.body;
  });

  it('should access protected route with login token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.data.accessToken}`)
      .expect(200);

    expect(response.body.data.user.username).toBe(userData.username);
  });
});
```

### Socket.io Integration Tests

**Test Scenarios:**
- Real-time post updates
- Live notifications
- Typing indicators
- Online user tracking

**Example Integration Test:**
```javascript
describe('Real-time Post Updates', () => {
  let userSocket, postAuthorSocket;
  let testPost;

  beforeEach(async () => {
    // Create test users and post
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    
    testPost = await createTestPost(user1._id);

    // Connect sockets
    userSocket = createSocket(user1.accessToken);
    postAuthorSocket = createSocket(user2.accessToken);
  });

  it('should broadcast post like updates', (done) => {
    postAuthorSocket.on('post:liked', (data) => {
      expect(data.postId).toBe(testPost._id.toString());
      expect(data.likeCount).toBe(1);
      done();
    });

    userSocket.emit('like:post', { postId: testPost._id.toString() });
  });
});
```

---

## End-to-End Testing

### Cypress Setup

```bash
# Install Cypress
npm install --save-dev cypress

# Open Cypress
npx cypress open

# Run Cypress tests
npx cypress run
```

### E2E Test Examples

**User Registration Flow:**
```javascript
describe('User Registration', () => {
  it('should register a new user successfully', () => {
    cy.visit('/register');
    
    cy.get('[data-testid=username-input]').type('newuser');
    cy.get('[data-testid=email-input]').type('newuser@example.com');
    cy.get('[data-testid=password-input]').type('Password123!');
    cy.get('[data-testid=register-button]').click();
    
    cy.url().should('include('/feed');
    cy.get('[data-testid=welcome-message]').should('contain', 'Welcome');
  });
});
```

**Post Creation Flow:**
```javascript
describe('Post Creation', () => {
  beforeEach(() => {
    cy.login('testuser@example.com', 'Password123!');
  });

  it('should create a post with image', () => {
    cy.visit('/create-post');
    
    cy.get('[data-testid=caption-input]').type('My test post');
    cy.get('[data-testid=image-upload]').attachFile('test-image.jpg');
    cy.get('[data-testid=post-button]').click();
    
    cy.url().should('include('/feed');
    cy.get('[data-testid=post-caption]').should('contain', 'My test post');
  });
});
```

---

## Performance Testing

### Load Testing with Artillery

**artillery.yml**
```yaml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Load posts feed"
    requests:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "Test123!"
      - get:
          url: "/api/posts"
          headers:
            Authorization: "Bearer {{ token }}"
```

**Run Load Test:**
```bash
artillery run artillery.yml
```

### Lighthouse Performance Testing

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run performance audit
lighthouse --chrome-flags="--headless" \
  --output=json --output-path=./lighthouse-report.json \
  http://localhost:3000/feed
```

---

## Test Data Management

### Test Database Setup

**MongoDB Memory Server:**
```javascript
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
});
```

### Test Factories

**User Factory:**
```javascript
const createTestUser = async (overrides = {}) => {
  const userData = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'Test123!@#',
    ...overrides
  };
  
  return await User.create(userData);
};
```

**Post Factory:**
```javascript
const createTestPost = async (userId, overrides = {}) => {
  const postData = {
    caption: 'Test post caption',
    userId,
    media: [],
    tags: ['test'],
    ...overrides
  };
  
  return await Post.create(postData);
};
```

---

## Continuous Integration Testing

### GitHub Actions Integration

**.github/workflows/test.yml**
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:5.0
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: |
          cd server && npm ci
          cd ../client && npm ci
          
      - name: Run backend tests
        run: cd server && npm test
        env:
          MONGODB_TEST_URI: 'mongodb://localhost:27017/test'
          
      - name: Run frontend tests
        run: cd client && npm test
```

### Coverage Reporting

**Codecov Integration:**
```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
    flags: unittests
    name: codecov-umbrella
```

---

## Best Practices

### Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names
- Keep tests focused and independent
- Use setup and teardown methods properly

### Test Data
- Use factory functions for test data
- Clean up test data after each test
- Use realistic but minimal test data
- Avoid hardcoded test data

### Mocking
- Mock external dependencies
- Use consistent mock implementations
- Don't over-mock - test real behavior
- Reset mocks between tests

### Assertions
- Use specific assertions
- Test both positive and negative cases
- Include edge cases and error conditions
- Verify behavior, not implementation

### Performance
- Keep tests fast and focused
- Use parallel test execution
- Optimize database operations in tests
- Use in-memory databases when possible

---

## Troubleshooting

### Common Issues

**Test Timeout:**
- Increase timeout in jest config
- Check for async operations
- Verify mock implementations

**Database Connection:**
- Ensure test database is running
- Check connection strings
- Verify cleanup procedures

**Authentication Issues:**
- Verify token generation
- Check middleware implementation
- Ensure proper token format

**Socket.io Test Issues:**
- Ensure proper socket cleanup
- Check event listener setup
- Verify authentication flow

### Debugging Tests

**Debug Mode:**
```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

**Verbose Output:**
```bash
# Run with verbose output
npm test -- --verbose
```

**Test Coverage:**
```bash
# Generate detailed coverage report
npm run test:coverage
```

---

## Test Metrics and KPIs

### Coverage Metrics
- **Statement Coverage**: 80% minimum
- **Branch Coverage**: 80% minimum
- **Function Coverage**: 80% minimum
- **Line Coverage**: 80% minimum

### Performance Metrics
- **Test Execution Time**: < 5 minutes for full suite
- **Individual Test Time**: < 10 seconds per test
- **Memory Usage**: < 512MB for test suite

### Quality Metrics
- **Test Pass Rate**: 100% for CI/CD
- **Flaky Test Rate**: < 1%
- **Test Documentation**: 100% coverage of test cases

---

## Future Testing Enhancements

### Planned Improvements
- **Visual Regression Testing**: Add Percy or Chromatic
- **Accessibility Testing**: Add axe-core integration
- **Contract Testing**: Add Pact for API contracts
- **Mutation Testing**: Add Stryker for test quality
- **Component Storybook Testing**: Add Storybook test runner

### Test Automation
- **Automated E2E Testing**: Expand Cypress coverage
- **Performance Regression Testing**: Automated Lighthouse CI
- **Security Testing**: Add OWASP ZAP integration
- **Load Testing**: Automated Artillery CI/CD
