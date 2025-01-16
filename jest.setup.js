// Mock micro-cors since it's not needed in tests
jest.mock('micro-cors', () => () => (handler) => handler);

// Add any other global mocks or setup here
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}; 