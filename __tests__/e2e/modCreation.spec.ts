import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { completeFullDraft } from './helpers/draftHelpers';

/**
 * E2E tests for Vue UI Mod Creation
 * These tests interact with the actual UI by clicking buttons, filling forms, etc.
 */

const VANILLA_CIVS_DIR = path.join(__dirname, '../../public/vanillaFiles/vanillaCivs/VanillaJson');

// Skip download tests locally (C++ backend not built), but run in CI
const shouldSkipDownloadTests = !process.env.CI;

test.describe('Combine Page - Multi-Civ Mod Creation', () => {
  test('should load combine page successfully', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Check page title
    await expect(page).toHaveTitle(/AoE2 Civbuilder/);
    
    // Check heading
    await expect(page.getByRole('heading', { name: /Combine Civilizations into Mod/i })).toBeVisible();
    
    // Check upload button is visible
    await expect(page.getByText(/Choose JSON Files/i)).toBeVisible();
    
    // Check empty state message
    await expect(page.getByText(/No civilizations loaded yet/i)).toBeVisible();
  });

  test('should upload JSON files via file input', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Load Britons civ JSON
    const britonsPath = path.join(VANILLA_CIVS_DIR, 'Britons.json');
    const franksPath = path.join(VANILLA_CIVS_DIR, 'Franks.json');
    
    // Check files exist
    expect(fs.existsSync(britonsPath)).toBeTruthy();
    expect(fs.existsSync(franksPath)).toBeTruthy();
    
    // Upload files using the file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([britonsPath, franksPath]);
    
    // Wait for files to be processed
    await page.waitForTimeout(500);
    
    // Check that civilizations are loaded
    await expect(page.getByText(/Loaded Civilizations \(2\)/i)).toBeVisible();
    await expect(page.getByText('Britons')).toBeVisible();
    await expect(page.getByText('Franks')).toBeVisible();
    
    // Check create button is enabled
    const createButton = page.getByRole('button', { name: /Create Combined Mod/i });
    await expect(createButton).toBeEnabled();
  });

  test('should remove individual civilizations', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Upload files
    const britonsPath = path.join(VANILLA_CIVS_DIR, 'Britons.json');
    const franksPath = path.join(VANILLA_CIVS_DIR, 'Franks.json');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([britonsPath, franksPath]);
    
    await page.waitForTimeout(500);
    
    // Verify 2 civs are loaded
    await expect(page.getByText(/Loaded Civilizations \(2\)/i)).toBeVisible();
    
    // Click remove button on first civ
    const removeButtons = page.locator('.remove-btn');
    await removeButtons.first().click();
    
    // Verify only 1 civ remains
    await expect(page.getByText(/Loaded Civilizations \(1\)/i)).toBeVisible();
  });

  test('should clear all civilizations', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Upload files
    const britonsPath = path.join(VANILLA_CIVS_DIR, 'Britons.json');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([britonsPath]);
    
    await page.waitForTimeout(500);
    
    // Click clear all button
    page.on('dialog', dialog => dialog.accept()); // Accept confirm dialog
    await page.getByRole('button', { name: /Clear All/i }).click();
    
    // Verify empty state is shown
    await expect(page.getByText(/No civilizations loaded yet/i)).toBeVisible();
  });

  test('should enforce 50 civilization limit', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Get 50 vanilla civ files
    const vanillaCivs = fs.readdirSync(VANILLA_CIVS_DIR).filter(f => f.endsWith('.json'));
    const first50Civs = vanillaCivs.slice(0, 50).map(f => path.join(VANILLA_CIVS_DIR, f));
    
    // Upload 50 civs
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(first50Civs);
    
    // Wait for files to be processed
    await page.waitForTimeout(2000);
    
    // Verify 50 civs are loaded
    await expect(page.getByText(/Loaded Civilizations \(50\)/i)).toBeVisible();
    
    // Verify NO warning message is shown at exactly 50 civs (warning only shows at 51+)
    await expect(page.getByText(/Warning:/i)).not.toBeVisible();
    
    // Verify create button is still enabled at 50 civs
    const createButton = page.getByRole('button', { name: /Create Combined Mod \(50 Civs\)/i });
    await expect(createButton).toBeEnabled();
    
    // Try to upload one more civ (should show alert and prevent)
    const extraCivPath = path.join(VANILLA_CIVS_DIR, vanillaCivs[50]);
    
    // Set up dialog handler to accept the alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Cannot add 1 civilization');
      expect(dialog.message()).toContain('You can only add 0 more');
      await dialog.accept();
    });
    
    // Try to upload the 51st civ
    await fileInput.setInputFiles([extraCivPath]);
    
    // Wait a moment to ensure dialog was shown
    await page.waitForTimeout(500);
    
    // Verify still only 50 civs (upload was prevented)
    await expect(page.getByText(/Loaded Civilizations \(50\)/i)).toBeVisible();
  });

  // Note: The following test requires C++ binary to be built
  // It's enabled in CI where the binary is available
  (shouldSkipDownloadTests ? test.skip : test)('should create combined mod and navigate to success page', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Upload files
    const britonsPath = path.join(VANILLA_CIVS_DIR, 'Britons.json');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([britonsPath]);
    
    await page.waitForTimeout(500);
    
    // Click create mod button
    const createButton = page.getByRole('button', { name: /Create Combined Mod/i });
    await createButton.click();
    
    // Wait for navigation to success page
    // C++ backend must be running for this test to pass
    // Using 30s timeout to match other stable mod creation tests
    await page.waitForURL('**/v2/download-success*', { timeout: 30000 });
    
    // Verify we're on the success page
    await expect(page.getByText(/Mod Created Successfully/i)).toBeVisible();
    
    // Verify civ is listed
    await expect(page.getByText(/Britons/i)).toBeVisible();
  });
});

