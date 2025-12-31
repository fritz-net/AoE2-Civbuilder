/**
 * Test for processing JSON files with array descriptions (issue reproduction)
 * 
 * This test reproduces the bug from the GitHub issue where JSON files with
 * array descriptions (like ["CAV ARCHER"]) cause errors during mod creation.
 */

const fs = require('fs');
const path = require('path');
const { normalizeDescription } = require('../process_mod/civDataUtils.js');

describe('Issue: Array Description Bug', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const cumansPath = path.join(fixturesDir, 'better-cumans.json');
  const britonsPath = path.join(fixturesDir, 'better-britons-drill.json');
  
  it('should process better-cumans.json with array description', () => {
    const jsonData = JSON.parse(fs.readFileSync(cumansPath, 'utf8'));
    
    // Verify the issue: description is an array
    expect(Array.isArray(jsonData.description)).toBe(true);
    expect(jsonData.description).toEqual(['CAV ARCHER']);
    
    // Apply the fix
    jsonData.description = normalizeDescription(jsonData.description);
    
    // Verify the fix works
    expect(typeof jsonData.description).toBe('string');
    expect(jsonData.description).toBe('CAV ARCHER');
  });
  
  it('should process better-britons-drill.json with multi-element array description', () => {
    const jsonData = JSON.parse(fs.readFileSync(britonsPath, 'utf8'));
    
    // Verify the issue: description is an array
    expect(Array.isArray(jsonData.description)).toBe(true);
    expect(jsonData.description).toEqual(['ARCHER', 'SIEGE']);
    
    // Apply the fix
    jsonData.description = normalizeDescription(jsonData.description);
    
    // Verify the fix works
    expect(typeof jsonData.description).toBe('string');
    expect(jsonData.description).toBe('ARCHER, SIEGE');
  });
  
  it('should handle multiple civs with array descriptions in presets', () => {
    // Simulate the presets format used by the server
    const presets = {
      presets: []
    };
    
    // Load the two problematic JSONs
    const cumans = JSON.parse(fs.readFileSync(cumansPath, 'utf8'));
    const britons = JSON.parse(fs.readFileSync(britonsPath, 'utf8'));
    
    presets.presets.push(cumans);
    presets.presets.push(britons);
    
    // Apply the normalization fix to all civs
    for (let i = 0; i < presets.presets.length; i++) {
      presets.presets[i].description = normalizeDescription(presets.presets[i].description);
    }
    
    // Verify all descriptions are strings
    expect(typeof presets.presets[0].description).toBe('string');
    expect(presets.presets[0].description).toBe('CAV ARCHER');
    
    expect(typeof presets.presets[1].description).toBe('string');
    expect(presets.presets[1].description).toBe('ARCHER, SIEGE');
  });
  
  it('should generate valid mod_data.description array with normalized strings', () => {
    // Simulate the mod creation process
    const civs = [
      JSON.parse(fs.readFileSync(cumansPath, 'utf8')),
      JSON.parse(fs.readFileSync(britonsPath, 'utf8'))
    ];
    
    const mod_data = {
      description: []
    };
    
    // Apply normalization and populate mod_data (as done in server.js)
    for (let i = 0; i < civs.length; i++) {
      civs[i].description = normalizeDescription(civs[i].description);
      mod_data.description.push(civs[i].description);
    }
    
    // Verify mod_data has correct structure
    expect(mod_data.description).toHaveLength(2);
    expect(mod_data.description[0]).toBe('CAV ARCHER');
    expect(mod_data.description[1]).toBe('ARCHER, SIEGE');
    
    // All descriptions should be strings
    mod_data.description.forEach(desc => {
      expect(typeof desc).toBe('string');
    });
  });
});
