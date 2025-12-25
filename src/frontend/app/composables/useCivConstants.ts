/**
 * Civilization-related constants
 * Shared constants used across the application
 */

// Civ Bonus IDs
// CIV_BONUS_356_PASTURES_REPLACE_FARMS_AND_MILL_UPGRADES
// "Pastures replace Farms and Mill upgrades"
// When this bonus is selected, we should show Pasture building and pasture techs instead of Farm and farm techs
export const PASTURES_BONUS_ID = 356

// Default flag palette used when initializing new civilizations
// Format: [color1, color2, color3, color4, color5, division, overlay, symbol]
export const DEFAULT_FLAG_PALETTE = [3, 4, 5, 6, 7, 3, 3, 3] as const
