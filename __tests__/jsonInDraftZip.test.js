/**
 * Test for JSON files in draft mod zips
 * Validates that draft-config.json and data.json are included in draft mode zips
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('JSON files in draft zip', () => {
  const projectRoot = path.join(__dirname, '..');
  const modsDir = path.join(projectRoot, 'modding', 'requested_mods');
  
  const testId = 'test-json-' + Date.now();
  let testDir;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civbuilder-json-test-'));
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }

    // Clean up zip file
    const zipPath = path.join(modsDir, `${testId}.zip`);
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    // Clean up mod directory
    const modDirPath = path.join(modsDir, testId);
    if (fs.existsSync(modDirPath)) {
      fs.rmSync(modDirPath, { recursive: true, force: true });
    }
  });

  test('should include data.json when present in mod folder', () => {
    // Create mod folder structure
    execSync(`bash ./process_mod/createModFolder.sh ./modding/requested_mods ${testId} ${projectRoot} 1`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Create a sample data.json
    const modFolderPath = path.join(modsDir, testId);
    const dataJson = {
      name: ['TestCiv'],
      description: ['A test civilization'],
      techtree: [[0]],
      modifyDat: true
    };
    fs.writeFileSync(
      path.join(modFolderPath, 'data.json'),
      JSON.stringify(dataJson, null, 2)
    );

    // Run zipModFolder.sh
    execSync(`bash ./process_mod/zipModFolder.sh ${testId} 1`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Check that zip was created
    const zipPath = path.join(modsDir, `${testId}.zip`);
    expect(fs.existsSync(zipPath)).toBe(true);

    // List contents of zip
    const zipContents = execSync(`unzip -l "${zipPath}"`, {
      cwd: projectRoot,
      encoding: 'utf8'
    });

    // Verify data.json is in the zip
    expect(zipContents).toContain('data.json');
  });

  test('should include draft-config.json when present in mod folder', () => {
    // Create mod folder structure
    execSync(`bash ./process_mod/createModFolder.sh ./modding/requested_mods ${testId} ${projectRoot} 1`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Create a sample draft-config.json
    const modFolderPath = path.join(modsDir, testId);
    const draftConfig = {
      id: testId,
      preset: {
        slots: 2,
        points: 100,
        rounds: 3
      },
      players: []
    };
    fs.writeFileSync(
      path.join(modFolderPath, 'draft-config.json'),
      JSON.stringify(draftConfig, null, 2)
    );

    // Run zipModFolder.sh
    execSync(`bash ./process_mod/zipModFolder.sh ${testId} 1`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Check that zip was created
    const zipPath = path.join(modsDir, `${testId}.zip`);
    expect(fs.existsSync(zipPath)).toBe(true);

    // List contents of zip
    const zipContents = execSync(`unzip -l "${zipPath}"`, {
      cwd: projectRoot,
      encoding: 'utf8'
    });

    // Verify draft-config.json is in the zip
    expect(zipContents).toContain('draft-config.json');
  });

  test('should include both JSON files when both are present', () => {
    // Create mod folder structure
    execSync(`bash ./process_mod/createModFolder.sh ./modding/requested_mods ${testId} ${projectRoot} 1`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Create both JSON files
    const modFolderPath = path.join(modsDir, testId);
    
    const dataJson = {
      name: ['TestCiv'],
      description: ['A test civilization']
    };
    fs.writeFileSync(
      path.join(modFolderPath, 'data.json'),
      JSON.stringify(dataJson, null, 2)
    );

    const draftConfig = {
      id: testId,
      preset: { slots: 2 }
    };
    fs.writeFileSync(
      path.join(modFolderPath, 'draft-config.json'),
      JSON.stringify(draftConfig, null, 2)
    );

    // Run zipModFolder.sh
    execSync(`bash ./process_mod/zipModFolder.sh ${testId} 1`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Check that zip was created
    const zipPath = path.join(modsDir, `${testId}.zip`);
    expect(fs.existsSync(zipPath)).toBe(true);

    // List contents of zip
    const zipContents = execSync(`unzip -l "${zipPath}"`, {
      cwd: projectRoot,
      encoding: 'utf8'
    });

    // Verify both JSON files are in the zip
    expect(zipContents).toContain('data.json');
    expect(zipContents).toContain('draft-config.json');
    
    // Also verify the core files are still there
    expect(zipContents).toContain('thumbnail.jpg');
    expect(zipContents).toContain(`${testId}-data.zip`);
    expect(zipContents).toContain(`${testId}-ui.zip`);
  });

  test('should work without JSON files (backward compatibility)', () => {
    // Create mod folder structure
    execSync(`bash ./process_mod/createModFolder.sh ./modding/requested_mods ${testId} ${projectRoot} 1`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Don't create any JSON files - just zip as-is

    // Run zipModFolder.sh
    execSync(`bash ./process_mod/zipModFolder.sh ${testId} 1`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Check that zip was created
    const zipPath = path.join(modsDir, `${testId}.zip`);
    expect(fs.existsSync(zipPath)).toBe(true);

    // List contents of zip
    const zipContents = execSync(`unzip -l "${zipPath}"`, {
      cwd: projectRoot,
      encoding: 'utf8'
    });

    // Verify core files are there
    expect(zipContents).toContain('thumbnail.jpg');
    expect(zipContents).toContain(`${testId}-data.zip`);
    expect(zipContents).toContain(`${testId}-ui.zip`);
    
    // JSON files should not be present
    expect(zipContents).not.toContain('data.json');
    expect(zipContents).not.toContain('draft-config.json');
  });

  test('should work with data mod only (no UI mod) and JSON files', () => {
    // Create mod folder structure without UI
    execSync(`bash ./process_mod/createModFolder.sh ./modding/requested_mods ${testId} ${projectRoot} 0`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Create a sample data.json
    const modFolderPath = path.join(modsDir, testId);
    const dataJson = {
      name: ['TestCiv'],
      modifyDat: false
    };
    fs.writeFileSync(
      path.join(modFolderPath, 'data.json'),
      JSON.stringify(dataJson, null, 2)
    );

    // Run zipModFolder.sh with mode 0 (no UI)
    execSync(`bash ./process_mod/zipModFolder.sh ${testId} 0`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Check that zip was created
    const zipPath = path.join(modsDir, `${testId}.zip`);
    expect(fs.existsSync(zipPath)).toBe(true);

    // List contents of zip
    const zipContents = execSync(`unzip -l "${zipPath}"`, {
      cwd: projectRoot,
      encoding: 'utf8'
    });

    // Verify data.json is in the zip
    expect(zipContents).toContain('data.json');
    expect(zipContents).toContain('thumbnail.jpg');
    expect(zipContents).toContain(`${testId}-data.zip`);
    
    // UI mod should not be present
    expect(zipContents).not.toContain(`${testId}-ui.zip`);
  });

  test('should include individual civ JSON files along with draft-config and data.json', () => {
    // Create mod folder structure
    execSync(`bash ./process_mod/createModFolder.sh ./modding/requested_mods ${testId} ${projectRoot} 1`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Create a sample data.json
    const modFolderPath = path.join(modsDir, testId);
    const dataJson = {
      name: ['TestCiv1', 'TestCiv2'],
      description: ['First test civ', 'Second test civ']
    };
    fs.writeFileSync(
      path.join(modFolderPath, 'data.json'),
      JSON.stringify(dataJson, null, 2)
    );

    // Create a sample draft-config.json
    const draftConfig = {
      id: testId,
      preset: {
        slots: 2,
        points: 100,
        rounds: 3
      },
      players: [
        { alias: 'TestCiv1' },
        { alias: 'TestCiv2' }
      ]
    };
    fs.writeFileSync(
      path.join(modFolderPath, 'draft-config.json'),
      JSON.stringify(draftConfig, null, 2)
    );

    // Create individual civ JSON files (simulating what server.js does)
    const civ1Json = {
      alias: 'TestCiv1',
      description: 'First test civ',
      tree: [[0]],
      bonuses: []
    };
    fs.writeFileSync(
      path.join(modFolderPath, 'TestCiv1.json'),
      JSON.stringify(civ1Json, null, 2)
    );

    const civ2Json = {
      alias: 'TestCiv2',
      description: 'Second test civ',
      tree: [[0]],
      bonuses: []
    };
    fs.writeFileSync(
      path.join(modFolderPath, 'TestCiv2.json'),
      JSON.stringify(civ2Json, null, 2)
    );

    // Run zipModFolder.sh
    execSync(`bash ./process_mod/zipModFolder.sh ${testId} 1`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Check that zip was created
    const zipPath = path.join(modsDir, `${testId}.zip`);
    expect(fs.existsSync(zipPath)).toBe(true);

    // Extract zip to verify contents
    const extractPath = path.join(testDir, 'extract');
    fs.mkdirSync(extractPath, { recursive: true });
    execSync(`unzip -q "${zipPath}" -d "${extractPath}"`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Verify all JSON files are present
    expect(fs.existsSync(path.join(extractPath, 'data.json'))).toBe(true);
    expect(fs.existsSync(path.join(extractPath, 'draft-config.json'))).toBe(true);
    expect(fs.existsSync(path.join(extractPath, 'TestCiv1.json'))).toBe(true);
    expect(fs.existsSync(path.join(extractPath, 'TestCiv2.json'))).toBe(true);
    
    // Verify the individual civ JSON files have correct content
    const extractedCiv1 = JSON.parse(fs.readFileSync(path.join(extractPath, 'TestCiv1.json'), 'utf8'));
    expect(extractedCiv1.alias).toBe('TestCiv1');
    expect(extractedCiv1.description).toBe('First test civ');
    
    // List contents to verify all expected files
    const zipContents = execSync(`unzip -l "${zipPath}"`, {
      cwd: projectRoot,
      encoding: 'utf8'
    });
    
    expect(zipContents).toContain('data.json');
    expect(zipContents).toContain('draft-config.json');
    expect(zipContents).toContain('TestCiv1.json');
    expect(zipContents).toContain('TestCiv2.json');
    expect(zipContents).toContain('thumbnail.jpg');
    expect(zipContents).toContain(`${testId}-data.zip`);
    expect(zipContents).toContain(`${testId}-ui.zip`);
  });
});
