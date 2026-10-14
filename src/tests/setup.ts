import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// Mock fetch globally for webhook delivery tests
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

// Reset mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});