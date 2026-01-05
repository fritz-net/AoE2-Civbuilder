/**
 * Composable for mapping civilization bonuses to tech tree units/techs
 * These bonuses grant units/techs for free, so they should appear with 0 cost in the techtree
 */

// Bonus ID Constants
export const BONUS_ID_TURTLE_SHIP = 50
export const BONUS_ID_LONGBOAT = 51
export const BONUS_ID_IMPERIAL_CAMEL = 53
export const BONUS_ID_SLINGER = 61
export const BONUS_ID_FEITORIA = 68
export const BONUS_ID_CARAVEL = 69
export const BONUS_ID_KREPOST = 93
export const BONUS_ID_DONJON = 109
export const BONUS_ID_MISSIONARY = 142
export const BONUS_ID_WARRIOR_PRIEST = 193
export const BONUS_ID_HOUFNICE = 286
export const BONUS_ID_THIRISADAI = 298
export const BONUS_ID_SHRIVAMSHA_RIDER = 299
export const BONUS_ID_CAMEL_SCOUT = 300
export const BONUS_ID_WAR_CHARIOT = 337
export const BONUS_ID_JIAN_SWORDSMAN = 343
export const BONUS_ID_XIANBEI_RAIDER = 348
export const BONUS_ID_GRENADIER = 355
export const BONUS_ID_PASTURES = 356
export const BONUS_ID_MOUNTED_TREBUCHET = 361
export const BONUS_ID_FOLWARK = 280
export const BONUS_ID_WINGED_HUSSAR = 282
export const BONUS_ID_LEGIONARY = 307
export const BONUS_ID_SAVAR = 314
export const BONUS_ID_FORTIFIED_CHURCH = 316

export interface BonusTechMapping {
  bonusId: number
  bonusType: 'civ' | 'uu' | 'castle' | 'imp' | 'team'
  units?: number[]  // Unit IDs that are granted by this bonus
  techs?: number[]  // Tech IDs that are granted by this bonus
  buildings?: number[]  // Building IDs that are granted by this bonus
  requiresPrerequisites?: boolean // If true, all prerequisites must also be enabled
  prerequisites?: {
    units?: number[]  // Prerequisite units that must be enabled (with cost)
    techs?: number[]  // Prerequisite techs that must be enabled (with cost)
  }
  replaces?: {
    units?: number[]  // Unit IDs that this bonus replaces (hides/disables)
    buildings?: number[]  // Building IDs that this bonus replaces (hides/disables)
  }
}

/**
 * Mapping of bonuses to the units/techs they grant
 * Bonus IDs are indices in the cardDescriptions array in useBonusData.ts
 */
