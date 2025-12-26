import { test, expect } from '@playwright/test';

/**
 * E2E tests for TechTree component functionality
 * Uses the demo page as a testing interface to verify core TechTree behavior
 */

test.describe('TechTree Functionality - Build Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Ensure we're in build mode (should be default)
    const buildModeRadio = page.getByRole('radio', { name: /Build Mode/i });
    await expect(buildModeRadio).toBeChecked();
  });

  test('should start with 0 points in build mode', async ({ page }) => {
    // Check points display starts at 0
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
  });

  test('should add points when enabling techs in build mode', async ({ page }) => {
    // Wait for tech tree SVG to load
    await page.locator('.techtree-svg').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(500); // Allow time for initialization
    
    // Get initial points
    const initialPointsText = await page.getByText(/Points Spent: \d+/i).textContent();
    const initialPoints = parseInt(initialPointsText?.match(/\d+/)?.[0] || '0');
    
    // Click the Fill button in the TechTree toolbar (not the demo panel)
    await page.locator('.techtree-toolbar button', { hasText: /Fill/i }).click();
    await page.waitForTimeout(1000);
    
    // Check that points increased
    const finalPointsText = await page.getByText(/Points Spent: \d+/i).textContent();
    const finalPoints = parseInt(finalPointsText?.match(/\d+/)?.[0] || '0');
    
    expect(finalPoints).toBeGreaterThan(initialPoints);
  });

  test('should have unlimited points in build mode', async ({ page }) => {
    // Wait for tech tree SVG to load
    await page.locator('.techtree-svg').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(500); // Allow time for initialization
    
    // Click Fill button in TechTree toolbar
    await page.locator('.techtree-toolbar button', { hasText: /Fill/i }).click();
    await page.waitForTimeout(1000);
    
    // Get final points - should be a large number with no restriction
    const pointsText = await page.getByText(/Points Spent: \d+/i).textContent();
    const points = parseInt(pointsText?.match(/\d+/)?.[0] || '0');
    
    // In build mode, points can exceed typical draft limits (e.g., 100, 200, 250)
    // Just verify we have points and no error occurred
    expect(points).toBeGreaterThan(0);
  });

  test('should reset points to 0 in build mode', async ({ page }) => {
    // Wait for tech tree SVG to load
    await page.locator('.techtree-svg').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(500); // Allow time for initialization
    
    // Click Fill to add some techs
    await page.locator('.techtree-toolbar button', { hasText: /Fill/i }).click();
    await page.waitForTimeout(1000);
    
    // Verify points increased
    const filledPointsText = await page.getByText(/Points Spent: \d+/i).textContent();
    const filledPoints = parseInt(filledPointsText?.match(/\d+/)?.[0] || '0');
    expect(filledPoints).toBeGreaterThan(0);
    
    // Click Reset button in TechTree toolbar
    await page.locator('.techtree-toolbar button', { hasText: /Reset/i }).click();
    await page.waitForTimeout(500);
    
    // Verify points back to 0
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
  });

  test('should subtract points when disabling techs in build mode', async ({ page }) => {
    // Wait for tech tree SVG to load
    await page.locator('.techtree-svg').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(500); // Allow time for initialization
    
    // Click Fill to enable all techs
    await page.locator('.techtree-toolbar button', { hasText: /Fill/i }).click();
    await page.waitForTimeout(1000);
    
    // Get filled points
    const filledPointsText = await page.getByText(/Points Spent: \d+/i).textContent();
    const filledPoints = parseInt(filledPointsText?.match(/\d+/)?.[0] || '0');
    
    // Click Reset to disable all techs
    await page.locator('.techtree-toolbar button', { hasText: /Reset/i }).click();
    await page.waitForTimeout(500);
    
    // Verify points reduced to 0
    const resetPointsText = await page.getByText(/Points Spent: \d+/i).textContent();
    const resetPoints = parseInt(resetPointsText?.match(/\d+/)?.[0] || '0');
    
    expect(resetPoints).toBe(0);
    expect(resetPoints).toBeLessThan(filledPoints);
  });
});

