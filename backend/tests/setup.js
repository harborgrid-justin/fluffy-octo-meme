// Backend test setup
import { beforeAll, afterAll, afterEach } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.PORT = '5001';

// Global test setup
beforeAll(() => {
  console.log('Starting backend test suite...');
});

afterAll(() => {
  console.log('Backend test suite completed.');
});

afterEach(() => {
  // Clean up any test artifacts if needed
});
