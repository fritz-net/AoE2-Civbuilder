/**
 * Test suite for vanilla civilization JSON files
 * 
 * This test suite validates that all vanilla civilization JSON files in
 * public/vanillaFiles/vanillaCivs/VanillaJson/ can be successfully processed
 * by the create-data-mod backend tool.
 * 
 * Each vanilla civ JSON is converted to the internal data.json format and
 * then processed through the C++ create-data-mod tool to generate a DAT file.
 * 
 * Tests run in parallel using async execFile for maximum throughput.
 */

const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');

// Promisify execFile for async/await usage
const execFileAsync = promisify(execFile);

// Load constants once at module level
const { numBonuses, numBasicTechs, indexDictionary } = require('../process_mod/constants.js');

describe('Vanilla Civs JSON Files', () => {
  const projectRoot = path.join(__dirname, '..');
  const createDataModPath = path.join(projectRoot, 'modding', 'build', 'create-data-mod');
  const vanillaCivsDir = path.join(projectRoot, 'public', 'vanillaFiles', 'vanillaCivs', 'VanillaJson');
  const vanillaDatPath = path.join(projectRoot, 'public', 'vanillaFiles', 'empires2_x2_p1.dat');

  // Load all vanilla civ JSON files
  const vanillaCivFiles = fs.readdirSync(vanillaCivsDir)
    .filter(file => file.endsWith('.json'))
    .sort();

  beforeAll(() => {
    // Check if C++ executable exists
    if (!fs.existsSync(createDataModPath)) {
      console.log('Skipping tests - C++ executable not built. Run: cd modding && ./scripts/build.sh');
    }
  });

  /**
   * Helper function to convert vanilla civ JSON to data.json format
   * This mimics the conversion done in server.js
   */
  function convertVanillaCivToDataJson(vanillaCivData) {
    const mod_data = {};
    mod_data.name = [vanillaCivData.alias || "Unknown"];
    mod_data.description = [vanillaCivData.description || ""];
    mod_data.techtree = [];
    mod_data.castletech = [];
    mod_data.imptech = [];
    mod_data.civ_bonus = [];
    mod_data.team_bonus = [];
    mod_data.architecture = [vanillaCivData.architecture !== undefined ? vanillaCivData.architecture : 1];
    mod_data.language = [vanillaCivData.language !== undefined ? vanillaCivData.language : 0];
    mod_data.wonder = [vanillaCivData.wonder !== undefined ? vanillaCivData.wonder : 0];
    mod_data.castle = [vanillaCivData.castle !== undefined ? vanillaCivData.castle : 0];
    mod_data.modifiers = {
      randomCosts: false,
      hp: 1,
      speed: 1,
      blind: false,
      infinity: false,
      building: 1,
    };
    mod_data.modifyDat = true;

    // Initialize techtree
    const player_techtree = [];
    for (let j = 0; j < numBasicTechs; j++) {
      player_techtree.push(0);
    }

    // Helper to extract bonus ID from [id, multiplier] or just id
    // This is a simplified version of extractBonusId from server.js
    // It doesn't include error logging since test failures will reveal issues
    function extractBonusId(bonus) {
      if (Array.isArray(bonus)) {
        return bonus[0];
      }
      return bonus || 0;
    }

    // Unique Unit
    if (vanillaCivData.bonuses && vanillaCivData.bonuses[1] && vanillaCivData.bonuses[1].length > 0) {
      player_techtree[0] = extractBonusId(vanillaCivData.bonuses[1][0]);
    } else {
      player_techtree[0] = 0;
    }

    // Castle Tech
    if (vanillaCivData.bonuses && vanillaCivData.bonuses[2] && vanillaCivData.bonuses[2].length > 0) {
      const castletechs = [];
      for (let j = 0; j < vanillaCivData.bonuses[2].length; j++) {
        castletechs.push(extractBonusId(vanillaCivData.bonuses[2][j]));
      }
      mod_data.castletech.push(castletechs);
    } else {
      mod_data.castletech.push([0]);
    }

    // Imp Tech
    if (vanillaCivData.bonuses && vanillaCivData.bonuses[3] && vanillaCivData.bonuses[3].length > 0) {
      const imptechs = [];
      for (let j = 0; j < vanillaCivData.bonuses[3].length; j++) {
        imptechs.push(extractBonusId(vanillaCivData.bonuses[3][j]));
      }
      mod_data.imptech.push(imptechs);
    } else {
      mod_data.imptech.push([0]);
    }

    // Tech Tree
    if (vanillaCivData.tree && Array.isArray(vanillaCivData.tree)) {
      for (let j = 0; j < vanillaCivData.tree.length; j++) {
        for (let k = 0; k < vanillaCivData.tree[j].length; k++) {
          const techId = vanillaCivData.tree[j][k].toString();
          if (indexDictionary[j] && indexDictionary[j][techId] !== undefined) {
            player_techtree[indexDictionary[j][techId]] = 1;
          }
        }
      }
    }
    mod_data.techtree.push(player_techtree);

    // Civ bonuses
    const civBonuses = [];
    if (vanillaCivData.bonuses && vanillaCivData.bonuses[0] && Array.isArray(vanillaCivData.bonuses[0])) {
      for (let j = 0; j < vanillaCivData.bonuses[0].length; j++) {
        civBonuses.push(extractBonusId(vanillaCivData.bonuses[0][j]));
      }
    }
    mod_data.civ_bonus.push(civBonuses);

    // Team bonus
    if (vanillaCivData.bonuses && vanillaCivData.bonuses[4] && vanillaCivData.bonuses[4].length > 0) {
      const team_bonuses = [];
      for (let j = 0; j < vanillaCivData.bonuses[4].length; j++) {
        team_bonuses.push(extractBonusId(vanillaCivData.bonuses[4][j]));
      }
      mod_data.team_bonus.push(team_bonuses);
    } else {
      mod_data.team_bonus.push([0]);
    }

    return mod_data;
  }

  /**
   * Test helper that runs create-data-mod with a vanilla civ JSON
   * Uses async execFile for non-blocking parallel execution
   */
  async function testVanillaCiv(civFileName) {
    const civFilePath = path.join(vanillaCivsDir, civFileName);
    
    // Skip if executable doesn't exist
    if (!fs.existsSync(createDataModPath)) {
      return { skipped: true };
    }

    // Create a temporary directory for this specific test
    const testDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'civbuilder-vanilla-test-'));
    
    let stdout, stderr;
    let exitCode = 0;
    let testDataPath, outputDatPath, outputAiConfigPath, vanillaCivData;
    
    try {
      // Read and convert vanilla civ JSON to data.json format
      const civFileContent = await fsp.readFile(civFilePath, 'utf8');
      vanillaCivData = JSON.parse(civFileContent);
      const dataJson = convertVanillaCivToDataJson(vanillaCivData);
      
      // Write data.json to temp directory
      testDataPath = path.join(testDir, 'data.json');
      await fsp.writeFile(testDataPath, JSON.stringify(dataJson, null, 2));
      
      // Output paths
      outputDatPath = path.join(testDir, 'empires2_x2_p1.dat');
      outputAiConfigPath = path.join(testDir, 'aiconfig.json');

      // Run create-data-mod asynchronously (non-blocking)
      const args = [testDataPath, vanillaDatPath, outputDatPath, outputAiConfigPath];

      const result = await execFileAsync(createDataModPath, args, {
        encoding: 'utf8',
        cwd: projectRoot,
        timeout: 30000, // 30 second timeout
      });
      stdout = result.stdout;
      stderr = result.stderr;
      
      // Check if output files exist and get their stats BEFORE cleanup
      let outputDatExists = false;
      let outputAiConfigExists = false;
      let datSize = 0;
      
      try {
        const datStats = await fsp.stat(outputDatPath);
        outputDatExists = true;
        datSize = datStats.size;
      } catch (e) { /* file doesn't exist */ }
      
      try {
        await fsp.stat(outputAiConfigPath);
        outputAiConfigExists = true;
      } catch (e) { /* file doesn't exist */ }
      
      // Clean up test directory
      await fsp.rm(testDir, { recursive: true, force: true });
      
      return {
        exitCode,
        stdout,
        stderr,
        outputDatExists,
        outputAiConfigExists,
        datSize,
        vanillaCivData,
      };
    } catch (error) {
      stderr = error.stderr || error.message;
      stdout = error.stdout || '';
      // For promisified execFile:
      // - error.code is the exit code when process exits normally
      // - error.code is null when killed by signal (use signal number + 128)
      if (error.code !== null && error.code !== undefined) {
        exitCode = error.code;
      } else if (error.signal) {
        // Convert signal name to number using os.constants.signals
        // Exit code for signals is 128 + signal number
        const signalNum = os.constants.signals[error.signal] || 1;
        exitCode = 128 + signalNum;
      } else {
        exitCode = 1;
      }
      
      // Clean up test directory on error
      try {
        await fsp.rm(testDir, { recursive: true, force: true });
      } catch (e) { /* ignore cleanup errors */ }
      
      return {
        exitCode,
        stdout,
        stderr,
        outputDatExists: false,
        outputAiConfigExists: false,
        datSize: 0,
        vanillaCivData,
      };
    }
  }

  // Generate all test cases in a single describe block for maximum parallelism
  // Using it.concurrent.each pattern for true parallel execution
  it.concurrent.each(vanillaCivFiles)(
    'should successfully process %s',
    async (civFileName) => {
      const result = await testVanillaCiv(civFileName);
      
      // Skip if executable not built
      if (result.skipped) {
        console.log(`Skipping ${civFileName} - executable not built`);
        return;
      }

      // Log output only on failure
      if (result.exitCode !== 0) {
        if (result.stdout) {
          console.log(`[${civFileName}] STDOUT:`, result.stdout.substring(0, 500));
        }
        if (result.stderr) {
          console.error(`[${civFileName}] STDERR:`, result.stderr.substring(0, 500));
        }
      }

      // Test should not crash
      expect(result.exitCode).not.toBe(139); // SIGSEGV
      
      // Test should succeed
      expect(result.exitCode).toBe(0);
      
      // Output files should be created
      expect(result.outputDatExists).toBe(true);
      expect(result.outputAiConfigExists).toBe(true);

      // Output files should have content
      expect(result.datSize).toBeGreaterThan(0);
    },
    60000 // 60 second timeout per test
  );
});
