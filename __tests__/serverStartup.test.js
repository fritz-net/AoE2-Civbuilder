const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

describe('Server Startup', () => {
  let serverProcess;
  const port = 4000;
  const startupTimeout = 10000; // 10 seconds for server to start
  const additionalTestTimeout = 2000; // Additional time for test assertions
  const httpTestTimeout = 5000; // Additional time for HTTP request test
  
  afterEach((done) => {
    // Clean up: kill server process if it's still running
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
      // Give it a moment to shut down
      setTimeout(() => {
        if (!serverProcess.killed) {
          serverProcess.kill('SIGKILL');
        }
        done();
      }, 1000);
    } else {
      done();
    }
  });

  test('should start server without module errors', (done) => {
    const projectRoot = path.join(__dirname, '..');
    const serverPath = path.join(projectRoot, 'server.js');
    
    let output = '';
    let errorOutput = '';
    let serverStarted = false;
    
    // Start the server process
    serverProcess = spawn('node', [serverPath], {
      cwd: projectRoot,
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    // Capture stdout
    serverProcess.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      
      // Check if server has started successfully
      if (message.includes('Server listening on port')) {
        serverStarted = true;
        
        // Give it a tiny bit more time to fully initialize
        setTimeout(() => {
          // Server started successfully - test passes
          expect(serverStarted).toBe(true);
          expect(errorOutput).not.toContain('Cannot find module');
          expect(errorOutput).not.toContain('MODULE_NOT_FOUND');
          expect(output).toContain('Starting server...');
          expect(output).toContain('Server listening on port 4000');
          done();
        }, 500);
      }
    });
    
    // Capture stderr
    serverProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    // Handle process exit
    serverProcess.on('exit', (code, signal) => {
      if (!serverStarted) {
        // Server exited before starting - this is a failure
        console.error('Server output:', output);
        console.error('Server errors:', errorOutput);
        
        // Check for the specific error we're testing for
        if (errorOutput.includes('Cannot find module') || errorOutput.includes('MODULE_NOT_FOUND')) {
          done(new Error('Server failed to start due to missing module: ' + errorOutput));
        } else if (code !== 0 && code !== null) {
          done(new Error(`Server exited with code ${code}. Output: ${output}. Errors: ${errorOutput}`));
        }
      }
    });
    
    // Timeout if server doesn't start in time
    setTimeout(() => {
      if (!serverStarted) {
        console.error('Server output:', output);
        console.error('Server errors:', errorOutput);
        done(new Error('Server did not start within timeout period'));
      }
    }, startupTimeout);
  }, startupTimeout + additionalTestTimeout);

  test('should respond to HTTP requests', (done) => {
    const projectRoot = path.join(__dirname, '..');
    const serverPath = path.join(projectRoot, 'server.js');
    
    let serverStarted = false;
    
    // Start the server process
    serverProcess = spawn('node', [serverPath], {
      cwd: projectRoot,
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    // Wait for server to start
    serverProcess.stdout.on('data', (data) => {
      if (data.toString().includes('Server listening on port') && !serverStarted) {
        serverStarted = true;
        
        // Give server a moment to fully initialize
        setTimeout(() => {
          // Make a simple HTTP request to verify server is responding
          const options = {
            hostname: 'localhost',
            port: port,
            path: '/civbuilder',
            method: 'GET',
            timeout: 3000
          };
          
          const req = http.request(options, (res) => {
            // We expect a 200 or 304 response
            expect(res.statusCode).toBeGreaterThanOrEqual(200);
            expect(res.statusCode).toBeLessThan(500);
            done();
          });
          
          req.on('error', (error) => {
            done(new Error(`HTTP request failed: ${error.message}`));
          });
          
          req.on('timeout', () => {
            req.destroy();
            done(new Error('HTTP request timed out'));
          });
          
          req.end();
        }, 1000);
      }
    });
    
    serverProcess.on('exit', (code) => {
      if (!serverStarted && code !== 0) {
        done(new Error(`Server exited with code ${code} before responding to requests`));
      }
    });
    
    // Timeout if server doesn't start
    setTimeout(() => {
      if (!serverStarted) {
        done(new Error('Server did not start within timeout period'));
      }
    }, startupTimeout);
  }, startupTimeout + httpTestTimeout);
});
