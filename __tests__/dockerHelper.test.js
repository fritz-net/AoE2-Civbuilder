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

  test('should check if Docker is available', () => {
    const isAvailable = dockerHelper.checkDockerAvailable();
    expect(typeof isAvailable).toBe('boolean');
    console.log('Docker available:', isAvailable);
  });

  test('should create DockerHelper instance with correct path', () => {
    expect(dockerHelper.projectRoot).toBe(projectRoot);
  });

  test('should check container status without errors', () => {
    if (!dockerHelper.dockerAvailable) {
      console.log('Docker not available, skipping container status check');
      return;
    }
    
    const isRunning = dockerHelper.isContainerRunning();
    expect(typeof isRunning).toBe('boolean');
  });

  // Only run container tests if Docker is available
  if (process.env.RUN_DOCKER_TESTS === '1') {
    test('should check if image exists', () => {
      if (!dockerHelper.dockerAvailable) {
        console.log('Docker not available, skipping image check');
        return;
      }

      const exists = dockerHelper.imageExists();
      expect(typeof exists).toBe('boolean');
      console.log('Docker image exists:', exists);
    });

    test('should start and stop container', async () => {
      if (!dockerHelper.dockerAvailable) {
        console.log('Docker not available, skipping container lifecycle test');
        return;
      }

      // This test is slow because it may need to build the image
      jest.setTimeout(300000); // 5 minutes for potential image build

      try {
        // Start container
        await dockerHelper.startContainer();
        expect(dockerHelper.isContainerRunning()).toBe(true);

        // Stop container
        dockerHelper.stopContainer();
        expect(dockerHelper.isContainerRunning()).toBe(false);
      } catch (error) {
        console.log('Container lifecycle test failed:', error.message);
        throw error;
      }
    }, 300000);

    test('should execute command in container', async () => {
      if (!dockerHelper.dockerAvailable) {
        console.log('Docker not available, skipping exec test');
        return;
      }

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
      } catch (error) {
        console.log('Container exec test failed:', error.message);
        throw error;
      } finally {
        dockerHelper.stopContainer();
      }
    }, 300000);
  } else {
    test.skip('should start and stop container (skipped - set RUN_DOCKER_TESTS=1 to enable)', () => {});
    test.skip('should execute command in container (skipped - set RUN_DOCKER_TESTS=1 to enable)', () => {});
  }

  test('should handle missing Docker gracefully', () => {
    const helper = new DockerHelper(projectRoot);
    
    if (!helper.dockerAvailable) {
      // If Docker is not available, these should not throw
      expect(() => helper.isContainerRunning()).not.toThrow();
      expect(() => helper.imageExists()).not.toThrow();
      expect(() => helper.stopContainer()).not.toThrow();
    }
  });
});
