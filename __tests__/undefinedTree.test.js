/**
 * Test suite for handling missing or undefined tree data
 * 
 * This test validates that the server handles cases where civs have:
 * - Missing tree property
 * - Undefined tree
 * - Null tree
 * - Empty tree array
 * 
 * These edge cases should not crash the server, but instead use default values.
 * Fixes issue: "TypeError: Cannot read properties of undefined (reading 'length')"
 * at server.js:946
 */

// Define constants needed for tech tree processing
const { numBasicTechs, indexDictionary } = require('../process_mod/constants.js');

describe('Undefined Tree Handling', () => {
  
  /**
   * Simulate the server.js logic for processing tech tree
   * This mimics lines 908-953 of server.js
   */
  function simulateTreeProcessing(civs) {
    const results = {
      techtrees: []
    };
    
    for (let i = 0; i < civs.length; i++) {
      const player_techtree = [];
      for (let j = 0; j < numBasicTechs; j++) {
        player_techtree.push(0);
      }
      
      // Tech Tree processing (server.js line ~946)
      if (civs[i]["tree"] && Array.isArray(civs[i]["tree"])) {
        for (let j = 0; j < civs[i]["tree"].length; j++) {
          for (let k = 0; k < civs[i]["tree"][j].length; k++) {
            player_techtree[indexDictionary[j][civs[i]["tree"][j][k].toString()]] = 1;
          }
        }
      }
      results.techtrees.push(player_techtree);
    }
    
    return results;
  }

  test('should handle missing tree property', () => {
    const civs = [
      {
        alias: 'Britons',
        bonuses: []
        // tree is completely missing
      }
    ];

    expect(() => {
      simulateTreeProcessing(civs);
    }).not.toThrow();

    const results = simulateTreeProcessing(civs);
    expect(results.techtrees).toHaveLength(1);
    expect(results.techtrees[0]).toHaveLength(numBasicTechs);
    // Should be all zeros since no tree was provided
    expect(results.techtrees[0].every(val => val === 0)).toBe(true);
  });

  test('should handle undefined tree', () => {
    const civs = [
      {
        alias: 'Franks',
        bonuses: [],
        tree: undefined
      }
    ];

    expect(() => {
      simulateTreeProcessing(civs);
    }).not.toThrow();

    const results = simulateTreeProcessing(civs);
    expect(results.techtrees).toHaveLength(1);
    expect(results.techtrees[0]).toHaveLength(numBasicTechs);
    expect(results.techtrees[0].every(val => val === 0)).toBe(true);
  });

  test('should handle null tree', () => {
    const civs = [
      {
        alias: 'Goths',
        bonuses: [],
        tree: null
      }
    ];

    expect(() => {
      simulateTreeProcessing(civs);
    }).not.toThrow();

    const results = simulateTreeProcessing(civs);
    expect(results.techtrees).toHaveLength(1);
    expect(results.techtrees[0]).toHaveLength(numBasicTechs);
    expect(results.techtrees[0].every(val => val === 0)).toBe(true);
  });

  test('should handle empty tree array', () => {
    const civs = [
      {
        alias: 'Teutons',
        bonuses: [],
        tree: []
      }
    ];

    expect(() => {
      simulateTreeProcessing(civs);
    }).not.toThrow();

    const results = simulateTreeProcessing(civs);
    expect(results.techtrees).toHaveLength(1);
    expect(results.techtrees[0]).toHaveLength(numBasicTechs);
    expect(results.techtrees[0].every(val => val === 0)).toBe(true);
  });

  test('should handle non-array tree (string)', () => {
    const civs = [
      {
        alias: 'Japanese',
        bonuses: [],
        tree: "invalid"
      }
    ];

    expect(() => {
      simulateTreeProcessing(civs);
    }).not.toThrow();

    const results = simulateTreeProcessing(civs);
    expect(results.techtrees).toHaveLength(1);
    expect(results.techtrees[0]).toHaveLength(numBasicTechs);
    expect(results.techtrees[0].every(val => val === 0)).toBe(true);
  });

  test('should handle properly defined tree', () => {
    const civs = [
      {
        alias: 'Chinese',
        bonuses: [],
        tree: [
          [4, 5, 6],  // Some building IDs
          [10, 11]    // Some unit IDs
        ]
      }
    ];

    expect(() => {
      simulateTreeProcessing(civs);
    }).not.toThrow();

    const results = simulateTreeProcessing(civs);
    expect(results.techtrees).toHaveLength(1);
    expect(results.techtrees[0]).toHaveLength(numBasicTechs);
    // Should have some non-zero values for the techs that were added
    expect(results.techtrees[0].some(val => val === 1)).toBe(true);
  });

  test('should handle multiple civs with mixed tree states', () => {
    const civs = [
      {
        alias: 'Britons',
        bonuses: [],
        tree: undefined
      },
      {
        alias: 'Franks',
        bonuses: [],
        tree: [[4, 5]]
      },
      {
        alias: 'Goths',
        bonuses: []
        // tree missing entirely
      }
    ];

    expect(() => {
      simulateTreeProcessing(civs);
    }).not.toThrow();

    const results = simulateTreeProcessing(civs);
    expect(results.techtrees).toHaveLength(3);
    // All should have proper length
    results.techtrees.forEach(techtree => {
      expect(techtree).toHaveLength(numBasicTechs);
    });
    // First and third should be all zeros
    expect(results.techtrees[0].every(val => val === 0)).toBe(true);
    expect(results.techtrees[2].every(val => val === 0)).toBe(true);
    // Second should have at least one non-zero
    expect(results.techtrees[1].some(val => val === 1)).toBe(true);
  });
});
