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
    // Note: It may still be commented out for documentation purposes
    const activeChdir = serverCode.match(/^[^/\n]*process\.chdir\([^)]+\);/gm);
    expect(activeChdir).toBeNull();
  });

  test('execSync calls should use cwd option', () => {
    const fs = require('fs');
    const serverCode = fs.readFileSync(path.join(projectRoot, 'server.js'), 'utf8');
    
    // Find all execSync calls and verify they have cwd option
    // Match execSync calls that are not comments
    const execSyncPattern = /execSync\(`[^`]+`\)/g;
    const execSyncCalls = serverCode.match(execSyncPattern) || [];
    
    // All active execSync calls should have { cwd: __dirname }
    const execSyncWithCwdPattern = /execSync\(`[^`]+`,\s*\{\s*cwd:\s*__dirname\s*\}\)/g;
    const execSyncWithCwdCalls = serverCode.match(execSyncWithCwdPattern) || [];
    
    // Either all calls have cwd, or there are no calls without cwd
    // Count execSync calls that DON'T have the cwd option
    const lines = serverCode.split('\n');
    let callsWithoutCwd = 0;
    
    for (const line of lines) {
      // Skip comment lines
      if (line.trim().startsWith('//')) continue;
      
      // Check if line has execSync but not with cwd option
      if (line.includes('execSync(') && !line.includes('{ cwd:')) {
        callsWithoutCwd++;
      }
    }
    
    expect(callsWithoutCwd).toBe(0);
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
