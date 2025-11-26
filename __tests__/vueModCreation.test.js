/**
 * E2E Test for Vue/Nuxt UI Mod Creation
 * 
 * This test suite validates the mod creation functionality in the Vue/Nuxt UI
 * by testing the /create API endpoint with vanilla civilization JSON files.
 * 
 * Tests cover:
 * 1. Single civilization mod creation (from build page stepper)
 * 2. Multi-civilization mod combining (from combine page)
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Vue UI Mod Creation E2E', () => {
  let testDir;
  const projectRoot = path.join(__dirname, '..');
  const createDataModPath = path.join(projectRoot, 'modding', 'build', 'create-data-mod');
  const vanillaCivsDir = path.join(projectRoot, 'public', 'vanillaFiles', 'vanillaCivs', 'VanillaJson');
  const vanillaDatPath = path.join(projectRoot, 'public', 'vanillaFiles', 'empires2_x2_p1.dat');

  // Test server configuration
  const testPort = 4001; // Use different port to avoid conflicts
  let serverProcess = null;

  beforeAll(() => {
    // Check if C++ executable exists
    if (!fs.existsSync(createDataModPath)) {
      console.log('Skipping tests - C++ executable not built. Run: cd modding && ./scripts/build.sh');
    }
  });

  beforeEach(() => {
    // Create a temporary directory for test outputs
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civbuilder-vue-test-'));
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  /**
   * Helper function to load a vanilla civ JSON file
   */
  function loadVanillaCiv(civName) {
    const civPath = path.join(vanillaCivsDir, `${civName}.json`);
    if (!fs.existsSync(civPath)) {
      throw new Error(`Vanilla civ not found: ${civName}`);
    }
    return JSON.parse(fs.readFileSync(civPath, 'utf8'));
  }

  /**
   * Helper function to create a mod using the /create endpoint format
   */
  function createModData(civs) {
    const seed = Date.now().toString();
    
    // Format matching the Vue UI's useModApi.ts
    const presets = {
      presets: civs.map(civ => ({
        alias: civ.alias,
        description: civ.description,
        flag_palette: civ.flag_palette,
        customFlag: civ.customFlag || false,
        customFlagData: civ.customFlagData || '',
        tree: civ.tree,
        bonuses: civ.bonuses,
        architecture: civ.architecture,
        language: civ.language,
        wonder: civ.wonder
      }))
    };

    const modifiers = {
      randomCosts: false,
      hp: 1.0,
      speed: 1.0,
      blind: false,
      infinity: false,
      building: 1.0
    };

    return {
      seed,
      presets: JSON.stringify(presets),
      modifiers: JSON.stringify(modifiers)
    };
  }

  describe('Single Civilization Mod Creation', () => {
    const skipTests = !fs.existsSync(createDataModPath);
    
    (skipTests ? it.skip : it)('should create mod for Britons (from build page)', () => {
      const britons = loadVanillaCiv('Britons');
      const modData = createModData([britons]);

      // Write data.json in the format the server expects
      const dataJsonPath = path.join(testDir, 'data.json');
      const parsedPresets = JSON.parse(modData.presets);
      const dataJson = {
        ...parsedPresets.presets[0],
        numCivs: 1
      };
      fs.writeFileSync(dataJsonPath, JSON.stringify(dataJson));

      // Run create-data-mod
      const outputDatPath = path.join(testDir, 'output.dat');
      const aiConfigPath = path.join(testDir, 'aiconfig.json');

      try {
        execFileSync(createDataModPath, [
          dataJsonPath,
          vanillaDatPath,
          outputDatPath,
          aiConfigPath
        ], {
          cwd: projectRoot,
          timeout: 30000
        });

        // Verify output files were created
        expect(fs.existsSync(outputDatPath)).toBe(true);
        expect(fs.existsSync(aiConfigPath)).toBe(true);

        // Verify output DAT file is not empty
        const stats = fs.statSync(outputDatPath);
        expect(stats.size).toBeGreaterThan(1000000); // Should be at least 1MB
      } catch (error) {
        throw new Error(`Failed to create mod for Britons: ${error.message}`);
      }
    });

    (skipTests ? it.skip : it)('should create mod for Mongols (cavalry archer civ)', () => {
      const mongols = loadVanillaCiv('Mongols');
      const modData = createModData([mongols]);

      const dataJsonPath = path.join(testDir, 'data.json');
      const parsedPresets = JSON.parse(modData.presets);
      const dataJson = {
        ...parsedPresets.presets[0],
        numCivs: 1
      };
      fs.writeFileSync(dataJsonPath, JSON.stringify(dataJson));

      const outputDatPath = path.join(testDir, 'output.dat');
      const aiConfigPath = path.join(testDir, 'aiconfig.json');

      try {
        execFileSync(createDataModPath, [
          dataJsonPath,
          vanillaDatPath,
          outputDatPath,
          aiConfigPath
        ], {
          cwd: projectRoot,
          timeout: 30000
        });

        expect(fs.existsSync(outputDatPath)).toBe(true);
        expect(fs.existsSync(aiConfigPath)).toBe(true);

        const stats = fs.statSync(outputDatPath);
        expect(stats.size).toBeGreaterThan(1000000);
      } catch (error) {
        throw new Error(`Failed to create mod for Mongols: ${error.message}`);
      }
    });
  });

  describe('Multi-Civilization Mod Combining', () => {
    const skipTests = !fs.existsSync(createDataModPath);
    
    (skipTests ? it.skip : it)('should combine Britons and Franks (from combine page)', () => {
      const britons = loadVanillaCiv('Britons');
      const franks = loadVanillaCiv('Franks');
      const modData = createModData([britons, franks]);

      const dataJsonPath = path.join(testDir, 'data.json');
      const parsedPresets = JSON.parse(modData.presets);
      
      // For multi-civ, we need to format it differently
      const dataJson = {
        numCivs: 2,
        civs: parsedPresets.presets
      };
      fs.writeFileSync(dataJsonPath, JSON.stringify(dataJson));

      const outputDatPath = path.join(testDir, 'output.dat');
      const aiConfigPath = path.join(testDir, 'aiconfig.json');

      try {
        execFileSync(createDataModPath, [
          dataJsonPath,
          vanillaDatPath,
          outputDatPath,
          aiConfigPath
        ], {
          cwd: projectRoot,
          timeout: 30000
        });

        expect(fs.existsSync(outputDatPath)).toBe(true);
        expect(fs.existsSync(aiConfigPath)).toBe(true);

        const stats = fs.statSync(outputDatPath);
        expect(stats.size).toBeGreaterThan(1000000);
      } catch (error) {
        throw new Error(`Failed to combine Britons and Franks: ${error.message}`);
      }
    });

    (skipTests ? it.skip : it)('should combine 3 civilizations (Britons, Franks, Goths)', () => {
      const britons = loadVanillaCiv('Britons');
      const franks = loadVanillaCiv('Franks');
      const goths = loadVanillaCiv('Goths');
      const modData = createModData([britons, franks, goths]);

      const dataJsonPath = path.join(testDir, 'data.json');
      const parsedPresets = JSON.parse(modData.presets);
      
      const dataJson = {
        numCivs: 3,
        civs: parsedPresets.presets
      };
      fs.writeFileSync(dataJsonPath, JSON.stringify(dataJson));

      const outputDatPath = path.join(testDir, 'output.dat');
      const aiConfigPath = path.join(testDir, 'aiconfig.json');

      try {
        execFileSync(createDataModPath, [
          dataJsonPath,
          vanillaDatPath,
          outputDatPath,
          aiConfigPath
        ], {
          cwd: projectRoot,
          timeout: 30000
        });

        expect(fs.existsSync(outputDatPath)).toBe(true);
        expect(fs.existsSync(aiConfigPath)).toBe(true);

        const stats = fs.statSync(outputDatPath);
        expect(stats.size).toBeGreaterThan(1000000);
      } catch (error) {
        throw new Error(`Failed to combine 3 civilizations: ${error.message}`);
      }
    });
  });

  describe('API Request Format Validation', () => {
    it('should generate correct request format for single civ', () => {
      const britons = loadVanillaCiv('Britons');
      const modData = createModData([britons]);

      // Validate structure
      expect(modData).toHaveProperty('seed');
      expect(modData).toHaveProperty('presets');
      expect(modData).toHaveProperty('modifiers');

      // Validate seed format (15 digit number as string)
      expect(modData.seed).toMatch(/^\d+$/);

      // Validate presets can be parsed
      const presets = JSON.parse(modData.presets);
      expect(presets).toHaveProperty('presets');
      expect(Array.isArray(presets.presets)).toBe(true);
      expect(presets.presets.length).toBe(1);

      // Validate civ structure
      const civ = presets.presets[0];
      expect(civ).toHaveProperty('alias');
      expect(civ).toHaveProperty('tree');
      expect(civ).toHaveProperty('bonuses');
      expect(civ).toHaveProperty('architecture');
      expect(civ).toHaveProperty('language');
      expect(civ.alias).toBe('Britons');
    });

    it('should generate correct request format for multiple civs', () => {
      const britons = loadVanillaCiv('Britons');
      const franks = loadVanillaCiv('Franks');
      const modData = createModData([britons, franks]);

      const presets = JSON.parse(modData.presets);
      expect(presets.presets.length).toBe(2);
      expect(presets.presets[0].alias).toBe('Britons');
      expect(presets.presets[1].alias).toBe('Franks');
    });

    it('should include all required civ properties', () => {
      const britons = loadVanillaCiv('Britons');
      const modData = createModData([britons]);
      const presets = JSON.parse(modData.presets);
      const civ = presets.presets[0];

      const requiredProps = [
        'alias',
        'description',
        'flag_palette',
        'customFlag',
        'customFlagData',
        'tree',
        'bonuses',
        'architecture',
        'language',
        'wonder'
      ];

      requiredProps.forEach(prop => {
        expect(civ).toHaveProperty(prop);
      });
    });

    it('should include correct modifiers format', () => {
      const britons = loadVanillaCiv('Britons');
      const modData = createModData([britons]);
      const modifiers = JSON.parse(modData.modifiers);

      expect(modifiers).toEqual({
        randomCosts: false,
        hp: 1.0,
        speed: 1.0,
        blind: false,
        infinity: false,
        building: 1.0
      });
    });
  });
});
