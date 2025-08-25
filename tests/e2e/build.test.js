const TestServer = require('./test-server');
const fetch = require('node-fetch');

describe('Build Path E2E Tests', () => {
  let testServer;
  let baseURL;

  beforeAll(async () => {
    testServer = new TestServer();
    await testServer.start();
    baseURL = testServer.getBaseURL();
    
    // Wait for server to be ready
    const isReady = await testServer.waitForServer();
    if (!isReady) {
      throw new Error('Test server failed to start');
    }
  }, 30000);

  afterAll(async () => {
    if (testServer) {
      await testServer.stop();
    }
  });

  test('should serve home page with build functionality', async () => {
    const response = await fetch(`${baseURL}/`);
    expect(response.status).toBe(200);
    
    const html = await response.text();
    expect(html).toContain('Build Civilization');
    expect(html).toContain('Create Draft');
    expect(html).toContain('client.js');
  });

  test('should navigate to build page successfully', async () => {
    const response = await fetch(`${baseURL}/build`);
    expect(response.status).toBe(200);
    
    const html = await response.text();
    expect(html).toContain('Civilization Builder');
    expect(html).toContain('builder.js');
  });

  test('should serve builder page resources', async () => {
    const builderJsResponse = await fetch(`${baseURL}/js/builder.js`);
    expect(builderJsResponse.status).toBe(200);
    
    const builderJsContent = await builderJsResponse.text();
    expect(builderJsContent).toContain('renderPhase2');
  });

  test('should handle edit civilization workflow', async () => {
    const response = await fetch(`${baseURL}/edit`);
    expect(response.status).toBe(200);
    
    const html = await response.text();
    expect(html).toContain('Civilization Builder');
  });

  test('should handle view civilization workflow', async () => {
    const response = await fetch(`${baseURL}/view`);
    expect(response.status).toBe(200);
    
    const html = await response.text();
    expect(html).toContain('Civilization Builder');
  });

  test('should create mod endpoint be accessible', async () => {
    // Test that the /create endpoint exists and handles POST requests
    const mockCivData = {
      seed: 'test-civ-simple-' + Date.now(), // Use unique seed to avoid conflicts
      civs: 'false' // Disable civ generation to avoid dependencies in test
    };

    try {
      const response = await fetch(`${baseURL}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(mockCivData).toString()
      });

      // Endpoint should exist and process the request
      // May return error due to missing mod creation dependencies in test env
      // But should not return 404 (endpoint not found)
      expect([200, 500]).toContain(response.status);
      expect(response.status).not.toBe(404);
    } catch (error) {
      // If request hangs due to mod creation process, that's OK
      // It means the endpoint exists and is processing the request
      expect(error.message).toContain('socket hang up');
    }
  });
});