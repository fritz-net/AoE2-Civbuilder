// Test setup for E2E tests
const { TextEncoder, TextDecoder } = require('util');
const fetch = require('node-fetch');

// Polyfills for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.fetch = fetch;

// Mock socket.io client for tests
global.io = () => ({
  emit: jest.fn(),
  on: jest.fn(),
  disconnect: jest.fn()
});

// Setup DOM environment
require('jsdom-global')();

// Mock external dependencies that are not available in test environment
window.axios = {
  post: jest.fn().mockResolvedValue({ data: 'mock response' })
};

// Mock jQuery
window.$ = jest.fn(() => ({
  on: jest.fn(),
  val: jest.fn()
}));

// Mock hostname and route variables that client.js expects
window.hostname = 'http://localhost:4000';
window.route = '';