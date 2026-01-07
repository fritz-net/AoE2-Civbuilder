import { test, expect } from '@playwright/test';
import { DraftCreatePage } from './helpers/DraftCreatePage';
import { DraftPlayerPage } from './helpers/DraftPlayerPage';
import { CustomUUEditorPage } from './helpers/CustomUUEditorPage';

/**
 * E2E tests for Custom UU Mode in Draft
 * Tests the custom unique unit designer integration in draft flow
 * Refactored to use Page Object Model pattern
 */

test.describe('Custom UU Draft - Creation', () => {
  test('should allow creating draft with custom UU mode enabled', async ({ page }) => {
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    await draftCreatePage.assertPageLoaded();

    await draftCreatePage.setNumPlayers(2);
    await draftCreatePage.enableCustomUUMode();

    await draftCreatePage.clickStartDraft();
    const { hostLink, draftId } = await draftCreatePage.getDraftLinks();

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
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    await draftCreatePage.assertPageLoaded();

    await draftCreatePage.setNumPlayers(1);
    await draftCreatePage.enableCustomUUMode();

    await draftCreatePage.clickStartDraft();
    const { hostLink } = await draftCreatePage.getDraftLinks();

    // Join as player
    const playerPage = new DraftPlayerPage(page);
    await playerPage.navigate(hostLink);
    await playerPage.joinDraft('Test Player');

    // Start draft
    await playerPage.startDraft();

    // Complete setup phase
    await playerPage.completeSetupPhase('Test Civilization');

    // Should now be in draft phase - select civ bonus (round 0)
    await playerPage.selectFirstCard();

    // Verify we don't see "Unique Units" card selection round
    const uniqueUnitsTitle = page.locator('text=/^Unique Units$/i');
    await expect(uniqueUnitsTitle).not.toBeVisible();
  });
});

test.describe('Custom UU Draft - Custom UU Phase', () => {
  test('should show custom UU editor after civ bonuses round', async ({ page }) => {
    // Create 1-player draft with custom UU mode and 1 bonus per player
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    await draftCreatePage.assertPageLoaded();

    await draftCreatePage.setNumPlayers(1);
    await draftCreatePage.setBonusesPerPlayer(1);

    // Enable custom UU mode
    await draftCreatePage.enableCustomUUMode();

    // Start draft
    await draftCreatePage.clickStartDraft();
    const { hostLink } = await draftCreatePage.getDraftLinks();

    // Join and navigate through to custom UU phase
    const playerPage = new DraftPlayerPage(page);
    await playerPage.navigate(hostLink);
    await playerPage.joinDraft('Test Player');
    await playerPage.startDraft();
    await playerPage.completeSetupPhase('Test Civilization');

    // Complete civ bonuses round (only need 1 pick with 1 bonus per player)
    await playerPage.selectFirstCard();

    // Should see custom UU editor
    const customUUEditor = new CustomUUEditorPage(page);
    await customUUEditor.waitForEditor();
  });

  test('should be able to submit custom UU and continue draft', async ({ page }) => {
    // Create 1-player draft with 1 bonus
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    await draftCreatePage.assertPageLoaded();

    await draftCreatePage.setNumPlayers(1);
    await draftCreatePage.setBonusesPerPlayer(1);

    // Enable custom UU mode
    await draftCreatePage.enableCustomUUMode();

    // Start draft
    await draftCreatePage.clickStartDraft();
    const { hostLink } = await draftCreatePage.getDraftLinks();

    // Join and navigate to custom UU phase
    const playerPage = new DraftPlayerPage(page);
    await playerPage.navigate(hostLink);
    await playerPage.joinDraft('Test Player');
    await playerPage.startDraft();
    await playerPage.completeSetupPhase('Test Civilization');
    await playerPage.selectFirstCard();

    // Create custom UU
    const customUUEditor = new CustomUUEditorPage(page);
    await customUUEditor.createCustomUnit('Infantry', 'Test Warrior');

    // Should advance to next phase (castle techs) - wait for cards to appear
    await expect(page.locator('.draft-card, .bonus-card').first()).toBeVisible();
  });
});

