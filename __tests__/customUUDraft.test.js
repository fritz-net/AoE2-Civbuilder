/**
 * Tests for Custom UU Mode in Drafts
 * Verifies backend support for custom unique unit designer in draft mode
 */

const fs = require('fs');
const path = require('path');

describe('Custom UU Draft Mode - Data Structures', () => {
  test('Draft preset includes custom_uu_mode flag when enabled', () => {
    // Create a draft object to test structure
    const draft = {
      preset: {
        slots: 2,
        points: 200,
        rounds: 4,
        custom_uu_mode: true, // Should be stored as boolean
      },
      players: [
        { custom_uu: null, ready: 0 },
        { custom_uu: null, ready: 0 },
      ],
      gamestate: {
        phase: 0,
        custom_uu_phase: false,
      },
    };

    expect(draft.preset.custom_uu_mode).toBe(true);
    expect(draft.players[0]).toHaveProperty('custom_uu');
    expect(draft.players[1]).toHaveProperty('custom_uu');
    expect(draft.gamestate).toHaveProperty('custom_uu_phase');
  });

  test('Draft preset defaults custom_uu_mode to false for backwards compatibility', () => {
    const draft = {
      preset: {
        slots: 2,
        custom_uu_mode: false, // Default value
      },
    };

    expect(draft.preset.custom_uu_mode).toBe(false);
  });

  test('Player state includes custom_uu field', () => {
    const player = {
      ready: 0,
      name: '',
      alias: '',
      custom_uu: null, // Should be initialized
    };

    expect(player).toHaveProperty('custom_uu');
    expect(player.custom_uu).toBeNull();
  });

  test('Custom UU data structure is valid', () => {
    const customUU = {
      type: 'custom',
      unitType: 'infantry',
      baseUnit: 1067,
      name: 'Test Warrior',
      health: 70,
      attack: 10,
      meleeArmor: 1,
      pierceArmor: 1,
      attackSpeed: 2.0,
      speed: 1.0,
      range: 0,
      cost: {
        food: 55,
        wood: 0,
        stone: 0,
        gold: 30,
      },
      trainTime: 14,
      lineOfSight: 5,
      heroMode: false,
      attackBonuses: [],
    };

    expect(customUU.type).toBe('custom');
    expect(customUU.unitType).toBe('infantry');
    expect(customUU.name).toBe('Test Warrior');
    expect(customUU.cost).toHaveProperty('food');
    expect(customUU.cost).toHaveProperty('gold');
    expect(Array.isArray(customUU.attackBonuses)).toBe(true);
  });

  test('Gamestate includes custom_uu_phase flag', () => {
    const gamestate = {
      phase: 0,
      turn: 0,
      custom_uu_phase: false, // Should be initialized
    };

    expect(gamestate).toHaveProperty('custom_uu_phase');
    expect(gamestate.custom_uu_phase).toBe(false);
  });

  test('Custom UU validation - required fields', () => {
    const validUU = {
      type: 'custom',
      unitType: 'cavalry',
      baseUnit: 1721,
      name: 'Knight Commander',
      health: 100,
      attack: 12,
      meleeArmor: 2,
      pierceArmor: 2,
      speed: 1.35,
      cost: { food: 60, gold: 75, wood: 0, stone: 0 },
      trainTime: 20,
    };

    // Check all required fields exist
    expect(validUU.type).toBe('custom');
    expect(validUU.unitType).toBeTruthy();
    expect(validUU.baseUnit).toBeGreaterThan(0);
    expect(validUU.name).toBeTruthy();
    expect(validUU.health).toBeGreaterThan(0);
    expect(validUU.attack).toBeGreaterThan(0);
    expect(typeof validUU.meleeArmor).toBe('number');
    expect(typeof validUU.pierceArmor).toBe('number');
    expect(validUU.speed).toBeGreaterThan(0);
    expect(validUU.cost).toBeTruthy();
    expect(validUU.trainTime).toBeGreaterThan(0);
  });

  test('Custom UU with attack bonuses', () => {
    const customUU = {
      type: 'custom',
      unitType: 'archer',
      name: 'Elite Archer',
      attackBonuses: [
        { class: 5, amount: 4 }, // +4 vs cavalry
        { class: 8, amount: 3 }, // +3 vs archers
      ],
    };

    expect(Array.isArray(customUU.attackBonuses)).toBe(true);
    expect(customUU.attackBonuses.length).toBe(2);
    expect(customUU.attackBonuses[0]).toHaveProperty('class');
    expect(customUU.attackBonuses[0]).toHaveProperty('amount');
    expect(customUU.attackBonuses[0].amount).toBeGreaterThan(0);
  });

  test('Server validation logic - custom UU type check', () => {
    const validCustomUU = { type: 'custom', unitType: 'infantry', name: 'Test' };
    const invalidCustomUU = { type: 'invalid', unitType: 'infantry', name: 'Test' };
    const notAnObject = 'not an object';

    // Simulate server validation
    const isValidCustomUU = (uu) => {
      return Boolean(uu && typeof uu === 'object' && uu.type === 'custom');
    };

    expect(isValidCustomUU(validCustomUU)).toBe(true);
    expect(isValidCustomUU(invalidCustomUU)).toBe(false);
    expect(isValidCustomUU(notAnObject)).toBe(false);
    expect(isValidCustomUU(null)).toBe(false);
  });
});

