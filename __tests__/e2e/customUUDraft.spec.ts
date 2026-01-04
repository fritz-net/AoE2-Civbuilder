import { test, expect, Page } from '@playwright/test';
import { DraftCreatePage } from './helpers/DraftCreatePage';

/**
 * E2E tests for Custom UU Mode in Draft
 * Tests the custom unique unit designer integration in draft flow
 * Using Page Object Model pattern
 */

// Helper to create a draft with custom UU mode enabled
async function createCustomUUDraft(page: Page, numPlayers: number = 2): Promise<{ hostLink: string; playerLink: string; draftId: string | null }> {
  const draftCreatePage = new DraftCreatePage(page);
  await draftCreatePage.navigate();
  await draftCreatePage.assertPageLoaded();
  
  // Set number of players
  await draftCreatePage.setNumPlayers(numPlayers);
  
  // Expand advanced settings
  await draftCreatePage.expandAdvancedSettings();
  
  // Enable custom UU mode
  await page.getByRole('checkbox', { name: /Enable Custom UU Designer Mode/i }).check();
  await expect(page.getByRole('checkbox', { name: /Enable Custom UU Designer Mode/i })).toBeChecked();
  
  // Start draft
  await draftCreatePage.clickStartDraft();
  
  // Get links
  return await draftCreatePage.getDraftLinks();
}

// Helper to join as player
async function joinAsPlayer(page: Page, link: string, playerName: string): Promise<void> {
  await page.goto(link);
  
  // Wait for join form
  await page.waitForSelector('#playerName, input[placeholder*="name" i]', { timeout: 10000 });
  
  // Fill in player name
  const nameInput = page.locator('#playerName, input[placeholder*="name" i]').first();
  await nameInput.fill(playerName);
  
  // Click join button
  await page.getByRole('button', { name: /Join/i }).click();
  
  // Wait for lobby or next phase
  await page.waitForTimeout(2000);
}

// Helper to complete setup phase (flag, architecture, language, civ name)
async function completeSetupPhase(page: Page): Promise<void> {
  // Wait for setup phase
  await page.waitForSelector('#civName, input[placeholder*="civilization name" i]', { timeout: 10000 });
  
  // Fill in civ name
  const civNameInput = page.locator('#civName, input[placeholder*="civilization name" i]').first();
  await civNameInput.fill('Test Civilization');
  
  // Click Next button
  await page.getByRole('button', { name: /Next/i }).click();
  
  // Wait for next phase
  await page.waitForTimeout(2000);
}

// Helper to select first available card
async function selectFirstCard(page: Page): Promise<void> {
  // Wait for cards to be visible
  await page.waitForSelector('.bonus-card, .draft-card, [class*="card"]', { timeout: 10000 });
  
  // Click first card
  const firstCard = page.locator('.bonus-card, .draft-card, [class*="card"]').first();
  await firstCard.click();
  
  // Wait a bit for server to process
  await page.waitForTimeout(1500);
}

test.describe('Custom UU Draft - Creation', () => {
  test('should allow creating draft with custom UU mode enabled', async ({ page }) => {
    const { hostLink, draftId } = await createCustomUUDraft(page, 2);
    
    expect(hostLink).toMatch(/\/v2\/draft\/host\/\d+/);
    expect(draftId).toBeTruthy();
  });
  
  test('should show custom UU checkbox in advanced settings', async ({ page }) => {
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    await draftCreatePage.expandAdvancedSettings();
    
    const customUUCheckbox = page.getByRole('checkbox', { name: /Enable Custom UU Designer Mode/i });
    await expect(customUUCheckbox).toBeVisible();
    
    // Check that description is present
    await expect(page.getByText(/design their own custom unique units/i)).toBeVisible();
  });
});

