import { test, expect } from '@playwright/test';

/**
 * E2E tests for bonus-granted units/techs in TechTree
 * Tests that bonus-granted units appear with 0 cost and auto-enable when selected
 */

test.describe('TechTree Bonus-Granted Units', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Ensure we're in build mode (should be default)
    const buildModeRadio = page.getByRole('radio', { name: /Build Mode/i });
    await expect(buildModeRadio).toBeChecked();
    
    // Wait for tech tree to load
    await page.locator('.techtree-svg').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(500); // Allow time for initialization
  });

  test('should start with 0 techs enabled without bonuses', async ({ page }) => {
    // Check that tech count starts at baseline (only default units)
    const techtreeText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const techCount = parseInt(techtreeText?.match(/\d+/)?.[0] || '0');
    
    // Should have the default enabled techs (around 39)
    expect(techCount).toBeGreaterThan(30);
    expect(techCount).toBeLessThan(45);
  });

  test('should enable Slinger with 0 cost when bonus 61 is selected', async ({ page }) => {
    // Get initial tech count
    const initialText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
    
    // Select "Can recruit Slingers" bonus
    const slingerCheckbox = page.getByRole('checkbox', { name: /Can recruit Slingers \(ID 61\)/i });
    await slingerCheckbox.check();
    await page.waitForTimeout(500); // Allow tree to rebuild
    
    // Verify tech count increased by 1
    const finalText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const finalCount = parseInt(finalText?.match(/\d+/)?.[0] || '0');
    expect(finalCount).toBe(initialCount + 1);
    
    // Verify points still at 0 (Slinger should be free)
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
  });

  test('should enable Longboat with 0 cost when bonus 51 is selected', async ({ page }) => {
    // Get initial tech count
    const initialText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
    
    // Select "Can recruit Longboats" bonus
    const longboatCheckbox = page.getByRole('checkbox', { name: /Can recruit Longboats \(ID 51\)/i });
    await longboatCheckbox.check();
    await page.waitForTimeout(500); // Allow tree to rebuild
    
    // Verify tech count increased by 1
    const finalText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const finalCount = parseInt(finalText?.match(/\d+/)?.[0] || '0');
    expect(finalCount).toBe(initialCount + 1);
    
    // Verify points still at 0 (Longboat should be free)
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
  });

  test('should enable multiple bonus units without consuming points', async ({ page }) => {
    // Get initial tech count
    const initialText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
    
    // Select "Can recruit Slingers" bonus
    const slingerCheckbox = page.getByRole('checkbox', { name: /Can recruit Slingers \(ID 61\)/i });
    await slingerCheckbox.check();
    await page.waitForTimeout(300);
    
    // Select "Can recruit Longboats" bonus
    const longboatCheckbox = page.getByRole('checkbox', { name: /Can recruit Longboats \(ID 51\)/i });
    await longboatCheckbox.check();
    await page.waitForTimeout(500);
    
    // Verify tech count increased by 2
    const finalText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const finalCount = parseInt(finalText?.match(/\d+/)?.[0] || '0');
    expect(finalCount).toBe(initialCount + 2);
    
    // Verify points still at 0 (both units should be free)
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
  });

  test('should auto-enable prerequisites with point costs for Imperial Camel', async ({ page }) => {
    // Select "Can upgrade to Imperial Camel Riders" bonus
    const imperialCamelCheckbox = page.getByRole('checkbox', { name: /Can upgrade to Imperial Camel Riders \(ID 53\)/i });
    await imperialCamelCheckbox.check();
    await page.waitForTimeout(500);
    
    // Verify points increased (should be 9 points for prerequisites)
    // Camel Rider (3) + Heavy Camel Rider (6) = 9 points
    // Imperial Camel Rider itself is free
    const pointsText = await page.getByText(/Points Spent: \d+/i).textContent();
    const points = parseInt(pointsText?.match(/\d+/)?.[0] || '0');
    expect(points).toBe(9);
  });

  test('should auto-enable Bombard Cannon prerequisite for Houfnice', async ({ page }) => {
    // Select "Can upgrade to Houfnice" bonus
    const houfniceCheckbox = page.getByRole('checkbox', { name: /Can upgrade to Houfnice \(ID 286\)/i });
    await houfniceCheckbox.check();
    await page.waitForTimeout(500);
    
    // Verify points increased (should be 8 points for Bombard Cannon prerequisite)
    // Houfnice itself is free
    const pointsText = await page.getByText(/Points Spent: \d+/i).textContent();
    const points = parseInt(pointsText?.match(/\d+/)?.[0] || '0');
    expect(points).toBe(8);
  });

  test('should remove bonus unit when bonus is deselected', async ({ page }) => {
    // Select "Can recruit Slingers" bonus
    const slingerCheckbox = page.getByRole('checkbox', { name: /Can recruit Slingers \(ID 61\)/i });
    await slingerCheckbox.check();
    await page.waitForTimeout(500);
    
    // Get tech count with bonus
    const withBonusText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const withBonusCount = parseInt(withBonusText?.match(/\d+/)?.[0] || '0');
    
    // Deselect the bonus
    await slingerCheckbox.uncheck();
    await page.waitForTimeout(500);
    
    // Verify tech count decreased by 1
    const withoutBonusText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const withoutBonusCount = parseInt(withoutBonusText?.match(/\d+/)?.[0] || '0');
    expect(withoutBonusCount).toBe(withBonusCount - 1);
    
    // Verify points back to 0
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
  });

  test('should show Pastures when bonus 356 is selected', async ({ page }) => {
    // Get initial tech count
    const initialText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
    
    // Select Pastures bonus (ID 356)
    const pasturesCheckbox = page.getByRole('checkbox', { name: /Pastures \(ID 356\)/i });
    await pasturesCheckbox.check();
    await page.waitForTimeout(500); // Allow tree to rebuild
    
    // Verify tech/building count increased (Pastures adds buildings)
    const finalText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const finalCount = parseInt(finalText?.match(/\d+/)?.[0] || '0');
    expect(finalCount).toBeGreaterThan(initialCount);
    
    // Verify points still at 0 (Pastures should be free)
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
  });

  test('should display correct Selected Bonuses count', async ({ page }) => {
    // Initially should be 0
    await expect(page.getByText(/Selected Bonuses: 0/i)).toBeVisible();
    
    // Select one bonus
    const slingerCheckbox = page.getByRole('checkbox', { name: /Can recruit Slingers \(ID 61\)/i });
    await slingerCheckbox.check();
    await page.waitForTimeout(300);
    
    // Should be 1
    await expect(page.getByText(/Selected Bonuses: 1/i)).toBeVisible();
    
    // Select another bonus
    const longboatCheckbox = page.getByRole('checkbox', { name: /Can recruit Longboats \(ID 51\)/i });
    await longboatCheckbox.check();
    await page.waitForTimeout(300);
    
    // Should be 2
    await expect(page.getByText(/Selected Bonuses: 2/i)).toBeVisible();
  });

  test('should preserve bonus units after reset', async ({ page }) => {
    await page.goto('/v2/demo/techtree')
    await page.waitForTimeout(1000)
    
    // Select Slinger bonus
    const slingerCheckbox = page.getByRole('checkbox', { name: /Can recruit Slingers \(ID 61\)/i });
    await slingerCheckbox.check()
    await page.waitForTimeout(500)
    
    // Verify Slinger is enabled (tech count increases)
    const techsEnabledBefore = page.locator('text=/Techs Enabled: \\d+/')
    await expect(techsEnabledBefore).toContainText(/Techs Enabled: 40/)
    
    // Click Reset Tree button
    const resetButton = page.getByRole('button', { name: /Reset Tree/i })
    await resetButton.click()
    await page.waitForTimeout(500)
    
    // Slinger should still be enabled after reset (bonus is still selected)
    const techsEnabledAfter = page.locator('text=/Techs Enabled: \\d+/')
    await expect(techsEnabledAfter).toContainText(/Techs Enabled: 40/)
    
    // Points should still be 0 (bonus units don't consume points)
    const pointsDisplay = page.locator('text=/Points Spent: \\d+/')
    await expect(pointsDisplay).toContainText('Points Spent: 0')
  });
});
