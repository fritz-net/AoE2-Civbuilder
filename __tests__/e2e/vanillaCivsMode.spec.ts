import { test, expect } from '@playwright/test';
import { CombinePage } from './helpers/CombinePage';
import * as path from 'path';
import * as fs from 'fs';

/**
 * E2E tests for Vanilla Civs Mode on Combine Page
 * Tests the feature that allows users to load all 50 vanilla civilizations
 * and replace individual civs with custom ones.
 */

const VANILLA_CIVS_DIR = path.join(__dirname, '../../public/vanillaFiles/vanillaCivs/VanillaJson');

test.describe('Vanilla Civs Mode', () => {
  test('should show Custom Mode by default with upload section', async ({ page }) => {
    const combinePage = new CombinePage(page);
    await combinePage.navigate();
    
    // Check page loaded
    await combinePage.assertPageLoaded();
    
    // Check that we're in Custom Mode
    await combinePage.assertCustomMode();
    
    // Check "Choose JSON Files" button is visible
    await expect(page.getByText(/Choose JSON Files/i)).toBeVisible();
    
    // Check download link is visible
    await expect(page.getByRole('link', { name: /download vanilla civs/i })).toBeVisible();
    
    // Check drag-and-drop hint
    await expect(page.getByText(/drag and drop JSON files here/i)).toBeVisible();
    
    // Check empty state message
    await expect(page.getByText(/No civilizations loaded yet/i)).toBeVisible();
  });

  test('should load all 50 vanilla civs when "Use Vanilla Civs" button is clicked', async ({ page }) => {
    const combinePage = new CombinePage(page);
    await combinePage.navigate();
    
    // Click "Use Vanilla Civs" button
    await combinePage.clickUseVanillaCivs();
    
    // Check that 50 civilizations are loaded
    await combinePage.assertCivCount(50);
    
    // Check that NO warning message is shown at 50 civs (warning only shows at 51+)
    await expect(page.getByText(/Warning:/i)).not.toBeVisible();
    
    // Check that we're now in Vanilla Mode
    await combinePage.assertVanillaMode();
  });

  test('should load vanilla civs in game order', async ({ page }) => {
    const combinePage = new CombinePage(page);
    await combinePage.navigate();
    
    // Click "Use Vanilla Civs" button
    await combinePage.clickUseVanillaCivs();
    
    // Get all civ cards
    const civCards = combinePage.getCivCards();
    const count = await combinePage.getCivCount();
    expect(count).toBe(50);
    
    // Check first few civs are in game order
    // Expected order: Britons, Franks, Goths, Teutons, Japanese...
    await expect(civCards.nth(0).getByRole('heading', { name: 'Britons' })).toBeVisible();
    await expect(civCards.nth(1).getByRole('heading', { name: 'Franks' })).toBeVisible();
    await expect(civCards.nth(2).getByRole('heading', { name: 'Goths' })).toBeVisible();
    await expect(civCards.nth(3).getByRole('heading', { name: 'Teutons' })).toBeVisible();
    await expect(civCards.nth(4).getByRole('heading', { name: 'Japanese' })).toBeVisible();
    
    // Check last civ (Khitans should be last in the list)
    await expect(civCards.nth(49).getByRole('heading', { name: 'Khitans' })).toBeVisible();
  });

  test('should show Replace button for each civ in Vanilla Mode', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Load vanilla civs
    await page.getByRole('button', { name: /Use Vanilla Civs/i }).click();
    await page.waitForTimeout(3000);
    
    // Check that Replace buttons are visible
    const replaceButtons = page.locator('.replace-btn');
    const count = await replaceButtons.count();
    expect(count).toBe(50); // One replace button per civ
    
    // Check first Replace button
    await expect(replaceButtons.first()).toBeVisible();
    await expect(replaceButtons.first()).toHaveText(/Replace/i);
  });

  test('should replace a vanilla civ with a custom JSON file', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Load vanilla civs
    await page.getByRole('button', { name: /Use Vanilla Civs/i }).click();
    await page.waitForTimeout(3000);
    
    // Verify Britons is the first civ
    const firstCivCard = page.locator('.civ-card').first();
    await expect(firstCivCard.getByRole('heading', { name: 'Britons' })).toBeVisible();
    
    // Create a temporary custom civ JSON
    const testDir = path.join(__dirname, '../../__tests__/fixtures');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const customCivPath = path.join(testDir, 'custom-replacement-civ.json');
    const customCivJson = {
      alias: 'CustomReplacementCiv',
      description: 'A custom civ replacing vanilla',
      flag_palette: [3, 4, 5, 6, 7, 3, 3, 3],
      tree: [[13, 17, 21], [12, 45, 49], [22, 101, 102]],
      bonuses: [[], [], [], [], []],
      architecture: 1,
      language: 0,
      wonder: 0,
      castle: 0,
      customFlag: false,
      customFlagData: ''
    };
    
    fs.writeFileSync(customCivPath, JSON.stringify(customCivJson, null, 2));
    
    try {
      // Click Replace button on first civ (Britons)
      const firstReplaceBtn = page.locator('.replace-btn').first();
      
      // Set up file chooser handler
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        firstReplaceBtn.click()
      ]);
      
      await fileChooser.setFiles(customCivPath);
      
      // Wait for replacement to process
      await page.waitForTimeout(500);
      
      // Verify the first civ is now the custom civ
      await expect(firstCivCard.getByRole('heading', { name: 'CustomReplacementCiv' })).toBeVisible();
      await expect(firstCivCard.getByText('A custom civ replacing vanilla')).toBeVisible();
      
      // Verify still 50 civs total
      await expect(page.getByText(/Loaded Civilizations \(50\)/i)).toBeVisible();
      
      // Verify second civ is still Franks (unchanged)
      const secondCivCard = page.locator('.civ-card').nth(1);
      await expect(secondCivCard.getByRole('heading', { name: 'Franks' })).toBeVisible();
      
    } finally {
      // Clean up test file
      if (fs.existsSync(customCivPath)) {
        fs.unlinkSync(customCivPath);
      }
    }
  });

  test('should remove a civ from vanilla mode', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Load vanilla civs
    await page.getByRole('button', { name: /Use Vanilla Civs/i }).click();
    await page.waitForTimeout(3000);
    
    // Verify 50 civs loaded
    await expect(page.getByText(/Loaded Civilizations \(50\)/i)).toBeVisible();
    
    // Click remove button on first civ
    const removeButtons = page.locator('.remove-btn');
    await removeButtons.first().click();
    
    // Wait for removal
    await page.waitForTimeout(500);
    
    // Verify only 49 civs remain
    await expect(page.getByText(/Loaded Civilizations \(49\)/i)).toBeVisible();
    
    // Verify NO warning message at 49 civs (warning only shows at 51+)
    await expect(page.getByText(/Warning:/i)).not.toBeVisible();
    
    // Verify Britons is removed (second civ should now be first)
    const firstCivCard = page.locator('.civ-card').first();
    await expect(firstCivCard.getByRole('heading', { name: 'Franks' })).toBeVisible();
  });

  test('should switch back to Custom Mode from Vanilla Mode', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Load vanilla civs
    await page.getByRole('button', { name: /Use Vanilla Civs/i }).click();
    await page.waitForTimeout(3000);
    
    // Verify in Vanilla Mode
    await expect(page.getByText(/Loaded Civilizations \(50\)/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Switch to Custom Mode/i })).toBeVisible();
    
    // Set up dialog handler to accept confirmation
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Switching to Custom Mode will clear all currently loaded civilizations');
      dialog.accept();
    });
    
    // Click "Switch to Custom Mode" button
    await page.getByRole('button', { name: /Switch to Custom Mode/i }).click();
    
    // Wait for mode switch
    await page.waitForTimeout(500);
    
    // Verify back in Custom Mode
    await expect(page.getByRole('heading', { name: /Add Civilizations/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Use Vanilla Civs/i })).toBeVisible();
    
    // Verify civs are cleared
    await expect(page.getByText(/No civilizations loaded yet/i)).toBeVisible();
  });

  test('should show confirmation dialog when switching to Custom Mode with loaded civs', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Load vanilla civs
    await page.getByRole('button', { name: /Use Vanilla Civs/i }).click();
    await page.waitForTimeout(3000);
    
    // Set up dialog handler to dismiss confirmation
    let dialogShown = false;
    page.on('dialog', async dialog => {
      dialogShown = true;
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('Switching to Custom Mode will clear all currently loaded civilizations');
      await dialog.dismiss(); // Cancel the switch
    });
    
    // Try to switch to Custom Mode
    await page.getByRole('button', { name: /Switch to Custom Mode/i }).click();
    
    // Wait a moment for dialog
    await page.waitForTimeout(500);
    
    // Verify dialog was shown
    expect(dialogShown).toBeTruthy();
    
    // Verify still in Vanilla Mode (switch was cancelled)
    await expect(page.getByText(/Loaded Civilizations \(50\)/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Switch to Custom Mode/i })).toBeVisible();
  });

  test('should allow uploading custom civs in Custom Mode after switching from Vanilla Mode', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Load vanilla civs
    await page.getByRole('button', { name: /Use Vanilla Civs/i }).click();
    await page.waitForTimeout(3000);
    
    // Switch back to Custom Mode
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: /Switch to Custom Mode/i }).click();
    await page.waitForTimeout(500);
    
    // Now upload a custom civ
    const britonsPath = path.join(VANILLA_CIVS_DIR, 'Britons.json');
    expect(fs.existsSync(britonsPath)).toBeTruthy();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([britonsPath]);
    
    await page.waitForTimeout(500);
    
    // Verify civ is loaded
    await expect(page.getByText(/Loaded Civilizations \(1\)/i)).toBeVisible();
    await expect(page.getByText('Britons')).toBeVisible();
    
    // Verify NO Replace button (we're in Custom Mode, not Vanilla Mode)
    const replaceButtons = page.locator('.replace-btn');
    await expect(replaceButtons).toHaveCount(0);
  });

  test('should handle vanilla civs download link', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Check download link is visible
    const downloadLink = page.getByRole('link', { name: /download vanilla civs/i });
    await expect(downloadLink).toBeVisible();
    
    // Verify link has correct href attribute
    await expect(downloadLink).toHaveAttribute('href', '/vanilla');
  });

  test('should create mod with vanilla civs', async ({ page }) => {
    // Skip if C++ backend not available (same as other mod creation tests)
    if (!process.env.CI) {
      test.skip();
      return;
    }
    
    await page.goto('/v2/combine');
    
    // Load vanilla civs
    await page.getByRole('button', { name: /Use Vanilla Civs/i }).click();
    await page.waitForTimeout(3000);
    
    // Verify 50 civs loaded
    await expect(page.getByText(/Loaded Civilizations \(50\)/i)).toBeVisible();
    
    // Click create mod button
    const createButton = page.getByRole('button', { name: /Create Combined Mod \(50 Civs\)/i });
    await expect(createButton).toBeEnabled();
    await createButton.click();
    
    // Wait for navigation to success page
    await page.waitForURL(/.*\/download-success/, { timeout: 30000 });
    
    // Verify we're on the success page
    await expect(page.getByText(/Mod Created Successfully/i)).toBeVisible();
  });

  test('should create mod with mix of vanilla and replaced civs', async ({ page }) => {
    // Skip if C++ backend not available
    if (!process.env.CI) {
      test.skip();
      return;
    }
    
    await page.goto('/v2/combine');
    
    // Load vanilla civs
    await page.getByRole('button', { name: /Use Vanilla Civs/i }).click();
    await page.waitForTimeout(3000);
    
    // Remove one vanilla civ
    const removeButtons = page.locator('.remove-btn');
    await removeButtons.first().click();
    await page.waitForTimeout(500);
    
    // Verify 49 civs
    await expect(page.getByText(/Loaded Civilizations \(49\)/i)).toBeVisible();
    
    // Replace another civ with custom one
    const testDir = path.join(__dirname, '../../__tests__/fixtures');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const customCivPath = path.join(testDir, 'mix-test-civ.json');
    const customCivJson = {
      alias: 'MixTestCiv',
      description: 'Mixed with vanilla',
      flag_palette: [3, 4, 5, 6, 7, 3, 3, 3],
      tree: [[13, 17, 21], [12, 45, 49], [22, 101, 102]],
      bonuses: [[], [], [], [], []],
      architecture: 1,
      language: 0,
      wonder: 0,
      castle: 0,
      customFlag: false,
      customFlagData: ''
    };
    
    fs.writeFileSync(customCivPath, JSON.stringify(customCivJson, null, 2));
    
    try {
      // Replace second civ
      const replaceBtn = page.locator('.replace-btn').nth(1);
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        replaceBtn.click()
      ]);
      await fileChooser.setFiles(customCivPath);
      await page.waitForTimeout(500);
      
      // Verify custom civ is in the list
      await expect(page.getByText('MixTestCiv')).toBeVisible();
      await expect(page.getByText(/Loaded Civilizations \(49\)/i)).toBeVisible();
      
      // Click create mod button
      const createButton = page.getByRole('button', { name: /Create Combined Mod \(49 Civs\)/i });
      await expect(createButton).toBeEnabled();
      await createButton.click();
      
      // Wait for navigation to success page
      await page.waitForURL(/.*\/download-success/, { timeout: 30000 });
      
      // Verify we're on the success page
      await expect(page.getByText(/Mod Created Successfully/i)).toBeVisible();
      
      // Verify custom civ name is listed
      await expect(page.getByText(/MixTestCiv/i)).toBeVisible();
      
    } finally {
      // Clean up test file
      if (fs.existsSync(customCivPath)) {
        fs.unlinkSync(customCivPath);
      }
    }
  });

  test('should maintain game order after replacing a civ', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Load vanilla civs
    await page.getByRole('button', { name: /Use Vanilla Civs/i }).click();
    await page.waitForTimeout(3000);
    
    // Create a custom civ
    const testDir = path.join(__dirname, '../../__tests__/fixtures');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const customCivPath = path.join(testDir, 'order-test-civ.json');
    const customCivJson = {
      alias: 'CustomOrderCiv',
      description: 'Test game order',
      flag_palette: [3, 4, 5, 6, 7, 3, 3, 3],
      tree: [[13, 17, 21], [12, 45, 49], [22, 101, 102]],
      bonuses: [[], [], [], [], []],
      architecture: 1,
      language: 0,
      wonder: 0,
      castle: 0,
      customFlag: false,
      customFlagData: ''
    };
    
    fs.writeFileSync(customCivPath, JSON.stringify(customCivJson, null, 2));
    
    try {
      // Replace first civ (Britons) with custom civ
      const firstReplaceBtn = page.locator('.replace-btn').first();
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        firstReplaceBtn.click()
      ]);
      await fileChooser.setFiles(customCivPath);
      await page.waitForTimeout(500);
      
      // Verify custom civ replaced Britons at position 0
      const firstCivCard = page.locator('.civ-card').first();
      await expect(firstCivCard.getByRole('heading', { name: 'CustomOrderCiv' })).toBeVisible();
      
      // Verify rest of order is preserved (Franks should still be second)
      const secondCivCard = page.locator('.civ-card').nth(1);
      await expect(secondCivCard.getByRole('heading', { name: 'Franks' })).toBeVisible();
      
    } finally {
      // Clean up test file
      if (fs.existsSync(customCivPath)) {
        fs.unlinkSync(customCivPath);
      }
    }
  });
});