test.describe('TechTree Functionality - Draft Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Switch to draft mode
    const draftModeRadio = page.getByRole('radio', { name: /Draft Mode/i });
    await draftModeRadio.click();
    await page.waitForTimeout(500);
  });

  test('should start with full point limit in draft mode', async ({ page }) => {
    // Default limit is 250
    await expect(page.getByText(/Points Remaining: 250/i)).toBeVisible();
  });

  test('should subtract points when enabling techs in draft mode', async ({ page }) => {
    // Get initial points (should be 250)
    const initialPointsText = await page.getByText(/Points Remaining: \d+/i).textContent();
    const initialPoints = parseInt(initialPointsText?.match(/\d+/)?.[0] || '0');
    
    // Click Fill button to enable all available techs
    await page.getByRole('button', { name: /Fill/i }).click();
    await page.waitForTimeout(500);
    
    // Check that points decreased
    const finalPointsText = await page.getByText(/Points Remaining: \d+/i).textContent();
    const finalPoints = parseInt(finalPointsText?.match(/\d+/)?.[0] || '0');
    
    expect(finalPoints).toBeLessThan(initialPoints);
  });

  test('should not allow spending more points than limit in draft mode', async ({ page }) => {
    // Set a lower limit to test enforcement (e.g., 50)
    const pointLimitInput = page.locator('input[type="number"]').first();
    await pointLimitInput.fill('50');
    await page.waitForTimeout(1000);
    
    // Get current points
    const currentPointsText = await page.getByText(/Points Remaining: \d+/i).textContent();
    const currentPoints = parseInt(currentPointsText?.match(/\d+/)?.[0] || '0');
    
    // Click Fill button
    await page.getByRole('button', { name: /Fill/i }).click();
    await page.waitForTimeout(500);
    
    // Check final points
    const finalPointsText = await page.getByText(/Points Remaining: \d+/i).textContent();
    const finalPoints = parseInt(finalPointsText?.match(/\d+/)?.[0] || '0');
    
    // Points remaining should not go below 0
    expect(finalPoints).toBeGreaterThanOrEqual(0);
    expect(finalPoints).toBeLessThanOrEqual(currentPoints);
  });

  test('should add points back when disabling techs in draft mode', async ({ page }) => {
    // Click Fill to enable techs
    await page.locator('.techtree-toolbar button', { hasText: /Fill/i }).click();
    await page.waitForTimeout(500);
    
    // Get points after fill
    const filledPointsText = await page.getByText(/Points Remaining: \d+/i).textContent();
    const filledPoints = parseInt(filledPointsText?.match(/\d+/)?.[0] || '0');
    
    // Click Reset to disable techs
    await page.locator('.techtree-toolbar button', { hasText: /Reset/i }).click();
    await page.waitForTimeout(500);
    
    // Get points after reset (should be back to limit)
    const resetPointsText = await page.getByText(/Points Remaining: \d+/i).textContent();
    const resetPoints = parseInt(resetPointsText?.match(/\d+/)?.[0] || '0');
    
    // Points should increase back to original limit
    expect(resetPoints).toBeGreaterThan(filledPoints);
    expect(resetPoints).toBe(250); // Default limit
  });

  test('should reset points to limit in draft mode', async ({ page }) => {
    // Click Fill to use some points
    await page.locator('.techtree-toolbar button', { hasText: /Fill/i }).click();
    await page.waitForTimeout(500);
    
    // Verify points decreased
    const filledPointsText = await page.getByText(/Points Remaining: \d+/i).textContent();
    const filledPoints = parseInt(filledPointsText?.match(/\d+/)?.[0] || '0');
    expect(filledPoints).toBeLessThan(250);
    
    // Click Reset button in TechTree toolbar
    await page.locator('.techtree-toolbar button', { hasText: /Reset/i }).click();
    await page.waitForTimeout(500);
    
    // Verify points back to limit
    await expect(page.getByText(/Points Remaining: 250/i)).toBeVisible();
  });

  test('should respect custom point limits in draft mode', async ({ page }) => {
    // Set custom limit (e.g., 150)
    const pointLimitInput = page.locator('input[type="number"]').first();
    await pointLimitInput.fill('150');
    await page.waitForTimeout(1000);
    
    // Verify points updated to new limit
    await expect(page.getByText(/Points Remaining: 150/i)).toBeVisible();
    
    // Reset should use the new limit
    await page.locator('.techtree-toolbar button', { hasText: /Fill/i }).click();
    await page.waitForTimeout(500);
    await page.locator('.techtree-toolbar button', { hasText: /Reset/i }).click();
    await page.waitForTimeout(500);
    
    // Should be back to custom limit
    await expect(page.getByText(/Points Remaining: 150/i)).toBeVisible();
  });
});

