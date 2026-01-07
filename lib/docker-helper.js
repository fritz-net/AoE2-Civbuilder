/**
 * Docker Helper Module
 * 
 * Manages Docker container lifecycle for C++ backend execution.
 * Supports both development (hot-reload) and production scenarios.
 */

const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const CONTAINER_NAME = 'aoe2-civbuilder-dev';
const DOCKER_IMAGE = 'aoe2-civbuilder:build-cpp';
const DOCKERFILE = 'Dockerfile.build-cpp';

class DockerHelper {
  constructor(projectRoot) {
    this.projectRoot = projectRoot || process.cwd();
    this.containerRunning = false;
    this.dockerAvailable = this.checkDockerAvailable();
  }

  /**
   * Check if Docker is available on the system
   */
  checkDockerAvailable() {
    try {
      execSync('docker --version', { stdio: 'ignore' });
      return true;
    } catch (error) {
      console.log('Docker not available on this system');
      return false;
    }
  }

  /**
   * Check if a container with our name is already running
   */
  isContainerRunning() {
    if (!this.dockerAvailable) return false;
    
    try {
      const output = execSync(
        `docker ps --filter "name=${CONTAINER_NAME}" --format "{{.Names}}"`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      this.containerRunning = output.trim() === CONTAINER_NAME;
      return this.containerRunning;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if our Docker image exists locally
   */
  imageExists() {
    if (!this.dockerAvailable) return false;
    
    try {
      const output = execSync(
        `docker images --filter "reference=${DOCKER_IMAGE}" --format "{{.Repository}}:{{.Tag}}"`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      return output.trim() === DOCKER_IMAGE;
    } catch (error) {
      return false;
    }
  }

  /**
   * Build the Docker image if it doesn't exist
   */
  buildImage() {
    if (!this.dockerAvailable) {
      throw new Error('Docker is not available');
    }

    console.log(`Building Docker image ${DOCKER_IMAGE}...`);
    const dockerfilePath = path.join(this.projectRoot, DOCKERFILE);
    
    if (!fs.existsSync(dockerfilePath)) {
      throw new Error(`Dockerfile not found at ${dockerfilePath}`);
    }

    try {
      execSync(
        `docker build -f ${DOCKERFILE} -t ${DOCKER_IMAGE} .`,
        { 
          cwd: this.projectRoot,
          stdio: 'inherit'
        }
      );
      console.log(`Docker image ${DOCKER_IMAGE} built successfully`);
      return true;
    } catch (error) {
      console.error('Failed to build Docker image:', error.message);
      return false;
    }
  }

  /**
   * Start a new container or use existing one
   * The container stays running and we use docker exec for each C++ invocation
   */
  async startContainer() {
    if (!this.dockerAvailable) {
      throw new Error('Docker is not available');
    }

    // Check if container is already running
    if (this.isContainerRunning()) {
      console.log(`Container ${CONTAINER_NAME} is already running`);
      return true;
    }

    // Check if image exists, build if needed
    if (!this.imageExists()) {
      console.log('Docker image not found, building...');
      if (!this.buildImage()) {
        throw new Error('Failed to build Docker image');
      }
    }

    // Start container in detached mode with sleep to keep it alive
    // Mount the project directory so we can access files
    console.log(`Starting container ${CONTAINER_NAME}...`);
    try {
      execSync(
        `docker run -d --name ${CONTAINER_NAME} ` +
        `-v "${this.projectRoot}:/app" ` +
        `-w /app ` +
        `--entrypoint sleep ` +
        `${DOCKER_IMAGE} infinity`,
        { 
          stdio: 'inherit',
          cwd: this.projectRoot
        }
      );
      this.containerRunning = true;
      console.log(`Container ${CONTAINER_NAME} started successfully`);
      return true;
    } catch (error) {
      console.error('Failed to start container:', error.message);
      return false;
    }
  }

  /**
   * Stop and remove the container
   */
  stopContainer() {
    if (!this.dockerAvailable) return false;
    
    try {
      console.log(`Stopping container ${CONTAINER_NAME}...`);
      execSync(`docker stop ${CONTAINER_NAME}`, { stdio: 'ignore' });
      execSync(`docker rm ${CONTAINER_NAME}`, { stdio: 'ignore' });
      this.containerRunning = false;
      console.log(`Container ${CONTAINER_NAME} stopped and removed`);
      return true;
    } catch (error) {
      console.error('Failed to stop container:', error.message);
      return false;
    }
  }

  /**
   * Execute a command inside the running container
   * @param {string} command - The command to execute
   * @param {function} callback - Callback function(error, stdout, stderr)
   */
  execInContainer(command, callback) {
    if (!this.dockerAvailable) {
      return callback(new Error('Docker is not available'));
    }

    if (!this.isContainerRunning()) {
      return callback(new Error(`Container ${CONTAINER_NAME} is not running`));
    }

    const dockerCmd = `docker exec ${CONTAINER_NAME} sh -c "${command.replace(/"/g, '\\"')}"`;
    
    exec(dockerCmd, { cwd: this.projectRoot, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      callback(error, stdout, stderr);
    });
  }

  /**
   * Build C++ binaries inside the container
   */
  async buildCppInContainer() {
    if (!this.dockerAvailable) {
      throw new Error('Docker is not available');
    }

    if (!this.isContainerRunning()) {
      throw new Error('Container is not running. Call startContainer() first.');
    }

    console.log('Building C++ binaries inside container...');
    
    return new Promise((resolve, reject) => {
      this.execInContainer(
        'cd /app/modding && ./scripts/build.sh',
        (error, stdout, stderr) => {
          if (error) {
            console.error('Failed to build C++ in container:', error.message);
            if (stderr) console.error(stderr);
            reject(error);
          } else {
            console.log('C++ binaries built successfully in container');
            if (stdout) console.log(stdout);
            resolve(true);
          }
        }
      );
    });
  }

  /**
   * Ensure container is ready (start if needed, build C++ if needed)
   */
  async ensureReady() {
    if (!this.dockerAvailable) {
      throw new Error('Docker is not available');
    }

    // Start container if not running
    if (!this.isContainerRunning()) {
      await this.startContainer();
    }

    // Check if C++ binaries exist in container
    const binaryPath = '/app/modding/build/create-data-mod';
    return new Promise((resolve, reject) => {
      this.execInContainer(
        `test -f ${binaryPath} && echo "exists" || echo "missing"`,
        (error, stdout, stderr) => {
          const exists = stdout.trim() === 'exists';
          
          if (!exists) {
            console.log('C++ binaries not found in container, building...');
            this.buildCppInContainer()
              .then(() => resolve(true))
              .catch(reject);
          } else {
            resolve(true);
          }
        }
      );
    });
  }
}

module.exports = DockerHelper;
