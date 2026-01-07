import { test, expect } from '@playwright/test';
import * as path from 'path';

/**
 * E2E tests for Imperial Paladin bonus (bonus 363)
 * Tests that Imperial Paladin appears as a bonus, shows in techtree when selected,
 * and can be used to create a mod.
 */

// Skip download tests locally (C++ backend not built), but run in CI
const shouldSkipDownloadTests = !process.env.CI;

test.describe('Imperial Paladin Bonus', () => {
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for these tests
    test.setTimeout(60000);
  });

  test('should show Imperial Paladin bonus in /v2/build bonuses list', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Look for the Imperial Paladin bonus checkbox
    const bonusCheckbox = page.getByRole('checkbox', { name: /Imperial Paladin replaces Cavalier/i });
    
    // Verify the bonus exists in the list
    await expect(bonusCheckbox).toBeVisible();
  });

  test('should replace Cavalier with Imperial Paladin in techtree when bonus is selected', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Wait for tech tree to load
    await page.locator('.techtree-svg').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Get initial tech count
    const initialText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
    
    // Select Imperial Paladin bonus
    const bonusCheckbox = page.getByRole('checkbox', { name: /Imperial Paladin replaces Cavalier/i });
    await bonusCheckbox.check();
    await page.waitForTimeout(500); // Allow tree to rebuild
    
    // Verify tech count increased (Knight and Cavalier are prerequisites)
    const finalText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const finalCount = parseInt(finalText?.match(/\d+/)?.[0] || '0');
    expect(finalCount).toBeGreaterThan(initialCount);
    
    // Verify points increased (Knight = 3pts, Cavalier = 6pts = 9pts total for prerequisites)
    const pointsText = await page.locator('text=/Points Spent: \\d+/').textContent();
    const points = parseInt(pointsText?.match(/\d+/)?.[0] || '0');
    expect(points).toBe(9);
    
    // Verify Cavalier is replaced (not visible)
    // Cavalier has unit ID 283
    const cavalierElement = page.locator('[data-caret-id="unit_283"]');
    await expect(cavalierElement).not.toBeVisible();
  });

  test('should enable Imperial Paladin with prerequisites when bonus is selected', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Wait for tech tree to load
    await page.locator('.techtree-svg').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Initially, nothing should be selected
    await expect(page.getByText('Points Spent: 0')).toBeVisible();
    
    // Select Imperial Paladin bonus
    const bonusCheckbox = page.getByRole('checkbox', { name: /Imperial Paladin replaces Cavalier/i });
    await bonusCheckbox.check();
    await page.waitForTimeout(500);
    
    // Verify points = 9 (prerequisites: Knight 3pts + Cavalier 6pts)
    // Imperial Paladin itself is free as a bonus unit
    const pointsText = await page.locator('text=/Points Spent: \\d+/').textContent();
    const points = parseInt(pointsText?.match(/\d+/)?.[0] || '0');
    expect(points).toBe(9);
    
    // Verify tech count increased appropriately
    const techsEnabledText = await page.locator('text=/Techs Enabled: \\d+/').textContent();
    const techsEnabled = parseInt(techsEnabledText?.match(/\d+/)?.[0] || '0');
    expect(techsEnabled).toBeGreaterThan(39); // More than default
  });

  test('should remove Imperial Paladin when bonus is deselected', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Wait for tech tree to load
    await page.locator('.techtree-svg').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Select bonus
    const bonusCheckbox = page.getByRole('checkbox', { name: /Imperial Paladin replaces Cavalier/i });
    await bonusCheckbox.check();
    await page.waitForTimeout(500);
    
    // Get tech count with bonus
    const withBonusText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const withBonusCount = parseInt(withBonusText?.match(/\d+/)?.[0] || '0');
    
    // Deselect the bonus
    await bonusCheckbox.uncheck();
    await page.waitForTimeout(500);
    
    // Verify tech count decreased
    const withoutBonusText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const withoutBonusCount = parseInt(withoutBonusText?.match(/\d+/)?.[0] || '0');
    expect(withoutBonusCount).toBeLessThan(withBonusCount);
    
    // Verify points back to 0
    await expect(page.getByText('Points Spent: 0')).toBeVisible();
  });

  test('should display correct Selected Bonuses count', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Wait for tech tree to load
    await page.locator('.techtree-svg').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Initially should be 0
    await expect(page.getByText(/Selected Bonuses: 0/i)).toBeVisible();
    
    // Select Imperial Paladin bonus
    const bonusCheckbox = page.getByRole('checkbox', { name: /Imperial Paladin replaces Cavalier/i });
    await bonusCheckbox.check();
    await page.waitForTimeout(300);
    
    // Should be 1
    await expect(page.getByText(/Selected Bonuses: 1/i)).toBeVisible();
  });

  test('should create downloadable mod with Imperial Paladin', async ({ page }) => {
    // Only run in CI environment
    if (shouldSkipDownloadTests) {
      test.skip();
      return;
    }
    
    await page.goto('/v2/build');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Fill in civilization name
    const civNameInput = page.locator('input[placeholder*="Civilization Name" i], input[name="civName" i], input[type="text"]').first();
    await civNameInput.fill('Test Imperial Paladin Civ');
    
    // Select Imperial Paladin bonus
    const bonusCheckbox = page.getByRole('checkbox', { name: /Imperial Paladin replaces Cavalier/i });
    await bonusCheckbox.check();
    await page.waitForTimeout(500);
    
    // Find and click the create/build button
    const buildButton = page.getByRole('button', { name: /Create|Build|Generate/i });
    await buildButton.click();
    
    // Wait for mod generation (can take some time)
    await page.waitForTimeout(5000);
    
    // Look for download button or link
    const downloadButton = page.getByRole('button', { name: /Download/i }).or(page.getByRole('link', { name: /Download/i }));
    
    // Verify download is available
    await expect(downloadButton).toBeVisible({ timeout: 30000 });
    
    // Attempt to download and verify it's a zip file
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.zip');
    
    // Verify file was downloaded
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
  });

  test('should show Imperial Paladin in stable lane in techtree', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Wait for tech tree to load
    await page.locator('.techtree-svg').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Select Imperial Paladin bonus
    const bonusCheckbox = page.getByRole('checkbox', { name: /Imperial Paladin replaces Cavalier/i });
    await bonusCheckbox.check();
    await page.waitForTimeout(1000);
    
    // Look for Imperial Paladin in the tech tree (unit ID 2540)
    // The element might be a circle, rect, or other SVG element with data-caret-id attribute
    const imperialPaladinElement = page.locator('[data-caret-id="unit_2540"]');
    
    // Verify Imperial Paladin is visible in the tech tree
    await expect(imperialPaladinElement).toBeVisible({ timeout: 5000 });
  });

  test('should preserve Imperial Paladin after reset', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Wait for tech tree to load
    await page.locator('.techtree-svg').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Select Imperial Paladin bonus
    const bonusCheckbox = page.getByRole('checkbox', { name: /Imperial Paladin replaces Cavalier/i });
    await bonusCheckbox.check();
    await page.waitForTimeout(500);
    
    // Get tech count before reset
    const beforeResetText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const beforeResetCount = parseInt(beforeResetText?.match(/\d+/)?.[0] || '0');
    
    // Click Reset Tree button
    const resetButton = page.getByRole('button', { name: /Reset Tree/i });
    await resetButton.click();
    await page.waitForTimeout(500);
    
    // Imperial Paladin should still be enabled after reset (bonus is still selected)
    const afterResetText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const afterResetCount = parseInt(afterResetText?.match(/\d+/)?.[0] || '0');
    expect(afterResetCount).toBe(beforeResetCount);
    
    // Points should still be 9 (prerequisites)
    const pointsText = await page.locator('text=/Points Spent: \\d+/').textContent();
    const points = parseInt(pointsText?.match(/\d+/)?.[0] || '0');
    expect(points).toBe(9);
  });
});
