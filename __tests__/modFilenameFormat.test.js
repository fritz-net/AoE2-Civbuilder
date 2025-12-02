/**
 * E2E Test for Mod Filename Format
 * 
 * This test validates that mod zip files are created with the new filename format:
 * {iso_datetime}_{hex*4}_v{version}.zip
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Mod Filename Format E2E', () => {
  const projectRoot = path.join(__dirname, '..');
  const modsDir = path.join(projectRoot, 'modding', 'requested_mods');
  const createDataModPath = path.join(projectRoot, 'modding', 'build', 'create-data-mod');
  
  // Generate unique test ID for this test run
  const testId = 'test-filename-' + Date.now();
  let testDir;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civbuilder-filename-test-'));
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }

    // Clean up any zip files created
    const files = fs.readdirSync(modsDir);
    files.forEach(file => {
      if (file.startsWith(testId) || file.match(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z_[0-9a-f]{4}_v\d+\.\d+\.\d+\.zip$/)) {
        const filePath = path.join(modsDir, file);
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.log('Cleanup error:', error.message);
        }
      }
    });

    // Clean up mod directory
    const modDirPath = path.join(modsDir, testId);
    if (fs.existsSync(modDirPath)) {
      fs.rmSync(modDirPath, { recursive: true, force: true });
    }
  });

  test('should create mod folder structure for testing', () => {
    // Create mod folder structure using the script
    execSync(`bash ./process_mod/createModFolder.sh ./modding/requested_mods ${testId} ${projectRoot} 1`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Verify folder was created
    const modDirPath = path.join(modsDir, testId);
    expect(fs.existsSync(modDirPath)).toBe(true);

    // Verify both data and UI folders exist
    expect(fs.existsSync(path.join(modDirPath, `${testId}-data`))).toBe(true);
    expect(fs.existsSync(path.join(modDirPath, `${testId}-ui`))).toBe(true);

    // Verify thumbnails exist
    expect(fs.existsSync(path.join(modDirPath, `${testId}-data`, 'thumbnail.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(modDirPath, `${testId}-ui`, 'thumbnail.jpg'))).toBe(true);
  });

  test('should create zip with new filename format when custom filename provided', () => {
    // Create mod folder structure
    execSync(`bash ./process_mod/createModFolder.sh ./modding/requested_mods ${testId} ${projectRoot} 1`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Generate a custom filename (simulating what server.js does)
    const customFilename = `2025-12-02T10-20-30Z_a1b2_v1.6.2`;
    
    // Run zipModFolder.sh with custom filename
    execSync(`bash ./process_mod/zipModFolder.sh ${testId} 1 ${customFilename}`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Verify zip file was created with custom name
    const zipPath = path.join(modsDir, `${customFilename}.zip`);
    expect(fs.existsSync(zipPath)).toBe(true);

    // Verify original testId.zip was NOT created
    const oldZipPath = path.join(modsDir, `${testId}.zip`);
    expect(fs.existsSync(oldZipPath)).toBe(false);

    // Clean up the custom zip file
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
  });

  test('should create zip with default filename when no custom filename provided', () => {
    // Create mod folder structure
    execSync(`bash ./process_mod/createModFolder.sh ./modding/requested_mods ${testId} ${projectRoot} 1`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Run zipModFolder.sh without custom filename (backward compatibility)
    execSync(`bash ./process_mod/zipModFolder.sh ${testId} 1`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Verify zip file was created with default testId name
    const zipPath = path.join(modsDir, `${testId}.zip`);
    expect(fs.existsSync(zipPath)).toBe(true);

    // Clean up
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
  });

  test('zipModFolder.sh should maintain backward compatibility', () => {
    // This test ensures that existing code that doesn't provide a custom filename still works
    
    // Create mod folder structure
    execSync(`bash ./process_mod/createModFolder.sh ./modding/requested_mods ${testId} ${projectRoot} 0`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Run zipModFolder.sh with only 2 arguments (old way)
    execSync(`bash ./process_mod/zipModFolder.sh ${testId} 0`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Should create zip with testId as filename
    const zipPath = path.join(modsDir, `${testId}.zip`);
    expect(fs.existsSync(zipPath)).toBe(true);

    // Verify zip contents include thumbnail
    const zipContents = execSync(`unzip -l "${zipPath}"`, {
      cwd: projectRoot,
      encoding: 'utf8'
    });
    expect(zipContents).toContain('thumbnail.jpg');
    expect(zipContents).toContain(`${testId}-data.zip`);

    // Clean up
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
  });

  test('should validate filename format matches expected pattern', () => {
    // Test the filename pattern without creating actual mod
    const filenamePattern = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z_[0-9a-f]{4}_v\d+\.\d+\.\d+$/;
    
    const testFilename = '2025-12-02T10-20-30Z_a1b2_v1.6.2';
    expect(testFilename).toMatch(filenamePattern);
    
    // Test various valid filenames
    const validFilenames = [
      '2025-01-15T09-30-45Z_0000_v1.0.0',
      '2025-12-31T23-59-59Z_ffff_v10.20.30',
      '2024-06-15T12-00-00Z_cafe_v2.3.4'
    ];
    
    validFilenames.forEach(filename => {
      expect(filename).toMatch(filenamePattern);
    });
    
    // Test invalid filenames
    const invalidFilenames = [
      '2025-12-02_a1b2_v1.6.2', // Missing time
      '2025-12-02T10:20:30Z_a1b2_v1.6.2', // Has colons (not filesystem-safe)
      '2025-12-02T10-20-30Z_a1b_v1.6.2', // Only 3 hex digits
      '2025-12-02T10-20-30Z_g1b2_v1.6.2', // Invalid hex character
      '2025-12-02T10-20-30Z_a1b2_1.6.2', // Missing 'v' prefix
      '2025-12-02T10-20-30Z_a1b2_v1.6', // Only 2 version components
    ];
    
    invalidFilenames.forEach(filename => {
      expect(filename).not.toMatch(filenamePattern);
    });
  });
});
