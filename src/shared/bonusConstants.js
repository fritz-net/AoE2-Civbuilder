/**
 * Constants for bonus array indices in the civ configuration
 * These indices are used throughout the codebase to access different bonus types
 * in the civConfig.bonuses array
 */

// Bonus type indices
export const BONUS_INDEX = {
  CIV: 0,           // Civilization bonuses
  UNIQUE_UNIT: 1,   // Unique units (stored as plain number, not tuple)
  CASTLE_TECH: 2,   // Castle Age unique technologies
  IMPERIAL_TECH: 3, // Imperial Age unique technologies
  TEAM: 4           // Team bonuses
};

// For backwards compatibility with Node.js require()
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BONUS_INDEX };
}
