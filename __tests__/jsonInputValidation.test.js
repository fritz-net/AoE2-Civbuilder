/**
 * Test for JSON input validation in mod creation endpoints
 * 
 * This test suite validates that the server properly handles invalid or missing
 * JSON fields in POST requests, preventing crashes from JSON.parse errors.
 */

describe('JSON Input Validation', () => {
  describe('random_json.js createJson function', () => {
    const { createJson, DEFAULT_MODIFIERS } = require('../process_mod/random/random_json.js');
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    
    let testDir;
    
    beforeEach(() => {
      testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'json-validation-test-'));
    });
    
    afterEach(() => {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    });
    
    it('should handle undefined modifiers gracefully', () => {
      const outputPath = path.join(testDir, 'data.json');
      const randomCivs = 'true';
      const modifiers = undefined;
      
      // Should not throw an error
      expect(() => {
        createJson(outputPath, randomCivs, modifiers);
      }).not.toThrow();
      
      // Verify the JSON file was created with default modifiers
      expect(fs.existsSync(outputPath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      expect(data.modifiers).toBeDefined();
      expect(data.modifiers).toEqual(DEFAULT_MODIFIERS);
    });
    
    it('should handle string "undefined" modifiers gracefully', () => {
      const outputPath = path.join(testDir, 'data.json');
      const randomCivs = 'true';
      const modifiers = 'undefined';
      
      // Should not throw an error
      expect(() => {
        createJson(outputPath, randomCivs, modifiers);
      }).not.toThrow();
      
      // Verify the JSON file was created with default modifiers
      expect(fs.existsSync(outputPath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      expect(data.modifiers).toBeDefined();
      expect(data.modifiers).toEqual(DEFAULT_MODIFIERS);
    });
    
    it('should handle null modifiers gracefully', () => {
      const outputPath = path.join(testDir, 'data.json');
      const randomCivs = 'true';
      const modifiers = null;
      
      // Should not throw an error
      expect(() => {
        createJson(outputPath, randomCivs, modifiers);
      }).not.toThrow();
      
      // Verify the JSON file was created with default modifiers
      expect(fs.existsSync(outputPath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      expect(data.modifiers).toBeDefined();
      expect(data.modifiers).toEqual(DEFAULT_MODIFIERS);
    });
    
    it('should handle invalid JSON string modifiers gracefully', () => {
      const outputPath = path.join(testDir, 'data.json');
      const randomCivs = 'true';
      const modifiers = '{invalid json}';
      
      // Should not throw an error
      expect(() => {
        createJson(outputPath, randomCivs, modifiers);
      }).not.toThrow();
      
      // Verify the JSON file was created with default modifiers
      expect(fs.existsSync(outputPath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      expect(data.modifiers).toBeDefined();
      expect(data.modifiers).toEqual(DEFAULT_MODIFIERS);
    });
    
    it('should accept valid modifiers JSON string', () => {
      const outputPath = path.join(testDir, 'data.json');
      const randomCivs = 'true';
      const validModifiers = {
        randomCosts: true,
        hp: 1.5,
        speed: 2.0,
        blind: true,
        infinity: true,
        building: 0.5
      };
      const modifiers = JSON.stringify(validModifiers);
      
      // Should not throw an error
      expect(() => {
        createJson(outputPath, randomCivs, modifiers);
      }).not.toThrow();
      
      // Verify the JSON file was created with the provided modifiers
      expect(fs.existsSync(outputPath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      expect(data.modifiers).toEqual(validModifiers);
    });
  });
});
