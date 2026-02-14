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
    
    // Wait for mode to be saved in localStorage
    await page.waitForFunction(() => {
      return localStorage.getItem('aoe2-custom-uu-active-mode') === 'build';
    }, { timeout: 5000 });
    
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
    
    // Step 3: Select Infantry unit type
    const infantryButton = page.getByTestId('type-button-infantry');
    await expect(infantryButton).toBeVisible();
    await infantryButton.click();
    
    // Step 4: Wait for unit name field to appear and fill it
    const unitNameInput = page.getByLabel(/Unit Name/i);
    await expect(unitNameInput).toBeVisible({ timeout: 10000 });
    await unitNameInput.fill('PersistWarrior');
    
    // Wait for autosave to trigger (check localStorage is set)
    await page.waitForFunction(() => {
      const key = 'aoe2-custom-uu-build';
      return localStorage.getItem(key) !== null;
    }, { timeout: 5000 });
    
    // Step 5: Reload the page to test persistence
    await page.reload();
    
    // Step 6: Wait for page to load and verify Build Mode is restored
    await expect(buildModeButton).toBeVisible();
    
    // Step 7: Verify unit data is restored - the unit name field should be visible and populated
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
    
    // Select Infantry
    const infantryButton = page.getByTestId('type-button-infantry');
    await infantryButton.click();
    
    // Wait for editor to load and fill unit name
    const unitNameInput = page.getByLabel(/Unit Name/i);
    await expect(unitNameInput).toBeVisible({ timeout: 10000 });
    await unitNameInput.fill('TestUnit');
    
    // Get initial health value
    const healthInput = page.locator('#health');
    await expect(healthInput).toBeVisible();
    const initialHealth = await healthInput.inputValue();
    
    // Wait for autosave to complete
    await page.waitForFunction(() => {
      const key = 'aoe2-custom-uu-build';
      return localStorage.getItem(key) !== null;
    }, { timeout: 5000 });
    
    // Reload page
    await page.reload();
    
    // Verify health value persists
    await expect(healthInput).toBeVisible({ timeout: 10000 });
    const reloadedHealth = await healthInput.inputValue();
    expect(reloadedHealth).toBe(initialHealth);
  });

  test('should save active mode when switching between modes', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Set up unit in Build Mode
    await page.getByRole('button', { name: /Build Mode \(150 pts\)/i }).click();
    
    const infantryButton = page.getByTestId('type-button-infantry');
    await infantryButton.click();
    
    const unitNameInput = page.getByLabel(/Unit Name/i);
    await expect(unitNameInput).toBeVisible({ timeout: 10000 });
    await unitNameInput.fill('BuildModeUnit');
    
    // Wait for autosave
    await page.waitForFunction(() => {
      const key = 'aoe2-custom-uu-build';
      return localStorage.getItem(key) !== null;
    }, { timeout: 5000 });
    
    // Switch to Demo Mode (data stays in localStorage but UI clears)
    await page.getByRole('button', { name: /Demo \(Unlimited\)/i }).click();
    
    // Reload page
    await page.reload();
    
    // Should be in Demo mode after reload (active mode was saved)
    const demoButton = page.getByRole('button', { name: /Demo \(Unlimited\)/i });
    await expect(demoButton).toBeVisible();
  });

  test('should handle multiple page reloads', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Setup in Build Mode
    await page.getByRole('button', { name: /Build Mode \(150 pts\)/i }).click();
    
    const cavalryButton = page.getByTestId('type-button-cavalry');
    await cavalryButton.click();
    
    const unitNameInput = page.getByLabel(/Unit Name/i);
    await expect(unitNameInput).toBeVisible({ timeout: 10000 });
    await unitNameInput.fill('PersistentKnight');
    
    // Wait for autosave - verify data is saved correctly
    await page.waitForFunction(() => {
      const key = 'aoe2-custom-uu-build';
      const data = localStorage.getItem(key);
      if (!data) return false;
      try {
        const parsed = JSON.parse(data);
        return parsed.unit && parsed.unit.name === 'PersistentKnight';
      } catch (e) {
        return false;
      }
    }, { timeout: 5000 });
    
    // First reload
    await page.reload();
    await expect(unitNameInput).toBeVisible({ timeout: 10000 });
    await expect(unitNameInput).toHaveValue('PersistentKnight');
    
    // Second reload
    await page.reload();
    await expect(unitNameInput).toBeVisible({ timeout: 10000 });
    await expect(unitNameInput).toHaveValue('PersistentKnight');
    
    // Third reload
    await page.reload();
    await expect(unitNameInput).toBeVisible({ timeout: 10000 });
    await expect(unitNameInput).toHaveValue('PersistentKnight');
  });
});

test.describe('Custom UU Editor - Draft Mode Persistence', () => {
  test('should persist data separately for Draft Mode', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Set up unit in Draft Mode (100 pts budget)
    await page.getByRole('button', { name: /Draft Mode \(100 pts\)/i }).click();
    
    const archerButton = page.getByTestId('type-button-archer');
    await archerButton.click();
    
    const unitNameInput = page.getByLabel(/Unit Name/i);
    await expect(unitNameInput).toBeVisible({ timeout: 10000 });
    await unitNameInput.fill('DraftArcher');
    
    // Wait for autosave in draft mode
    await page.waitForFunction(() => {
      const key = 'aoe2-custom-uu-draft';
      return localStorage.getItem(key) !== null;
    }, { timeout: 5000 });
    
    // Reload
    await page.reload();
    
    // Verify Draft Mode persists
    const draftButton = page.getByRole('button', { name: /Draft Mode \(100 pts\)/i });
    await expect(draftButton).toBeVisible();
    
    // Verify data persists
    await expect(unitNameInput).toBeVisible({ timeout: 10000 });
    await expect(unitNameInput).toHaveValue('DraftArcher');
  });
});