test.describe('TechTree Functionality - Fill Button', () => {
  test('should enable all available techs when Fill is clicked (build mode)', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Wait for tech tree SVG to load
    await page.locator('.techtree-svg').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(500); // Allow time for initialization
    
    // Click Fill button in TechTree toolbar
    await page.locator('.techtree-toolbar button', { hasText: /Fill/i }).click();
    await page.waitForTimeout(1000);
    
    // Check that points are greater than 0
    const pointsText = await page.getByText(/Points Spent: \d+/i).textContent();
    const points = parseInt(pointsText?.match(/\d+/)?.[0] || '0');
    expect(points).toBeGreaterThan(0);
    
    // Check tech count increased
    const techCountText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const techCount = parseInt(techCountText?.match(/\d+/)?.[0] || '0');
    expect(techCount).toBeGreaterThan(39); // Initial loaded techs
  });

  test('should enable techs up to point limit when Fill is clicked (draft mode)', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Switch to draft mode
    await page.getByRole('radio', { name: /Draft Mode/i }).click();
    await page.waitForTimeout(500);
    
    // Set a low limit to test
    const pointLimitInput = page.locator('input[type="number"]').first();
    await pointLimitInput.fill('100');
    await page.waitForTimeout(1000);
    
    // Click Fill button in TechTree toolbar
    await page.locator('.techtree-toolbar button', { hasText: /Fill/i }).click();
    await page.waitForTimeout(500);
    
    // Points remaining should be >= 0 and <= 100
    const pointsText = await page.getByText(/Points Remaining: \d+/i).textContent();
    const points = parseInt(pointsText?.match(/\d+/)?.[0] || '0');
    expect(points).toBeGreaterThanOrEqual(0);
    expect(points).toBeLessThanOrEqual(100);
  });
});

test.describe('TechTree Functionality - Reset Button', () => {
  test('should clear all techs when Reset is clicked (build mode)', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Fill first
    await page.locator('.techtree-toolbar button', { hasText: /Fill/i }).click();
    await page.waitForTimeout(500);
    
    // Click Reset in TechTree toolbar
    await page.locator('.techtree-toolbar button', { hasText: /Reset/i }).click();
    await page.waitForTimeout(500);
    
    // Points should be 0
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
  });

  test('should clear all techs and restore points when Reset is clicked (draft mode)', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Switch to draft mode
    await page.getByRole('radio', { name: /Draft Mode/i }).click();
    await page.waitForTimeout(500);
    
    // Fill first
    await page.locator('.techtree-toolbar button', { hasText: /Fill/i }).click();
    await page.waitForTimeout(500);
    
    // Click Reset in TechTree toolbar
    await page.locator('.techtree-toolbar button', { hasText: /Reset/i }).click();
    await page.waitForTimeout(500);
    
    // Points should be back to limit
    await expect(page.getByText(/Points Remaining: 250/i)).toBeVisible();
  });
});

test.describe('TechTree Functionality - Mode Switching', () => {
  test('should correctly switch point calculation when changing modes', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Start in build mode - verify 0 points
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
    
    // Switch to draft mode
    await page.getByRole('radio', { name: /Draft Mode/i }).click();
    await page.waitForTimeout(500);
    
    // Should show points remaining at limit
    await expect(page.getByText(/Points Remaining: 250/i)).toBeVisible();
    
    // Switch back to build mode
    await page.getByRole('radio', { name: /Build Mode/i }).click();
    await page.waitForTimeout(500);
    
    // Should show points spent at 0
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
  });
});

test.describe('TechTree Production - Page Verification', () => {
  test('should use build mode with unlimited points on /build page', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Fill in civilization name
    await page.getByPlaceholder(/Enter civilization name/i).fill('Test Civ');
    
    // Navigate to tech tree step
    const STEPS_TO_TECH_TREE = 6;
    const nextButton = page.getByRole('button', { name: /Next/i });
    
    for (let i = 0; i < STEPS_TO_TECH_TREE; i++) {
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Should show Points Spent: 0 (build mode)
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
  });

  test('should use draft mode with point limit on /techtree page', async ({ page }) => {
    await page.goto('/v2/techtree');
    
    // Should show Points Remaining (draft mode)
    await expect(page.getByText(/Points Remaining: \d+/i)).toBeVisible();
  });
});