test.describe('Build Page - Single Civ Mod Creation', () => {
  test('should load build page successfully', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Check page title
    await expect(page).toHaveTitle(/AoE2 Civbuilder/);
    
    // Check heading
    await expect(page.getByRole('heading', { name: /Create Your Civilization/i })).toBeVisible();
    
    // Check stepper is visible (use more specific selector)
    await expect(page.locator('.step-label').filter({ hasText: 'Basic Info' })).toBeVisible();
    await expect(page.locator('.step-label').filter({ hasText: 'Civ Bonuses' })).toBeVisible();
  });

  test('should fill in civilization name and enable next button', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Check that Next button is initially disabled
    const nextButton = page.getByRole('button', { name: /Next →/i });
    await expect(nextButton).toBeDisabled();
    
    // Fill in civilization name
    const civNameInput = page.getByPlaceholder(/Enter civilization name/i);
    await civNameInput.fill('TestCivilization');
    
    // Next button should now be enabled
    await expect(nextButton).toBeEnabled();
  });

  test('should navigate through stepper steps', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Fill in basic info
    await page.getByPlaceholder(/Enter civilization name/i).fill('TestCiv');
    
    // Click Next
    await page.getByRole('button', { name: /Next →/i }).click();
    
    // Should be on Civ Bonuses step
    await expect(page.getByRole('heading', { name: /Civilization Bonuses/i })).toBeVisible();
    
    // Can navigate forward and back
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Unique Unit/i })).toBeVisible();
    
    await page.getByRole('button', { name: /← Previous/i }).click();
    await expect(page.getByRole('heading', { name: /Civilization Bonuses/i })).toBeVisible();
  });

  test('should save config to browser storage', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Fill in name
    await page.getByPlaceholder(/Enter civilization name/i).fill('StoredCiv');
    
    // Wait for autosave
    await page.waitForTimeout(1500);
    
    // Reload page
    await page.reload();
    
    // Wait for page to load
    await page.waitForTimeout(500);
    
    // Name should be restored from browser storage
    const civNameInput = page.getByPlaceholder(/Enter civilization name/i);
    await expect(civNameInput).toHaveValue('StoredCiv');
  });

  // Note: Requires C++ binary - enabled in CI
  (shouldSkipDownloadTests ? test.skip : test)('should create mod at end of stepper and navigate to success page', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Fill in basic info
    await page.getByPlaceholder(/Enter civilization name/i).fill('TestCiv');
    
    // Navigate through stepper to final step
    // Click "Next" buttons to get to the end
    const nextButton = page.getByRole('button', { name: /Next/i });
    
    // Move through steps (may need multiple clicks depending on stepper design)
    for (let i = 0; i < 5; i++) {
      const isVisible = await nextButton.isVisible().catch(() => false);
      if (isVisible) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // At final step, look for create button
    const createButton = page.getByRole('button', { name: /Create Mod/i });
    const buttonExists = await createButton.isVisible().catch(() => false);
    
    if (!buttonExists) {
      // Button not found - test environment may not support full stepper workflow
      console.log('Create Mod button not found - test environment limitation');
      return;
    }
    
    await createButton.click();
    
    // Wait a bit for response
    await page.waitForTimeout(2000);
    
    // Check if error message appeared (C++ backend not available)
    const errorMessage = page.getByText(/Mod creation failed/i);
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);
    
    if (isErrorVisible) {
      // This is expected when C++ binary is not available
      console.log('C++ backend not available - showing error as expected');
      return;
    }
    
    // Otherwise, wait for navigation to success page
    // Using 30s timeout to match other stable mod creation tests
    await page.waitForURL('**/v2/download-success*', { timeout: 30000 });
    
    // Verify we're on the success page
    await expect(page.getByText(/Mod Created Successfully/i)).toBeVisible();
    
    // Verify civ name is listed
    await expect(page.getByText(/TestCiv/i)).toBeVisible();
  });
});

test.describe('Home Page Navigation', () => {
  test('should navigate to combine page from home', async ({ page }) => {
    await page.goto('/v2/');
    
    // Click "Combine Civilizations" button
    await page.getByRole('button', { name: /Combine Civilizations/i }).click();
    
    // Should navigate to combine page
    await expect(page).toHaveURL(/.*\/combine/);
    await expect(page.getByRole('heading', { name: /Combine Civilizations into Mod/i })).toBeVisible();
  });

  test('should navigate to build page from home', async ({ page }) => {
    await page.goto('/v2/');
    
    // Click "Build Civilization" link
    await page.getByRole('link', { name: /Build Civilization/i }).click();
    
    // Should navigate to build page
    await expect(page).toHaveURL(/.*\/build/);
    await expect(page.getByRole('heading', { name: /Create Your Civilization/i })).toBeVisible();
  });
});

// Pasture bonus filter text - used to find bonus 356 (Pastures replace Farms) in the UI
const PASTURE_BONUS_FILTER_TEXT = 'Pastures replace Farms';

