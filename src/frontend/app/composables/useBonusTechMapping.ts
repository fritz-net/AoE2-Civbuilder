/**
 * Composable for mapping civilization bonuses to tech tree units/techs
 * These bonuses grant units/techs for free, so they should appear with 0 cost in the techtree
 */

export interface BonusTechMapping {
  bonusId: number
  bonusType: 'civ' | 'uu' | 'castle' | 'imp' | 'team'
  units?: number[]  // Unit IDs that are granted by this bonus
  techs?: number[]  // Tech IDs that are granted by this bonus
  buildings?: number[]  // Building IDs that are granted by this bonus
  requiresPrerequisites?: boolean // If true, all prerequisites must also be enabled
}

/**
 * Mapping of bonuses to the units/techs they grant
 * Bonus IDs are indices in the cardDescriptions array in useBonusData.ts
 */
export const BONUS_TECH_MAPPINGS: BonusTechMapping[] = [
  // CIV_BONUS_51: "Can recruit Longboats from docks"
  {
    bonusId: 51,
    bonusType: 'civ',
    units: [250],  // Longboat
  },
  
  // CIV_BONUS_53: "Can upgrade Heavy Camel Riders to Imperial Camel Riders"
  {
    bonusId: 53,
    bonusType: 'civ',
    units: [207],  // Imperial Camel Rider
    requiresPrerequisites: true,  // Requires Heavy Camel Rider
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
  },
  
  // CIV_BONUS_299: "Can recruit Shrivamsha Riders"
  {
    bonusId: 299,
    bonusType: 'civ',
    units: [1751],  // Shrivamsha Rider
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
  
  // CIV_BONUS_337: "Can recruit War Chariots"
  {
    bonusId: 337,
    bonusType: 'civ',
    units: [1962],  // War Chariot
  },
  
  // CIV_BONUS_343: "Can recruit Jian Swordsmen"
  {
    bonusId: 343,
    bonusType: 'civ',
    units: [1974],  // Jian Swordsman
  },
  
  // CIV_BONUS_348: "Can recruit Xianbei Raiders"
  {
    bonusId: 348,
    bonusType: 'civ',
    units: [1952],  // Xianbei Raider
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
 * Returns a map of entity type to entity IDs with 0 cost
 */
export function getAllGrantedEntities(selectedBonuses: Map<string, { id: number; count: number }[]>): {
  units: Set<number>
  techs: Set<number>
  buildings: Set<number>
} {
  const result = {
    units: new Set<number>(),
    techs: new Set<number>(),
    buildings: new Set<number>(),
  }
  
  // Iterate through all bonus types
  for (const [bonusType, bonusList] of selectedBonuses.entries()) {
    const type = bonusType as 'civ' | 'uu' | 'castle' | 'imp' | 'team'
    
    for (const bonus of bonusList) {
      const units = getUnitsGrantedByBonus(bonus.id, type)
      const techs = getTechsGrantedByBonus(bonus.id, type)
      const buildings = getBuildingsGrantedByBonus(bonus.id, type)
      
      units.forEach(id => result.units.add(id))
      techs.forEach(id => result.techs.add(id))
      buildings.forEach(id => result.buildings.add(id))
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
