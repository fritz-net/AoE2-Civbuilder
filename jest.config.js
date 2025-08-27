module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/e2e/**/*.test.js'],
  testTimeout: 30000,
  collectCoverage: false,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true
};