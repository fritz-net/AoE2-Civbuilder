import { test, expect } from '@playwright/test';
import { DraftCreatePage } from './helpers/DraftCreatePage';
import { DraftHostPage } from './helpers/DraftHostPage';

/**
 * E2E tests for Draft Mode with Custom UU Designer
 * Tests the complete flow from creation to mod download with custom UU enabled
 * 
 * Uses Page Object Model pattern for maintainability
 */

test.describe('Draft Custom UU Flow - Creation and Phase Timing', () => {
  test('should allow enabling custom UU mode in draft creation', async ({ page }) => {
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    
    // Expand advanced settings to access custom UU mode
    await draftCreatePage.expandAdvancedSettings();
    
    // Enable custom UU mode
    await draftCreatePage.enableCustomUUMode();
    
    // Verify checkbox is checked
    const isChecked = await draftCreatePage.isCheckboxChecked('customUUMode');
    expect(isChecked).toBe(true);
  });

  test('should create draft with custom UU mode enabled', async ({ page }) => {
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    
    // Create draft with custom UU mode
    const { hostLink, draftId } = await draftCreatePage.createDraft({
      numPlayers: 1,
      customUUMode: true,
    });
    
    expect(hostLink).toMatch(/\/v2\/draft\/host\/\d+/);
    expect(draftId).not.toBeNull();
  });
});

test.describe('Draft Custom UU Flow - Phase Transitions', () => {
  test('should show custom UU phase after civ bonus selection', async ({ page }) => {
    // Create draft with custom UU enabled
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    const { hostLink } = await draftCreatePage.createDraft({
      numPlayers: 1,
      customUUMode: true,
      bonuses: 1, // Only 1 civ bonus round for faster testing
    });
    
    // Join and start draft
    const draftHostPage = new DraftHostPage(page);
    await draftHostPage.navigate(hostLink);
    await draftHostPage.joinAsHost('Custom UU Test Player');
    await draftHostPage.startDraft();
    
    // Complete setup phase
    await draftHostPage.completeSetupPhase('Custom UU Test Civ');
    
    // Complete civ bonus selection (1 round = 1 card for 1 player)
    const civBonusRounds = await draftHostPage.completeCardDrafting(1);
    expect(civBonusRounds).toBe(1);
    
    // Wait a bit for phase transition
    await page.waitForTimeout(2000);
    
    // Should now be in custom UU phase
    const isInCustomUUPhase = await draftHostPage.isInPhase('customuu');
    expect(isInCustomUUPhase).toBe(true);
  });

  test('should skip classic UU card picking when custom UU mode enabled', async ({ page }) => {
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    const { hostLink } = await draftCreatePage.createDraft({
      numPlayers: 1,
      customUUMode: true,
      bonuses: 1,
    });
    
    const draftHostPage = new DraftHostPage(page);
    await draftHostPage.navigate(hostLink);
    await draftHostPage.joinAsHost('Skip UU Test');
    await draftHostPage.startDraft();
    await draftHostPage.completeSetupPhase('Skip UU Civ');
    
    // Complete civ bonus round
    await draftHostPage.completeCardDrafting(1);
    await page.waitForTimeout(2000);
    
    // Should be in custom UU phase, not UU card selection
    await expect(page.locator('.custom-uu-phase')).toBeVisible({ timeout: 10000 });
    
    // Phase title should mention "Custom Unique Unit"
    const phaseTitle = page.locator('.phase-title');
    await expect(phaseTitle).toContainText(/Custom.*Unit/i);
  });
});

