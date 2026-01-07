/**
 * Composable for managing Custom Unique Unit data and validation
 * Based on the ruleset defined in docs/CUSTOM_UU_RULESET.md
 * 
 * IMPORTANT: Keep this file in sync with docs/CUSTOM_UU_RULESET.md
 * Any rule changes should be documented in both locations.
 */

import { ref, computed, type Ref } from 'vue';

export interface ResourceCost {
  food: number;
  wood: number;
  stone: number;
  gold: number;
}

export interface AttackBonus {
  class: number;  // Armor class ID
  amount: number; // Bonus damage amount
}

export interface EliteStats {
  health: number;
  attack: number;
  meleeArmor: number;
  pierceArmor: number;
  range: number;
  speed: number;
}

export interface CustomUUData {
  type: 'custom';
  unitType: 'infantry' | 'cavalry' | 'archer' | 'siege';
  baseUnit: number;
  name: string;
  health: number;
  attack: number;
  meleeArmor: number;
  pierceArmor: number;
  attackSpeed: number;
  speed: number;
  range: number;
  minRange: number; // Minimum range (1 for ranged units, 0 for melee)
  cost: ResourceCost;
  trainTime: number;
  lineOfSight: number;
  heroMode: boolean;
  attackBonuses: AttackBonus[];
  eliteStats?: EliteStats; // Auto-calculated elite stats
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export type EditorMode = 'demo' | 'build' | 'draft';

export interface BaseUnitOption {
  id: number;
  name: string;
  type: 'infantry' | 'cavalry' | 'archer' | 'siege';
  isRanged: boolean;
  isMelee: boolean; // Some units like Throwing Axeman, Mameluk are both ranged AND melee
  uuGraphicId: number | null; // UU graphic ID for icon (0-87), null means use techtree
  techtreeIconId?: number; // Unit ID for techtree icon
  range?: number; // Override default range for this base unit
  minRange?: number; // Override default min range for this base unit
}

interface UnitTypeDefaults {
  baseUnit: number;
  health: number;
  attack: number;
  speed: number;
  range: number;
  armor: { melee: number; pierce: number };
  cost: ResourceCost;
  trainTime: number;
}

const UNIT_TYPE_DEFAULTS: Record<string, UnitTypeDefaults> = {
  infantry: {
    baseUnit: 1067, // Jaguar Warrior base
    health: 60,
    attack: 8,
    speed: 1.0,
    range: 0,
    armor: { melee: 0, pierce: 0 },
    cost: { food: 65, wood: 0, stone: 0, gold: 20 }, // Asymmetrical: more food, less gold
    trainTime: 14
  },
  cavalry: {
    baseUnit: 1721, // Knight-like base
    health: 100,
    attack: 10,
    speed: 1.35,
    range: 0,
    armor: { melee: 2, pierce: 1 },
    cost: { food: 60, wood: 0, stone: 0, gold: 85 }, // Asymmetrical: less food, more gold
    trainTime: 22
  },
  archer: {
    baseUnit: 850, // Plumed Archer base
    health: 40,
    attack: 6,
    speed: 0.96,
    range: 4,
    armor: { melee: 0, pierce: 0 },
    cost: { food: 0, wood: 55, stone: 0, gold: 20 }, // Asymmetrical: more wood, less gold
    trainTime: 18
  },
  siege: {
    baseUnit: 706, // Ram-like base
    health: 150,
    attack: 12,
    speed: 0.7,
    range: 0,
    armor: { melee: -3, pierce: 7 },
    cost: { food: 0, wood: 135, stone: 0, gold: 40 }, // Asymmetrical: much more wood, less gold
    trainTime: 36
  }
};

const ARMOR_CLASS_NAMES: Record<number, string> = {
  1: 'Infantry',
  3: 'Archers',
  4: 'Base Melee',
  5: 'Cavalry',
  8: 'Cavalry Archers',
  11: 'Buildings',
  13: 'Stone Buildings',
  15: 'Archers',
  16: 'Ships',
  19: 'Unique Units',
  20: 'Siege Weapons',
  21: 'Buildings',
  30: 'War Elephants'
};

// Base unit options for each type with UU graphic IDs
// UU IDs 0-87 map to unique unit graphics (/v2/img/unitgraphics/uu_X.jpg)
// Standard units use techtree icons (/v2/img/unitgraphics/X.jpg where X is unit ID)
// Vanilla UUs: 0=Longbow, 1=Cataphract, 2=Huskarl, 3=Teutonic, 4=Samurai, 5=War Elephant, 
// 6=Cataphract, 7=Chu Ko Nu, 8=Mameluke, 9=Janissary, 10=War Wagon, 11=Mangudai, etc.
const BASE_UNIT_OPTIONS: Record<string, BaseUnitOption[]> = {
  infantry: [
    // simple units
    { id: 1699, name: 'Flemish Militia', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: null, techtreeIconId: 1699 },
    { id: 1697, name: 'Flemish Militia Female', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: null, techtreeIconId: 1697 },

    { id: 74, name: 'Militia Line', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: null, techtreeIconId: 74 },
    { id: 75, name: 'Man-at-Arms', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: null, techtreeIconId: 75 },
    { id: 77, name: 'Longswordman', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: null, techtreeIconId: 77 },
    { id: 473, name: 'Two-Handed Swordsman', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: null, techtreeIconId: 473 },
    { id: 567, name: 'Champion', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: null, techtreeIconId: 567 },
    
    { id: 93, name: 'Spearman Line', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: null, techtreeIconId: 93 },
    { id: 358, name: 'Pikeman', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: null, techtreeIconId: 358 },
    { id: 359, name: 'Halberdier', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: null, techtreeIconId: 359 },

    { id: 751, name: 'Eagle Scout', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: null, techtreeIconId: 751 },
    { id: 753, name: 'Eagle Warrior', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: null, techtreeIconId: 753 },
    { id: 752, name: 'Elite Eagle Warrior', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: null, techtreeIconId: 752 },

    // uu based units
    { id: 725, name: 'Jaguar Warrior', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: 725 }, // elite is 725 in web techtree; 1067=Itzcoat
    { id: 232, name: 'Woad Raider', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: 534 }, // elite=534
    { id: 41, name: 'Huskarl', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: 41 }, // elite=555
    { id: 291, name: 'Samurai', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: 291 }, // elite=560
    { id: 1735, name: 'Urumi Swordsman', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: 1735 }, // elite=1737
    { id: 1016, name: 'Shotel Warrior', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: 1016 }, // elite=1018
    { id: 1747, name: 'Ghulam', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: 1747 }, // elite=1749
    { id: 1920, name: 'Liao Dao', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: 1920 }, // elite=1922
    { id: 1123, name: 'Karambit', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: 1123 }, // elite=1125
    { id: 1701, name: 'Obuch', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: 1701 }, // elite=1703
    { id: 1959, name: 'White Feather Guard', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: 1959 }, // elite=1961
    { id: 1658, name: 'Serjeant', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: 1658 }, // elite=1659
    { id: 25, name: 'Teutonic Knight', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: 25 }, // elite = 554
    { id: 692, name: 'Berserk', type: 'infantry', isRanged: false, isMelee: true, uuGraphicId: 692 }, // elite=694

    // ranged melee uu based units
    { id: 281, name: 'Throwing Axeman', type: 'infantry', isRanged: true, isMelee: true, range: 3, minRange: 0, uuGraphicId: 281 }, // Hybrid ranged+melee; elite=531
    { id: 1013, name: 'Gbeto', type: 'infantry', isRanged: true, isMelee: true, range: 5, minRange: 0, uuGraphicId: 1013 }, // Hybrid ranged+melee; elite=1015
    
    { id: 879, name: 'Kamayuk', type: 'infantry', isRanged: true, isMelee: true, range: 1, minRange: 0, uuGraphicId: 879 }, // Hybrid ranged+melee (1 range); elit=881

    // cheat based units
    // 1145 ninja
  ],
  cavalry: [
    { id: 1281, name: 'Cataphract', type: 'cavalry', isRanged: false, isMelee: true, uuGraphicId: 6 },
    { id: 1269, name: 'Boyar', type: 'cavalry', isRanged: false, isMelee: true, uuGraphicId: 22 },
    { id: 1755, name: 'War Elephant', type: 'cavalry', isRanged: false, isMelee: true, uuGraphicId: 5 },
    { id: 1132, name: 'Battle Elephant', type: 'cavalry', isRanged: false, isMelee: true, uuGraphicId: 19 },
    { id: 1663, name: 'Mameluke', type: 'cavalry', isRanged: true, isMelee: true, range: 3, minRange: 0, uuGraphicId: 8 }, // Hybrid ranged+melee
    { id: 1794, name: 'Steppe Lancer', type: 'cavalry', isRanged: true, isMelee: true, range: 1, minRange: 0, uuGraphicId: 77 }, // Hybrid ranged+melee (1 range, 0 min range)
    { id: 1721, name: 'Knight Line', type: 'cavalry', isRanged: false, isMelee: true, uuGraphicId: null, techtreeIconId: 37 }, // Knight
    { id: 207, name: 'Camel Line', type: 'cavalry', isRanged: false, isMelee: true, uuGraphicId: null, techtreeIconId: 207 },
    { id: 546, name: 'Light Cavalry', type: 'cavalry', isRanged: false, isMelee: true, uuGraphicId: null, techtreeIconId: 546 },
    { id: 441, name: 'Hussar', type: 'cavalry', isRanged: false, isMelee: true, uuGraphicId: null, techtreeIconId: 441 },

    // 1723 crusader knight
    // 1570 xolotl Warrior

  ],
  archer: [
    { id: 873, name: 'Longbowman', type: 'archer', isRanged: true, isMelee: false, uuGraphicId: 0 },
    { id: 850, name: 'Plumed Archer', type: 'archer', isRanged: true, isMelee: false, uuGraphicId: 15 },
    { id: 1225, name: 'Chu Ko Nu', type: 'archer', isRanged: true, isMelee: false, uuGraphicId: 7 },
    { id: 1231, name: 'Mangudai', type: 'archer', isRanged: true, isMelee: false, uuGraphicId: 11 },
    { id: 1036, name: 'Genitour', type: 'archer', isRanged: true, isMelee: false, uuGraphicId: 25 },
    { id: 5, name: 'Archer Line', type: 'archer', isRanged: true, isMelee: false, uuGraphicId: null, techtreeIconId: 5 },
    { id: 24, name: 'Crossbowman', type: 'archer', isRanged: true, isMelee: false, uuGraphicId: null, techtreeIconId: 24 },
    { id: 943, name: 'Cavalry Archer', type: 'archer', isRanged: true, isMelee: false, uuGraphicId: null, techtreeIconId: 943 },

    // 1800=Composite Bowman
  ],
  siege: [
    { id: 1699, name: 'War Wagon', type: 'siege', isRanged: true, isMelee: false, range: 6, minRange: 1, uuGraphicId: 10 }, // currently shows berserk, in game its felmish militia
    { id: 280, name: 'Mangonel Line', type: 'siege', isRanged: true, isMelee: false, range: 7, minRange: 3, uuGraphicId: null, techtreeIconId: 280 },
    { id: 279, name: 'Scorpion', type: 'siege', isRanged: true, isMelee: false, range: 5, minRange: 1, uuGraphicId: null, techtreeIconId: 279 },
    { id: 36, name: 'Bombard Cannon', type: 'siege', isRanged: true, isMelee: false, range: 12, minRange: 5, uuGraphicId: null, techtreeIconId: 36 },
    { id: 706, name: 'Battering Ram', type: 'siege', isRanged: false, isMelee: true, range: 0, minRange: 0, uuGraphicId: null, techtreeIconId: 706 },
  ]
};

export function useCustomUU(initialMode: EditorMode = 'demo') {
  const customUnit: Ref<CustomUUData | null> = ref(null);
  const isCustomMode = ref(false);
  const validationErrors: Ref<ValidationError[]> = ref([]);
  const editorMode: Ref<EditorMode> = ref(initialMode);
  const maxPoints: Ref<number | null> = ref(null); // null = unlimited

  const createCustomUnit = (unitType: 'infantry' | 'cavalry' | 'archer' | 'siege'): CustomUUData => {
    const defaults = UNIT_TYPE_DEFAULTS[unitType];
    const isRangedType = defaults.range > 0;
    
    // Siege units get +10 attack vs buildings for free (see CUSTOM_UU_RULESET.md)
    const bonuses: AttackBonus[] = [];
    if (unitType === 'siege') {
      bonuses.push({ class: 11, amount: 10 }); // +10 vs Buildings
    }
    
    return {
      type: 'custom',
      unitType,
      baseUnit: defaults.baseUnit,
      name: `Custom ${unitType.charAt(0).toUpperCase() + unitType.slice(1)}`,
      health: defaults.health,
      attack: defaults.attack,
      meleeArmor: defaults.armor.melee,
      pierceArmor: defaults.armor.pierce,
      attackSpeed: 2.0,
      speed: defaults.speed,
      range: defaults.range,
      minRange: isRangedType ? 1 : 0, // Start with 1 min range for ranged units, 0 for melee
      cost: { ...defaults.cost },
      trainTime: defaults.trainTime,
      lineOfSight: 5,
      heroMode: false,
      attackBonuses: bonuses
    };
  };

  const validateUnit = (unit: CustomUUData): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Name validation
    if (unit.name.length === 0 || unit.name.length > 30) {
      errors.push({
        field: 'name',
        message: 'Name must be 1-30 characters',
        severity: 'error'
      });
    }

    // Health validation (max increased to 400)
    if (unit.health < 15 || unit.health > 400) {
      errors.push({
        field: 'health',
        message: 'Health must be between 15 and 400',
        severity: 'error'
      });
    }

    // Attack validation (min changed to 1)
    if (unit.attack < 1 || unit.attack > 35) {
      errors.push({
        field: 'attack',
        message: 'Attack must be between 1 and 35',
        severity: 'error'
      });
    }

    // Armor validation
    if (unit.meleeArmor < -3 || unit.meleeArmor > 10) {
      errors.push({
        field: 'meleeArmor',
        message: 'Melee armor must be between -3 and 10',
        severity: 'error'
      });
    }

    if (unit.pierceArmor < -3 || unit.pierceArmor > 10) {
      errors.push({
        field: 'pierceArmor',
        message: 'Pierce armor must be between -3 and 10',
        severity: 'error'
      });
    }

    // Speed validation
    if (unit.speed < 0.5 || unit.speed > 1.65) {
      errors.push({
        field: 'speed',
        message: 'Speed must be between 0.5 and 1.65',
        severity: 'error'
      });
    }

    // Range validation
    if (unit.range < 0 || unit.range > 12) {
      errors.push({
        field: 'range',
        message: 'Range must be between 0 and 12',
        severity: 'error'
      });
    }

    // Min range validation
    if (unit.minRange < 0 || unit.minRange > unit.range) {
      errors.push({
        field: 'minRange',
        message: `Minimum range must be between 0 and ${unit.range}`,
        severity: 'error'
      });
    }

    // Min range should be 0 for melee-only units
    if (unit.range === 0 && unit.minRange !== 0) {
      errors.push({
        field: 'minRange',
        message: 'Minimum range must be 0 for melee units (range = 0)',
        severity: 'error'
      });
    }

    // Type-specific range validation (see CUSTOM_UU_RULESET.md)
    // Honor base unit ranges: if unit started from hybrid base unit (Throwing Axeman, Gbeto, Mameluke),
    // allow up to +2 range from base unit starting range
    const baseUnit = getBaseUnitOption(unit.baseUnit);
    const baseUnitRange = baseUnit?.range ?? 0;
    
    // Hybrid units (Throwing Axeman, Gbeto, Mameluke) can have +2 range beyond their base at 30 pts/range
    const isHybridUnit = baseUnit && baseUnit.isRanged && baseUnit.isMelee;
    const maxAllowedRange = isHybridUnit ? baseUnitRange + 2 : (unit.unitType === 'infantry' ? 5 : 5);
    
    // Infantry: generally melee (range 0) or 1 for Kamayuk
    // Throwing Axeman (base 3) and Gbeto (base 5) can have up to +2 range
    if (unit.unitType === 'infantry' && unit.range > maxAllowedRange) {
      if (isHybridUnit) {
        errors.push({
          field: 'range',
          message: `${baseUnit.name} can have up to range ${maxAllowedRange} (base ${baseUnitRange} + 2)`,
          severity: 'error'
        });
      } else {
        errors.push({
          field: 'range',
          message: 'Infantry can have range 0-5 (typical: 0=melee, 1=Kamayuk, 3=Throwing Axeman, 5=Gbeto)',
          severity: 'error'
        });
      }
    }
    
    // Cavalry: range 0 (melee), 1 for Steppe Lancer, or 3-5 for Mameluke
    // Mameluke (base 3) can have up to range 5 (base 3 + 2)
    if (unit.unitType === 'cavalry') {
      if (unit.range > maxAllowedRange) {
        if (isHybridUnit) {
          errors.push({
            field: 'range',
            message: `${baseUnit.name} can have up to range ${maxAllowedRange} (base ${baseUnitRange} + 2)`,
            severity: 'error'
          });
        } else {
          errors.push({
            field: 'range',
            message: 'Cavalry can have range 0-1 or 3-5 (typical: 0=melee, 1=Steppe Lancer, 3=Mameluke). Range 2 not allowed.',
            severity: 'error'
          });
        }
      }
      
      // Cavalry with range 2 is not allowed UNLESS it's a hybrid unit with base range >= 1
      if (unit.range === 2 && !(isHybridUnit && baseUnitRange >= 1)) {
        errors.push({
          field: 'range',
          message: 'Cavalry cannot have range 2 (gap between unit types). Use 0-1 or 3-5.',
          severity: 'error'
        });
      }
    }

    // Cost validation
    const totalCost = unit.cost.food + unit.cost.wood + unit.cost.stone + unit.cost.gold;
    if (totalCost < 30) {
      errors.push({
        field: 'cost',
        message: 'Total cost must be at least 30 resources',
        severity: 'error'
      });
    }

    // Train time validation
    if (unit.trainTime < 6 || unit.trainTime > 90) {
      errors.push({
        field: 'trainTime',
        message: 'Train time must be between 6 and 90 seconds',
        severity: 'error'
      });
    }

    // Balance warnings
    if (unit.health > 120 && unit.speed > 1.3) {
      errors.push({
        field: 'balance',
        message: 'High HP with high speed may be overpowered',
        severity: 'warning'
      });
    }

    if (unit.attack > 15 && unit.health > 100) {
      errors.push({
        field: 'balance',
        message: 'High attack with high HP may be overpowered',
        severity: 'warning'
      });
    }

    // Attack bonus validation
    const maxBonuses = unit.unitType === 'archer' || unit.unitType === 'siege' ? 4 : 3;
    if (unit.attackBonuses.length > maxBonuses) {
      errors.push({
        field: 'attackBonuses',
        message: `Maximum ${maxBonuses} attack bonuses allowed for ${unit.unitType}`,
        severity: 'error'
      });
    }

    return errors;
  };