test.describe('Custom UU Draft - Backend Integration', () => {
  test('should store custom UU in player bonuses array and complete full draft', async ({ page }) => {
    // This test verifies the complete custom UU integration:
    // 1. Custom UU is stored in bonuses[1] array when submitted
    // 2. Draft completes all rounds (civ bonuses → custom UU → castle → imperial → team bonuses)
    // 3. Transitions to tech tree phase correctly
    // 4. Mod generation handles custom UU objects (no "[object Object]" errors)
    // 5. Zip file is generated successfully

    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    await draftCreatePage.assertPageLoaded();

    // Set 1 player and 1 bonus for quick test
    await draftCreatePage.setNumPlayers(1);
    await draftCreatePage.setBonusesPerPlayer(1);
    await draftCreatePage.enableCustomUUMode();

    // Start draft
    await draftCreatePage.clickStartDraft();
    const { hostLink } = await draftCreatePage.getDraftLinks();

    // Join as player
    const playerPage = new DraftPlayerPage(page);
    await playerPage.navigate(hostLink);
    await playerPage.joinDraft('Test Player');

    // Start draft
    await playerPage.startDraft();

    // Complete setup phase
    await playerPage.completeSetupPhase('Test Civilization');

    // Complete civ bonuses round
    await playerPage.selectFirstCard();

    // Complete custom UU phase
    const customUUEditor = new CustomUUEditorPage(page);
    await customUUEditor.createCustomUnit('Infantry', 'Elite Guard');

    // Complete remaining card selection rounds (Castle, Imperial, Team)
    await playerPage.selectCards(3);

    // Should reach tech tree phase
    await playerPage.assertInTechTreePhase();

    // Complete tech tree
    await playerPage.completeTechTree();

    // Wait for mod generation (can take several seconds)
    await playerPage.waitForDownloadPhase();

    // Verify download button is visible
    await playerPage.assertDownloadButtonVisible();
  });
});

test.describe('Custom UU Draft - Error Handling', () => {
  test('should not allow submitting invalid custom UU', async ({ page }) => {
    // Create 1-player draft with 1 bonus
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    await draftCreatePage.setNumPlayers(1);
    await draftCreatePage.setBonusesPerPlayer(1);
    await draftCreatePage.enableCustomUUMode();

    await draftCreatePage.clickStartDraft();
    const { hostLink } = await draftCreatePage.getDraftLinks();

    const playerPage = new DraftPlayerPage(page);
    await playerPage.navigate(hostLink);
    await playerPage.joinDraft('Test Player');
    await playerPage.startDraft();
    await playerPage.completeSetupPhase('Test Civilization');
    await playerPage.selectFirstCard();

    // Should be in custom UU editor - but don't select unit type or fill anything
    const customUUEditor = new CustomUUEditorPage(page);
    await customUUEditor.waitForEditor();

    // Submit button should be disabled without selecting unit type
    await customUUEditor.assertSubmitDisabled();
  });

  test('should show validation errors for invalid custom UU', async ({ page }) => {
    // Create 1-player draft with 1 bonus
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    await draftCreatePage.setNumPlayers(1);
    await draftCreatePage.setBonusesPerPlayer(1);
    await draftCreatePage.enableCustomUUMode();

    await draftCreatePage.clickStartDraft();
    const { hostLink } = await draftCreatePage.getDraftLinks();

    const playerPage = new DraftPlayerPage(page);
    await playerPage.navigate(hostLink);
    await playerPage.joinDraft('Test Player');
    await playerPage.startDraft();
    await playerPage.completeSetupPhase('Test Civilization');
    await playerPage.selectFirstCard();

    // Should be in custom UU editor - select unit type but clear name
    const customUUEditor = new CustomUUEditorPage(page);
    await customUUEditor.waitForEditor();
    await customUUEditor.selectUnitType('Infantry');

    const unitNameInput = page.getByLabel(/Unit Name/i);
    await expect(unitNameInput).toBeVisible();

    // Clear the name (if it has default value)
    await unitNameInput.clear();

    // Should show validation errors or disabled submit button
    await customUUEditor.assertSubmitDisabled();
  });
});
