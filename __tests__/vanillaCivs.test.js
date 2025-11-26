/**
 * Test suite for vanilla civilization JSON files
 * 
 * This test suite validates that all vanilla civilization JSON files in
 * public/vanillaFiles/vanillaCivs/VanillaJson/ can be successfully processed
 * by the create-data-mod backend tool.
 * 
 * Each vanilla civ JSON is converted to the internal data.json format and
 * then processed through the C++ create-data-mod tool to generate a DAT file.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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
   */
  function testVanillaCiv(civFileName) {
    const civFilePath = path.join(vanillaCivsDir, civFileName);
    
    // Skip if executable doesn't exist
    if (!fs.existsSync(createDataModPath)) {
      return { skipped: true };
    }

    // Create a temporary directory for this specific test
    const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civbuilder-vanilla-test-'));
    
    let stdout, stderr;
    let exitCode = 0;
    let testDataPath, outputDatPath, outputAiConfigPath, vanillaCivData;
    
    try {
      // Read and convert vanilla civ JSON to data.json format
      vanillaCivData = JSON.parse(fs.readFileSync(civFilePath, 'utf8'));
      const dataJson = convertVanillaCivToDataJson(vanillaCivData);
      
      // Write data.json to temp directory
      testDataPath = path.join(testDir, 'data.json');
      fs.writeFileSync(testDataPath, JSON.stringify(dataJson, null, 2));
      
      // Output paths
      outputDatPath = path.join(testDir, 'empires2_x2_p1.dat');
      outputAiConfigPath = path.join(testDir, 'aiconfig.json');

      // Run create-data-mod
      const args = [testDataPath, vanillaDatPath, outputDatPath, outputAiConfigPath];

      stdout = execFileSync(createDataModPath, args, {
        encoding: 'utf8',
        cwd: projectRoot,
        timeout: 30000, // 30 second timeout
      });
      
      // Check if output files exist and get their stats BEFORE cleanup
      const outputDatExists = fs.existsSync(outputDatPath);
      const outputAiConfigExists = fs.existsSync(outputAiConfigPath);
      const datSize = outputDatExists ? fs.statSync(outputDatPath).size : 0;
      
      // Clean up test directory
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
      
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
      exitCode = error.status !== null ? error.status : (error.signal ? 139 : 1);
      
      // Clean up test directory on error
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
      
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

  // Generate a test case for each vanilla civ JSON file
  // Use describe.each with test.concurrent to run tests in parallel
  describe.each(vanillaCivFiles)('Vanilla Civ: %s', (civFileName) => {
    test.concurrent(`should successfully process ${civFileName}`, () => {
      const result = testVanillaCiv(civFileName);
      
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
    }, 60000); // 60 second timeout per test
  });
});