  const calculatePowerBudget = (unit: CustomUUData): number => {
    const basePoints: Record<string, number> = {
      infantry: 50,
      cavalry: 65,
      archer: 45,
      siege: 70
    };

    let points = basePoints[unit.unitType] || 50;
    
    // Hero mode gives bonus points (allows more powerful unit)
    if (unit.heroMode) {
      points -= 30; // Hero mode gives 30 points to use
    }

    // Health contribution
    const defaults = UNIT_TYPE_DEFAULTS[unit.unitType];
    const healthDiff = unit.health - defaults.health;
    points += (healthDiff / 10) * 2;

    // Attack contribution
    const attackDiff = unit.attack - defaults.attack;
    points += attackDiff * 3;

    // Armor contribution
    points += (unit.meleeArmor - defaults.armor.melee) * 4;
    points += (unit.pierceArmor - defaults.armor.pierce) * 4;

    // Speed contribution
    const speedDiff = unit.speed - defaults.speed;
    points += (speedDiff / 0.1) * 5;

    // Attack speed contribution (lower is better, more expensive)
    const attackSpeedBonus = (2.0 - unit.attackSpeed) / 0.2;
    points += attackSpeedBonus * 6; // Increased from 3 to 6 to make it more expensive

    // Range contribution - now included in calculations
    // IMPORTANT: Make range very expensive for melee units (infantry, cavalry)
    // This prevents cheap melee units from becoming ranged easily
    // SPECIAL CASE: Hybrid units (Throwing Axeman, Gbeto, Mameluke) can increase range
    // beyond their base at 30 points per range (instead of standard 14 points)
    const baseUnit = getBaseUnitOption(unit.baseUnit);
    const baseUnitRange = baseUnit?.range ?? defaults.range;
    const isHybridUnit = baseUnit && baseUnit.isRanged && baseUnit.isMelee;
    
    const rangeDiff = unit.range - defaults.range;
    const rangeDiffFromBase = unit.range - baseUnitRange;
    let rangePoints = 0;
    
    if (rangeDiff > 0) {
      if (isHybridUnit && rangeDiffFromBase > 0) {
        // Hybrid units: charge 30 points per range beyond their base unit range
        // e.g., Throwing Axeman base 3 -> 4 = 30 pts, 5 = 60 pts
        rangePoints = rangeDiffFromBase * 30;
      } else {
        // Standard calculation: 6 base + 8 penalty for melee types
        rangePoints = rangeDiff * 6;
        
        // Extra cost for melee unit types gaining range (standard units like Militia -> ranged)
        if (unit.unitType === 'infantry' || unit.unitType === 'cavalry') {
          rangePoints += rangeDiff * 8; // Additional 8 points per range for melee types (total 14)
        }
      }
    }
    points += rangePoints;
    
    // Min range contribution - lowering min range costs points (allows closer attacks)
    // Start: ranged units have min range 1, melee have 0
    // Lowering min range from default makes unit stronger
    const defaultMinRange = defaults.range > 0 ? 1 : 0;
    const minRangeDiff = defaultMinRange - unit.minRange; // Positive = lower min range = costs points
    points += minRangeDiff * 4; // 4 points per 1 min range reduction
    
    // Train time contribution - now included in calculations
    // Lower train time = better = costs points
    const trainTimeDiff = defaults.trainTime - unit.trainTime;
    points += (trainTimeDiff / 5) * 2;

    // Attack bonuses
    unit.attackBonuses.forEach(bonus => {
      points += (bonus.amount / 5) * 8;
    });
    
    // Cost adjustments: expensive units get points, cheap units cost points
    const totalCost = unit.cost.food + unit.cost.wood + unit.cost.stone + unit.cost.gold;
    const defaultCost = defaults.cost.food + defaults.cost.wood + defaults.cost.stone + defaults.cost.gold;
    const costDiff = totalCost - defaultCost;
    
    // For every 10 resources above/below default, give/take 2 points
    points += (costDiff / 10) * 2;

    return Math.round(points);
  };

