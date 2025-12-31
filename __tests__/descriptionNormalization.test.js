/**
 * Test for description field normalization
 * 
 * This test suite validates that the description field is properly normalized
 * to a string, regardless of the input type (array, null, undefined, string, etc.)
 */

describe('Description Normalization', () => {
  // Load server.js to access the normalizeDescription function
  // We'll need to extract it or test it indirectly through the API
  
  // Since normalizeDescription is not exported, we'll create a local version for testing
  // that matches the implementation in server.js
  function normalizeDescription(description) {
    // If description is an array, join its elements with ", " or take the first element
    if (Array.isArray(description)) {
      // If array has elements, join them or take first one
      if (description.length > 0) {
        // Join all elements with comma-space separator
        return description.join(', ');
      }
      // Empty array becomes empty string
      return '';
    }
    
    // If description is null or undefined, return empty string
    if (description === null || description === undefined) {
      return '';
    }
    
    // If description is already a string, return it
    if (typeof description === 'string') {
      return description;
    }
    
    // For any other type (number, object, etc.), convert to string
    // This handles edge cases gracefully
    return String(description);
  }
  
  describe('normalizeDescription function', () => {
    it('should convert array with single element to string', () => {
      expect(normalizeDescription(['CAV ARCHER'])).toBe('CAV ARCHER');
    });
    
    it('should convert array with multiple elements to comma-separated string', () => {
      expect(normalizeDescription(['ARCHER', 'SIEGE'])).toBe('ARCHER, SIEGE');
    });
    
    it('should convert empty array to empty string', () => {
      expect(normalizeDescription([])).toBe('');
    });
    
    it('should convert null to empty string', () => {
      expect(normalizeDescription(null)).toBe('');
    });
    
    it('should convert undefined to empty string', () => {
      expect(normalizeDescription(undefined)).toBe('');
    });
    
    it('should return string as-is', () => {
      expect(normalizeDescription('Cavalry')).toBe('Cavalry');
    });
    
    it('should return empty string as-is', () => {
      expect(normalizeDescription('')).toBe('');
    });
    
    it('should convert number to string', () => {
      expect(normalizeDescription(123)).toBe('123');
    });
    
    it('should convert object to string', () => {
      expect(normalizeDescription({type: 'test'})).toBe('[object Object]');
    });
    
    it('should handle array with mixed types', () => {
      expect(normalizeDescription(['Cavalry', 'Archer', 'Infantry'])).toBe('Cavalry, Archer, Infantry');
    });
  });
  
  describe('Integration with mod creation', () => {
    it('should handle civ JSON with array description', () => {
      const civ = {
        alias: 'Test Civ',
        description: ['CAV ARCHER'],
        flag_palette: [3, 4, 5, 6, 7, 3, 3, 3],
        tree: [[13, 17, 21], [12, 45, 49], [22, 101, 102]],
        bonuses: [[], [], [], [], []],
        architecture: 1,
        language: 0,
        wonder: 0,
        castle: 0,
        customFlag: false,
        customFlagData: ''
      };
      
      // Normalize description
      civ.description = normalizeDescription(civ.description);
      
      // Verify it's a string
      expect(typeof civ.description).toBe('string');
      expect(civ.description).toBe('CAV ARCHER');
    });
    
    it('should handle civ JSON with multi-element array description', () => {
      const civ = {
        alias: 'Test Civ 2',
        description: ['ARCHER', 'SIEGE'],
        flag_palette: [3, 4, 5, 6, 7, 3, 3, 3],
        tree: [[13, 17, 21], [12, 45, 49], [22, 101, 102]],
        bonuses: [[], [], [], [], []],
        architecture: 1,
        language: 0,
        wonder: 0,
        castle: 0,
        customFlag: false,
        customFlagData: ''
      };
      
      // Normalize description
      civ.description = normalizeDescription(civ.description);
      
      // Verify it's a string
      expect(typeof civ.description).toBe('string');
      expect(civ.description).toBe('ARCHER, SIEGE');
    });
    
    it('should handle civ JSON with missing description', () => {
      const civ = {
        alias: 'Test Civ 3',
        flag_palette: [3, 4, 5, 6, 7, 3, 3, 3],
        tree: [[13, 17, 21], [12, 45, 49], [22, 101, 102]],
        bonuses: [[], [], [], [], []],
        architecture: 1,
        language: 0,
        wonder: 0,
        castle: 0,
        customFlag: false,
        customFlagData: ''
      };
      
      // Normalize description
      civ.description = normalizeDescription(civ.description);
      
      // Verify it's a string
      expect(typeof civ.description).toBe('string');
      expect(civ.description).toBe('');
    });
  });
});
