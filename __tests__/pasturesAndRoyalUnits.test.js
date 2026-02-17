const fs = require('fs');
const path = require('path');
const os = require('os');
const { createTechtreeJson } = require('../process_mod/createTechtreeJson.js');

describe('Pastures and Royal Units Techtree Generation', () => {
  let testDir;

  beforeEach(() => {
    // Create a temporary directory for test outputs
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civbuilder-pasture-test-'));
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should generate techtree with pastures (bonus 356)', () => {
    const testDataPath = path.join(testDir, 'test-data.json');
    const outputPath = path.join(testDir, 'civTechTrees.json');

    // Create test data with pastures bonus (356)
    const testData = {
      name: ["TestCiv"],
      description: ["A test civilization with pastures"],
      techtree: [
        // Basic techtree array with all zeros (simplified for test)
        new Array(200).fill(0)
      ],
      castletech: [[0]],
      imptech: [[0]],
      civ_bonus: [[356]], // Pastures bonus
      team_bonus: [[0]],
      architecture: [1],
      language: [0],
      castle: [0],
      wonder: [0],
      modifiers: {
        randomCosts: false,
        hp: 1,
        speed: 1,
        blind: false,
        infinity: false,
        building: 1,
      },
      modifyDat: true
    };

    fs.writeFileSync(testDataPath, JSON.stringify(testData, null, 2));

    // Execute the techtree generation
    createTechtreeJson(testDataPath, outputPath);

    // Check that output file was created
    expect(fs.existsSync(outputPath)).toBe(true);

    // Parse and validate the output
    const techtreeData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    
    // Verify the techtree structure
    expect(techtreeData).toHaveProperty('civs');
    expect(techtreeData.civs).toHaveLength(1);
    
    const civ = techtreeData.civs[0];
    
    // Check that Mill and Farm are removed from buildings
    const buildingNames = civ.civ_techs_buildings.map(b => b.Name);
    expect(buildingNames).not.toContain('Mill');
    expect(buildingNames).not.toContain('Farm');
    
    // Check that Pasture is added
    expect(buildingNames).toContain('Pasture');
    
    // Check that farm upgrades are removed from units/techs
    const techNames = civ.civ_techs_units.map(t => t.Name);
    expect(techNames).not.toContain('Horse Collar');
    expect(techNames).not.toContain('Heavy Plow');
    expect(techNames).not.toContain('Crop Rotation');
    
    // Check that pasture upgrades are added
    expect(techNames).toContain('Domestication');
    expect(techNames).toContain('Pastoralism');
    expect(techNames).toContain('Transhumance');
  });

  test('should generate techtree with royal battle elephants (bonus 309)', () => {
    const testDataPath = path.join(testDir, 'test-data.json');
    const outputPath = path.join(testDir, 'civTechTrees.json');

    // Create test data with royal battle elephant bonus (309)
    const testData = {
      name: ["TestCiv"],
      description: ["A test civilization with royal battle elephants"],
      techtree: [
        // Basic techtree array - set elite battle elephant to 1 (index 38)
        Array.from({ length: 200 }, (_, i) => i === 38 ? 1 : 0)
      ],
      castletech: [[0]],
      imptech: [[0]],
      civ_bonus: [[309]], // Royal Battle Elephant bonus
      team_bonus: [[0]],
      architecture: [1],
      language: [0],
      castle: [0],
      wonder: [0],
      modifiers: {
        randomCosts: false,
        hp: 1,
        speed: 1,
        blind: false,
        infinity: false,
        building: 1,
      },
      modifyDat: true
    };

    fs.writeFileSync(testDataPath, JSON.stringify(testData, null, 2));

    // Execute the techtree generation
    createTechtreeJson(testDataPath, outputPath);

    // Check that output file was created
    expect(fs.existsSync(outputPath)).toBe(true);

    // Parse and validate the output
    const techtreeData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    
    // Verify the techtree structure
    expect(techtreeData).toHaveProperty('civs');
    expect(techtreeData.civs).toHaveLength(1);
    
    const civ = techtreeData.civs[0];
    
    // Check that Royal Battle Elephant is added
    const unitNames = civ.civ_techs_units.map(u => u.Name);
    expect(unitNames).toContain('Royal Battle Elephant');
  });

  test('should generate techtree with royal lancers (bonus 310)', () => {
    const testDataPath = path.join(testDir, 'test-data.json');
    const outputPath = path.join(testDir, 'civTechTrees.json');

    // Create test data with royal lancer bonus (310)
    const testData = {
      name: ["TestCiv"],
      description: ["A test civilization with royal lancers"],
      techtree: [
        // Basic techtree array - set elite steppe lancer to 1 (index 40)
        Array.from({ length: 200 }, (_, i) => i === 40 ? 1 : 0)
      ],
      castletech: [[0]],
      imptech: [[0]],
      civ_bonus: [[310]], // Royal Lancer bonus
      team_bonus: [[0]],
      architecture: [1],
      language: [0],
      castle: [0],
      wonder: [0],
      modifiers: {
        randomCosts: false,
        hp: 1,
        speed: 1,
        blind: false,
        infinity: false,
        building: 1,
      },
      modifyDat: true
    };

    fs.writeFileSync(testDataPath, JSON.stringify(testData, null, 2));

    // Execute the techtree generation
    createTechtreeJson(testDataPath, outputPath);

    // Check that output file was created
    expect(fs.existsSync(outputPath)).toBe(true);

    // Parse and validate the output
    const techtreeData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    
    // Verify the techtree structure
    expect(techtreeData).toHaveProperty('civs');
    expect(techtreeData.civs).toHaveLength(1);
    
    const civ = techtreeData.civs[0];
    
    // Check that Royal Lancer is added
    const unitNames = civ.civ_techs_units.map(u => u.Name);
    expect(unitNames).toContain('Royal Lancer');
  });
});