  const calculateRecommendedCost = (unit: CustomUUData): ResourceCost => {
    const points = calculatePowerBudget(unit);
    
    // Calculate base total from points
    let totalCost = Math.round(points * 1.2);
    
    // Hero units should be significantly more expensive (see CUSTOM_UU_RULESET.md)
    // Multipliers ensure that max-point heroes reach appropriate cost levels (400-600 range)
    if (unit.heroMode) {
      // Cavalry heroes get an extra multiplier to reach ~500-600 cost at max points
      if (unit.unitType === 'cavalry') {
        totalCost = Math.round(totalCost * 3.0); // Increased from 2.2x to 3.0x for proper scaling
      } else {
        totalCost = Math.round(totalCost * 2.5); // Increased from 1.8x to 2.5x
      }
    }

    // Asymmetric cost distribution based on unit type
    // Different types have different primary/secondary resource ratios
    const distributions: Record<string, { primary: number; secondary: number; resource: 'food' | 'wood' }> = {
      infantry: { primary: 0.75, secondary: 0.25, resource: 'food' }, // More food, less gold
      cavalry: { primary: 0.40, secondary: 0.60, resource: 'food' },  // Less food, more gold (expensive)
      archer: { primary: 0.70, secondary: 0.30, resource: 'wood' },   // More wood, less gold
      siege: { primary: 0.75, secondary: 0.25, resource: 'wood' }     // Much more wood, less gold
    };

    const dist = distributions[unit.unitType];
    let primaryCost = Math.round(totalCost * dist.primary);
    let secondaryCost = Math.round(totalCost * dist.secondary);

    // Hero mode cost penalty: minimum 300 for each of the 2 selected resources
    if (unit.heroMode) {
      primaryCost = Math.max(primaryCost, 300);
      secondaryCost = Math.max(secondaryCost, 300);
    }

    if (dist.resource === 'wood') {
      return { food: 0, wood: primaryCost, stone: 0, gold: secondaryCost };
    } else {
      return { food: primaryCost, wood: 0, stone: 0, gold: secondaryCost };
    }
  };