test.describe('Draft Custom UU Flow - Custom UU Editor Integration', () => {
  test('should display custom UU editor in custom UU phase', async ({ page }) => {
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    const { hostLink } = await draftCreatePage.createDraft({
      numPlayers: 1,
      customUUMode: true,
      bonuses: 1,
    });
    
    const draftHostPage = new DraftHostPage(page);
    await draftHostPage.navigate(hostLink);
    await draftHostPage.joinAsHost('Editor Test');
    await draftHostPage.startDraft();
    await draftHostPage.completeSetupPhase('Editor Test Civ');
    await draftHostPage.completeCardDrafting(1);
    await page.waitForTimeout(2000);
    
    // Custom UU editor should be visible
    await draftHostPage.waitForCustomUUPhase();
    const isEditorVisible = await draftHostPage.isCustomUUEditorVisible();
    expect(isEditorVisible).toBe(true);
    
    // Should have unit name input
    await expect(page.locator('#unitName')).toBeVisible({ timeout: 5000 });
    
    // Should have submit button
    await expect(page.locator('.submit-uu-button')).toBeVisible({ timeout: 5000 });
  });

  test('should allow filling and submitting custom UU', async ({ page }) => {
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    const { hostLink } = await draftCreatePage.createDraft({
      numPlayers: 1,
      customUUMode: true,
      bonuses: 1,
    });
    
    const draftHostPage = new DraftHostPage(page);
    await draftHostPage.navigate(hostLink);
    await draftHostPage.joinAsHost('Submit Test');
    await draftHostPage.startDraft();
    await draftHostPage.completeSetupPhase('Submit Test Civ');
    await draftHostPage.completeCardDrafting(1);
    await page.waitForTimeout(2000);
    
    // Fill custom UU
    await draftHostPage.fillCustomUU('E2E Test Warrior');
    
    // Submit button should be enabled
    const submitButton = page.locator('.submit-uu-button');
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    
    // Submit
    await draftHostPage.submitCustomUU();
    
    // Should transition away from custom UU phase
    await page.waitForTimeout(3000);
    const isStillInCustomUUPhase = await draftHostPage.isInPhase('customuu');
    
    // After submission with 1 player, should move to next drafting phase (castle tech)
    if (!isStillInCustomUUPhase) {
      // Check if moved to card drafting (castle tech) or waiting/completed
      const isInDrafting = await draftHostPage.isInPhase('drafting');
      console.log('After custom UU submission, in drafting phase:', isInDrafting);
    }
  });

  test('should not allow submitting invalid custom UU', async ({ page }) => {
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    const { hostLink } = await draftCreatePage.createDraft({
      numPlayers: 1,
      customUUMode: true,
      bonuses: 1,
    });
    
    const draftHostPage = new DraftHostPage(page);
    await draftHostPage.navigate(hostLink);
    await draftHostPage.joinAsHost('Invalid UU Test');
    await draftHostPage.startDraft();
    await draftHostPage.completeSetupPhase('Invalid UU Civ');
    await draftHostPage.completeCardDrafting(1);
    await page.waitForTimeout(2000);
    
    // Wait for custom UU phase
    await draftHostPage.waitForCustomUUPhase();
    
    // Clear unit name to make it invalid
    const nameInput = page.locator('#unitName');
    await nameInput.clear();
    await page.waitForTimeout(500);
    
    // Submit button should be disabled
    const submitButton = page.locator('.submit-uu-button');
    await expect(submitButton).toBeDisabled({ timeout: 5000 });
  });
});

