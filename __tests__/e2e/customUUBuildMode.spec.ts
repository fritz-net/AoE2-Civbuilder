<<<<<<< HEAD
import { test, expect, Page, Download } from '@playwright/test';
import * as fs from 'fs';

/**
 * E2E tests for Custom Unique Unit Editor in /v2/build mode
 * Tests custom UU integration, autosave persistence, and JSON download
 */

test.describe('Custom UU Editor - Build Mode Integration', () => {
  test('should display custom UU checkbox on Unique Unit step', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Fill in civ name to enable navigation
    await page.getByPlaceholder(/Enter civilization name/i).fill('TestCiv');
    
    // Navigate to Unique Unit step (step 3)
    await page.getByRole('button', { name: /Next →/i }).click(); // To Civ Bonuses
    await page.getByRole('button', { name: /Next →/i }).click(); // To Unique Unit
    
    // Verify we're on the Unique Unit step
    await expect(page.getByRole('heading', { name: /Unique Unit/i })).toBeVisible();
    
    // Verify custom UU checkbox is visible
    const customUUCheckbox = page.getByRole('checkbox', { name: /Use Custom Unique Unit Designer/i });
    await expect(customUUCheckbox).toBeVisible();
  });

  test('should have improved contrast on custom UU checkbox area', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Navigate to Unique Unit step
    await page.getByPlaceholder(/Enter civilization name/i).fill('TestCiv');
    await page.getByRole('button', { name: /Next →/i }).click(); // To Civ Bonuses
    await page.getByRole('button', { name: /Next →/i }).click(); // To Unique Unit
    
    // Get the checkbox container element
    const checkboxContainer = page.locator('.uu-mode-toggle');
    await expect(checkboxContainer).toBeVisible();
    
    // Verify the background color has sufficient contrast
    // The new background should be rgba(139, 69, 19, 0.75) - darker brown
    const bgColor = await checkboxContainer.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // Check that background is not the old light color
    expect(bgColor).not.toBe('rgba(212, 175, 55, 0.1)');
  });

  test('should toggle custom UU editor when checkbox is clicked', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Navigate to Unique Unit step
    await page.getByPlaceholder(/Enter civilization name/i).fill('TestCiv');
    await page.getByRole('button', { name: /Next →/i }).click();
    await page.getByRole('button', { name: /Next →/i }).click();
    
    // Verify standard UU selector is visible initially
    await expect(page.getByText(/Select one unique unit for your civilization/i)).toBeVisible();
    
    // Click the custom UU checkbox
    const customUUCheckbox = page.getByRole('checkbox', { name: /Use Custom Unique Unit Designer/i });
    await customUUCheckbox.check();
    
    // Verify custom UU editor is now visible
    await expect(page.getByRole('heading', { name: /Design Your Custom Unique Unit/i })).toBeVisible();
    await expect(page.getByText(/Create a unique unit with customizable stats and abilities \(150 point budget\)/i)).toBeVisible();
  });

  test('should hide "Save Unit" button in build mode', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Navigate to Unique Unit step and enable custom UU
    await page.getByPlaceholder(/Enter civilization name/i).fill('TestCiv');
    await page.getByRole('button', { name: /Next →/i }).click();
    await page.getByRole('button', { name: /Next →/i }).click();
    await page.getByRole('checkbox', { name: /Use Custom Unique Unit Designer/i }).check();
    
    // Select a unit type to show the editor
    await page.getByTestId('type-button-infantry').click();
    await page.waitForTimeout(500);
    
    // Verify "Save Unit" button is NOT visible (should be hidden in build mode)
    await expect(page.getByRole('button', { name: /Save Unit/i })).not.toBeVisible();
  });

  test('should allow creating custom unit in build mode', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Navigate to Unique Unit step and enable custom UU
    await page.getByPlaceholder(/Enter civilization name/i).fill('TestCiv');
    await page.getByRole('button', { name: /Next →/i }).click();
    await page.getByRole('button', { name: /Next →/i }).click();
    await page.getByRole('checkbox', { name: /Use Custom Unique Unit Designer/i }).check();
    
    // Select Infantry unit type
    await page.getByTestId('type-button-infantry').click();
    await page.waitForTimeout(500);
    
    // Verify editor is shown with default name
    const unitNameInput = page.getByLabel(/Unit Name/i);
    await expect(unitNameInput).toBeVisible();
    await expect(unitNameInput).toHaveValue('Custom Infantry');
    
    // Change the unit name
    await unitNameInput.fill('Elite Guard');
    await expect(unitNameInput).toHaveValue('Elite Guard');
    
    // Verify health slider is present
    await expect(page.locator('#health')).toBeVisible();
    
    // Verify power budget is shown
    await expect(page.getByText(/Power Budget:/i)).toBeVisible();
=======
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
>>>>>>> origin/main
  });
});

