const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Dat File Creation', () => {
  let testDir;

  beforeEach(() => {
    // Create a temporary directory for test outputs
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civbuilder-test-'));
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  // Helper function to run the test with a specific dat file
  const testDatFileCreation = (datFileName, shouldPass, expectedExitCode = null) => {
    const projectRoot = path.join(__dirname, '..');
    const createDataModPath = path.join(projectRoot, 'modding', 'build', 'create-data-mod');
    const testDataPath = path.join(__dirname, 'fixtures', 'crash-test-data.json');
    const vanillaDatPath = path.join(projectRoot, 'public', 'vanillaFiles', datFileName);
    const outputDatPath = path.join(testDir, datFileName);
    const outputAiConfigPath = path.join(testDir, 'aiconfig.json');

    // Skip test if C++ executable doesn't exist (needs to be built first)
    if (!fs.existsSync(createDataModPath)) {
      console.log('Skipping test - C++ executable not built. Run: cd modding && ./scripts/build.sh');
      return;
    }
    
    // Check that test data exists
    expect(fs.existsSync(testDataPath)).toBe(true);
    
    // Check that vanilla dat file exists
    expect(fs.existsSync(vanillaDatPath)).toBe(true);

    // This is the exact command that crashes according to the issue log
    // Use execFileSync instead of execSync to avoid shell injection
    const args = [testDataPath, vanillaDatPath, outputDatPath, outputAiConfigPath];

    let stdout, stderr;
    let exitCode = 0;

    try {
      // Execute the command safely without shell
      stdout = execFileSync(createDataModPath, args, {
        encoding: 'utf8',
        cwd: projectRoot,
        timeout: 30000, // 30 second timeout
      });
    } catch (error) {
      stderr = error.stderr || error.message;
      stdout = error.stdout || '';
      exitCode = error.status !== null ? error.status : (error.signal ? 139 : 1);
    }

    // Log output for debugging
    if (stdout) {
      console.log('STDOUT:', stdout);
    }
    if (stderr) {
      console.error('STDERR:', stderr);
    }

    // The test should detect if the command crashes with a segfault
    // Exit code 139 is SIGSEGV (segmentation fault)
    if (exitCode === 139) {
      // The crash is reproduced - log this for investigation
      console.log(`Crash reproduced with segmentation fault for ${datFileName}`);
    }
    
    if (shouldPass) {
      // This dat file should work without crashing
      expect(exitCode).toBe(0);
      
      // Check that output files were created
      expect(fs.existsSync(outputDatPath)).toBe(true);
      expect(fs.existsSync(outputAiConfigPath)).toBe(true);

      // Check that output files have content
      const datStats = fs.statSync(outputDatPath);
      expect(datStats.size).toBeGreaterThan(0);
    } else if (expectedExitCode !== null) {
      // This dat file should exit gracefully with a specific error code
      expect(exitCode).toBe(expectedExitCode);
      // Verify it's not a crash
      expect(exitCode).not.toBe(139);
    } else {
      // This dat file is expected to crash (for now)
      expect(exitCode).toBe(139);
    }
  };

  // Test the original dat file - should now work with the off-by-one fix
  test('should successfully create dat file with empires2_x2_p1.dat', () => {
    testDatFileCreation('empires2_x2_p1.dat', true);
  }, 60000);

  // Test the 3k dat file - now handled gracefully with exit code 2
  test('should handle empires2_x2_p1_3k.dat (3 Kingdoms - has vector length error)', () => {
    testDatFileCreation('empires2_x2_p1_3k.dat', false, 2);
  }, 60000);

  // Test the august2025 dat file - should now work
  test('should successfully create dat file with empires2_x2_p1_august2025.dat', () => {
    testDatFileCreation('empires2_x2_p1_august2025.dat', true);
  }, 60000);

  // Test the october2025 dat file - should now work
  test('should successfully create dat file with empires2_x2_p1_october2025.dat', () => {
    testDatFileCreation('empires2_x2_p1_october2025.dat', true);
  }, 60000);
});
