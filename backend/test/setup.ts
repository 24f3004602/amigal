import { jest } from '@jest/globals';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-min-32-characters-long!!!';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/test';
process.env.REDIS_URL = 'redis://localhost:6380';
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Global test timeout
jest.setTimeout(30000);

// Mock console in tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}
