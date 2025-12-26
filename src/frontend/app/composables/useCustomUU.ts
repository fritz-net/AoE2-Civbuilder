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
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
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
    cost: { food: 55, wood: 0, stone: 0, gold: 30 },
    trainTime: 14
  },
  cavalry: {
    baseUnit: 1721, // Knight-like base
    health: 100,
    attack: 10,
    speed: 1.35,
    range: 0,
    armor: { melee: 2, pierce: 1 },
    cost: { food: 70, wood: 0, stone: 0, gold: 75 },
    trainTime: 22
  },
  archer: {
    baseUnit: 850, // Plumed Archer base
    health: 40,
    attack: 6,
    speed: 0.96,
    range: 4,
    armor: { melee: 0, pierce: 0 },
    cost: { food: 0, wood: 35, stone: 0, gold: 40 },
    trainTime: 18
  },
  siege: {
    baseUnit: 706, // Ram-like base
    health: 150,
    attack: 12,
    speed: 0.7,
    range: 0,
    armor: { melee: -3, pierce: 7 },
    cost: { food: 0, wood: 150, stone: 0, gold: 75 },
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

export function useCustomUU() {
  const customUnit: Ref<CustomUUData | null> = ref(null);
  const isCustomMode = ref(false);
  const validationErrors: Ref<ValidationError[]> = ref([]);

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

    // Health validation
    if (unit.health < 15 || unit.health > 250) {
      errors.push({
        field: 'health',
        message: 'Health must be between 15 and 250',
        severity: 'error'
      });
    }

    // Attack validation
    if (unit.attack < 2 || unit.attack > 35) {
      errors.push({
        field: 'attack',
        message: 'Attack must be between 2 and 35',
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

    // Attack speed contribution (lower is better)
    const attackSpeedBonus = (2.0 - unit.attackSpeed) / 0.2;
    points += attackSpeedBonus * 3;

    // Range contribution (for archers)
    if (unit.unitType === 'archer' || unit.unitType === 'siege') {
      const rangeDiff = unit.range - defaults.range;
      points += rangeDiff * 6;
    }

    // Attack bonuses
    unit.attackBonuses.forEach(bonus => {
      points += (bonus.amount / 5) * 8;
    });

    return Math.round(points);
  };

  const calculateRecommendedCost = (unit: CustomUUData): ResourceCost => {
    const points = calculatePowerBudget(unit);
    const totalCost = Math.round(points * 1.2);

    // Distribute based on unit type
    const ratios: Record<string, { primary: number; secondary: number }> = {
      infantry: { primary: 0.65, secondary: 0.35 }, // food/gold
      cavalry: { primary: 0.50, secondary: 0.50 },  // food/gold
      archer: { primary: 0.45, secondary: 0.55 },   // wood/gold
      siege: { primary: 0.60, secondary: 0.40 }     // wood/gold
    };

    const ratio = ratios[unit.unitType];
    const primaryCost = Math.round(totalCost * ratio.primary);
    const secondaryCost = Math.round(totalCost * ratio.secondary);

    if (unit.unitType === 'archer' || unit.unitType === 'siege') {
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
    createCustomUnit,
    validateUnit,
    calculatePowerBudget,
    calculateRecommendedCost,
    exportToTechtree,
    getArmorClassName,
    isValid,
    hasWarnings,
    ARMOR_CLASS_NAMES
  };
}
