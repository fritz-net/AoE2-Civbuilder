/**
 * Unit tests for Custom UU Editor
 * 
 * These tests validate the ruleset defined in docs/CUSTOM_UU_RULESET.md
 * 
 * Note: This is a test specification file. To run these tests, you need to:
 * 1. Install vitest: npm install -D vitest @vue/test-utils
 * 2. Add test script to package.json: "test": "vitest"
 * 3. Run: npm test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCustomUU } from './useCustomUU';

describe('useCustomUU - Unit Type Creation', () => {
  it('should create infantry unit with correct defaults', () => {
    const { createCustomUnit } = useCustomUU();
    const unit = createCustomUnit('infantry');
    
    expect(unit.unitType).toBe('infantry');
    expect(unit.health).toBeGreaterThanOrEqual(15);
    expect(unit.health).toBeLessThanOrEqual(400); // Updated from 250
    expect(unit.range).toBeLessThanOrEqual(1); // Infantry max range is 1
  });

  it('should create cavalry unit with correct defaults', () => {
    const { createCustomUnit } = useCustomUU();
    const unit = createCustomUnit('cavalry');
    
    expect(unit.unitType).toBe('cavalry');
    expect(unit.speed).toBeGreaterThan(0.9); // Cavalry should be faster
  });

  it('should create archer unit with correct defaults', () => {
    const { createCustomUnit } = useCustomUU();
    const unit = createCustomUnit('archer');
    
    expect(unit.unitType).toBe('archer');
    expect(unit.range).toBeGreaterThan(0); // Archers must have range
  });

  it('should create siege unit with correct defaults', () => {
    const { createCustomUnit } = useCustomUU();
    const unit = createCustomUnit('siege');
    
    expect(unit.unitType).toBe('siege');
    expect(unit.health).toBeGreaterThan(30); // Siege units have higher HP
  });
});

describe('useCustomUU - Validation Rules', () => {
  it('should validate health is within bounds (15-400)', () => {
    const { createCustomUnit, validateUnit } = useCustomUU();
    const unit = createCustomUnit('infantry');
    
    unit.health = 10; // Too low
    let errors = validateUnit(unit);
    expect(errors.some(e => e.field === 'health' && e.severity === 'error')).toBe(true);
    
    unit.health = 450; // Too high (updated from 300)
    errors = validateUnit(unit);
    expect(errors.some(e => e.field === 'health' && e.severity === 'error')).toBe(true);
    
    unit.health = 100; // Valid
    errors = validateUnit(unit);
    expect(errors.every(e => e.field !== 'health' || e.severity !== 'error')).toBe(true);
  });

  it('should validate attack is within bounds (1-35)', () => {
    const { createCustomUnit, validateUnit } = useCustomUU();
    const unit = createCustomUnit('infantry');
    
    unit.attack = 0; // Too low (updated from 1)
    let errors = validateUnit(unit);
    expect(errors.some(e => e.field === 'attack' && e.severity === 'error')).toBe(true);
    
    unit.attack = 40; // Too high
    errors = validateUnit(unit);
    expect(errors.some(e => e.field === 'attack' && e.severity === 'error')).toBe(true);
    
    unit.attack = 10; // Valid
    errors = validateUnit(unit);
    expect(errors.every(e => e.field !== 'attack' || e.severity !== 'error')).toBe(true);
  });

  it('should enforce infantry range limit (max 1)', () => {
    const { createCustomUnit, validateUnit } = useCustomUU();
    const unit = createCustomUnit('infantry');
    
    unit.range = 2; // Too high for infantry
    const errors = validateUnit(unit);
    expect(errors.some(e => e.field === 'range' && e.severity === 'error')).toBe(true);
  });

  it('should allow range for archers (max 12)', () => {
    const { createCustomUnit, validateUnit } = useCustomUU();
    const unit = createCustomUnit('archer');
    
    unit.range = 6; // Valid for archers
    let errors = validateUnit(unit);
    expect(errors.every(e => e.field !== 'range' || e.severity !== 'error')).toBe(true);
    
    unit.range = 15; // Too high
    errors = validateUnit(unit);
    expect(errors.some(e => e.field === 'range' && e.severity === 'error')).toBe(true);
  });
});

describe('useCustomUU - Cost System', () => {
  it('should have asymmetrical default costs', () => {
    const { createCustomUnit } = useCustomUU();
    const infantry = createCustomUnit('infantry');
    
    // Costs should be asymmetrical (e.g., 65F + 20G, not 50F + 50G)
    const totalCost = infantry.cost.food + infantry.cost.wood + infantry.cost.gold + infantry.cost.stone;
    expect(totalCost).toBeGreaterThan(0);
    
    // Check that not all resources are equal
    const resources = [infantry.cost.food, infantry.cost.wood, infantry.cost.gold, infantry.cost.stone];
    const nonZeroResources = resources.filter(r => r > 0);
    if (nonZeroResources.length > 1) {
      expect(new Set(nonZeroResources).size).toBeGreaterThan(1);
    }
  });

  it('should calculate recommended cost based on power budget', () => {
    const { createCustomUnit, calculateRecommendedCost } = useCustomUU();
    const unit = createCustomUnit('infantry');
    
    unit.health = 100;
    unit.attack = 15;
    const cost = calculateRecommendedCost(unit);
    
    expect(cost.food + cost.wood + cost.gold + cost.stone).toBeGreaterThan(0);
  });
});

describe('useCustomUU - Power Budget System', () => {
  it('should calculate power budget based on stats', () => {
    const { createCustomUnit, calculatePowerBudget } = useCustomUU();
    const unit = createCustomUnit('infantry');
    
    const baseBudget = calculatePowerBudget(unit);
    
    // Increase health should increase budget
    unit.health += 50;
    const higherBudget = calculatePowerBudget(unit);
    expect(higherBudget).toBeGreaterThan(baseBudget);
  });

  it('should respect point limits in build mode', () => {
    const { setMode, maxPoints } = useCustomUU();
    
    setMode('build');
    expect(maxPoints.value).toBe(150);
    
    setMode('draft');
    expect(maxPoints.value).toBe(100);
    
    setMode('demo');
    expect(maxPoints.value).toBeNull();
  });
});

describe('useCustomUU - Elite Stats Calculation', () => {
  it('should calculate elite infantry stats (+15% HP, +2 ATK, +1 melee armor)', () => {
    const { createCustomUnit, calculateEliteStats } = useCustomUU();
    const unit = createCustomUnit('infantry');
    unit.health = 60;
    unit.attack = 8;
    unit.meleeArmor = 0;
    
    const elite = calculateEliteStats(unit);
    
    expect(elite.health).toBe(Math.round(60 * 1.15)); // 69
    expect(elite.attack).toBe(10); // 8 + 2
    expect(elite.meleeArmor).toBe(1); // 0 + 1
  });

  it('should calculate elite cavalry stats (+20% HP, +2 ATK, +1 both armors)', () => {
    const { createCustomUnit, calculateEliteStats } = useCustomUU();
    const unit = createCustomUnit('cavalry');
    unit.health = 100;
    unit.attack = 10;
    unit.meleeArmor = 2;
    unit.pierceArmor = 1;
    
    const elite = calculateEliteStats(unit);
    
    expect(elite.health).toBe(Math.round(100 * 1.20)); // 120
    expect(elite.attack).toBe(12); // 10 + 2
    expect(elite.meleeArmor).toBe(3); // 2 + 1
    expect(elite.pierceArmor).toBe(2); // 1 + 1
  });

  it('should calculate elite archer stats (+10% HP, +1 ATK, +1 range, +1 pierce armor)', () => {
    const { createCustomUnit, calculateEliteStats } = useCustomUU();
    const unit = createCustomUnit('archer');
    unit.health = 40;
    unit.attack = 6;
    unit.range = 5;
    unit.pierceArmor = 0;
    
    const elite = calculateEliteStats(unit);
    
    expect(elite.health).toBe(Math.round(40 * 1.10)); // 44
    expect(elite.attack).toBe(7); // 6 + 1
    expect(elite.range).toBe(6); // 5 + 1
    expect(elite.pierceArmor).toBe(1); // 0 + 1
  });

  it('should calculate elite siege stats (+25% HP, +3 ATK, +1 pierce armor)', () => {
    const { createCustomUnit, calculateEliteStats } = useCustomUU();
    const unit = createCustomUnit('siege');
    unit.health = 80;
    unit.attack = 12;
    unit.pierceArmor = 0;
    
    const elite = calculateEliteStats(unit);
    
    expect(elite.health).toBe(Math.round(80 * 1.25)); // 100
    expect(elite.attack).toBe(15); // 12 + 3
    expect(elite.pierceArmor).toBe(1); // 0 + 1
  });
});

describe('useCustomUU - Base Unit Options', () => {
  it('should provide correct UU graphic IDs for vanilla units', () => {
    const { getBaseUnitOptions } = useCustomUU();
    
    const infantryOptions = getBaseUnitOptions('infantry');
    expect(infantryOptions.length).toBeGreaterThan(0);
    
    // Check that Jaguar Warrior has correct graphic ID (14)
    const jaguar = infantryOptions.find(opt => opt.name === 'Jaguar Warrior');
    expect(jaguar).toBeDefined();
    expect(jaguar?.uuGraphicId).toBe(14);
    
    const archerOptions = getBaseUnitOptions('archer');
    
    // Check that Longbowman has correct graphic ID (0)
    const longbow = archerOptions.find(opt => opt.name === 'Longbowman');
    expect(longbow).toBeDefined();
    expect(longbow?.uuGraphicId).toBe(0);
    
    // Check that Mangudai is included
    const mangudai = archerOptions.find(opt => opt.name === 'Mangudai');
    expect(mangudai).toBeDefined();
    expect(mangudai?.uuGraphicId).toBe(11);
  });

  it('should provide unit icon URLs', () => {
    const { getUnitIconUrl } = useCustomUU();
    
    const url = getUnitIconUrl(14);
    expect(url).toBe('/v2/img/unitgraphics/uu_14.jpg');
  });
});

describe('useCustomUU - Attack Bonuses', () => {
  it('should limit infantry/cavalry to max 3 bonuses', () => {
    const { createCustomUnit, validateUnit } = useCustomUU();
    const unit = createCustomUnit('infantry');
    
    unit.attackBonuses = [
      { class: 1, amount: 5 },
      { class: 2, amount: 5 },
      { class: 3, amount: 5 },
      { class: 4, amount: 5 }, // 4th bonus - should trigger warning/error
    ];
    
    const errors = validateUnit(unit);
    expect(errors.some(e => e.field === 'attackBonuses')).toBe(true);
  });

  it('should allow archer/siege up to 4 bonuses', () => {
    const { createCustomUnit, validateUnit } = useCustomUU();
    const unit = createCustomUnit('archer');
    
    unit.attackBonuses = [
      { class: 1, amount: 5 },
      { class: 2, amount: 5 },
      { class: 3, amount: 5 },
      { class: 4, amount: 5 }, // 4th bonus - valid for archers
    ];
    
    const errors = validateUnit(unit);
    expect(errors.every(e => e.field !== 'attackBonuses' || e.severity !== 'error')).toBe(true);
  });
});

describe('useCustomUU - Hero Mode', () => {
  it('should grant bonus points when hero mode is enabled', () => {
    const { createCustomUnit, calculatePowerBudget } = useCustomUU();
    const unit = createCustomUnit('infantry');
    
    const normalBudget = calculatePowerBudget(unit);
    
    unit.heroMode = true;
    const heroBudget = calculatePowerBudget(unit);
    
    // Hero mode should grant +30 bonus points
    expect(heroBudget).toBe(normalBudget + 30);
  });
});

describe('useCustomUU - API Compatibility', () => {
  it('should export to backwards-compatible techtree format', () => {
    const { createCustomUnit, exportToTechtree } = useCustomUU();
    const unit = createCustomUnit('infantry');
    unit.name = 'Test Warrior';
    
    const exported = exportToTechtree(unit);
    
    expect(exported).toBeDefined();
    expect(exported.type).toBe('custom');
    expect(exported.unitType).toBe('infantry');
    expect(exported.name).toBe('Test Warrior');
  });
});
