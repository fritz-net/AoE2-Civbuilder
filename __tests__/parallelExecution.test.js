const { exec } = require('child_process');
const path = require('path');

/**
 * Test that command execution uses cwd option instead of process.chdir()
 * This ensures parallel execution is safe for concurrent requests.
 */
describe('Parallel Command Execution', () => {
  const projectRoot = path.join(__dirname, '..');
  
  test('exec with cwd option should run commands in specified directory', (done) => {
    // Verify that exec with cwd option works correctly
    exec('pwd', { cwd: projectRoot }, (error, stdout, stderr) => {
      expect(error).toBeNull();
      expect(stdout.trim()).toBe(projectRoot);
      done();
    });
  });

  test('multiple parallel execs with cwd should not interfere with each other', (done) => {
    // Run multiple commands in parallel with different working directories
    // This simulates what happens when multiple mod creation requests come in
    const results = [];
    const expectedCount = 5;
    let completedCount = 0;
    
    // All commands should run in the project root directory
    for (let i = 0; i < expectedCount; i++) {
      exec(`echo "task-${i}" && pwd`, { cwd: projectRoot }, (error, stdout, stderr) => {
        expect(error).toBeNull();
        
        const lines = stdout.trim().split('\n');
        expect(lines[0]).toBe(`task-${i}`);
        expect(lines[1]).toBe(projectRoot);
        
        results.push(i);
        completedCount++;
        
        if (completedCount === expectedCount) {
          // All tasks completed
          expect(results.length).toBe(expectedCount);
          done();
        }
      });
    }
  });

  test('server module should not use process.chdir in os_func.execCommand', () => {
    // Read the server.js file and verify it uses cwd option
    const fs = require('fs');
    const serverCode = fs.readFileSync(path.join(projectRoot, 'server.js'), 'utf8');
    
    // Check that os_func uses cwd option
    expect(serverCode).toContain('exec(cmd, { cwd: __dirname }');
    
    // Check that process.chdir is not used in the main execution flow
    // Look for process.chdir calls that are not commented out
    const lines = serverCode.split('\n');
    let activeChdir = [];
    
    for (const line of lines) {
      // Skip lines that start with comment (after trimming whitespace)
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('//')) continue;
      
      // Check for process.chdir calls
      if (trimmedLine.includes('process.chdir(')) {
        activeChdir.push(line);
      }
    }
    
    expect(activeChdir).toEqual([]);
  });

  test('execSync calls should use cwd option', () => {
    const fs = require('fs');
    const serverCode = fs.readFileSync(path.join(projectRoot, 'server.js'), 'utf8');
    
    // Count execSync calls that DON'T have the cwd option
    // Parse line by line to handle different string formats
    const lines = serverCode.split('\n');
    let callsWithoutCwd = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Skip comment lines
      if (trimmedLine.startsWith('//')) continue;
      
      // Check if line has execSync but not with cwd option
      // This handles template literals, single quotes, double quotes, and concatenation
      if (trimmedLine.includes('execSync(') && !line.includes('{ cwd:') && !line.includes('{cwd:')) {
        callsWithoutCwd.push({ line: i + 1, content: trimmedLine });
      }
    }
    
    expect(callsWithoutCwd).toEqual([]);
  });

  test('route handlers should not include chToAppDir or chToTmpDir', () => {
    const fs = require('fs');
    const serverCode = fs.readFileSync(path.join(projectRoot, 'server.js'), 'utf8');
    
    // Look for route handlers that use chToAppDir or chToTmpDir
    const routeWithChdir = /router\.(get|post|put|delete)\([^)]+,\s*ch(ToAppDir|ToTmpDir)/g;
    const matches = serverCode.match(routeWithChdir);
    
    expect(matches).toBeNull();
  });
});
