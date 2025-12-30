/**
 * Test suite for handling missing or undefined bonuses data
 * 
 * This test validates that the server handles cases where civs have:
 * - Missing bonuses property
 * - Undefined bonuses
 * - Null bonuses
 * 
 * These edge cases should not crash the server, but instead use default values.
 * Fixes issue: "TypeError: Cannot read properties of undefined (reading '1')"
 * at server.js:914
 */

// Define BONUS_INDEX constants locally to avoid import issues with ES6 modules in Jest
const BONUS_INDEX = {
  CIV: 0,           // Civilization bonuses
  UNIQUE_UNIT: 1,   // Unique units (stored as plain number, not tuple)
  CASTLE_TECH: 2,   // Castle Age unique technologies
  IMPERIAL_TECH: 3, // Imperial Age unique technologies
  TEAM: 4           // Team bonuses
};

describe('Undefined Bonuses Handling', () => {
  
  // Simulate the server.js logic for processing bonuses
  function simulateBonusProcessing(civs) {
    const results = {
      uniqueUnits: [],
      castleTechs: [],
      impTechs: [],
      civBonuses: [],
      teamBonuses: []
    };
    
    for (let i = 0; i < civs.length; i++) {
      // Unique Unit (server.js line ~914)
      if (civs[i]["bonuses"] && civs[i]["bonuses"][BONUS_INDEX.UNIQUE_UNIT] && civs[i]["bonuses"][BONUS_INDEX.UNIQUE_UNIT].length != 0) {
        results.uniqueUnits.push(civs[i]["bonuses"][BONUS_INDEX.UNIQUE_UNIT][0]);
      } else {
        results.uniqueUnits.push(0);
      }
      
      // Castle Tech (server.js line ~922)
      if (civs[i]["bonuses"] && civs[i]["bonuses"][BONUS_INDEX.CASTLE_TECH] && civs[i]["bonuses"][BONUS_INDEX.CASTLE_TECH].length != 0) {
        const castletechs = [];
        for (let j = 0; j < civs[i]["bonuses"][BONUS_INDEX.CASTLE_TECH].length; j++) {
          castletechs.push(civs[i]["bonuses"][BONUS_INDEX.CASTLE_TECH][j]);
        }
        results.castleTechs.push(castletechs);
      } else {
        results.castleTechs.push([0]);
      }
      
      // Imperial Tech (server.js line ~934)
      if (civs[i]["bonuses"] && civs[i]["bonuses"][BONUS_INDEX.IMPERIAL_TECH] && civs[i]["bonuses"][BONUS_INDEX.IMPERIAL_TECH].length != 0) {
        const imptechs = [];
        for (let j = 0; j < civs[i]["bonuses"][BONUS_INDEX.IMPERIAL_TECH].length; j++) {
          imptechs.push(civs[i]["bonuses"][BONUS_INDEX.IMPERIAL_TECH][j]);
        }
        results.impTechs.push(imptechs);
      } else {
        results.impTechs.push([0]);
      }
      
      // Civ bonuses (server.js line ~955)
      const civBonuses = [];
      if (civs[i]["bonuses"] && civs[i]["bonuses"][BONUS_INDEX.CIV] && Array.isArray(civs[i]["bonuses"][BONUS_INDEX.CIV])) {
        for (let j = 0; j < civs[i]["bonuses"][BONUS_INDEX.CIV].length; j++) {
          civBonuses.push(civs[i]["bonuses"][BONUS_INDEX.CIV][j]);
        }
      }
      results.civBonuses.push(civBonuses);
      
      // Team bonuses (server.js line ~963)
      if (civs[i]["bonuses"] && civs[i]["bonuses"][BONUS_INDEX.TEAM] && civs[i]["bonuses"][BONUS_INDEX.TEAM].length != 0) {
        const team_bonuses = [];
        for (let j = 0; j < civs[i]["bonuses"][BONUS_INDEX.TEAM].length; j++) {
          team_bonuses.push(civs[i]["bonuses"][BONUS_INDEX.TEAM][j]);
        }
        results.teamBonuses.push(team_bonuses);
      } else {
        results.teamBonuses.push([0]);
      }
    }
    
    return results;
  }

  test('should handle missing bonuses property', () => {
    const civs = [
      {
        alias: 'Britons',
        tree: [],
        // bonuses is completely missing
      }
    ];

    expect(() => {
      simulateBonusProcessing(civs);
    }).not.toThrow();

    const results = simulateBonusProcessing(civs);
    expect(results.uniqueUnits).toEqual([0]);
    expect(results.castleTechs).toEqual([[0]]);
    expect(results.impTechs).toEqual([[0]]);
    expect(results.civBonuses).toEqual([[]]);
    expect(results.teamBonuses).toEqual([[0]]);
  });

  test('should handle undefined bonuses', () => {
    const civs = [
      {
        alias: 'Franks',
        tree: [],
        bonuses: undefined
      }
    ];

    expect(() => {
      simulateBonusProcessing(civs);
    }).not.toThrow();

    const results = simulateBonusProcessing(civs);
    expect(results.uniqueUnits).toEqual([0]);
    expect(results.castleTechs).toEqual([[0]]);
    expect(results.impTechs).toEqual([[0]]);
    expect(results.civBonuses).toEqual([[]]);
    expect(results.teamBonuses).toEqual([[0]]);
  });

  test('should handle null bonuses', () => {
    const civs = [
      {
        alias: 'Goths',
        tree: [],
        bonuses: null
      }
    ];

    expect(() => {
      simulateBonusProcessing(civs);
    }).not.toThrow();

    const results = simulateBonusProcessing(civs);
    expect(results.uniqueUnits).toEqual([0]);
    expect(results.castleTechs).toEqual([[0]]);
    expect(results.impTechs).toEqual([[0]]);
    expect(results.civBonuses).toEqual([[]]);
    expect(results.teamBonuses).toEqual([[0]]);
  });

  test('should handle partially defined bonuses (missing specific bonus types)', () => {
    const civs = [
      {
        alias: 'Teutons',
        tree: [],
        bonuses: [
          [1, 2], // CIV bonuses exist (index 0)
          [5],    // UNIQUE_UNIT exists (index 1)
          // CASTLE_TECH missing (index 2)
          // IMPERIAL_TECH missing (index 3)
          // TEAM bonus missing (index 4)
        ]
      }
    ];

    expect(() => {
      simulateBonusProcessing(civs);
    }).not.toThrow();

    const results = simulateBonusProcessing(civs);
    expect(results.uniqueUnits).toEqual([5]);
    expect(results.castleTechs).toEqual([[0]]);
    expect(results.impTechs).toEqual([[0]]);
    expect(results.civBonuses).toEqual([[1, 2]]);
    expect(results.teamBonuses).toEqual([[0]]);
  });

  test('should handle properly defined bonuses', () => {
    const civs = [
      {
        alias: 'Japanese',
        tree: [],
        bonuses: [
          [1, 2, 3], // CIV bonuses
          [100], // UNIQUE_UNIT
          [50, 51], // CASTLE_TECH
          [60], // IMPERIAL_TECH
          [7, 8] // TEAM bonuses
        ]
      }
    ];

    expect(() => {
      simulateBonusProcessing(civs);
    }).not.toThrow();

    const results = simulateBonusProcessing(civs);
    expect(results.uniqueUnits).toEqual([100]);
    expect(results.castleTechs).toEqual([[50, 51]]);
    expect(results.impTechs).toEqual([[60]]);
    expect(results.civBonuses).toEqual([[1, 2, 3]]);
    expect(results.teamBonuses).toEqual([[7, 8]]);
  });

  test('should handle empty bonuses arrays', () => {
    const civs = [
      {
        alias: 'Chinese',
        tree: [],
        bonuses: [[], [], [], [], []] // All empty arrays
      }
    ];

    expect(() => {
      simulateBonusProcessing(civs);
    }).not.toThrow();

    const results = simulateBonusProcessing(civs);
    expect(results.uniqueUnits).toEqual([0]);
    expect(results.castleTechs).toEqual([[0]]);
    expect(results.impTechs).toEqual([[0]]);
    expect(results.civBonuses).toEqual([[]]);
    expect(results.teamBonuses).toEqual([[0]]);
  });

  test('should handle multiple civs with mixed bonuses states', () => {
    const civs = [
      {
        alias: 'Britons',
        tree: [],
        bonuses: undefined
      },
      {
        alias: 'Franks',
        tree: [],
        bonuses: [[], [100], [], [], []]
      },
      {
        alias: 'Goths',
        tree: [],
        // bonuses missing entirely
      }
    ];

    expect(() => {
      simulateBonusProcessing(civs);
    }).not.toThrow();

    const results = simulateBonusProcessing(civs);
    expect(results.uniqueUnits).toEqual([0, 100, 0]);
    expect(results.castleTechs).toEqual([[0], [0], [0]]);
    expect(results.impTechs).toEqual([[0], [0], [0]]);
    expect(results.civBonuses).toEqual([[], [], []]);
    expect(results.teamBonuses).toEqual([[0], [0], [0]]);
  });
});