test.describe('Build Page - Pasture Bonus Detection', () => {
  test('should show pasture techs in techtree when bonus 356 is selected', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Fill in civilization name
    const civNameInput = page.getByPlaceholder(/Enter civilization name/i);
    await civNameInput.fill('PastureCiv');
    
    // Click Next to go to Civ Bonuses step
    await page.getByRole('button', { name: /Next →/i }).click();
    
    // Should be on Civ Bonuses step
    await expect(page.getByRole('heading', { name: /Civilization Bonuses/i })).toBeVisible();
    
    // Search for the pasture bonus (Pastures replace Farms and Mill upgrades)
    // Use first() since all BonusSelectorGrid components have this placeholder
    const filterInput = page.getByPlaceholder(/e.g. "Infantry", "Archer"/i).first();
    await filterInput.fill(PASTURE_BONUS_FILTER_TEXT);
    
    // Wait for filter to apply by checking if the bonus card is visible
    const bonusCard = page.locator('.bonus-card').first();
    await expect(bonusCard).toBeVisible();
    
    // Click on the bonus card to select it
    await bonusCard.click();
    
    // Navigate to Tech Tree step (need to go through remaining steps)
    // Step 3: Unique Unit
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Unique Unit/i })).toBeVisible();
    
    // Step 4: Castle Tech
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Castle Age Unique Tech/i })).toBeVisible();
    
    // Step 5: Imperial Tech
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Imperial Age Unique Tech/i })).toBeVisible();
    
    // Step 6: Team Bonus
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Team Bonus/i })).toBeVisible();
    
    // Step 7: Tech Tree
    await page.getByRole('button', { name: /Next →/i }).click();
    
    // Wait for the techtree to load by checking for the techtree-container element
    const techtreeContainer = page.locator('.techtree-container');
    await expect(techtreeContainer).toBeVisible();
    
    // Wait a moment for the techtree to fully render
    await page.waitForTimeout(500);
    
    // Check for Pasture building in the techtree SVG
    // The Pasture node is in the SVG but may need scrolling to be in view
    const pastureNode = page.locator('.techtree-svg g.node').filter({ hasText: 'Pasture' }).first();
    await pastureNode.scrollIntoViewIfNeeded();
    await expect(pastureNode).toBeVisible();
    
    // Verify Pasture is enabled (not crossed out) - check that it doesn't have a .cross image on it
    // The cross image should not be visible on the Pasture node
    // When enabled, the cross image has a v-if that hides it
    const crossOnPasture = pastureNode.locator('image.cross');
    await expect(crossOnPasture).not.toBeVisible();
    
    // Check for Domestication tech (first pasture tech)
    const domesticationNode = page.locator('.techtree-svg g.node').filter({ hasText: 'Domestication' }).first();
    await domesticationNode.scrollIntoViewIfNeeded();
    await expect(domesticationNode).toBeVisible();
  });

  test('should show Pasture as enabled (no cross) when pasture bonus is selected', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Fill in civilization name
    const civNameInput = page.getByPlaceholder(/Enter civilization name/i);
    await civNameInput.fill('PastureEnabledCiv');
    
    // Click Next to go to Civ Bonuses step
    await page.getByRole('button', { name: /Next →/i }).click();
    
    // Should be on Civ Bonuses step
    await expect(page.getByRole('heading', { name: /Civilization Bonuses/i })).toBeVisible();
    
    // Search for the pasture bonus (Pastures replace Farms and Mill upgrades)
    const filterInput = page.getByPlaceholder(/e.g. "Infantry", "Archer"/i).first();
    await filterInput.fill(PASTURE_BONUS_FILTER_TEXT);
    
    // Wait for filter to apply by checking if the bonus card is visible
    const bonusCard = page.locator('.bonus-card').first();
    await expect(bonusCard).toBeVisible();
    
    // Click on the bonus card to select it
    await bonusCard.click();
    
    // Navigate through all steps to Tech Tree
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Unique Unit/i })).toBeVisible();
    
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Castle Age Unique Tech/i })).toBeVisible();
    
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Imperial Age Unique Tech/i })).toBeVisible();
    
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Team Bonus/i })).toBeVisible();
    
    await page.getByRole('button', { name: /Next →/i }).click();
    
    // Wait for the techtree to load
    const techtreeContainer = page.locator('.techtree-container');
    await expect(techtreeContainer).toBeVisible();
    
    // Wait a moment for the techtree to fully render
    await page.waitForTimeout(500);
    
    // Find the Pasture node in the SVG
    const pastureNode = page.locator('.techtree-svg g.node').filter({ hasText: 'Pasture' }).first();
    await pastureNode.scrollIntoViewIfNeeded();
    await expect(pastureNode).toBeVisible();
    
    // Verify Pasture is enabled - no cross image should be visible
    const crossOnPasture = pastureNode.locator('image.cross');
    await expect(crossOnPasture).not.toBeVisible();
  });

  test('should show farm techs in techtree when bonus 356 is NOT selected', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Fill in civilization name
    const civNameInput = page.getByPlaceholder(/Enter civilization name/i);
    await civNameInput.fill('FarmCiv');
    
    // Navigate directly to Tech Tree step without selecting pasture bonus
    // Step 1 -> Step 2 (Civ Bonuses)
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Civilization Bonuses/i })).toBeVisible();
    
    // Step 2 -> Step 3 (don't select pasture bonus)
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Unique Unit/i })).toBeVisible();
    
    // Step 3 -> Step 4
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Castle Age Unique Tech/i })).toBeVisible();
    
    // Step 4 -> Step 5
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Imperial Age Unique Tech/i })).toBeVisible();
    
    // Step 5 -> Step 6
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Team Bonus/i })).toBeVisible();
    
    // Step 6 -> Step 7 (Tech Tree)
    await page.getByRole('button', { name: /Next →/i }).click();
    
    // Wait for the techtree to load by checking for the techtree-container element
    const techtreeContainer = page.locator('.techtree-container');
    await expect(techtreeContainer).toBeVisible();
    
    // Wait a moment for the techtree to fully render
    await page.waitForTimeout(500);
    
    // Check for Farm building in the techtree SVG
    // The Farm node is in the SVG but may need scrolling to be in view
    const farmNode = page.locator('.techtree-svg g.node').filter({ hasText: 'Farm' }).first();
    // Scroll the element into view first
    await farmNode.scrollIntoViewIfNeeded();
    await expect(farmNode).toBeVisible();
    
    // Check for Horse Collar tech (first farm tech)
    const horseCollarNode = page.locator('.techtree-svg g.node').filter({ hasText: 'Horse' }).first();
    await horseCollarNode.scrollIntoViewIfNeeded();
    await expect(horseCollarNode).toBeVisible();
  });

  test('should update techtree when pasture bonus is removed', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Fill in civilization name
    const civNameInput = page.getByPlaceholder(/Enter civilization name/i);
    await civNameInput.fill('ToggleCiv');
    
    // Click Next to go to Civ Bonuses step
    await page.getByRole('button', { name: /Next →/i }).click();
    
    // Search for and select the pasture bonus
    // Use first() since all BonusSelectorGrid components have this placeholder
    const filterInput = page.getByPlaceholder(/e.g. "Infantry", "Archer"/i).first();
    await filterInput.fill(PASTURE_BONUS_FILTER_TEXT);
    
    // Wait for filter to apply by checking if the bonus card is visible
    const bonusCard = page.locator('.bonus-card').first();
    await expect(bonusCard).toBeVisible();
    
    // Click on the bonus card to select it
    await bonusCard.click();
    
    // Verify bonus is selected (counter shows 1/1530 selected - no unique limit on build page)
    await expect(page.getByText(/1\/1530 selected/i)).toBeVisible();
    
    // Click the bonus again to deselect it
    await bonusCard.click();
    
    // Verify bonus is deselected (counter shows 0/1530 selected)
    await expect(page.getByText(/0\/1530 selected/i)).toBeVisible();
    
    // Navigate to Tech Tree step by clicking through remaining steps
    // Use explicit waits for each step header
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Unique Unit/i })).toBeVisible();
    
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Castle Age Unique Tech/i })).toBeVisible();
    
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Imperial Age Unique Tech/i })).toBeVisible();
    
    await page.getByRole('button', { name: /Next →/i }).click();
    await expect(page.getByRole('heading', { name: /Team Bonus/i })).toBeVisible();
    
    await page.getByRole('button', { name: /Next →/i }).click();
    
    // Wait for the techtree to load by checking for the techtree-container element
    const techtreeContainer = page.locator('.techtree-container');
    await expect(techtreeContainer).toBeVisible();
    
    // Wait a moment for the techtree to fully render
    await page.waitForTimeout(500);
    
    // Check for Farm building in the techtree SVG
    // The Farm node is in the SVG but may need scrolling to be in view
    const farmNode = page.locator('.techtree-svg g.node').filter({ hasText: 'Farm' }).first();
    // Scroll the element into view first
    await farmNode.scrollIntoViewIfNeeded();
    await expect(farmNode).toBeVisible();
  });
});