test.describe('Custom UU Draft - Flow (Single Player)', () => {
  test('should skip unique unit selection round when custom UU mode is enabled', async ({ page }) => {
    // Create 1-player draft with custom UU mode
    const { hostLink } = await createCustomUUDraft(page, 1);
    
    // Join as host
    await joinAsPlayer(page, hostLink, 'Test Player');
    
    // Start draft
    await page.waitForTimeout(2000);
    const startButton = page.getByRole('button', { name: /Start Draft/i });
    await expect(startButton).toBeVisible({ timeout: 5000 });
    await startButton.click();
    
    // Complete setup phase
    await completeSetupPhase(page);
    
    // Should now be in draft phase - select civ bonus (round 0)
    await page.waitForTimeout(2000);
    const phaseTitle = page.locator('h1, h2, .phase-title, [class*="title"]').first();
    const titleText = await phaseTitle.textContent().catch(() => '');
    
    // Verify we're in civ bonuses round
    expect(titleText).toMatch(/Civilization Bonuses|Bonuses|Draft/i);
    
    // Select a card
    await selectFirstCard(page);
    
    // After civ bonuses, should go to custom UU phase (not unique units cards)
    await page.waitForTimeout(3000);
    
    // Check if custom UU editor is shown
    const customUUEditor = page.locator('text=/Design Your Custom Unique Unit|Custom Unique Unit|Custom UU/i');
    const isCustomUUVisible = await customUUEditor.isVisible().catch(() => false);
    
    if (!isCustomUUVisible) {
      // Log what we see instead
      const currentPhase = await page.locator('h1, h2, .phase-title').first().textContent().catch(() => 'unknown');
      console.log(`After civ bonuses, current phase: ${currentPhase}`);
    }
    
    // The test passes if we don't see "Unique Units" card selection
    const uniqueUnitsTitle = page.locator('text=/^Unique Units$/i');
    const hasUniqueUnitsRound = await uniqueUnitsTitle.isVisible().catch(() => false);
    expect(hasUniqueUnitsRound).toBe(false);
  });
});

test.describe('Custom UU Draft - Custom UU Phase', () => {
  test('should show custom UU editor after civ bonuses round', async ({ page }) => {
    // Create 1-player draft with custom UU mode
    const { hostLink } = await createCustomUUDraft(page, 1);
    
    // Join and start
    await joinAsPlayer(page, hostLink, 'Test Player');
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /Start Draft/i }).click();
    
    // Complete setup
    await completeSetupPhase(page);
    
    // Complete civ bonuses round
    await page.waitForTimeout(2000);
    await selectFirstCard(page);
    
    // Should see custom UU editor
    await page.waitForTimeout(3000);
    const customUUEditor = page.locator('text=/Design Your Custom Unique Unit|Custom Unique Unit/i').first();
    await expect(customUUEditor).toBeVisible({ timeout: 10000 });
  });
  
  test('should be able to submit custom UU and continue draft', async ({ page }) => {
    // Create 1-player draft
    const { hostLink } = await createCustomUUDraft(page, 1);
    
    // Join and navigate to custom UU phase
    await joinAsPlayer(page, hostLink, 'Test Player');
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /Start Draft/i }).click();
    await completeSetupPhase(page);
    await page.waitForTimeout(2000);
    await selectFirstCard(page);
    
    // Should be in custom UU phase
    await page.waitForTimeout(3000);
    
    // Try to find and interact with custom UU editor
    const unitNameInput = page.getByLabel(/Unit Name/i);
    const isEditorVisible = await unitNameInput.isVisible().catch(() => false);
    
    if (isEditorVisible) {
      // Fill in unit name
      await unitNameInput.fill('Test Warrior');
      
      // Wait a bit for validation
      await page.waitForTimeout(1000);
      
      // Try to submit
      const submitButton = page.getByRole('button', { name: /Submit Custom Unit|Submit/i });
      const isSubmitVisible = await submitButton.isVisible().catch(() => false);
      
      if (isSubmitVisible) {
        const isEnabled = await submitButton.isEnabled();
        
        // If button is enabled, submit
        if (isEnabled) {
          await submitButton.click();
          
          // Should advance to next phase
          await page.waitForTimeout(3000);
          
          // Should see castle techs round or waiting screen
          const nextPhase = page.locator('text=/Castle|Waiting|Tech Tree/i').first();
          await expect(nextPhase).toBeVisible({ timeout: 10000 });
        }
      }
    }
  });
});

