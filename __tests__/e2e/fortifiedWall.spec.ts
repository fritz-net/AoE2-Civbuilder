import { test, expect } from '@playwright/test';

/**
 * E2E tests for Fortified Wall tech tree dependencies
 * Tests that:
 * 1. Clicking Fortified Wall (tech or building) enables Stone Wall + Gate
 * 2. Stone Wall and Gate are always enabled/disabled together
 * 3. Deselecting Stone Wall or Gate deselects Fortified Wall
 */

test.describe('Fortified Wall Tech Tree Dependencies', () => {
  test.beforeEach(async ({ page }) => {
    // Create a draft with a single player to access tech tree
    await page.goto('/v2/draft/create');
    
    const numPlayersInput = page.locator('#numPlayers');
    await numPlayersInput.fill('1');
    
    const startButton = page.getByRole('button', { name: /Start Draft/i });
    await startButton.click();
    
    // Wait for modal
    await page.waitForTimeout(2000);
    
    const modal = page.locator('.modal-overlay');
    const isModalVisible = await modal.isVisible().catch(() => false);
    
    if (!isModalVisible) {
      test.skip();
      return;
    }
    
    // Get host link and navigate
    const hostLinkInput = page.locator('#hostLink');
    const hostLink = await hostLinkInput.inputValue();
    await page.goto(hostLink);
    
    // Join as host
    await page.waitForSelector('#playerName', { timeout: 10000 });
    await page.fill('#playerName', 'Test Player');
    await page.click('.join-button');
    await page.waitForTimeout(3000);
    
    // Start draft
    const lobbyTitle = page.locator('.lobby-title, h1:has-text("Civilization Drafter")');
    await expect(lobbyTitle).toBeVisible({ timeout: 10000 });
    
    const startDraftButton = page.getByRole('button', { name: /Start Draft/i });
    await expect(startDraftButton).toBeVisible({ timeout: 5000 });
    await startDraftButton.click();
    
    // Skip setup phase (Phase 1)
    await page.waitForTimeout(3000);
    const setupPhase = page.locator('.setup-phase');
    const isSetupVisible = await setupPhase.isVisible().catch(() => false);
    
    if (isSetupVisible) {
      const civNameInput = page.locator('#civName');
      if (await civNameInput.isVisible()) {
        await civNameInput.fill('TestCiv');
      }
      
      const nextButton = page.getByRole('button', { name: /Next/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(3000);
      }
    }
    
    // Complete card drafting phase (Phase 2)
    // For 1-player draft: 4 bonus rounds + UU + castle + imp + team = 8 total rounds
    const totalRounds = 8;
    let currentRound = 0;
    
    while (currentRound < totalRounds) {
      const isDraftBoardVisible = await page.locator('.draft-board').isVisible().catch(() => false);
      
      if (!isDraftBoardVisible) {
        break; // Tech tree phase reached or other phase
      }
      
      const cards = page.locator('.draft-card:not(.card-hidden)');
      const cardCount = await cards.count();
      
      if (cardCount > 0) {
        await cards.first().click();
        currentRound++;
        await page.waitForTimeout(2000);
      } else {
        break;
      }
    }
    
    // Wait for tech tree phase
    await page.waitForTimeout(2000);
    const phaseTitle = page.getByRole('heading', { name: /Tech Tree/i });
    await expect(phaseTitle).toBeVisible({ timeout: 10000 });
  });

  test('should enable Stone Wall and Gate when Fortified Wall tech is clicked', async ({ page }) => {
    const techtreeSvg = page.locator('.techtree-svg');
    await expect(techtreeSvg).toBeVisible();
    
    // Find and verify initial state of Stone Wall (should be disabled by default after reset)
    // First, click reset to ensure clean state
    const resetButton = page.getByRole('button', { name: /Reset/i });
    if (await resetButton.isVisible()) {
      await resetButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Locate Stone Wall node
    const stoneWallNode = techtreeSvg.locator('g.node').filter({ hasText: /^Stone Wall$/i }).first();
    await expect(stoneWallNode).toBeVisible();
    await stoneWallNode.scrollIntoViewIfNeeded();
    
    // Verify Stone Wall is disabled (has cross)
    const stoneWallCross = stoneWallNode.locator('image.cross');
    await expect(stoneWallCross).toBeVisible();
    
    // Locate Gate node
    const gateNode = techtreeSvg.locator('g.node').filter({ hasText: /^Gate$/i }).first();
    await expect(gateNode).toBeVisible();
    await gateNode.scrollIntoViewIfNeeded();
    
    // Verify Gate is disabled (has cross)
    const gateCross = gateNode.locator('image.cross');
    await expect(gateCross).toBeVisible();
    
    // Locate Fortified Wall tech node (in University)
    const fortifiedWallTech = techtreeSvg.locator('g.node').filter({ hasText: /Fortified Wall/i }).first();
    await expect(fortifiedWallTech).toBeVisible();
    await fortifiedWallTech.scrollIntoViewIfNeeded();
    
    // Click Fortified Wall tech
    const fortifiedWallOverlay = fortifiedWallTech.locator('rect.node__overlay');
    await fortifiedWallOverlay.click();
    await page.waitForTimeout(500);
    
    // Verify Stone Wall is now enabled (no cross)
    await expect(stoneWallCross).not.toBeVisible();
    
    // Verify Gate is now enabled (no cross)
    await expect(gateCross).not.toBeVisible();
  });

  test('should enable Stone Wall and Gate when Fortified Wall building is clicked', async ({ page }) => {
    const techtreeSvg = page.locator('.techtree-svg');
    await expect(techtreeSvg).toBeVisible();
    
    // Reset to clean state
    const resetButton = page.getByRole('button', { name: /Reset/i });
    if (await resetButton.isVisible()) {
      await resetButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Locate Stone Wall node
    const stoneWallNode = techtreeSvg.locator('g.node').filter({ hasText: /^Stone Wall$/i }).first();
    await stoneWallNode.scrollIntoViewIfNeeded();
    const stoneWallCross = stoneWallNode.locator('image.cross');
    await expect(stoneWallCross).toBeVisible();
    
    // Locate Gate node
    const gateNode = techtreeSvg.locator('g.node').filter({ hasText: /^Gate$/i }).first();
    await gateNode.scrollIntoViewIfNeeded();
    const gateCross = gateNode.locator('image.cross');
    await expect(gateCross).toBeVisible();
    
    // Locate Fortified Wall building node (in wall lane, not the tech)
    // We need to find the building (ID 155), which appears in Castle Age
    const fortifiedWallBuilding = techtreeSvg.locator('g.node').filter({ hasText: /Fortified Wall/i }).nth(1);
    await fortifiedWallBuilding.scrollIntoViewIfNeeded();
    
    // Click Fortified Wall building
    const fortifiedWallBuildingOverlay = fortifiedWallBuilding.locator('rect.node__overlay');
    await fortifiedWallBuildingOverlay.click();
    await page.waitForTimeout(500);
    
    // Verify Stone Wall is now enabled
    await expect(stoneWallCross).not.toBeVisible();
    
    // Verify Gate is now enabled
    await expect(gateCross).not.toBeVisible();
  });

  test('should disable Fortified Wall when Stone Wall is deselected', async ({ page }) => {
    const techtreeSvg = page.locator('.techtree-svg');
    await expect(techtreeSvg).toBeVisible();
    
    // Reset to clean state
    const resetButton = page.getByRole('button', { name: /Reset/i });
    if (await resetButton.isVisible()) {
      await resetButton.click();
      await page.waitForTimeout(1000);
    }
    
    // First enable Fortified Wall (which enables Stone Wall and Gate)
    const fortifiedWallTech = techtreeSvg.locator('g.node').filter({ hasText: /Fortified Wall/i }).first();
    await fortifiedWallTech.scrollIntoViewIfNeeded();
    const fortifiedWallOverlay = fortifiedWallTech.locator('rect.node__overlay');
    await fortifiedWallOverlay.click();
    await page.waitForTimeout(500);
    
    // Verify Fortified Wall tech is enabled (no cross)
    const fortifiedWallTechCross = fortifiedWallTech.locator('image.cross');
    await expect(fortifiedWallTechCross).not.toBeVisible();
    
    // Verify Fortified Wall building is enabled
    const fortifiedWallBuilding = techtreeSvg.locator('g.node').filter({ hasText: /Fortified Wall/i }).nth(1);
    await fortifiedWallBuilding.scrollIntoViewIfNeeded();
    const fortifiedWallBuildingCross = fortifiedWallBuilding.locator('image.cross');
    await expect(fortifiedWallBuildingCross).not.toBeVisible();
    
    // Now click Stone Wall to disable it
    const stoneWallNode = techtreeSvg.locator('g.node').filter({ hasText: /^Stone Wall$/i }).first();
    await stoneWallNode.scrollIntoViewIfNeeded();
    const stoneWallOverlay = stoneWallNode.locator('rect.node__overlay');
    await stoneWallOverlay.click();
    await page.waitForTimeout(500);
    
    // Verify Fortified Wall tech is now disabled
    await expect(fortifiedWallTechCross).toBeVisible();
    
    // Verify Fortified Wall building is now disabled
    await expect(fortifiedWallBuildingCross).toBeVisible();
  });

  test('should disable Fortified Wall when Gate is deselected', async ({ page }) => {
    const techtreeSvg = page.locator('.techtree-svg');
    await expect(techtreeSvg).toBeVisible();
    
    // Reset to clean state
    const resetButton = page.getByRole('button', { name: /Reset/i });
    if (await resetButton.isVisible()) {
      await resetButton.click();
      await page.waitForTimeout(1000);
    }
    
    // First enable Fortified Wall (which enables Stone Wall and Gate)
    const fortifiedWallTech = techtreeSvg.locator('g.node').filter({ hasText: /Fortified Wall/i }).first();
    await fortifiedWallTech.scrollIntoViewIfNeeded();
    const fortifiedWallOverlay = fortifiedWallTech.locator('rect.node__overlay');
    await fortifiedWallOverlay.click();
    await page.waitForTimeout(500);
    
    // Verify Fortified Wall is enabled
    const fortifiedWallTechCross = fortifiedWallTech.locator('image.cross');
    await expect(fortifiedWallTechCross).not.toBeVisible();
    
    // Verify Fortified Wall building is enabled
    const fortifiedWallBuilding = techtreeSvg.locator('g.node').filter({ hasText: /Fortified Wall/i }).nth(1);
    await fortifiedWallBuilding.scrollIntoViewIfNeeded();
    const fortifiedWallBuildingCross = fortifiedWallBuilding.locator('image.cross');
    await expect(fortifiedWallBuildingCross).not.toBeVisible();
    
    // Now click Gate to disable it
    const gateNode = techtreeSvg.locator('g.node').filter({ hasText: /^Gate$/i }).first();
    await gateNode.scrollIntoViewIfNeeded();
    const gateOverlay = gateNode.locator('rect.node__overlay');
    await gateOverlay.click();
    await page.waitForTimeout(500);
    
    // Verify Fortified Wall tech is now disabled
    await expect(fortifiedWallTechCross).toBeVisible();
    
    // Verify Fortified Wall building is now disabled
    await expect(fortifiedWallBuildingCross).toBeVisible();
  });

  test('should keep Stone Wall and Gate linked - enabling one enables the other', async ({ page }) => {
    const techtreeSvg = page.locator('.techtree-svg');
    await expect(techtreeSvg).toBeVisible();
    
    // Reset to clean state
    const resetButton = page.getByRole('button', { name: /Reset/i });
    if (await resetButton.isVisible()) {
      await resetButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Click Stone Wall to enable it
    const stoneWallNode = techtreeSvg.locator('g.node').filter({ hasText: /^Stone Wall$/i }).first();
    await stoneWallNode.scrollIntoViewIfNeeded();
    const stoneWallOverlay = stoneWallNode.locator('rect.node__overlay');
    const stoneWallCross = stoneWallNode.locator('image.cross');
    await stoneWallOverlay.click();
    await page.waitForTimeout(500);
    
    // Verify Stone Wall is enabled
    await expect(stoneWallCross).not.toBeVisible();
    
    // Verify Gate is also enabled (linked)
    const gateNode = techtreeSvg.locator('g.node').filter({ hasText: /^Gate$/i }).first();
    await gateNode.scrollIntoViewIfNeeded();
    const gateCross = gateNode.locator('image.cross');
    await expect(gateCross).not.toBeVisible();
  });

  test('should keep Stone Wall and Gate linked - disabling one disables the other', async ({ page }) => {
    const techtreeSvg = page.locator('.techtree-svg');
    await expect(techtreeSvg).toBeVisible();
    
    // Reset to clean state
    const resetButton = page.getByRole('button', { name: /Reset/i });
    if (await resetButton.isVisible()) {
      await resetButton.click();
      await page.waitForTimeout(1000);
    }
    
    // First enable Stone Wall (which will enable Gate)
    const stoneWallNode = techtreeSvg.locator('g.node').filter({ hasText: /^Stone Wall$/i }).first();
    await stoneWallNode.scrollIntoViewIfNeeded();
    const stoneWallOverlay = stoneWallNode.locator('rect.node__overlay');
    const stoneWallCross = stoneWallNode.locator('image.cross');
    await stoneWallOverlay.click();
    await page.waitForTimeout(500);
    
    // Verify both are enabled
    await expect(stoneWallCross).not.toBeVisible();
    const gateNode = techtreeSvg.locator('g.node').filter({ hasText: /^Gate$/i }).first();
    await gateNode.scrollIntoViewIfNeeded();
    const gateCross = gateNode.locator('image.cross');
    await expect(gateCross).not.toBeVisible();
    
    // Now disable Gate
    const gateOverlay = gateNode.locator('rect.node__overlay');
    await gateOverlay.click();
    await page.waitForTimeout(500);
    
    // Verify both are now disabled (Gate click disables Gate, which should also disable Stone Wall)
    await expect(gateCross).toBeVisible();
    await expect(stoneWallCross).toBeVisible();
  });
});