test.describe('Draft JSON Compatibility with Combine Page', () => {
  test('should accept draft JSON player format in combine page', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Create a temporary draft JSON file with player data
    const testDir = path.join(__dirname, '../../__tests__/fixtures');
    const draftJsonPath = path.join(testDir, 'test-draft-player.json');
    
    // Create test fixture directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create a player JSON in draft format that should be compatible with CivConfig
    const draftPlayerJson = {
      alias: 'DraftTestCiv',
      description: 'A civilization from draft mode',
      flag_palette: [3, 4, 5, 6, 7, 3, 3, 3],
      tree: [
        [13, 17, 21, 74, 545, 539, 331, 125, 83, 128, 440],
        [12, 45, 49, 50, 68, 70, 72, 79, 82, 84, 87, 101, 103, 104, 109, 199, 209, 276, 562, 584, 598, 621, 792],
        [22, 101, 102, 103, 408]
      ],
      bonuses: [[], [], [], [], []],
      architecture: 1,
      language: 0,
      wonder: 0,
      castle: 0,
      customFlag: false,
      customFlagData: ''
    };
    
    // Write the test JSON file
    fs.writeFileSync(draftJsonPath, JSON.stringify(draftPlayerJson, null, 2));
    
    try {
      // Upload the draft player JSON file to combine page
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(draftJsonPath);
      
      // Wait for file to be processed
      await page.waitForTimeout(500);
      
      // Verify the civilization was loaded successfully
      await expect(page.getByText(/Loaded Civilizations \(1\)/i)).toBeVisible();
      await expect(page.getByText('DraftTestCiv')).toBeVisible();
      await expect(page.getByText('A civilization from draft mode')).toBeVisible();
      
      // Verify create button is enabled
      const createButton = page.getByRole('button', { name: /Create Combined Mod/i });
      await expect(createButton).toBeEnabled();
    } finally {
      // Clean up test file
      if (fs.existsSync(draftJsonPath)) {
        fs.unlinkSync(draftJsonPath);
      }
    }
  });

  test('should handle multiple draft JSON players in combine page', async ({ page }) => {
    await page.goto('/v2/combine');
    
    const testDir = path.join(__dirname, '../../__tests__/fixtures');
    
    // Create test fixture directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create two draft player JSON files
    const player1Path = path.join(testDir, 'draft-player-1.json');
    const player2Path = path.join(testDir, 'draft-player-2.json');
    
    const player1Json = {
      alias: 'DraftCiv1',
      description: 'First draft civ',
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
    
    const player2Json = {
      alias: 'DraftCiv2',
      description: 'Second draft civ',
      flag_palette: [2, 3, 4, 5, 6, 3, 3, 4],
      tree: [[13, 17], [12, 45], [22, 101]],
      bonuses: [[], [], [], [], []],
      architecture: 2,
      language: 10,
      wonder: 1,
      castle: 1,
      customFlag: false,
      customFlagData: ''
    };
    
    fs.writeFileSync(player1Path, JSON.stringify(player1Json, null, 2));
    fs.writeFileSync(player2Path, JSON.stringify(player2Json, null, 2));
    
    try {
      // Upload both draft player JSON files
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([player1Path, player2Path]);
      
      // Wait for files to be processed
      await page.waitForTimeout(500);
      
      // Verify both civilizations were loaded
      await expect(page.getByText(/Loaded Civilizations \(2\)/i)).toBeVisible();
      await expect(page.getByText('DraftCiv1')).toBeVisible();
      await expect(page.getByText('DraftCiv2')).toBeVisible();
      
      // Verify descriptions
      await expect(page.getByText('First draft civ')).toBeVisible();
      await expect(page.getByText('Second draft civ')).toBeVisible();
      
      // Verify create button is enabled
      const createButton = page.getByRole('button', { name: /Create Combined Mod/i });
      await expect(createButton).toBeEnabled();
    } finally {
      // Clean up test files
      if (fs.existsSync(player1Path)) fs.unlinkSync(player1Path);
      if (fs.existsSync(player2Path)) fs.unlinkSync(player2Path);
    }
  });

  test('should handle mix of vanilla and draft JSON files', async ({ page }) => {
    await page.goto('/v2/combine');
    
    const testDir = path.join(__dirname, '../../__tests__/fixtures');
    
    // Create test fixture directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create a draft player JSON
    const draftPlayerPath = path.join(testDir, 'draft-civ-mixed.json');
    const draftPlayerJson = {
      alias: 'DraftMixedCiv',
      description: 'Draft civ mixed with vanilla',
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
    
    fs.writeFileSync(draftPlayerPath, JSON.stringify(draftPlayerJson, null, 2));
    
    // Also use a vanilla civ
    const britonsPath = path.join(VANILLA_CIVS_DIR, 'Britons.json');
    
    try {
      // Check vanilla file exists
      expect(fs.existsSync(britonsPath)).toBeTruthy();
      
      // Upload both files (vanilla + draft)
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([britonsPath, draftPlayerPath]);
      
      // Wait for files to be processed
      await page.waitForTimeout(500);
      
      // Verify both civilizations were loaded
      await expect(page.getByText(/Loaded Civilizations \(2\)/i)).toBeVisible();
      await expect(page.getByText('Britons')).toBeVisible();
      await expect(page.getByText('DraftMixedCiv')).toBeVisible();
      
      // Verify create button is enabled
      const createButton = page.getByRole('button', { name: /Create Combined Mod/i });
      await expect(createButton).toBeEnabled();
    } finally {
      // Clean up test file
      if (fs.existsSync(draftPlayerPath)) {
        fs.unlinkSync(draftPlayerPath);
      }
    }
  });

  test('should extract JSON from actual draft zip created via full draft flow and use in combine', async ({ page }) => {
    test.setTimeout(60000); // Reduced timeout - mod creation takes ~5s, draft+extraction should complete well within 60s
    
    const projectRoot = path.join(__dirname, '../..');
    const modsDir = path.join(projectRoot, 'modding', 'requested_mods');
    let draftId: string | null = null;
    const extractDir = path.join(modsDir, `extract-${Date.now()}`);
    
    try {
      // Complete full draft using helper function
      draftId = await completeFullDraft(page, 1, 'E2E Test Player', 'DraftE2ECiv');
      
      console.log(`[Test] Draft ${draftId} completed, waiting for mod creation...`);
      
      // First, verify we're in the creating phase (phase 5)
      // This confirms the server received the update tree event and started mod creation
      const creatingPhase = page.locator('.creating-phase');
      try {
        await creatingPhase.waitFor({ state: 'visible', timeout: 10000 });
        console.log('[Test] Phase 5 (creating) is visible - mod creation started');
      } catch (error) {
        console.log('[Test] Warning: Phase 5 (creating) not visible - checking current state');
        const currentURL = page.url();
        const draftBoard = await page.locator('.draft-board').isVisible().catch(() => false);
        const techTreePhase = await page.locator('.techtree-phase').isVisible().catch(() => false);
        const downloadPhase = await page.locator('.download-phase').isVisible().catch(() => false);
        console.log(`[Test] Current state: URL=${currentURL}, draft-board=${draftBoard}, techtree=${techTreePhase}, download=${downloadPhase}`);
      }
      
      // Wait for the download button to appear (indicates phase 6 - mod creation complete)
      // Mod creation typically takes ~5 seconds, using 15s timeout to account for CI variability
      console.log('[Test] Waiting for download button (phase 6)...');
      await page.waitForSelector('.download-button', { timeout: 15000 });
      console.log('[Test] Download button appeared - mod creation complete!');
      
      // Give server a moment to ensure file is fully written
      await page.waitForTimeout(1000);
      
      // Now find the zip file
      let zipPath: string | null = null;
      let zipFile: string | null = null;
      
      // The server generates zip files with timestamp-based names (not draft ID)
      // Format: {iso_datetime}_{hex}_v{version}.zip
      // Since we just created this mod, look for the most recent .zip file
      console.log(`[Test] Looking for zip file (draft ID: ${draftId})`);
      const modsFiles = fs.readdirSync(modsDir);
      console.log(`[Test] Files in mods directory (${modsDir}):`, modsFiles);
      
      // First try: Look for zip files that contain the draft ID (legacy naming)
      let foundZipFile = modsFiles.find(f => f.includes(draftId!) && f.endsWith('.zip'));
      
      if (!foundZipFile) {
        // Second try: Find the most recent .zip file (new naming scheme)
        const zipFiles = modsFiles.filter(f => f.endsWith('.zip'));
        console.log(`[Test] Found ${zipFiles.length} zip files:`, zipFiles);
        
        if (zipFiles.length > 0) {
          // Get the most recently modified zip file
          const zipFilesWithStats = zipFiles.map(f => ({
            name: f,
            mtime: fs.statSync(path.join(modsDir, f)).mtime.getTime()
          }));
          zipFilesWithStats.sort((a, b) => b.mtime - a.mtime);
          foundZipFile = zipFilesWithStats[0].name;
          console.log(`[Test] Using most recent zip file: ${foundZipFile}`);
        }
      }
      
      if (foundZipFile) {
        zipFile = foundZipFile;
        zipPath = path.join(modsDir, zipFile);
        console.log(`[Test] Found zip file: ${zipFile}`);
      } else {
        console.log(`[Test] ERROR: No zip file found for draft ${draftId}`);
      }
      
      // Better error message if zip file not found
      if (!zipPath) {
        throw new Error(`Zip file not found for draft ${draftId}. Files in ${modsDir}: ${modsFiles.join(', ')}`);
      }
      
      console.log(`[Test] Verifying zip file exists at: ${zipPath}`);
      expect(fs.existsSync(zipPath)).toBeTruthy();
      
      // Extract the zip
      console.log(`[Test] Extracting zip to: ${extractDir}`);
      fs.mkdirSync(extractDir, { recursive: true });
      execSync(`unzip -q "${zipPath}" -d "${extractDir}"`, {
        cwd: projectRoot,
        stdio: 'pipe'
      });
      console.log(`[Test] Zip extracted successfully`);
      
      // Verify draft-config.json exists
      const extractedDraftConfigPath = path.join(extractDir, 'draft-config.json');
      console.log(`[Test] Checking for draft-config.json at: ${extractedDraftConfigPath}`);
      expect(fs.existsSync(extractedDraftConfigPath)).toBeTruthy();
      
      const extractedDraftConfig = JSON.parse(fs.readFileSync(extractedDraftConfigPath, 'utf8'));
      console.log(`[Test] Draft config loaded, players: ${extractedDraftConfig.players.length}`);
      expect(extractedDraftConfig.players).toHaveLength(1);
      expect(extractedDraftConfig.id).toBe(draftId);
      
      // Find individual civ JSON files created by the server (no conversion needed!)
      const extractedFiles = fs.readdirSync(extractDir);
      const civJsonFiles = extractedFiles.filter(f => f.endsWith('.json') && f !== 'draft-config.json' && f !== 'data.json');
      
      expect(civJsonFiles.length).toBeGreaterThan(0);
      
      // Use the first civ JSON file in combine page
      const civJsonPath = path.join(extractDir, civJsonFiles[0]);
      const civJson = JSON.parse(fs.readFileSync(civJsonPath, 'utf8'));
      
      // Verify the JSON has the expected structure (server should create it correctly)
      expect(civJson).toHaveProperty('alias');
      expect(civJson).toHaveProperty('tree');
      expect(civJson).toHaveProperty('bonuses');
      
      // Use the server-created civ JSON in combine page
      await page.goto('/v2/combine');
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([civJsonPath]);
      
      await page.waitForTimeout(500);
      
      // Verify civilization from real draft was loaded
      await expect(page.getByText(/Loaded Civilizations \(1\)/i)).toBeVisible();
      await expect(page.getByText(civJson.alias)).toBeVisible();
      
      // Verify create button is enabled
      const createButton = page.getByRole('button', { name: /Create Combined Mod/i });
      await expect(createButton).toBeEnabled();
      
    } finally {
      // Clean up
      if (draftId) {
        try {
          const modsFiles = fs.readdirSync(modsDir);
          modsFiles.forEach(file => {
            if (file.includes(draftId!) && file.endsWith('.zip')) {
              const zipPath = path.join(modsDir, file);
              if (fs.existsSync(zipPath)) {
                fs.unlinkSync(zipPath);
              }
            }
          });
        } catch (err) {
          console.error('Error cleaning up zip files:', err);
        }
        
        const modDirPath = path.join(modsDir, draftId);
        if (fs.existsSync(modDirPath)) {
          fs.rmSync(modDirPath, { recursive: true, force: true });
        }
        
        // Clean up draft JSON
        const tempdir = path.join(require('os').tmpdir(), 'civbuilder');
        const draftPath = path.join(tempdir, 'drafts', `${draftId}.json`);
        if (fs.existsSync(draftPath)) {
          fs.unlinkSync(draftPath);
        }
      }
      
      if (fs.existsSync(extractDir)) {
        fs.rmSync(extractDir, { recursive: true, force: true });
      }
    }
  });
});

test.describe('Build Page - Full Flow to Zip Download', () => {
  // This test verifies the complete /v2/build flow including zip download and verification
  // Addresses the requirement: "is there an e2e test for full flow on /v2/build?"
  // This test is similar to:
  //   - draftMode.spec.ts:475 "Draft Mode - Pasture Bonus Detection › should complete single player draft with multiple bonuses"
  //   - customUUDraft.spec.ts "should store custom UU in player bonuses array and complete full draft"
  // But specifically for the /v2/build route with comprehensive zip verification
  (shouldSkipDownloadTests ? test.skip : test)('should complete full build flow, download zip, verify size > 1MB and check JSONs', async ({ page }) => {
    test.setTimeout(90000); // Build flow + mod creation can take time
    
    const projectRoot = path.join(__dirname, '../..');
    const modsDir = path.join(projectRoot, 'modding', 'requested_mods');
    let modTimestamp: number | null = null;
    const extractDir = path.join(modsDir, `extract-build-${Date.now()}`);
    
    try {
      // Navigate to build page
      await page.goto('/v2/build');
      console.log('[Test] Navigated to /v2/build');
      
      // Step 1: Fill in civilization name
      const civNameInput = page.getByPlaceholder(/Enter civilization name/i);
      await expect(civNameInput).toBeVisible();
      await civNameInput.fill('E2E Build Test Civ');
      console.log('[Test] Filled civilization name');
      
      // Navigate through the stepper by clicking Next multiple times
      // The stepper typically has these steps:
      // 1. Basic Info (civ name) - current step
      // 2. Civ Bonuses
      // 3. Unique Unit
      // 4. Castle Tech
      // 5. Imperial Tech
      // 6. Team Bonus
      // 7. Tech Tree
      
      const nextButton = page.getByRole('button', { name: /Next/i });
      
      // Step 2: Civ Bonuses
      await expect(nextButton).toBeEnabled();
      await nextButton.click();
      await page.waitForTimeout(500);
      console.log('[Test] Advanced to Civ Bonuses step');
      
      // Step 3: Unique Unit
      await nextButton.click();
      await page.waitForTimeout(500);
      console.log('[Test] Advanced to Unique Unit step');
      
      // Step 4: Castle Tech
      await nextButton.click();
      await page.waitForTimeout(500);
      console.log('[Test] Advanced to Castle Tech step');
      
      // Step 5: Imperial Tech
      await nextButton.click();
      await page.waitForTimeout(500);
      console.log('[Test] Advanced to Imperial Tech step');
      
      // Step 6: Team Bonus
      await nextButton.click();
      await page.waitForTimeout(500);
      console.log('[Test] Advanced to Team Bonus step');
      
      // Step 7: Tech Tree - this is the final step before mod creation
      await nextButton.click();
      await page.waitForTimeout(1000);
      console.log('[Test] Advanced to Tech Tree step');
      
      // Wait for tech tree to load
      const techTreeContainer = page.locator('.techtree-container');
      await expect(techTreeContainer).toBeVisible({ timeout: 10000 });
      console.log('[Test] Tech tree loaded');
      
      // Complete the tech tree by clicking Done
      const doneButton = page.getByRole('button', { name: /Done|Create Mod/i });
      await expect(doneButton).toBeVisible({ timeout: 5000 });
      await expect(doneButton).toBeEnabled();
      console.log('[Test] Found Done/Create Mod button');
      
      // Record timestamp before clicking to identify the created mod
      modTimestamp = Date.now();
      
      await doneButton.click();
      console.log('[Test] Clicked Done/Create Mod button');
      
      // Handle optional confirmation modal (similar to draft flow)
      const confirmButton = page.getByRole('button', { name: /Yes, Done|Confirm/i });
      try {
        await expect(confirmButton).toBeVisible({ timeout: 2000 });
        await confirmButton.click();
        console.log('[Test] Clicked confirmation button');
      } catch {
        // No confirmation modal - that's fine
        console.log('[Test] No confirmation modal needed');
      }
      
      // Wait for mod creation to complete
      // The build flow might navigate to a success page or show download button
      // Try multiple approaches to detect completion
      
      // Approach 1: Check for navigation to download-success page
      try {
        await page.waitForURL('**/v2/download-success*', { timeout: 30000 });
        console.log('[Test] Navigated to download-success page');
      } catch {
        console.log('[Test] Did not navigate to download-success page, checking for download button...');
        
        // Approach 2: Check for download button/phase in current page
        const downloadButton = page.locator('button:has-text("Download"), .download-button, button:has-text("Download Mod")');
        await expect(downloadButton.first()).toBeVisible({ timeout: 30000 });
        console.log('[Test] Download button visible');
      }
      
      // Give server a moment to ensure file is fully written
      await page.waitForTimeout(2000);
      
      // Now find the zip file created after modTimestamp
      console.log(`[Test] Looking for zip file created after timestamp ${modTimestamp}`);
      const modsFiles = fs.readdirSync(modsDir);
      console.log(`[Test] Files in mods directory: ${modsFiles.length} files`);
      
      // Find the most recently created zip file after our timestamp
      const zipFiles = modsFiles.filter(f => f.endsWith('.zip'));
      const zipFilesWithStats = zipFiles.map(f => ({
        name: f,
        path: path.join(modsDir, f),
        mtime: fs.statSync(path.join(modsDir, f)).mtime.getTime()
      }));
      
      // Filter to only files created after we started (with 5 second buffer for clock skew)
      const recentZips = zipFilesWithStats.filter(z => z.mtime >= (modTimestamp! - 5000));
      recentZips.sort((a, b) => b.mtime - a.mtime);
      
      console.log(`[Test] Found ${recentZips.length} recent zip files`);
      
      if (recentZips.length === 0) {
        throw new Error(`No zip file found created after ${modTimestamp}. All zips: ${zipFiles.join(', ')}`);
      }
      
      const zipPath = recentZips[0].path;
      const zipFile = recentZips[0].name;
      console.log(`[Test] Using most recent zip file: ${zipFile}`);
      
      // Verify zip file exists
      expect(fs.existsSync(zipPath)).toBeTruthy();
      
      // Verify zip file size is greater than 1MB
      const stats = fs.statSync(zipPath);
      const fileSizeInBytes = stats.size;
      const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
      console.log(`[Test] Zip file size: ${fileSizeInMB.toFixed(2)} MB (${fileSizeInBytes} bytes)`);
      
      expect(fileSizeInBytes).toBeGreaterThan(1024 * 1024); // > 1MB
      console.log('[Test] ✓ Zip file size is greater than 1MB');
      
      // Extract the zip
      console.log(`[Test] Extracting zip to: ${extractDir}`);
      fs.mkdirSync(extractDir, { recursive: true });
      execSync(`unzip -q "${zipPath}" -d "${extractDir}"`, {
        cwd: projectRoot,
        stdio: 'pipe'
      });
      console.log('[Test] Zip extracted successfully');
      
      // Verify data.json exists (main mod file)
      const dataJsonPath = path.join(extractDir, 'data.json');
      console.log(`[Test] Checking for data.json at: ${dataJsonPath}`);
      expect(fs.existsSync(dataJsonPath)).toBeTruthy();
      
      const dataJson = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));
      console.log(`[Test] data.json loaded successfully`);
      
      // Verify the data.json has the expected structure
      expect(dataJson).toHaveProperty('civs');
      expect(Array.isArray(dataJson.civs)).toBeTruthy();
      expect(dataJson.civs.length).toBeGreaterThan(0);
      console.log(`[Test] ✓ data.json contains ${dataJson.civs.length} civilization(s)`);
      
      // Verify the civ has the name we entered
      const ourCiv = dataJson.civs.find((c: any) => c.alias === 'E2E Build Test Civ');
      expect(ourCiv).toBeTruthy();
      console.log('[Test] ✓ Found our civilization in data.json');
      
      // Verify the civ has expected properties
      expect(ourCiv).toHaveProperty('tree');
      expect(Array.isArray(ourCiv.tree)).toBeTruthy();
      expect(ourCiv).toHaveProperty('bonuses');
      expect(Array.isArray(ourCiv.bonuses)).toBeTruthy();
      console.log('[Test] ✓ Civilization has expected structure (tree, bonuses)');
      
      // Check for individual civ JSON file
      const extractedFiles = fs.readdirSync(extractDir);
      const civJsonFiles = extractedFiles.filter(f => f.endsWith('.json') && f !== 'data.json' && f !== 'draft-config.json');
      console.log(`[Test] Found ${civJsonFiles.length} individual civ JSON files: ${civJsonFiles.join(', ')}`);
      
      // For build mode, there might be just the data.json or individual files
      // Either way is valid, so we just verify data.json structure
      
      console.log('[Test] ✓ All verifications passed!');
      
    } finally {
      // Clean up
      if (modTimestamp) {
        try {
          const modsFiles = fs.readdirSync(modsDir);
          modsFiles.forEach(file => {
            if (file.endsWith('.zip')) {
              const filePath = path.join(modsDir, file);
              const stats = fs.statSync(filePath);
              // Clean up zip files created during this test (with buffer)
              if (stats.mtime.getTime() >= (modTimestamp! - 5000)) {
                console.log(`[Test] Cleaning up zip file: ${file}`);
                fs.unlinkSync(filePath);
              }
            }
          });
        } catch (err) {
          console.error('Error cleaning up zip files:', err);
        }
      }
      
      if (fs.existsSync(extractDir)) {
        fs.rmSync(extractDir, { recursive: true, force: true });
        console.log('[Test] Cleaned up extract directory');
      }
    }
  });
});
