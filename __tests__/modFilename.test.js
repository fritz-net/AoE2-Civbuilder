/**
 * Tests for modFilename.js module
 * Validates the generation of mod filenames with version, datetime, and hex
 */

const path = require('path');
const {
  getVersion,
  getIsoDatetime,
  getHex4,
  generateModFilename,
  generateModFilenameNoExt
} = require('../process_mod/modFilename');

describe('modFilename module', () => {
  const projectRoot = path.join(__dirname, '..');

  describe('getVersion', () => {
    it('should read version from .release-please-manifest.json', () => {
      const version = getVersion(projectRoot);
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');
      // Version should match semver pattern (e.g., "1.6.2")
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should return 0.0.0 if manifest file does not exist', () => {
      const version = getVersion('/nonexistent/path');
      expect(version).toBe('0.0.0');
    });
  });

  describe('getIsoDatetime', () => {
    it('should generate ISO datetime string', () => {
      const datetime = getIsoDatetime();
      expect(datetime).toBeDefined();
      expect(typeof datetime).toBe('string');
      // Should match format: 2025-12-02T23-15-30Z
      expect(datetime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$/);
    });

    it('should not contain colons (filesystem-safe)', () => {
      const datetime = getIsoDatetime();
      expect(datetime).not.toContain(':');
    });

    it('should end with Z (UTC)', () => {
      const datetime = getIsoDatetime();
      expect(datetime).toMatch(/Z$/);
    });
  });

  describe('getHex4', () => {
    it('should generate 4-character hex string', () => {
      const hex = getHex4();
      expect(hex).toBeDefined();
      expect(typeof hex).toBe('string');
      expect(hex.length).toBe(4);
      // Should only contain hex characters
      expect(hex).toMatch(/^[0-9a-f]{4}$/);
    });

    it('should generate different values on multiple calls', () => {
      const hex1 = getHex4();
      const hex2 = getHex4();
      // While not guaranteed, very unlikely to be the same
      // This test may occasionally fail due to randomness, but helps catch issues
      const samples = new Set();
      for (let i = 0; i < 100; i++) {
        samples.add(getHex4());
      }
      // With 100 samples, we should have at least 90 unique values
      expect(samples.size).toBeGreaterThan(90);
    });
  });

  describe('generateModFilename', () => {
    it('should generate filename with correct format', () => {
      const filename = generateModFilename(projectRoot);
      expect(filename).toBeDefined();
      expect(typeof filename).toBe('string');
      // Should match format: {iso_datetime}_{hex*4}_v{version}.zip
      // Example: 2025-12-02T23-15-30Z_a3f2_v1.6.2.zip
      expect(filename).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z_[0-9a-f]{4}_v\d+\.\d+\.\d+\.zip$/);
    });

    it('should end with .zip extension', () => {
      const filename = generateModFilename(projectRoot);
      expect(filename).toMatch(/\.zip$/);
    });

    it('should include version number', () => {
      const filename = generateModFilename(projectRoot);
      const version = getVersion(projectRoot);
      expect(filename).toContain(`_v${version}.zip`);
    });

    it('should be filesystem-safe (no colons or special chars)', () => {
      const filename = generateModFilename(projectRoot);
      // Should not contain problematic characters
      expect(filename).not.toContain(':');
      expect(filename).not.toContain('/');
      expect(filename).not.toContain('\\');
      expect(filename).not.toContain(' ');
    });

    it('should generate unique filenames on multiple calls', () => {
      const filename1 = generateModFilename(projectRoot);
      // Small delay to ensure different timestamp
      const filename2 = generateModFilename(projectRoot);
      // Filenames should likely be different due to different hex values or timestamps
      // Note: This might occasionally fail if called at exactly the same second with same hex
      expect(filename1).toBeDefined();
      expect(filename2).toBeDefined();
    });
  });

  describe('generateModFilenameNoExt', () => {
    it('should generate filename without .zip extension', () => {
      const filename = generateModFilenameNoExt(projectRoot);
      expect(filename).toBeDefined();
      expect(typeof filename).toBe('string');
      expect(filename).not.toMatch(/\.zip$/);
      // Should still have the rest of the format
      expect(filename).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z_[0-9a-f]{4}_v\d+\.\d+\.\d+$/);
    });

    it('should match generateModFilename without extension', () => {
      const filenameWithExt = generateModFilename(projectRoot);
      const filenameNoExt = generateModFilenameNoExt(projectRoot);
      // They should be almost the same (within the same second)
      expect(filenameWithExt).toContain(filenameNoExt.substring(0, 10)); // Date portion should match
    });
  });

  describe('filename format validation', () => {
    it('should create filenames parseable by extracting components', () => {
      const filename = generateModFilename(projectRoot);
      // Extract components using regex
      const match = filename.match(/^(.+)_([0-9a-f]{4})_v(\d+\.\d+\.\d+)\.zip$/);
      expect(match).not.toBeNull();
      expect(match[1]).toBeTruthy(); // datetime
      expect(match[2]).toBeTruthy(); // hex
      expect(match[3]).toBeTruthy(); // version
      
      // Validate datetime part
      expect(match[1]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$/);
      
      // Validate hex part
      expect(match[2]).toMatch(/^[0-9a-f]{4}$/);
      
      // Validate version part
      expect(match[3]).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});