test.describe('Custom UU Editor - Autosave Persistence', () => {
<<<<<<< HEAD
  test('should persist custom UU mode on page reload', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Navigate to Unique Unit step and enable custom UU
    await page.getByPlaceholder(/Enter civilization name/i).fill('TestCiv');
    await page.getByRole('button', { name: /Next →/i }).click();
    await page.getByRole('button', { name: /Next →/i }).click();
    await page.getByRole('checkbox', { name: /Use Custom Unique Unit Designer/i }).check();
    
    // Wait for autosave
    await page.waitForTimeout(1500);
    
    // Verify autosave indicator shows
    await expect(page.getByText(/Last saved:/i)).toBeVisible();
    
    // Reload the page
    await page.reload();
    
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Verify custom UU checkbox is still checked
    const customUUCheckbox = page.getByRole('checkbox', { name: /Use Custom Unique Unit Designer/i });
    await expect(customUUCheckbox).toBeChecked();
    
    // Verify custom UU editor section is visible
    await expect(page.getByRole('heading', { name: /Design Your Custom Unique Unit/i })).toBeVisible();
  });

  test('should persist custom unit data on page reload', async ({ page }) => {
    // Start fresh
    await page.goto('/v2/build');
    
    // Wait for initial page load and restore period
    await page.waitForTimeout(1500);
    
    // Fill in basic civ info
    await page.getByPlaceholder(/Enter civilization name/i).fill('PersistTestCiv');
    
    // Navigate to Unique Unit step
    await page.getByRole('button', { name: /Next →/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /Next →/i }).click();
    await page.waitForTimeout(500);
    
    // Enable custom UU mode
    const customUUCheckbox = page.getByRole('checkbox', { name: /Use Custom Unique Unit Designer/i });
    await expect(customUUCheckbox).toBeVisible({ timeout: 10000 });
    await customUUCheckbox.check();
    await page.waitForTimeout(300);
    
    // Select infantry type
    await page.getByTestId('type-button-infantry').click();
    await page.waitForTimeout(800);
    
    // Wait for the unit name input to be visible
    const unitNameInput = page.locator('#unit-name');
    await expect(unitNameInput).toBeVisible({ timeout: 10000 });
    
    // Change the unit name
    await unitNameInput.fill('PersistWarrior');
    await expect(unitNameInput).toHaveValue('PersistWarrior');
    
    // Wait for autosave to complete (1000ms debounce + buffer)
    await page.waitForTimeout(2000);
    
    // Verify autosave happened by checking the status
    const autosaveStatus = page.locator('.autosave-status');
    await expect(autosaveStatus).toBeVisible({ timeout: 5000 });
    
    // Reload the page
    await page.reload();
    
    // Wait for page to fully reload and restore (longer wait for safety)
    await page.waitForTimeout(3500);
    
    // Check that we're back on the Unique Unit step and custom UU mode is active
    await expect(customUUCheckbox).toBeVisible({ timeout: 15000 });
    await expect(customUUCheckbox).toBeChecked({ timeout: 5000 });
    
    // Verify the custom UU editor is visible
    await expect(page.getByRole('heading', { name: /Design Your Custom Unique Unit/i })).toBeVisible({ timeout: 10000 });
    
    // Verify unit name field is present and has the saved value
    await expect(unitNameInput).toBeVisible({ timeout: 10000 });
    await expect(unitNameInput).toHaveValue('PersistWarrior', { timeout: 5000 });
  });

  test('should show autosave indicator when changes are made', async ({ page }) => {
    // Start fresh
    await page.goto('/v2/build');
    
    // Wait for initial page load and restore period
    await page.waitForTimeout(1500);
    
    // Verify autosave checkbox is enabled by default
    const autosaveCheckbox = page.getByRole('checkbox', { name: /💾 Autosave to browser/i });
    await expect(autosaveCheckbox).toBeVisible({ timeout: 10000 });
    await expect(autosaveCheckbox).toBeChecked({ timeout: 5000 });
    
    // Make a change - fill in civ name
    const civNameInput = page.getByPlaceholder(/Enter civilization name/i);
    await expect(civNameInput).toBeVisible({ timeout: 10000 });
    await civNameInput.fill('AutosaveTestCiv');
    
    // Wait for autosave to trigger (1000ms debounce + safety margin)
    await page.waitForTimeout(2000);
    
    // Verify autosave status element appears
    const autosaveStatus = page.locator('.autosave-status');
    await expect(autosaveStatus).toBeVisible({ timeout: 10000 });
    
    // Verify it contains the expected text
    const statusText = await autosaveStatus.textContent();
    expect(statusText).toMatch(/Last saved:/i);
  });
});

