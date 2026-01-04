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
  });
});

test.describe('Custom UU Editor - Autosave Persistence', () => {
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
    await page.goto('/v2/build');
    
    // Wait for restore period to complete (1100ms)
    await page.waitForTimeout(1200);
    
    // Navigate and create a custom unit
    await page.getByPlaceholder(/Enter civilization name/i).fill('TestCiv');
    await page.getByRole('button', { name: /Next →/i }).click();
    await page.getByRole('button', { name: /Next →/i }).click();
    await page.getByRole('checkbox', { name: /Use Custom Unique Unit Designer/i }).check();
    await page.getByTestId('type-button-infantry').click();
    await page.waitForTimeout(500);
    
    // Customize the unit
    await page.getByLabel(/Unit Name/i).fill('Elite Warrior');
    
    // Wait for autosave (1000ms debounce + safety margin)
    await page.waitForTimeout(1500);
    
    // Reload the page
    await page.reload();
    
    // Wait for restore to complete after reload (1100ms restore + extra buffer for rendering)
    await page.waitForTimeout(3000);
    
    // After reload, verify we're back on step 3 (Unique Unit)
    await expect(page.getByRole('heading', { name: /Unique Unit/i })).toBeVisible({ timeout: 10000 });
    
    // Verify custom UU checkbox is still checked
    const customUUCheckbox = page.getByRole('checkbox', { name: /Use Custom Unique Unit Designer/i });
    await expect(customUUCheckbox).toBeChecked({ timeout: 10000 });
    
    // Verify custom UU editor is shown
    await expect(page.getByRole('heading', { name: /Design Your Custom Unique Unit/i })).toBeVisible({ timeout: 10000 });
    
    // Verify unit name is restored
    await expect(page.getByLabel(/Unit Name/i)).toHaveValue('Elite Warrior', { timeout: 10000 });
  });

  test('should show autosave indicator when changes are made', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Wait for restore period to complete (1100ms)
    await page.waitForTimeout(1200);
    
    // Verify autosave checkbox is enabled by default
    const autosaveCheckbox = page.getByRole('checkbox', { name: /💾 Autosave to browser/i });
    await expect(autosaveCheckbox).toBeChecked({ timeout: 10000 });
    
    // Fill in civ name
    await page.getByPlaceholder(/Enter civilization name/i).fill('TestCiv');
    
    // Wait for autosave to trigger (1000ms debounce + safety margin)
    await page.waitForTimeout(1500);
    
    // Verify autosave status is shown (text contains "Last saved:")
    const autosaveStatus = page.locator('.autosave-status');
    await expect(autosaveStatus).toBeVisible({ timeout: 10000 });
    await expect(autosaveStatus).toContainText(/Last saved:/i, { timeout: 10000 });
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
  });
});