export const BONUS_TECH_MAPPINGS: BonusTechMapping[] = [
  // CIV_BONUS_50: "Can train Turtle Ships in docks"
  {
    bonusId: 50,
    bonusType: 'civ',
    units: [831, 832],  // Turtle Ship + Elite Turtle Ship (auto-enable elite)
  },
  
  // CIV_BONUS_51: "Can recruit Longboats from docks"
  {
    bonusId: 51,
    bonusType: 'civ',
    units: [250, 533],  // Longboat + Elite Longboat (auto-enable elite) - Elite ID is 533 not 251
  },
  
  // CIV_BONUS_53: "Can upgrade Heavy Camel Riders to Imperial Camel Riders"
  {
    bonusId: 53,
    bonusType: 'civ',
    units: [207],  // Imperial Camel Rider
    requiresPrerequisites: true,  // Requires Heavy Camel Rider
    prerequisites: {
      units: [329, 330],  // Camel Rider, Heavy Camel Rider
    },
  },
  
  // CIV_BONUS_61: "Can recruit slingers from Archery Ranges"
  {
    bonusId: 61,
    bonusType: 'civ',
    units: [185],  // Slinger
  },
  
  // CIV_BONUS_193: "Can recruit Warrior Priests"
  {
    bonusId: 193,
    bonusType: 'civ',
    units: [1811],  // Warrior Priest
  },
  
  // CIV_BONUS_286: "Can upgrade Bombard Cannons to Houfnice"
  {
    bonusId: 286,
    bonusType: 'civ',
    units: [1709],  // Houfnice
    requiresPrerequisites: true,  // Requires Bombard Cannon
    prerequisites: {
      units: [36],  // Bombard Cannon
      techs: [47],  // Chemistry (required by both Bombard Cannon and Houfnice)
    },
  },
  
  // CIV_BONUS_299: "Can recruit Shrivamsha Riders"
  {
    bonusId: 299,
    bonusType: 'civ',
    units: [1751, 1753],  // Shrivamsha Rider + Elite Shrivamsha Rider (auto-enable elite)
  },
  
  // CIV_BONUS_300: "Can recruit Camel Scouts in Feudal Age"
  {
    bonusId: 300,
    bonusType: 'civ',
    units: [1755],  // Camel Scout
  },
  
  // CIV_BONUS_308: "Can upgrade Heavy Scorpions to Imperial Scorpions"
  // Note: Imperial Scorpion unit ID not found in current data - might be future content
  // Placeholder for when it's added
  {
    bonusId: 308,
    bonusType: 'civ',
    units: [],  // TODO: Add Imperial Scorpion unit ID when available
    requiresPrerequisites: true,  // Requires Heavy Scorpion
  },
  
  // CIV_BONUS_309: "Can upgrade Elite Battle Elephants to Royal Battle Elephants"
  // Note: Royal Battle Elephant unit ID not found in current data - might be future content
  // Placeholder for when it's added
  {
    bonusId: 309,
    bonusType: 'civ',
    units: [],  // TODO: Add Royal Battle Elephant unit ID when available
    requiresPrerequisites: true,  // Requires Elite Battle Elephant
  },
  
  // CIV_BONUS_310: "Can upgrade Elite Steppe Lancers to Royal Lancers"
  // Note: Royal Lancer unit ID not found in current data - might be future content
  // Placeholder for when it's added
  {
    bonusId: 310,
    bonusType: 'civ',
    units: [],  // TODO: Add Royal Lancer unit ID when available
    requiresPrerequisites: true,  // Requires Elite Steppe Lancer
  },
  
  // CIV_BONUS_337: "Can recruit War Chariots" - NO ELITE VERSION EXISTS
  {
    bonusId: 337,
    bonusType: 'civ',
    units: [1962],  // War Chariot only (no elite version in game)
  },
  
  // CIV_BONUS_343: "Can recruit Jian Swordsmen" - NO ELITE VERSION EXISTS
  {
    bonusId: 343,
    bonusType: 'civ',
    units: [1974],  // Jian Swordsman only (no elite version in game)
  },
  
  // CIV_BONUS_348: "Can recruit Xianbei Raiders" - NO ELITE VERSION EXISTS
  {
    bonusId: 348,
    bonusType: 'civ',
    units: [1952],  // Xianbei Raider only (no elite version in game)
  },
  
  // CIV_BONUS_355: "Can recruit Grenadiers"
  {
    bonusId: 355,
    bonusType: 'civ',
    units: [1911],  // Grenadier
  },
  
  // CIV_BONUS_356: "Pastures replace Farms and Mill upgrades"
  {
    bonusId: 356,
    bonusType: 'civ',
    buildings: [1889],  // Pasture building
  },
  
  // CIV_BONUS_298: "Can train Thirisadai in docks"
  {
    bonusId: 298,
    bonusType: 'civ',
    units: [1750],  // Thirisadai
  },
  
  // CIV_BONUS_361: "Can train Mounted Trebuchets"
  {
    bonusId: 361,
    bonusType: 'civ',
    units: [1923],  // Mounted Trebuchet - NOT Traction Trebuchet (1942 is a different unit)
  },
  
  // CIV_BONUS_142: "Missionaries can be trained in monasteries"
  {
    bonusId: 142,
    bonusType: 'civ',
    units: [775],  // Missionary
  },
  
  // CIV_BONUS_280: "Folwark replaces Mill"
  {
    bonusId: 280,
    bonusType: 'civ',
    buildings: [1734],  // Folwark
    replaces: {
      buildings: [68],  // Mill
    },
  },
  
  // CIV_BONUS_282: "Winged Hussar replaces Hussar"
  {
    bonusId: 282,
    bonusType: 'civ',
    units: [1707],  // Winged Hussar
    requiresPrerequisites: true,
    prerequisites: {
      // these should NOT be removed because then we could have scout cavalry without light cavalry enabled
      units: [448, 546],  // Scout Cavalry, Light Cavalry (full chain)
    },
    replaces: {
      units: [441],  // Hussar
    },
  },
  
  // CIV_BONUS_307: "Legionary replaces Two-Handed Swordsman and Champion"
  {
    bonusId: 307,
    bonusType: 'civ',
    units: [1793],  // Legionary
    requiresPrerequisites: true,
    prerequisites: {
      units: [75, 77],  // Man-at-Arms, Long Swordsman
    },
    replaces: {
      units: [473, 567],  // Two-Handed Swordsman, Champion
    },
  },
  
  // CIV_BONUS_314: "Savar replaces Paladin"
  {
    bonusId: 314,
    bonusType: 'civ',
    units: [1813],  // Savar
    requiresPrerequisites: true,
    prerequisites: {
      // these should NOT be removed because then we could have Cavalier without Knight enabled
      units: [38, 283],  // Knight, Cavalier (full chain)
    },
    replaces: {
      units: [569],  // Paladin
    },
  },
  
  // CIV_BONUS_316: "Fortified Church replaces Monastery"
  {
    bonusId: 316,
    bonusType: 'civ',
    buildings: [1806],  // Fortified Church
    replaces: {
      buildings: [104],  // Monastery
    },
  },
  
  // CIV_BONUS_68: "Can build Feitoria"
  {
    bonusId: 68,
    bonusType: 'civ',
    buildings: [1021],  // Feitoria
  },
  
  // CIV_BONUS_69: "Can build Caravels"
  {
    bonusId: 69,
    bonusType: 'civ',
    units: [1004, 1006],  // Caravel + Elite Caravel (auto-enable elite)
  },
  
  // CIV_BONUS_93: "Can build Krepost"
  {
    bonusId: 93,
    bonusType: 'civ',
    buildings: [1251],  // Krepost
  },
  
  // CIV_BONUS_109: "Can build Donjon"
  {
    bonusId: 109,
    bonusType: 'civ',
    buildings: [1665],  // Donjon
  },
]

