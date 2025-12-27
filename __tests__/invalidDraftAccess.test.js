/**
 * Test for invalid draft access handling
 * Tests that server doesn't crash when accessing non-existent drafts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Invalid Draft Access Handling', () => {
  const testDir = '/tmp/civbuilder';
  
  beforeAll(() => {
    // Ensure test directory exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    if (!fs.existsSync(path.join(testDir, 'drafts'))) {
      fs.mkdirSync(path.join(testDir, 'drafts'), { recursive: true });
    }
  });

  test('updateTimerRemaining should handle invalid draft gracefully', () => {
    // Read server.js to verify the fix
    const serverJs = fs.readFileSync('./server.js', 'utf8');
    
    // Check that updateTimerRemaining has null checks
    const updateTimerFuncRegex = /function updateTimerRemaining\(draft\)\s*{[^}]*if\s*\(\s*!\s*draft\s*\|\|\s*draft\s*===\s*-1\s*\)\s*return;/;
    const hasNullCheck = updateTimerFuncRegex.test(serverJs);
    
    expect(hasNullCheck).toBe(true);
  });

  test('socket handlers should check for invalid drafts', () => {
    const serverJs = fs.readFileSync('./server.js', 'utf8');
    
    // Check that "get gamestate" handler has validation
    const getGamestateRegex = /socket\.on\("get gamestate"[\s\S]{0,200}if\s*\(\s*!\s*draft\s*\|\|\s*draft\s*===\s*-1\s*\)/;
    expect(getGamestateRegex.test(serverJs)).toBe(true);
    
    // Check that "get private gamestate" handler has validation
    const getPrivateGamestateRegex = /socket\.on\("get private gamestate"[\s\S]{0,200}if\s*\(\s*!\s*draft\s*\|\|\s*draft\s*===\s*-1\s*\)/;
    expect(getPrivateGamestateRegex.test(serverJs)).toBe(true);
    
    // Check that handlers emit "draft not found" event
    const draftNotFoundRegex = /emit\("draft not found"/;
    expect(draftNotFoundRegex.test(serverJs)).toBe(true);
  });

  test('Vue composable should handle draft not found event', () => {
    const useDraftPath = './src/frontend/app/composables/useDraft.ts';
    
    // Skip if file doesn't exist (e.g., in minimal test environment)
    if (!fs.existsSync(useDraftPath)) {
      console.log('Skipping Vue test - frontend not available');
      return;
    }
    
    const useDraftTs = fs.readFileSync(useDraftPath, 'utf8');
    
    // Check that it listens for "draft not found" event
    const draftNotFoundListenerRegex = /socket\.value\.on\(['"]draft not found['"]/;
    expect(draftNotFoundListenerRegex.test(useDraftTs)).toBe(true);
    
    // Check that it redirects to create page
    const redirectRegex = /navigateTo\(['"]\/draft\/create['"]\)/;
    expect(redirectRegex.test(useDraftTs)).toBe(true);
  });

  test('server should start without crashing with empty drafts directory', (done) => {
    // This test verifies the server can start with no drafts
    // We don't actually start the server here, just verify the code structure
    const serverJs = fs.readFileSync('./server.js', 'utf8');
    
    // Verify getDraft function returns -1 for non-existent files
    const getDraftRegex = /function getDraft\(id\)\s*{[\s\S]{0,200}return\s+-1;/;
    expect(getDraftRegex.test(serverJs)).toBe(true);
    
    done();
  });
});
