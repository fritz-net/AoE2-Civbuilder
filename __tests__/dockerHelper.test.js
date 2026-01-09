/**
 * Test Docker Helper functionality
 * These tests verify the Docker integration works correctly
 */

const DockerHelper = require('../lib/docker-helper');
const path = require('path');

describe('Docker Helper', () => {
  const projectRoot = path.join(__dirname, '..');
  let dockerHelper;

  beforeEach(() => {
    dockerHelper = new DockerHelper(projectRoot);
  });

  afterEach(() => {
    // Clean up any containers we created
    if (dockerHelper && dockerHelper.isContainerRunning()) {
      dockerHelper.stopContainer();
    }
  });

  test('should create DockerHelper instance with correct path', () => {
    expect(dockerHelper.projectRoot).toBe(projectRoot);
    expect(dockerHelper.dockerAvailable).toBe(true);
  });

  test('should check if image exists', () => {
    const exists = dockerHelper.imageExists();
    expect(typeof exists).toBe('boolean');
  });

  test('should start and stop container', async () => {
    // This test is slow because it may need to build the image
    jest.setTimeout(300000); // 5 minutes for potential image build

    // Start container
    await dockerHelper.startContainer();
    expect(dockerHelper.isContainerRunning()).toBe(true);

    // Stop container
    dockerHelper.stopContainer();
    expect(dockerHelper.isContainerRunning()).toBe(false);
  }, 300000);

  test('should execute command in container', async () => {
    jest.setTimeout(300000); // 5 minutes for potential image build

    try {
      // Start container
      await dockerHelper.startContainer();

      // Execute a simple command
      const result = await new Promise((resolve, reject) => {
        dockerHelper.execInContainer('echo "Hello from container"', (error, stdout, stderr) => {
          if (error) reject(error);
          else resolve({ stdout, stderr });
        });
      });

      expect(result.stdout).toContain('Hello from container');
    } finally {
      dockerHelper.stopContainer();
    }
  }, 300000);
});