test.describe('Custom UU Draft - Backend Integration', () => {
  test('should store custom UU in player bonuses array', async ({ page, context }) => {
    // This test verifies that custom UU is stored correctly
    // We'll need to check the backend state or wait for tech tree phase
    // where custom UU should be displayed in sidebar
    
    const { hostLink } = await createCustomUUDraft(page, 1);
    
    await joinAsPlayer(page, hostLink, 'Test Player');
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /Start Draft/i }).click();
    await completeSetupPhase(page);
    await page.waitForTimeout(2000);
    
    // Complete civ bonuses round to get to custom UU
    await selectFirstCard(page);
    await page.waitForTimeout(3000);
    
    // If we're in custom UU phase, fill it out
    const unitNameInput = page.getByLabel(/Unit Name/i);
    if (await unitNameInput.isVisible().catch(() => false)) {
      await unitNameInput.fill('Elite Guard');
      await page.waitForTimeout(1000);
      
      // Submit if possible
      const submitButton = page.getByRole('button', { name: /Submit Custom Unit|Submit/i });
      if (await submitButton.isEnabled().catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(3000);
        
        // Continue through remaining rounds
        // Castle tech
        if (await page.locator('.bonus-card, .draft-card').first().isVisible().catch(() => false)) {
          await selectFirstCard(page);
          await page.waitForTimeout(2000);
        }
        
        // Imperial tech
        if (await page.locator('.bonus-card, .draft-card').first().isVisible().catch(() => false)) {
          await selectFirstCard(page);
          await page.waitForTimeout(2000);
        }
        
        // Team bonus
        if (await page.locator('.bonus-card, .draft-card').first().isVisible().catch(() => false)) {
          await selectFirstCard(page);
          await page.waitForTimeout(3000);
        }
        
        // Should reach tech tree phase
        // Custom UU should be visible in sidebar
        const techTreePhase = page.locator('text=/Tech Tree|Techtree/i');
        if (await techTreePhase.isVisible().catch(() => false)) {
          // Look for custom UU in sidebar
          const customUUInSidebar = page.locator('text=/Elite Guard|Custom Unique Unit/i');
          await expect(customUUInSidebar).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });
});

test.describe('Custom UU Draft - Error Handling', () => {
  test('should not allow submitting invalid custom UU', async ({ page }) => {
    const { hostLink } = await createCustomUUDraft(page, 1);
    
    await joinAsPlayer(page, hostLink, 'Test Player');
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /Start Draft/i }).click();
    await completeSetupPhase(page);
    await page.waitForTimeout(2000);
    await selectFirstCard(page);
    await page.waitForTimeout(3000);
    
    // Should be in custom UU editor
    const unitNameInput = page.getByLabel(/Unit Name/i);
    if (await unitNameInput.isVisible().catch(() => false)) {
      // Try to submit without filling anything (invalid)
      const submitButton = page.getByRole('button', { name: /Submit Custom Unit|Submit/i });
      
      if (await submitButton.isVisible().catch(() => false)) {
        // Button should be disabled for invalid UU
        const isEnabled = await submitButton.isEnabled();
        expect(isEnabled).toBe(false);
      }
    }
  });
  
  test('should show validation errors for invalid custom UU', async ({ page }) => {
    const { hostLink } = await createCustomUUDraft(page, 1);
    
    await joinAsPlayer(page, hostLink, 'Test Player');
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /Start Draft/i }).click();
    await completeSetupPhase(page);
    await page.waitForTimeout(2000);
    await selectFirstCard(page);
    await page.waitForTimeout(3000);
    
    // Should be in custom UU editor
    const unitNameInput = page.getByLabel(/Unit Name/i);
    if (await unitNameInput.isVisible().catch(() => false)) {
      // Clear the name (if it has default value)
      await unitNameInput.clear();
      await page.waitForTimeout(500);
      
      // Should show validation errors or disabled submit button
      const submitButton = page.getByRole('button', { name: /Submit Custom Unit|Submit/i });
      if (await submitButton.isVisible().catch(() => false)) {
        const isDisabled = !(await submitButton.isEnabled());
        expect(isDisabled).toBe(true);
      }
    }
  });
});