  const exportToTechtree = (unit: CustomUUData | number): any => {
    if (typeof unit === 'number') {
      return unit;
    }
    return unit;
  };

  const getArmorClassName = (classId: number): string => {
    return ARMOR_CLASS_NAMES[classId] || `Class ${classId}`;
  };

  const getBaseUnitOptions = (unitType: string): BaseUnitOption[] => {
    return BASE_UNIT_OPTIONS[unitType] || [];
  };

  const getBaseUnitOption = (baseUnitId: number): BaseUnitOption | undefined => {
    // Search through all unit types to find the base unit option
    for (const unitType in BASE_UNIT_OPTIONS) {
      const found = BASE_UNIT_OPTIONS[unitType].find(opt => opt.id === baseUnitId);
      if (found) return found;
    }
    return undefined;
  };

  const getUnitIconUrl = (option: BaseUnitOption): string => {
    if (option.uuGraphicId !== null) {
      // Use UU graphics for unique units
      return `/v2/img/unitgraphics/uu_${option.uuGraphicId}.jpg`;
    } else if (option.techtreeIconId !== undefined) {
      // Use techtree graphics for standard units
      return `/v2/img/unitgraphics/${option.techtreeIconId}.jpg`;
    }
    // Fallback to generic icon
    return `/v2/img/unitgraphics/uu_39.jpg`;
  };