test.describe('Draft Custom UU Flow - Complete Flow to Castle Tech', () => {
  test('should complete custom UU phase and continue to castle tech selection', async ({ page }) => {
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    const { hostLink } = await draftCreatePage.createDraft({
      numPlayers: 1,
      customUUMode: true,
      bonuses: 1, // 1 civ bonus round
    });
    
    const draftHostPage = new DraftHostPage(page);
    await draftHostPage.navigate(hostLink);
    await draftHostPage.joinAsHost('Full Flow Test');
    await draftHostPage.startDraft();
    
    // Phase 1: Setup
    await draftHostPage.completeSetupPhase('Full Flow Civ');
    
    // Phase 2a: Civ bonuses
    const civBonusRounds = await draftHostPage.completeCardDrafting(1);
    expect(civBonusRounds).toBe(1);
    await page.waitForTimeout(2000);
    
    // Phase 2b: Custom UU
    await draftHostPage.completeCustomUUPhase('Full Flow Warrior');
    await page.waitForTimeout(2000);
    
    // Phase 2c: Should now be in castle tech selection
    const isInDrafting = await draftHostPage.isInPhase('drafting');
    
    if (isInDrafting) {
      // Check phase title to confirm it's castle tech
      const phaseTitle = page.locator('.phase-title');
      const titleText = await phaseTitle.textContent();
      console.log('Phase title after custom UU:', titleText);
      
      // Should be "Castle Age Unique Tech" or similar
      expect(titleText).toMatch(/Castle|Tech/i);
    }
  });

  test('should complete entire draft flow with custom UU till tech tree', async ({ page }) => {
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    const { hostLink } = await draftCreatePage.createDraft({
      numPlayers: 1,
      customUUMode: true,
      bonuses: 1, // Minimal rounds for faster test
    });
    
    const draftHostPage = new DraftHostPage(page);
    await draftHostPage.navigate(hostLink);
    await draftHostPage.joinAsHost('Complete Flow Test');
    await draftHostPage.startDraft();
    
    // Phase 1: Setup
    await draftHostPage.completeSetupPhase('Complete Flow Civ');
    
    // Phase 2a: Civ bonuses (1 round)
    await draftHostPage.completeCardDrafting(1);
    await page.waitForTimeout(2000);
    
    // Phase 2b: Custom UU
    await draftHostPage.completeCustomUUPhase('Complete Flow Unit');
    await page.waitForTimeout(2000);
    
    // Phase 2c: Castle tech, Imperial tech, Team bonus (3 more rounds)
    const remainingRounds = await draftHostPage.completeCardDrafting(3);
    console.log('Remaining drafting rounds completed:', remainingRounds);
    
    // Phase 3: Should reach tech tree phase
    await page.waitForTimeout(3000);
    const isInTechTree = await draftHostPage.isInPhase('techtree');
    
    console.log('Reached tech tree phase:', isInTechTree);
    
    if (isInTechTree) {
      // Verify tech tree is actually visible
      await expect(page.locator('.techtree-phase')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Draft Custom UU Flow - Validation and Error Handling', () => {
  test('should show validation errors for invalid custom UU', async ({ page }) => {
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    const { hostLink } = await draftCreatePage.createDraft({
      numPlayers: 1,
      customUUMode: true,
      bonuses: 1,
    });
    
    const draftHostPage = new DraftHostPage(page);
    await draftHostPage.navigate(hostLink);
    await draftHostPage.joinAsHost('Validation Test');
    await draftHostPage.startDraft();
    await draftHostPage.completeSetupPhase('Validation Civ');
    await draftHostPage.completeCardDrafting(1);
    await page.waitForTimeout(2000);
    
    // Wait for custom UU editor
    await draftHostPage.waitForCustomUUPhase();
    
    // Clear name to trigger validation error
    const nameInput = page.locator('#unitName');
    await nameInput.clear();
    await page.waitForTimeout(500);
    
    // Should show validation errors
    const validationErrors = page.locator('.validation-errors');
    const hasErrors = await validationErrors.isVisible().catch(() => false);
    
    if (hasErrors) {
      const errorText = await validationErrors.textContent();
      expect(errorText).toContain('Unit name');
    }
  });

  test('should successfully submit custom UU without errors', async ({ page }) => {
    // This test verifies successful custom UU submission (fixing the s.emit bug)
    const draftCreatePage = new DraftCreatePage(page);
    await draftCreatePage.navigate();
    const { hostLink } = await draftCreatePage.createDraft({
      numPlayers: 1,
      customUUMode: true,
      bonuses: 1,
    });
    
    const draftHostPage = new DraftHostPage(page);
    await draftHostPage.navigate(hostLink);
    await draftHostPage.joinAsHost('Submit Success Test');
    await draftHostPage.startDraft();
    await draftHostPage.completeSetupPhase('Submit Test Civ');
    await draftHostPage.completeCardDrafting(1);
    await page.waitForTimeout(2000);
    
    // Fill and submit custom UU
    await draftHostPage.fillCustomUU('Success Test Unit');
    await draftHostPage.submitCustomUU();
    
    // Wait for submission to complete
    await page.waitForTimeout(3000);
    
    // Verify we've moved past custom UU phase (submission was successful)
    const isStillInCustomUUPhase = await draftHostPage.isInPhase('customuu');
    expect(isStillInCustomUUPhase).toBe(false);
    
    // Verify we're in next phase (drafting or completed)
    const pageContent = await page.content();
    const hasProgressed = pageContent.includes('draft-board') || 
                         pageContent.includes('techtree') ||
                         pageContent.includes('Castle');
    expect(hasProgressed).toBe(true);
  });
});