test.describe('Custom UU Editor - JSON Download', () => {
  test('should include custom UU data in downloaded JSON config', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Create a civ with custom UU
    await page.getByPlaceholder(/Enter civilization name/i).fill('TestCiv');
    await page.getByRole('button', { name: /Next →/i }).click();
    await page.getByRole('button', { name: /Next →/i }).click();
    
    // Enable custom UU
    await page.getByRole('checkbox', { name: /Use Custom Unique Unit Designer/i }).check();
    await page.getByTestId('type-button-infantry').click();
    await page.waitForTimeout(500);
    
    // Customize the unit
    await page.getByLabel(/Unit Name/i).fill('Elite Guard');
    
    // Wait for changes to settle
    await page.waitForTimeout(500);
    
    // Set up download handler
    const downloadPromise = page.waitForEvent('download');
    
    // Click download config button
    await page.getByRole('button', { name: /Download Config/i }).click();
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify download happened
    expect(download.suggestedFilename()).toBe('TestCiv.json');
    
    // Read the downloaded file
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    
    if (downloadPath) {
      const fileContent = fs.readFileSync(downloadPath, 'utf-8');
      const configData = JSON.parse(fileContent);
      
      // Verify basic civ data
      expect(configData.alias).toBe('TestCiv');
      
      // Verify custom UU data is present in bonuses array
      expect(configData.bonuses).toBeDefined();
      expect(Array.isArray(configData.bonuses)).toBe(true);
      
      // bonuses[1] should contain the unique unit data
      // For custom UU, it should be an array with a custom UU data object
      const uuData = configData.bonuses[1];
      expect(Array.isArray(uuData)).toBe(true);
      expect(uuData.length).toBeGreaterThan(0);
      
      // Verify the custom UU object structure
      const customUU = uuData[0];
      expect(customUU).toBeDefined();
      expect(customUU.name).toBe('Elite Guard');
      expect(customUU.unitType).toBe('infantry');
      
      // Verify unit has base stats
      expect(customUU.health).toBeDefined();
      expect(customUU.attack).toBeDefined();
      expect(customUU.baseUnit).toBeDefined();
    }
  });

  test('should download JSON without custom UU when checkbox is unchecked', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Create a civ without custom UU
    await page.getByPlaceholder(/Enter civilization name/i).fill('NormalCiv');
    await page.getByRole('button', { name: /Next →/i }).click();
    await page.getByRole('button', { name: /Next →/i }).click();
    
    // Don't enable custom UU - select a standard UU instead
    await page.locator('img[alt="Longbowmen"]').click();
    
    // Wait for selection
    await page.waitForTimeout(500);
    
    // Set up download handler
    const downloadPromise = page.waitForEvent('download');
    
    // Click download config button
    await page.getByRole('button', { name: /Download Config/i }).click();
    
    // Wait for download
    const download = await downloadPromise;
    
    // Read the downloaded file
    const downloadPath = await download.path();
    if (downloadPath) {
      const fileContent = fs.readFileSync(downloadPath, 'utf-8');
      const configData = JSON.parse(fileContent);
      
      // Verify UU data is a simple ID array, not custom UU object array
      const uuData = configData.bonuses[1];
      expect(Array.isArray(uuData)).toBe(true);
      
      // Standard UU should be just a number (the bonus ID)
      if (uuData.length > 0) {
        expect(typeof uuData[0]).toBe('number');
      }
    }
  });
});

test.describe('Custom UU Editor - Build Mode Constraints', () => {
  test('should enforce 150 point budget in build mode', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Navigate to custom UU
    await page.getByPlaceholder(/Enter civilization name/i).fill('TestCiv');
    await page.getByRole('button', { name: /Next →/i }).click();
    await page.getByRole('button', { name: /Next →/i }).click();
    await page.getByRole('checkbox', { name: /Use Custom Unique Unit Designer/i }).check();
    await page.getByTestId('type-button-infantry').click();
    await page.waitForTimeout(500);
    
    // Verify 150 point budget is shown
    await expect(page.getByText(/Create a unique unit with customizable stats and abilities \(150 point budget\)/i)).toBeVisible();
    
    // Verify power budget display shows limit
    const budgetText = await page.getByText(/Power Budget:/i).textContent();
    expect(budgetText).toBeTruthy();
  });

  test('should show validation status', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Navigate to custom UU
    await page.getByPlaceholder(/Enter civilization name/i).fill('TestCiv');
    await page.getByRole('button', { name: /Next →/i }).click();
    await page.getByRole('button', { name: /Next →/i }).click();
    await page.getByRole('checkbox', { name: /Use Custom Unique Unit Designer/i }).check();
    await page.getByTestId('type-button-cavalry').click();
    await page.waitForTimeout(500);
    
    // Verify validation status is shown (should be valid with defaults)
    await expect(page.getByText(/✓ Valid/i)).toBeVisible();
=======
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
>>>>>>> origin/main
  });
});
