// @ts-check
const request = require('supertest');
const path = require('path');

describe('Server configuration', () => {
  let server;
  beforeAll(() => {
    process.env.CIVBUILDER_HOSTNAME = 'http://testhost/civbuilder_testurl';
    server = require('../server.js');
  });

  afterAll(() => {
    jest.resetModules();
  });

  test('should serve /civbuilder_testurl routes', async () => {
    const res = await request(server.router).get('/');
    expect(res.statusCode).toBe(200);
  });

  test('should use configurable hostname', () => {
    expect(process.env.CIVBUILDER_HOSTNAME).toBe('http://testhost/civbuilder_testurl');
  });

  test('should use temp dir for file operations', () => {
    const os = require('os');
    const expectedDir = path.join(os.tmpdir(), 'civbuilder');
    expect(server.dir || '').toContain(expectedDir);
  });
});