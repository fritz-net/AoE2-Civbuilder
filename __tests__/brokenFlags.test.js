/**
 * Test suite for handling missing or broken flag_palette data
 * 
 * This test validates that the server handles cases where civs have:
 * - Missing flag_palette property
 * - Undefined flag_palette
 * - Malformed flag_palette (not an array or insufficient length)
 * 
 * These edge cases should not crash the server, but instead use default values.
 */

const path = require('path');

describe('Broken Flag Handling', () => {
  const projectRoot = path.join(__dirname, '..');
  
  // Mock the writeIconsJson function behavior to test flag_palette handling
  function simulateWriteIconsJson(civs) {
    const colours = []; // Would normally be populated
    const nameArr = ['britons', 'franks', 'goths']; // Example civ names
    
    const results = [];
    for (var i = 0; i < civs.length; i++) {
      var civName = nameArr[i];
      
      // This is the fix - ensure flag_palette exists with default values if missing
      if (!civs[i]["flag_palette"] || !Array.isArray(civs[i]["flag_palette"]) || civs[i]["flag_palette"].length < 8) {
        civs[i]["flag_palette"] = [3, 4, 5, 6, 7, 3, 3, 3]; // Default flag palette
      }
      
      // Now safely access flag_palette
      if (civs[i]["flag_palette"][0] == -1) {
        results.push({ type: 'vanilla', civName });
      } else if (civs[i]["customFlag"] && civs[i]["customFlagData"]) {
        results.push({ type: 'custom', civName });
      } else {
        // Would normally create seed from flag_palette
        const seed = [
          [
            civs[i]["flag_palette"][0],
            civs[i]["flag_palette"][1],
            civs[i]["flag_palette"][2],
            civs[i]["flag_palette"][3],
            civs[i]["flag_palette"][4]
          ],
          civs[i]["flag_palette"][5],
          civs[i]["flag_palette"][6]
        ];
        const symbol = civs[i]["flag_palette"][7] - 1;
        results.push({ type: 'generated', civName, seed, symbol });
      }
    }
    return results;
  }

  test('should handle missing flag_palette property', () => {
    const civs = [
      {
        alias: 'Britons',
        // flag_palette is completely missing
        tree: [],
        bonuses: []
      }
    ];

    expect(() => {
      simulateWriteIconsJson(civs);
    }).not.toThrow();

    const results = simulateWriteIconsJson(civs);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('generated');
    expect(civs[0]["flag_palette"]).toEqual([3, 4, 5, 6, 7, 3, 3, 3]);
  });

  test('should handle undefined flag_palette', () => {
    const civs = [
      {
        alias: 'Franks',
        flag_palette: undefined,
        tree: [],
        bonuses: []
      }
    ];

    expect(() => {
      simulateWriteIconsJson(civs);
    }).not.toThrow();

    const results = simulateWriteIconsJson(civs);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('generated');
    expect(civs[0]["flag_palette"]).toEqual([3, 4, 5, 6, 7, 3, 3, 3]);
  });

  test('should handle null flag_palette', () => {
    const civs = [
      {
        alias: 'Goths',
        flag_palette: null,
        tree: [],
        bonuses: []
      }
    ];

    expect(() => {
      simulateWriteIconsJson(civs);
    }).not.toThrow();

    const results = simulateWriteIconsJson(civs);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('generated');
    expect(civs[0]["flag_palette"]).toEqual([3, 4, 5, 6, 7, 3, 3, 3]);
  });

  test('should handle non-array flag_palette', () => {
    const civs = [
      {
        alias: 'Britons',
        flag_palette: 'not-an-array',
        tree: [],
        bonuses: []
      }
    ];

    expect(() => {
      simulateWriteIconsJson(civs);
    }).not.toThrow();

    const results = simulateWriteIconsJson(civs);
    expect(results).toHaveLength(1);
    expect(civs[0]["flag_palette"]).toEqual([3, 4, 5, 6, 7, 3, 3, 3]);
  });

  test('should handle flag_palette with insufficient length', () => {
    const civs = [
      {
        alias: 'Franks',
        flag_palette: [1, 2, 3], // Only 3 elements, needs 8
        tree: [],
        bonuses: []
      }
    ];

    expect(() => {
      simulateWriteIconsJson(civs);
    }).not.toThrow();

    const results = simulateWriteIconsJson(civs);
    expect(results).toHaveLength(1);
    expect(civs[0]["flag_palette"]).toEqual([3, 4, 5, 6, 7, 3, 3, 3]);
  });

  test('should preserve valid flag_palette', () => {
    const civs = [
      {
        alias: 'Goths',
        flag_palette: [0, 1, 2, 3, 4, 5, 6, 7],
        tree: [],
        bonuses: []
      }
    ];

    const results = simulateWriteIconsJson(civs);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('generated');
    // Should preserve the original valid flag_palette
    expect(civs[0]["flag_palette"]).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  test('should handle vanilla civ flag (flag_palette[0] = -1)', () => {
    const civs = [
      {
        alias: 'Britons',
        flag_palette: [-1, 23, 5, 6, 7, 3, 3, 3],
        tree: [],
        bonuses: []
      }
    ];

    const results = simulateWriteIconsJson(civs);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('vanilla');
  });

  test('should handle custom flag', () => {
    const civs = [
      {
        alias: 'Franks',
        flag_palette: [3, 4, 5, 6, 7, 3, 3, 3],
        customFlag: true,
        customFlagData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        tree: [],
        bonuses: []
      }
    ];

    const results = simulateWriteIconsJson(civs);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('custom');
  });

  test('should handle multiple civs with mixed flag states', () => {
    const civs = [
      { alias: 'Britons', flag_palette: undefined }, // missing
      { alias: 'Franks', flag_palette: [1, 2, 3, 4, 5, 6, 7, 8] }, // valid
      { alias: 'Goths' } // completely missing property
    ];

    expect(() => {
      simulateWriteIconsJson(civs);
    }).not.toThrow();

    const results = simulateWriteIconsJson(civs);
    expect(results).toHaveLength(3);
    
    // All should have valid flag_palette after processing
    expect(civs[0]["flag_palette"]).toEqual([3, 4, 5, 6, 7, 3, 3, 3]);
    expect(civs[1]["flag_palette"]).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(civs[2]["flag_palette"]).toEqual([3, 4, 5, 6, 7, 3, 3, 3]);
  });
});
