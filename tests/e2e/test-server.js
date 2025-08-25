const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class TestServer {
  constructor() {
    this.serverProcess = null;
    this.port = 4001 + Math.floor(Math.random() * 1000); // Random port to avoid conflicts
  }

  async start() {
    const tempdir = require('os').tmpdir() + '/civbuilder-test';
    if (!fs.existsSync(tempdir)) {
      fs.mkdirSync(tempdir, { recursive: true });
      fs.mkdirSync(`${tempdir}/drafts`, { recursive: true });
    }

    // Set environment variables for test server
    process.env.CIVBUILDER_HOSTNAME = `http://localhost:${this.port}`;
    
    return new Promise((resolve, reject) => {
      // Start server in a child process to avoid conflicts
      this.serverProcess = exec(
        `cd ${process.cwd()} && PORT=${this.port} node server.js`,
        { env: { ...process.env, PORT: this.port } }
      );

      let startupTimer;

      this.serverProcess.stdout.on('data', (data) => {
        console.log('Server output:', data.toString());
        if (data.toString().includes('Server is running') || data.toString().includes('listening')) {
          if (startupTimer) clearTimeout(startupTimer);
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      this.serverProcess.on('error', reject);

      // Give the server time to start up, then resolve anyway
      startupTimer = setTimeout(() => {
        resolve();
      }, 5000);
    });
  }

  async stop() {
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!this.serverProcess.killed) {
        this.serverProcess.kill('SIGKILL');
      }
      this.serverProcess = null;
    }
  }

  getBaseURL() {
    return `http://localhost:${this.port}`;
  }

  async waitForServer(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${this.getBaseURL()}/`);
        if (response.status === 200) {
          return true;
        }
      } catch (error) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return false;
  }
}

module.exports = TestServer;