/**
 * Get units/techs granted by a specific bonus
 */
export function getUnitsGrantedByBonus(bonusId: number, bonusType: 'civ' | 'uu' | 'castle' | 'imp' | 'team'): number[] {
  const mapping = BONUS_TECH_MAPPINGS.find(m => m.bonusId === bonusId && m.bonusType === bonusType)
  return mapping?.units || []
}

/**
 * Get techs granted by a specific bonus
 */
export function getTechsGrantedByBonus(bonusId: number, bonusType: 'civ' | 'uu' | 'castle' | 'imp' | 'team'): number[] {
  const mapping = BONUS_TECH_MAPPINGS.find(m => m.bonusId === bonusId && m.bonusType === bonusType)
  return mapping?.techs || []
}

/**
 * Get buildings granted by a specific bonus
 */
export function getBuildingsGrantedByBonus(bonusId: number, bonusType: 'civ' | 'uu' | 'castle' | 'imp' | 'team'): number[] {
  const mapping = BONUS_TECH_MAPPINGS.find(m => m.bonusId === bonusId && m.bonusType === bonusType)
  return mapping?.buildings || []
}

/**
 * Check if a bonus requires prerequisites to be enabled
 */
export function bonusRequiresPrerequisites(bonusId: number, bonusType: 'civ' | 'uu' | 'castle' | 'imp' | 'team'): boolean {
  const mapping = BONUS_TECH_MAPPINGS.find(m => m.bonusId === bonusId && m.bonusType === bonusType)
  return mapping?.requiresPrerequisites || false
}

/**
 * Get all units/techs/buildings granted by a list of selected bonuses
 * Returns separate sets for free entities (0 cost) and prerequisite entities (with cost)
 */
export function getAllGrantedEntities(selectedBonuses: Map<string, { id: number; count: number }[]>): {
  free: {
    units: Set<number>
    techs: Set<number>
    buildings: Set<number>
  }
  prerequisites: {
    units: Set<number>
    techs: Set<number>
  }
  replaces: {
    units: Set<number>
    buildings: Set<number>
  }
} {
  const result = {
    free: {
      units: new Set<number>(),
      techs: new Set<number>(),
      buildings: new Set<number>(),
    },
    prerequisites: {
      units: new Set<number>(),
      techs: new Set<number>(),
    },
    replaces: {
      units: new Set<number>(),
      buildings: new Set<number>(),
    },
  }
  
  // Iterate through all bonus types
  for (const [bonusType, bonusList] of selectedBonuses.entries()) {
    const type = bonusType as 'civ' | 'uu' | 'castle' | 'imp' | 'team'
    
    for (const bonus of bonusList) {
      const mapping = BONUS_TECH_MAPPINGS.find(m => m.bonusId === bonus.id && m.bonusType === type)
      if (!mapping) continue
      
      // Add the granted entities (free - 0 cost)
      mapping.units?.forEach(id => result.free.units.add(id))
      mapping.techs?.forEach(id => result.free.techs.add(id))
      mapping.buildings?.forEach(id => result.free.buildings.add(id))
      
      // Add prerequisites (with cost) if they exist
      // Check both requiresPrerequisites flag and existence of prerequisites (defensive)
      if (mapping.prerequisites && (mapping.requiresPrerequisites || mapping.prerequisites.units || mapping.prerequisites.techs)) {
        mapping.prerequisites.units?.forEach(id => result.prerequisites.units.add(id))
        mapping.prerequisites.techs?.forEach(id => result.prerequisites.techs.add(id))
      }
      
      // Add replaced entities (units/buildings that should be hidden)
      if (mapping.replaces) {
        mapping.replaces.units?.forEach(id => result.replaces.units.add(id))
        mapping.replaces.buildings?.forEach(id => result.replaces.buildings.add(id))
      }
    }
  }
  
  return result
}

export function useBonusTechMapping() {
  return {
    BONUS_TECH_MAPPINGS,
    getUnitsGrantedByBonus,
    getTechsGrantedByBonus,
    getBuildingsGrantedByBonus,
    bonusRequiresPrerequisites,
    getAllGrantedEntities,
  }
}
