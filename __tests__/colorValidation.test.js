const { drawFlag } = require('../process_mod/random/random_icon.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Color Validation in Flag Generation', () => {
  const testDir = path.join(os.tmpdir(), 'color-validation-test');
  const testOutput = path.join(testDir, 'test-flag.png');
  const symbolsPath = path.join(__dirname, '..', 'public', 'img', 'symbols');

  beforeEach(() => {
    // Create test directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testOutput)) {
      fs.unlinkSync(testOutput);
    }
  });

  test('should reject seed with undefined color', async () => {
    // Seed with an undefined color (simulating colours[15] which doesn't exist)
    const invalidSeed = [
      [
        [0, 0, 0],      // color 0: valid
        undefined,      // color 1: invalid - this should cause error
        [255, 0, 0],    // color 2: valid
        [0, 255, 0],    // color 3: valid
        [0, 0, 255],    // color 4: valid
      ],
      0, // division
      0  // overlay
    ];

    await expect(
      drawFlag(invalidSeed, -1, [testOutput], symbolsPath)
    ).rejects.toThrow('Invalid colour_palette[1]');
  });

  test('should reject seed with invalid color structure', async () => {
    // Seed with a color that's not a 3-element array
    const invalidSeed = [
      [
        [0, 0, 0],      // color 0: valid
        [255, 0],       // color 1: invalid - only 2 elements
        [255, 0, 0],    // color 2: valid
        [0, 255, 0],    // color 3: valid
        [0, 0, 255],    // color 4: valid
      ],
      0, // division
      0  // overlay
    ];

    await expect(
      drawFlag(invalidSeed, -1, [testOutput], symbolsPath)
    ).rejects.toThrow('Invalid colour_palette[1]');
  });

  test('should accept valid seed with proper colors', async () => {
    // Valid seed with all proper colors
    const validSeed = [
      [
        [0, 0, 0],      // color 0: black
        [255, 255, 255], // color 1: white
        [255, 0, 0],    // color 2: red
        [0, 255, 0],    // color 3: green
        [0, 0, 255],    // color 4: blue
      ],
      0, // division: solid color
      0  // overlay: no overlay
    ];

    // Should not throw
    await expect(
      drawFlag(validSeed, -1, [testOutput], symbolsPath)
    ).resolves.not.toThrow();

    // Check that the file was created
    expect(fs.existsSync(testOutput)).toBe(true);
  });

  test('should reject seed with insufficient colors', async () => {
    // Seed with only 3 colors instead of 5
    const invalidSeed = [
      [
        [0, 0, 0],
        [255, 255, 255],
        [255, 0, 0],
      ],
      0,
      0
    ];

    await expect(
      drawFlag(invalidSeed, -1, [testOutput], symbolsPath)
    ).rejects.toThrow('Invalid colour_palette');
  });
});
