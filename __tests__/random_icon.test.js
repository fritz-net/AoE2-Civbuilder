const { drawFlag, generateSeed } = require('../process_mod/random/random_icon.js');
const fs = require('fs');
const path = require('path');

describe('random_icon drawFlag', () => {
  const testOutputDir = '/tmp/test_flag_output';
  
  beforeAll(() => {
    // Create test output directory
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test output directory
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
  });

  test('should handle undefined colors in palette gracefully', async () => {
    // Create a seed with undefined colors (simulating the crash scenario)
    const invalidSeed = [
      [
        undefined,  // Index 0 - undefined
        [255, 0, 0], // Index 1 - valid red
        undefined,  // Index 2 - undefined
        [0, 255, 0], // Index 3 - valid green
        [0, 0, 255]  // Index 4 - valid blue
      ],
      0, // division
      0  // overlay
    ];

    const outputPath = path.join(testOutputDir, 'test_undefined_colors.png');
    const symbolsPath = path.join(__dirname, '../public/img/symbols');

    // This should not crash anymore
    await expect(
      drawFlag(invalidSeed, -1, [outputPath], symbolsPath)
    ).resolves.not.toThrow();

    // Check that file was created
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  test('should handle completely invalid color palette', async () => {
    // Create a seed with all undefined colors
    const allUndefinedSeed = [
      [undefined, undefined, undefined, undefined, undefined],
      0, // division
      0  // overlay
    ];

    const outputPath = path.join(testOutputDir, 'test_all_undefined.png');
    const symbolsPath = path.join(__dirname, '../public/img/symbols');

    // This should not crash and use fallback colors
    await expect(
      drawFlag(allUndefinedSeed, -1, [outputPath], symbolsPath)
    ).resolves.not.toThrow();

    // Check that file was created
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  test('should handle empty array colors', async () => {
    // Create a seed with empty arrays
    const emptyArraySeed = [
      [[], [255, 0, 0], [], [0, 255, 0], [0, 0, 255]],
      0, // division
      0  // overlay
    ];

    const outputPath = path.join(testOutputDir, 'test_empty_arrays.png');
    const symbolsPath = path.join(__dirname, '../public/img/symbols');

    // This should not crash
    await expect(
      drawFlag(emptyArraySeed, -1, [outputPath], symbolsPath)
    ).resolves.not.toThrow();

    // Check that file was created
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  test('should handle valid seed from generateSeed', async () => {
    // Generate a valid seed
    const validSeed = generateSeed();

    const outputPath = path.join(testOutputDir, 'test_valid_seed.png');
    const symbolsPath = path.join(__dirname, '../public/img/symbols');

    // This should work perfectly
    await expect(
      drawFlag(validSeed, -1, [outputPath], symbolsPath)
    ).resolves.not.toThrow();

    // Check that file was created
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  test('should handle non-array color values', async () => {
    // Create a seed with non-array values
    const nonArraySeed = [
      ["not an array", [255, 0, 0], null, [0, 255, 0], [0, 0, 255]],
      0, // division
      0  // overlay
    ];

    const outputPath = path.join(testOutputDir, 'test_non_array.png');
    const symbolsPath = path.join(__dirname, '../public/img/symbols');

    // This should not crash and use fallback colors
    await expect(
      drawFlag(nonArraySeed, -1, [outputPath], symbolsPath)
    ).resolves.not.toThrow();

    // Check that file was created
    expect(fs.existsSync(outputPath)).toBe(true);
  });
});