  const calculateEliteStats = (unit: CustomUUData): EliteStats => {
    // Elite units get predictable improvements based on unit type
    const improvements: Record<string, Partial<EliteStats>> = {
      infantry: {
        health: Math.round(unit.health * 1.15), // +15% HP
        attack: unit.attack + 2,
        meleeArmor: unit.meleeArmor + 1,
        pierceArmor: unit.pierceArmor,
        range: unit.range,
        speed: unit.speed
      },
      cavalry: {
        health: Math.round(unit.health * 1.20), // +20% HP
        attack: unit.attack + 2,
        meleeArmor: unit.meleeArmor + 1,
        pierceArmor: unit.pierceArmor + 1,
        range: unit.range,
        speed: unit.speed
      },
      archer: {
        health: Math.round(unit.health * 1.10), // +10% HP
        attack: unit.attack + 1,
        meleeArmor: unit.meleeArmor,
        pierceArmor: unit.pierceArmor + 1,
        range: unit.range + 1, // +1 range for archers
        speed: unit.speed
      },
      siege: {
        health: Math.round(unit.health * 1.25), // +25% HP
        attack: unit.attack + 3,
        meleeArmor: unit.meleeArmor,
        pierceArmor: unit.pierceArmor + 1,
        range: unit.unitType === 'siege' && unit.range > 0 ? unit.range + 1 : unit.range,
        speed: unit.speed
      }
    };

    return improvements[unit.unitType] as EliteStats;
  };

