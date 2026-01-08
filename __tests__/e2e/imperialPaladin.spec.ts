import { test, expect } from '@playwright/test';
import { TechTreeDemoPage } from './helpers/TechTreeDemoPage';

/**
 * E2E tests for Imperial Paladin bonus (bonus 363)
 * Tests that Imperial Paladin appears as a bonus, shows in techtree when selected.
 * 
 * Uses Page Object Model pattern for maintainability and reusability.
 */

const IMPERIAL_PALADIN_BONUS = /Can upgrade Paladin to Imperial Paladin/i;
const IMPERIAL_PALADIN_UNIT_ID = 'unit_2540';
const CAVALIER_UNIT_ID = 'unit_283';
const EXPECTED_POINTS = 17; // Knight (3) + Cavalier (6) + Paladin (8)

test.describe('Imperial Paladin Bonus', () => {
  test('should add Imperial Paladin after Paladin in techtree when bonus is selected', async ({ page }) => {
    const techtreePage = new TechTreeDemoPage(page);
    
    await techtreePage.navigate();
    await techtreePage.waitForTechtreeLoaded();
    
    // Get initial state
    const initialTechCount = await techtreePage.getTechCount();
    
    // Select Imperial Paladin bonus
    await techtreePage.selectBonus(IMPERIAL_PALADIN_BONUS);
    
    // Verify tech count increased (Knight, Cavalier, and Paladin are prerequisites)
    await techtreePage.assertTechCountGreaterThan(initialTechCount);
    
    // Verify points (Knight 3pts + Cavalier 6pts + Paladin 8pts = 17pts)
    await techtreePage.assertPoints(EXPECTED_POINTS);
    
    // Verify Cavalier is still visible (not replaced)
    await techtreePage.assertCaretVisible(CAVALIER_UNIT_ID);
  });

  test('should enable Imperial Paladin with prerequisites when bonus is selected', async ({ page }) => {
    const techtreePage = new TechTreeDemoPage(page);
    
    await techtreePage.navigate();
    await techtreePage.waitForTechtreeLoaded();
    
    // Initially, nothing should be selected
    await techtreePage.assertPoints(0);
    
    // Select Imperial Paladin bonus
    await techtreePage.selectBonus(IMPERIAL_PALADIN_BONUS);
    
    // Verify points = 17 (prerequisites: Knight 3pts + Cavalier 6pts + Paladin 8pts)
    // Imperial Paladin itself is free as a bonus unit
    await techtreePage.assertPoints(EXPECTED_POINTS);
    
    // Verify tech count increased appropriately
    await techtreePage.assertTechCountGreaterThan(39);
  });

  test('should remove Imperial Paladin when bonus is deselected', async ({ page }) => {
    const techtreePage = new TechTreeDemoPage(page);
    
    await techtreePage.navigate();
    await techtreePage.waitForTechtreeLoaded();
    
    // Select bonus
    await techtreePage.selectBonus(IMPERIAL_PALADIN_BONUS);
    
    // Get tech count with bonus
    const withBonusCount = await techtreePage.getTechCount();
    
    // Deselect the bonus
    await techtreePage.unselectBonus(IMPERIAL_PALADIN_BONUS);
    
    // Verify tech count decreased
    const withoutBonusCount = await techtreePage.getTechCount();
    expect(withoutBonusCount).toBeLessThan(withBonusCount);
    
    // Verify points back to 0
    await techtreePage.assertPoints(0);
  });

  test('should display correct Selected Bonuses count', async ({ page }) => {
    const techtreePage = new TechTreeDemoPage(page);
    
    await techtreePage.navigate();
    await techtreePage.waitForTechtreeLoaded();
    
    // Initially should be 0
    await techtreePage.assertSelectedBonusesCount(0);
    
    // Select Imperial Paladin bonus
    await techtreePage.selectBonus(IMPERIAL_PALADIN_BONUS);
    
    // Should be 1
    await techtreePage.assertSelectedBonusesCount(1);
  });

  test('should show Imperial Paladin in stable lane in techtree', async ({ page }) => {
    const techtreePage = new TechTreeDemoPage(page);
    
    await techtreePage.navigate();
    await techtreePage.waitForTechtreeLoaded();
    
    // Select Imperial Paladin bonus
    await techtreePage.selectBonus(IMPERIAL_PALADIN_BONUS);
    await techtreePage.wait(1000); // Extra wait for rendering
    
    // Verify Imperial Paladin is visible in the tech tree (unit ID 2540)
    await techtreePage.assertCaretVisible(IMPERIAL_PALADIN_UNIT_ID);
  });

  test('should preserve Imperial Paladin after reset', async ({ page }) => {
    const techtreePage = new TechTreeDemoPage(page);
    
    await techtreePage.navigate();
    await techtreePage.waitForTechtreeLoaded();
    
    // Select Imperial Paladin bonus
    await techtreePage.selectBonus(IMPERIAL_PALADIN_BONUS);
    
    // Get state before reset
    const beforeReset = await techtreePage.getStateSnapshot();
    
    // Click Reset Tree button
    await techtreePage.clickReset();
    
    // Imperial Paladin should still be enabled after reset (bonus is still selected)
    const afterReset = await techtreePage.getStateSnapshot();
    expect(afterReset.techCount).toBe(beforeReset.techCount);
    expect(afterReset.points).toBe(EXPECTED_POINTS);
  });
});
