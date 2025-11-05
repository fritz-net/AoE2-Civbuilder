const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Thumbnail Copy in Mod Creation', () => {
  const projectRoot = path.join(__dirname, '..');
  const tempdir = path.join(os.tmpdir(), 'civbuilder-test');
  const testModId = 'test-' + Date.now();
  
  beforeAll(() => {
    // Ensure temp directory exists
    if (!fs.existsSync(tempdir)) {
      fs.mkdirSync(tempdir, { recursive: true });
    }
    
    // Create modding directory structure in temp
    const moddingDir = path.join(tempdir, 'modding/requested_mods');
    if (!fs.existsSync(moddingDir)) {
      fs.mkdirSync(moddingDir, { recursive: true });
    }
  });
  
  afterAll(() => {
    // Clean up test mod folder
    const testModPath = path.join(tempdir, 'modding/requested_mods', testModId);
    if (fs.existsSync(testModPath)) {
      fs.rmSync(testModPath, { recursive: true, force: true });
    }
  });
  
  test('should copy thumbnail.jpg when using __dirname (correct behavior)', () => {
    const moddingDir = path.join(tempdir, 'modding/requested_mods');
    
    // Run createModFolder.sh with correct __dirname parameter
    const cmd = `bash ${projectRoot}/process_mod/createModFolder.sh ${moddingDir} ${testModId} ${projectRoot} 1`;
    
    try {
      execSync(cmd, { cwd: projectRoot });
      
      // Verify thumbnail.jpg exists in both -data and -ui folders
      const dataThumbPath = path.join(moddingDir, testModId, `${testModId}-data`, 'thumbnail.jpg');
      const uiThumbPath = path.join(moddingDir, testModId, `${testModId}-ui`, 'thumbnail.jpg');
      
      expect(fs.existsSync(dataThumbPath)).toBe(true);
      expect(fs.existsSync(uiThumbPath)).toBe(true);
      
      // Verify file is not empty
      const dataStats = fs.statSync(dataThumbPath);
      const uiStats = fs.statSync(uiThumbPath);
      
      expect(dataStats.size).toBeGreaterThan(0);
      expect(uiStats.size).toBeGreaterThan(0);
    } catch (error) {
      fail(`createModFolder.sh failed: ${error.message}`);
    }
  });
  
  test('should fail to copy thumbnail.jpg when using tempdir (incorrect behavior)', () => {
    const testModId2 = 'test-fail-' + Date.now();
    const moddingDir = path.join(tempdir, 'modding/requested_mods');
    
    // Run createModFolder.sh with incorrect tempdir parameter (simulating the bug)
    const cmd = `bash ${projectRoot}/process_mod/createModFolder.sh ${moddingDir} ${testModId2} ${tempdir} 1`;
    
    try {
      execSync(cmd, { cwd: projectRoot, stdio: 'pipe' });
      
      // If we get here, check if thumbnail exists (it shouldn't with tempdir)
      const dataThumbPath = path.join(moddingDir, testModId2, `${testModId2}-data`, 'thumbnail.jpg');
      const uiThumbPath = path.join(moddingDir, testModId2, `${testModId2}-ui`, 'thumbnail.jpg');
      
      // These should not exist because tempdir doesn't have public/img/thumbnail.jpg
      expect(fs.existsSync(dataThumbPath)).toBe(false);
      expect(fs.existsSync(uiThumbPath)).toBe(false);
    } catch (error) {
      // Expected to fail because thumbnail.jpg doesn't exist in tempdir
      expect(error.message).toContain('cp:');
    } finally {
      // Clean up
      const testModPath = path.join(moddingDir, testModId2);
      if (fs.existsSync(testModPath)) {
        fs.rmSync(testModPath, { recursive: true, force: true });
      }
    }
  });
});
