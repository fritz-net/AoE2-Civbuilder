/**
 * Test for random_icon.js module
 * 
 * This test suite validates the random icon generation functionality
 * using pure JS libraries (pngjs) instead of the native canvas package.
 */

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const { getRandomInt, generateSeed, drawFlag } = require("../process_mod/random/random_icon.js");

describe("Random Icon Generation", () => {
  const testOutputDir = "/tmp/test_random_icons";
  const symbolsDir = path.join(__dirname, "..", "public", "img", "symbols");

  beforeAll(() => {
    // Create test output directory
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test output directory
    if (fs.existsSync(testOutputDir)) {
      const files = fs.readdirSync(testOutputDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(testOutputDir, file));
      });
      fs.rmdirSync(testOutputDir);
    }
  });

  describe("getRandomInt function", () => {
    it("should return a number between 0 and n-1", () => {
      for (let i = 0; i < 100; i++) {
        const result = getRandomInt(10);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(10);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it("should return 0 for n=1", () => {
      expect(getRandomInt(1)).toBe(0);
    });

    it("should handle larger values of n", () => {
      for (let i = 0; i < 50; i++) {
        const result = getRandomInt(1000);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(1000);
      }
    });
  });

  describe("generateSeed function", () => {
    it("should return an array with 3 elements", () => {
      const seed = generateSeed();
      expect(Array.isArray(seed)).toBe(true);
      expect(seed.length).toBe(3);
    });

    it("should return colour_palette, division, and overlay", () => {
      const seed = generateSeed();
      const [colour_palette, division, overlay] = seed;

      // Check colour palette is an array of 5 colors
      expect(Array.isArray(colour_palette)).toBe(true);
      expect(colour_palette.length).toBe(5);

      // Each color should be an array of 3 RGB values
      colour_palette.forEach((color) => {
        expect(Array.isArray(color)).toBe(true);
        expect(color.length).toBe(3);
        color.forEach((value) => {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(255);
        });
      });

      // Division should be 0-11
      expect(division).toBeGreaterThanOrEqual(0);
      expect(division).toBeLessThan(12);

      // Overlay should be 0-11
      expect(overlay).toBeGreaterThanOrEqual(0);
      expect(overlay).toBeLessThan(12);
    });

    it("should generate different seeds", () => {
      const seeds = [];
      for (let i = 0; i < 10; i++) {
        seeds.push(generateSeed());
      }

      // Check that not all seeds are identical
      const allSame = seeds.every((seed, idx) => {
        if (idx === 0) return true;
        return (
          seed[1] === seeds[0][1] &&
          seed[2] === seeds[0][2] &&
          JSON.stringify(seed[0]) === JSON.stringify(seeds[0][0])
        );
      });

      expect(allSame).toBe(false);
    });
  });

  describe("drawFlag function", () => {
    it("should create a PNG file without symbol", async () => {
      const seed = generateSeed();
      const outputPath = path.join(testOutputDir, "test_flag_no_symbol.png");

      await drawFlag(seed, -1, [outputPath], symbolsDir);

      // Check file exists
      expect(fs.existsSync(outputPath)).toBe(true);

      // Check it's a valid PNG
      const buffer = fs.readFileSync(outputPath);
      const png = PNG.sync.read(buffer);
      expect(png.width).toBe(256);
      expect(png.height).toBe(256);
    });

    it("should create a PNG file with symbol", async () => {
      // Check if symbol files exist
      const symbolPath = path.join(symbolsDir, "symbol_0.png");
      if (!fs.existsSync(symbolPath)) {
        console.warn("Symbol files not found, skipping symbol test");
        return;
      }

      const seed = generateSeed();
      const outputPath = path.join(testOutputDir, "test_flag_with_symbol.png");

      await drawFlag(seed, 0, [outputPath], symbolsDir);

      // Check file exists
      expect(fs.existsSync(outputPath)).toBe(true);

      // Check it's a valid PNG
      const buffer = fs.readFileSync(outputPath);
      const png = PNG.sync.read(buffer);
      expect(png.width).toBe(256);
      expect(png.height).toBe(256);
    });

    it("should write to multiple output paths", async () => {
      const seed = generateSeed();
      const outputPath1 = path.join(testOutputDir, "test_flag_multi_1.png");
      const outputPath2 = path.join(testOutputDir, "test_flag_multi_2.png");

      await drawFlag(seed, -1, [outputPath1, outputPath2], symbolsDir);

      // Check both files exist
      expect(fs.existsSync(outputPath1)).toBe(true);
      expect(fs.existsSync(outputPath2)).toBe(true);

      // Check they are identical
      const buffer1 = fs.readFileSync(outputPath1);
      const buffer2 = fs.readFileSync(outputPath2);
      expect(buffer1.equals(buffer2)).toBe(true);
    });

    it("should handle all division patterns (0-11)", async () => {
      for (let division = 0; division < 12; division++) {
        const colour_palette = [
          [255, 0, 0],
          [0, 255, 0],
          [0, 0, 255],
          [255, 255, 0],
          [0, 0, 0],
        ];
        const seed = [colour_palette, division, 0];
        const outputPath = path.join(testOutputDir, `test_division_${division}.png`);

        await drawFlag(seed, -1, [outputPath], symbolsDir);

        expect(fs.existsSync(outputPath)).toBe(true);
        const buffer = fs.readFileSync(outputPath);
        const png = PNG.sync.read(buffer);
        expect(png.width).toBe(256);
        expect(png.height).toBe(256);
      }
    });

    it("should handle all overlay patterns (0-11)", async () => {
      for (let overlay = 0; overlay < 12; overlay++) {
        const colour_palette = [
          [255, 0, 0],
          [0, 255, 0],
          [0, 0, 255],
          [255, 255, 0],
          [0, 0, 0],
        ];
        const seed = [colour_palette, 0, overlay];
        const outputPath = path.join(testOutputDir, `test_overlay_${overlay}.png`);

        await drawFlag(seed, -1, [outputPath], symbolsDir);

        expect(fs.existsSync(outputPath)).toBe(true);
        const buffer = fs.readFileSync(outputPath);
        const png = PNG.sync.read(buffer);
        expect(png.width).toBe(256);
        expect(png.height).toBe(256);
      }
    });

    it("should apply colors from the seed correctly", async () => {
      const colour_palette = [
        [255, 0, 0],    // red
        [0, 255, 0],    // green
        [0, 0, 255],    // blue
        [255, 255, 0],  // yellow
        [0, 0, 0],      // black
      ];
      const seed = [colour_palette, 0, 0]; // Solid red background, no overlay
      const outputPath = path.join(testOutputDir, "test_color_check.png");

      await drawFlag(seed, -1, [outputPath], symbolsDir);

      const buffer = fs.readFileSync(outputPath);
      const png = PNG.sync.read(buffer);

      // Sample a few pixels to verify they're red (or close to it)
      const checkPixel = (x, y) => {
        const idx = (png.width * y + x) << 2;
        return {
          r: png.data[idx],
          g: png.data[idx + 1],
          b: png.data[idx + 2],
          a: png.data[idx + 3],
        };
      };

      // Check center pixel should be red
      const centerPixel = checkPixel(128, 128);
      expect(centerPixel.r).toBe(255);
      expect(centerPixel.g).toBe(0);
      expect(centerPixel.b).toBe(0);
      expect(centerPixel.a).toBe(255);
    });
  });
});
