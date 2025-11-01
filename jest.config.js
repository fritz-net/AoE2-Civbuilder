module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/e2e/**/*.test.js'],
  testTimeout: 30000,
  collectCoverage: false,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  // Run all tests even if some fail
  bail: false,
  maxWorkers: 1  // Run tests serially to avoid port conflicts
};