const icons = require('../process_mod/random/random_icon.js');
const path = require('path');
const fs = require('fs');
const os = require('os');

describe('Flag Color Validation', () => {
  let tempDir;

  beforeEach(() => {
    // Create a temporary directory for test outputs
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flag-test-'));
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('should throw error when colour_palette is undefined', async () => {
    const seed = [undefined, 0, 0];
    const symbol = 0;
    const outputPath = path.join(tempDir, 'test.png');
    const inputPath = path.join(__dirname, '..', 'public', 'img', 'symbols');

    await expect(
      icons.drawFlag(seed, symbol, [outputPath], inputPath)
    ).rejects.toThrow('colour_palette must be an array with at least 5 color entries');
  });

  test('should throw error when colour_palette is null', async () => {
    const seed = [null, 0, 0];
    const symbol = 0;
    const outputPath = path.join(tempDir, 'test.png');
    const inputPath = path.join(__dirname, '..', 'public', 'img', 'symbols');

    await expect(
      icons.drawFlag(seed, symbol, [outputPath], inputPath)
    ).rejects.toThrow('colour_palette must be an array with at least 5 color entries');
  });

  test('should throw error when colour_palette is not an array', async () => {
    const seed = ["not an array", 0, 0];
    const symbol = 0;
    const outputPath = path.join(tempDir, 'test.png');
    const inputPath = path.join(__dirname, '..', 'public', 'img', 'symbols');

    await expect(
      icons.drawFlag(seed, symbol, [outputPath], inputPath)
    ).rejects.toThrow('colour_palette must be an array with at least 5 color entries');
  });

  test('should throw error when colour_palette has less than 5 entries', async () => {
    const seed = [[[255, 0, 0], [0, 255, 0]], 0, 0]; // Only 2 colors
    const symbol = 0;
    const outputPath = path.join(tempDir, 'test.png');
    const inputPath = path.join(__dirname, '..', 'public', 'img', 'symbols');

    await expect(
      icons.drawFlag(seed, symbol, [outputPath], inputPath)
    ).rejects.toThrow('colour_palette must be an array with at least 5 color entries');
  });

  test('should throw error when a color entry is undefined', async () => {
    const seed = [[[255, 0, 0], undefined, [0, 0, 255], [255, 255, 0], [0, 255, 255]], 0, 0];
    const symbol = 0;
    const outputPath = path.join(tempDir, 'test.png');
    const inputPath = path.join(__dirname, '..', 'public', 'img', 'symbols');

    await expect(
      icons.drawFlag(seed, symbol, [outputPath], inputPath)
    ).rejects.toThrow('colour_palette[1] must be an array with 3 RGB values');
  });

  test('should throw error when a color entry is not an array', async () => {
    const seed = [[[255, 0, 0], "not an array", [0, 0, 255], [255, 255, 0], [0, 255, 255]], 0, 0];
    const symbol = 0;
    const outputPath = path.join(tempDir, 'test.png');
    const inputPath = path.join(__dirname, '..', 'public', 'img', 'symbols');

    await expect(
      icons.drawFlag(seed, symbol, [outputPath], inputPath)
    ).rejects.toThrow('colour_palette[1] must be an array with 3 RGB values');
  });

  test('should throw error when a color entry has less than 3 values', async () => {
    const seed = [[[255, 0, 0], [0, 255], [0, 0, 255], [255, 255, 0], [0, 255, 255]], 0, 0];
    const symbol = 0;
    const outputPath = path.join(tempDir, 'test.png');
    const inputPath = path.join(__dirname, '..', 'public', 'img', 'symbols');

    await expect(
      icons.drawFlag(seed, symbol, [outputPath], inputPath)
    ).rejects.toThrow('colour_palette[1] must be an array with 3 RGB values');
  });

  test('should successfully generate flag with valid colour_palette', async () => {
    const validSeed = [
      [[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [0, 255, 255]],
      0, // division
      0  // overlay
    ];
    const symbol = -1; // No symbol
    const outputPath = path.join(tempDir, 'test.png');
    const inputPath = path.join(__dirname, '..', 'public', 'img', 'symbols');

    await expect(
      icons.drawFlag(validSeed, symbol, [outputPath], inputPath)
    ).resolves.not.toThrow();

    // Verify the file was created
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  test('should handle randomly generated seeds', () => {
    const seed = icons.generateSeed();
    
    // Verify the structure of generated seed
    expect(seed).toHaveLength(3);
    expect(Array.isArray(seed[0])).toBe(true);
    expect(seed[0]).toHaveLength(5);
    
    // Verify all colors are valid RGB arrays
    for (let i = 0; i < 5; i++) {
      expect(Array.isArray(seed[0][i])).toBe(true);
      expect(seed[0][i]).toHaveLength(3);
      expect(typeof seed[0][i][0]).toBe('number');
      expect(typeof seed[0][i][1]).toBe('number');
      expect(typeof seed[0][i][2]).toBe('number');
    }
    
    // Verify division and overlay are numbers in valid range
    expect(typeof seed[1]).toBe('number');
    expect(seed[1]).toBeGreaterThanOrEqual(0);
    expect(seed[1]).toBeLessThan(12);
    
    expect(typeof seed[2]).toBe('number');
    expect(seed[2]).toBeGreaterThanOrEqual(0);
    expect(seed[2]).toBeLessThan(12);
  });
});