  const setMode = (mode: EditorMode) => {
    editorMode.value = mode;
    
    // Set max points based on mode
    switch (mode) {
      case 'draft':
        maxPoints.value = 100; // Strict limit for drafts
        break;
      case 'build':
        maxPoints.value = 150; // More flexible for build mode
        break;
      case 'demo':
      default:
        maxPoints.value = null; // No limit in demo
        break;
    }
  };

  // Normal max values for each stat (HP updated to 400)
  const STAT_MAX_VALUES: Record<string, number> = {
    health: 400, // Updated from 250
    attack: 35,
    meleeArmor: 10,
    pierceArmor: 10,
    speed: 1.65,
    range: 12
  };

  const getMaxStatValue = (stat: string, unitType: string, maxPointsLimit: number | null = null, unit: CustomUnit | null = null): number => {
    // Use passed unit or fall back to composable's customUnit
    const currentUnit = unit || customUnit.value;
    const pointLimit = maxPointsLimit !== null ? maxPointsLimit : maxPoints.value;
    
    // If no max points set, return normal max
    if (!pointLimit || !currentUnit) {
      return STAT_MAX_VALUES[stat] || 100;
    }

    // Calculate remaining points
    const currentPoints = calculatePowerBudget(currentUnit);
    const pointsLeft = pointLimit - currentPoints;

    // If we're over budget, return current value
    if (pointsLeft < 0) {
      return (currentUnit as any)[stat] || 0;
    }

    // Calculate how much we can add to this stat
    // Point costs per single unit of stat
    const pointCosts: Record<string, number> = {
      health: 0.2, // 0.2 points per 1 HP (2 points per 10 HP)
      attack: 3,   // 3 points per 1 attack
      meleeArmor: 4, // 4 points per 1 armor
      pierceArmor: 4, // 4 points per 1 armor
      speed: 50,   // 50 points per 1.0 speed (5 points per 0.1 speed)
      range: 6     // 6 points per 1 range
    };

    const cost = pointCosts[stat] || 1;
    const currentValue = (currentUnit as any)[stat] || 0;
    
    // Calculate max increase: for speed use division, for others use floor division
    const maxIncrease = stat === 'speed' 
      ? pointsLeft / cost 
      : Math.floor(pointsLeft / cost);
    
    const absoluteMax = STAT_MAX_VALUES[stat] || 100;
    const calculatedMax = currentValue + maxIncrease;

    return Math.min(calculatedMax, absoluteMax);
  };

  const isValid = computed(() => {
    if (!customUnit.value) return false;
    const errors = validateUnit(customUnit.value);
    const hasErrors = errors.some(e => e.severity === 'error');
    return !hasErrors;
  });

  const hasWarnings = computed(() => {
    if (!customUnit.value) return false;
    const errors = validateUnit(customUnit.value);
    return errors.some(e => e.severity === 'warning');
  });

  return {
    customUnit,
    isCustomMode,
    validationErrors,
    editorMode,
    maxPoints,
    createCustomUnit,
    validateUnit,
    calculatePowerBudget,
    calculateRecommendedCost,
    calculateEliteStats,
    exportToTechtree,
    getArmorClassName,
    getBaseUnitOptions,
    getBaseUnitOption,
    getUnitIconUrl,
    setMode,
    getMaxStatValue,
    isValid,
    hasWarnings,
    ARMOR_CLASS_NAMES,
    BASE_UNIT_OPTIONS
  };
}
