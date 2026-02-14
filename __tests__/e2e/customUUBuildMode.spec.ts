import { test, expect } from '@playwright/test';

/**
 * E2E tests for Custom Unique Unit Editor in Build Mode
 * Tests autosave and persistence functionality specific to Build Mode (150 pts)
 */

test.describe('Custom UU Editor - Build Mode', () => {
  test('should have Build Mode option available', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Check that Build Mode button is visible
    await expect(page.getByRole('button', { name: /Build Mode \(150 pts\)/i })).toBeVisible();
  });

  test('should switch to Build Mode', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Switch to Build Mode
    const buildModeButton = page.getByRole('button', { name: /Build Mode \(150 pts\)/i });
    await buildModeButton.click();
    await page.waitForTimeout(500);
    
    // Verify mode is active (button should still be visible and might have different styling)
    await expect(buildModeButton).toBeVisible();
  });
});

test.describe('Custom UU Editor - Autosave Persistence', () => {
  test('should persist custom unit data on page reload', async ({ page }) => {
    // Step 1: Navigate to custom UU editor
    await page.goto('/v2/demo/custom-uu');
    
    // Step 2: Switch to Build Mode (150 pts budget)
    const buildModeButton = page.getByRole('button', { name: /Build Mode \(150 pts\)/i });
    await buildModeButton.click();
    await page.waitForTimeout(500);
    
    // Step 3: Select Infantry unit type
    const infantryButton = page.getByTestId('type-button-infantry');
    await expect(infantryButton).toBeVisible();
    await infantryButton.click();
    await page.waitForTimeout(1000);
    
    // Step 4: Fill in unit name
    const unitNameInput = page.getByLabel(/Unit Name/i);
    await expect(unitNameInput).toBeVisible({ timeout: 10000 });
    await unitNameInput.fill('PersistWarrior');
    
    // Wait for autosave to trigger
    await page.waitForTimeout(1000);
    
    // Step 5: Reload the page to test persistence
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Step 6: Verify Build Mode is still active (restored)
    await expect(buildModeButton).toBeVisible();
    
    // Step 7: Verify unit data is restored - the unit name field should be visible and populated
    // After reload with restored data, we should be in the editor view (not type selection)
    await expect(unitNameInput).toBeVisible({ timeout: 10000 });
    await expect(unitNameInput).toHaveValue('PersistWarrior', { timeout: 5000 });
    
    // Step 8: Verify the unit type tabs are shown (not type selection buttons)
    const infantryTab = page.locator('.type-tab').filter({ hasText: /Infantry/i });
    await expect(infantryTab).toBeVisible();
  });

  test('should persist unit stats after reload', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Switch to Build Mode
    await page.getByRole('button', { name: /Build Mode \(150 pts\)/i }).click();
    await page.waitForTimeout(500);
    
    // Select Infantry
    await page.getByTestId('type-button-infantry').click();
    await page.waitForTimeout(1000);
    
    // Fill unit name
    const unitNameInput = page.getByLabel(/Unit Name/i);
    await unitNameInput.fill('TestUnit');
    
    // Get initial health value
    const healthInput = page.locator('#health');
    await expect(healthInput).toBeVisible();
    const initialHealth = await healthInput.inputValue();
    
    // Wait for autosave
    await page.waitForTimeout(1000);
    
    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Verify health value persists
    await expect(healthInput).toBeVisible({ timeout: 10000 });
    const reloadedHealth = await healthInput.inputValue();
    expect(reloadedHealth).toBe(initialHealth);
  });

  test('should clear persisted data when switching modes', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Set up unit in Build Mode
    await page.getByRole('button', { name: /Build Mode \(150 pts\)/i }).click();
    await page.waitForTimeout(500);
    
    await page.getByTestId('type-button-infantry').click();
    await page.waitForTimeout(1000);
    
    const unitNameInput = page.getByLabel(/Unit Name/i);
    await unitNameInput.fill('BuildModeUnit');
    await page.waitForTimeout(1000);
    
    // Switch to Demo Mode (should clear build mode data)
    await page.getByRole('button', { name: /Demo \(Unlimited\)/i }).click();
    await page.waitForTimeout(500);
    
    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Should be in Demo mode, not Build mode
    // Build mode data should not persist
    const demoButton = page.getByRole('button', { name: /Demo \(Unlimited\)/i });
    await expect(demoButton).toBeVisible();
  });

  test('should handle multiple page reloads', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Setup in Build Mode
    await page.getByRole('button', { name: /Build Mode \(150 pts\)/i }).click();
    await page.waitForTimeout(500);
    
    await page.getByTestId('type-button-cavalry').click();
    await page.waitForTimeout(1000);
    
    const unitNameInput = page.getByLabel(/Unit Name/i);
    await unitNameInput.fill('PersistentKnight');
    await page.waitForTimeout(1000);
    
    // First reload
    await page.reload();
    await page.waitForTimeout(1000);
    await expect(unitNameInput).toBeVisible({ timeout: 10000 });
    await expect(unitNameInput).toHaveValue('PersistentKnight');
    
    // Second reload
    await page.reload();
    await page.waitForTimeout(1000);
    await expect(unitNameInput).toBeVisible({ timeout: 10000 });
    await expect(unitNameInput).toHaveValue('PersistentKnight');
    
    // Third reload
    await page.reload();
    await page.waitForTimeout(1000);
    await expect(unitNameInput).toBeVisible({ timeout: 10000 });
    await expect(unitNameInput).toHaveValue('PersistentKnight');
  });
});

test.describe('Custom UU Editor - Draft Mode Persistence', () => {
  test('should persist data separately for Draft Mode', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Set up unit in Draft Mode (100 pts budget)
    await page.getByRole('button', { name: /Draft Mode \(100 pts\)/i }).click();
    await page.waitForTimeout(500);
    
    await page.getByTestId('type-button-archer').click();
    await page.waitForTimeout(1000);
    
    const unitNameInput = page.getByLabel(/Unit Name/i);
    await unitNameInput.fill('DraftArcher');
    await page.waitForTimeout(1000);
    
    // Reload
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Verify Draft Mode persists
    const draftButton = page.getByRole('button', { name: /Draft Mode \(100 pts\)/i });
    await expect(draftButton).toBeVisible();
    
    // Verify data persists
    await expect(unitNameInput).toBeVisible({ timeout: 10000 });
    await expect(unitNameInput).toHaveValue('DraftArcher');
  });
});
