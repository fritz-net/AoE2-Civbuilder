/**
 * Composable for managing Custom Unique Unit data and validation
 * Based on the ruleset defined in docs/CUSTOM_UU_RULESET.md
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
  uuGraphicId: number | null; // UU graphic ID for icon (0-87), null means use techtree
  techtreeIconId?: number; // Unit ID for techtree icon
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
    { id: 1067, name: 'Jaguar Warrior', type: 'infantry', isRanged: false, uuGraphicId: 14 },
    { id: 1723, name: 'Teutonic Knight', type: 'infantry', isRanged: false, uuGraphicId: 3 },
    { id: 1570, name: 'Woad Raider', type: 'infantry', isRanged: false, uuGraphicId: 12 },
    { id: 1145, name: 'Huskarl', type: 'infantry', isRanged: false, uuGraphicId: 2 },
    { id: 1306, name: 'Samurai', type: 'infantry', isRanged: false, uuGraphicId: 4 },
    { id: 1317, name: 'Berserk', type: 'infantry', isRanged: false, uuGraphicId: 13 },
    { id: 75, name: 'Militia Line', type: 'infantry', isRanged: false, uuGraphicId: null, techtreeIconId: 75 },
    { id: 93, name: 'Spearman Line', type: 'infantry', isRanged: false, uuGraphicId: null, techtreeIconId: 93 },
    { id: 473, name: 'Champion', type: 'infantry', isRanged: false, uuGraphicId: null, techtreeIconId: 473 },
    { id: 555, name: 'Halberdier', type: 'infantry', isRanged: false, uuGraphicId: null, techtreeIconId: 555 },
  ],
  cavalry: [
    { id: 1281, name: 'Cataphract', type: 'cavalry', isRanged: false, uuGraphicId: 6 },
    { id: 1269, name: 'Boyar', type: 'cavalry', isRanged: false, uuGraphicId: 22 },
    { id: 1755, name: 'War Elephant', type: 'cavalry', isRanged: false, uuGraphicId: 5 },
    { id: 1132, name: 'Battle Elephant', type: 'cavalry', isRanged: false, uuGraphicId: 19 },
    { id: 1721, name: 'Knight Line', type: 'cavalry', isRanged: false, uuGraphicId: null, techtreeIconId: 37 }, // Knight
    { id: 207, name: 'Camel Line', type: 'cavalry', isRanged: false, uuGraphicId: null, techtreeIconId: 207 },
    { id: 546, name: 'Light Cavalry', type: 'cavalry', isRanged: false, uuGraphicId: null, techtreeIconId: 546 },
    { id: 441, name: 'Hussar', type: 'cavalry', isRanged: false, uuGraphicId: null, techtreeIconId: 441 },
  ],
  archer: [
    { id: 873, name: 'Longbowman', type: 'archer', isRanged: true, uuGraphicId: 0 },
    { id: 850, name: 'Plumed Archer', type: 'archer', isRanged: true, uuGraphicId: 15 },
    { id: 1225, name: 'Chu Ko Nu', type: 'archer', isRanged: true, uuGraphicId: 7 },
    { id: 1231, name: 'Mangudai', type: 'archer', isRanged: true, uuGraphicId: 11 },
    { id: 1036, name: 'Genitour', type: 'archer', isRanged: true, uuGraphicId: 25 },
    { id: 5, name: 'Archer Line', type: 'archer', isRanged: true, uuGraphicId: null, techtreeIconId: 5 },
    { id: 24, name: 'Crossbowman', type: 'archer', isRanged: true, uuGraphicId: null, techtreeIconId: 24 },
    { id: 943, name: 'Cavalry Archer', type: 'archer', isRanged: true, uuGraphicId: null, techtreeIconId: 943 },
  ],
  siege: [
    { id: 1699, name: 'War Wagon', type: 'siege', isRanged: true, uuGraphicId: 10 },
    { id: 280, name: 'Mangonel Line', type: 'siege', isRanged: true, uuGraphicId: null, techtreeIconId: 280 },
    { id: 279, name: 'Scorpion', type: 'siege', isRanged: true, uuGraphicId: null, techtreeIconId: 279 },
    { id: 36, name: 'Bombard Cannon', type: 'siege', isRanged: true, uuGraphicId: null, techtreeIconId: 36 },
    { id: 706, name: 'Battering Ram', type: 'siege', isRanged: false, uuGraphicId: null, techtreeIconId: 706 },
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
      cost: { ...defaults.cost },
      trainTime: defaults.trainTime,
      lineOfSight: 5,
      heroMode: false,
      attackBonuses: []
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

    // Type-specific range validation
    if (unit.unitType === 'infantry' && unit.range > 1) {
      errors.push({
        field: 'range',
        message: 'Infantry can only have range 0 (or 1 for Kamayuk-like)',
        severity: 'error'
      });
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
    
    // Hero mode grants bonus points
    if (unit.heroMode) {
      points += 30; // Hero mode gives 30 bonus points
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
    const rangeDiff = unit.range - defaults.range;
    points += rangeDiff * 6;
    
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
    
    // Hero units should be significantly more expensive
    if (unit.heroMode) {
      totalCost = Math.round(totalCost * 1.8);
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
    const primaryCost = Math.round(totalCost * dist.primary);
    const secondaryCost = Math.round(totalCost * dist.secondary);

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
    getUnitIconUrl,
    setMode,
    getMaxStatValue,
    isValid,
    hasWarnings,
    ARMOR_CLASS_NAMES,
    BASE_UNIT_OPTIONS
  };
}
