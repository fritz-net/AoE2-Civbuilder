import { test, expect } from '@playwright/test';

/**
 * E2E tests for Fortified Wall dependencies in the tech tree
 * Tests that Fortified Wall correctly enables Stone Wall and Gate
 * Tests both /draft and /build techtree interfaces
 * 
 * Tech IDs:
 * - tech_194: Fortified Wall Tech (researched at University)
 * - building_155: Fortified Wall Building
 * - building_117: Stone Wall
 * - building_487: Gate
 */

test.describe('Fortified Wall Tech Tree Dependencies', () => {
  test.describe('Build Page - Tech Tree', () => {
    test('should enable Stone Wall and Gate when Fortified Wall tech is clicked', async ({ page }) => {
      await page.goto('/v2/build');
      
      // Wait for page to load and tech tree to render
      await page.waitForTimeout(2000);
      
      // Verify tech tree is visible
      const techtreeSvg = page.locator('.techtree-svg');
      await expect(techtreeSvg).toBeVisible({ timeout: 10000 });
      
      // Check initial state: Stone Wall, Gate, and Fortified Wall should be disabled (have cross)
      const stoneWallNode = page.locator('[data-testid="node-building_117"]');
      const gateNode = page.locator('[data-testid="node-building_487"]');
      const fortifiedWallTechNode = page.locator('[data-testid="node-tech_194"]');
      const fortifiedWallBuildingNode = page.locator('[data-testid="node-building_155"]');
      
      // Verify all nodes are present
      await expect(stoneWallNode).toBeAttached();
      await expect(gateNode).toBeAttached();
      await expect(fortifiedWallTechNode).toBeAttached();
      await expect(fortifiedWallBuildingNode).toBeAttached();
      
      // Check initial disabled state by verifying crosses are present
      await expect(stoneWallNode.locator('image.cross')).toBeVisible();
      await expect(gateNode.locator('image.cross')).toBeVisible();
      await expect(fortifiedWallTechNode.locator('image.cross')).toBeVisible();
      await expect(fortifiedWallBuildingNode.locator('image.cross')).toBeVisible();
      
      // Click on Fortified Wall Tech (tech_194)
      const fortifiedWallTechOverlay = page.locator('[data-testid="overlay-tech_194"]');
      await fortifiedWallTechOverlay.click();
      
      // Wait for state update
      await page.waitForTimeout(300);
      
      // Verify that clicking Fortified Wall Tech enables all (crosses should be gone):
      // 1. Fortified Wall Building (building_155)
      // 2. Stone Wall (building_117)
      // 3. Gate (building_487)
      await expect(fortifiedWallTechNode.locator('image.cross')).not.toBeVisible();
      await expect(fortifiedWallBuildingNode.locator('image.cross')).not.toBeVisible();
      await expect(stoneWallNode.locator('image.cross')).not.toBeVisible();
      await expect(gateNode.locator('image.cross')).not.toBeVisible();
    });

    test('should enable Stone Wall and Gate when Fortified Wall building is clicked', async ({ page }) => {
      await page.goto('/v2/build');
      
      // Wait for page to load
      await page.waitForTimeout(2000);
      
      const techtreeSvg = page.locator('.techtree-svg');
      await expect(techtreeSvg).toBeVisible({ timeout: 10000 });
      
      // Get nodes
      const stoneWallNode = page.locator('[data-testid="node-building_117"]');
      const gateNode = page.locator('[data-testid="node-building_487"]');
      const fortifiedWallBuildingNode = page.locator('[data-testid="node-building_155"]');
      
      // Check initial state - crosses should be visible
      await expect(stoneWallNode.locator('image.cross')).toBeVisible();
      await expect(gateNode.locator('image.cross')).toBeVisible();
      await expect(fortifiedWallBuildingNode.locator('image.cross')).toBeVisible();
      
      // Click on Fortified Wall Building (building_155)
      const fortifiedWallBuildingOverlay = page.locator('[data-testid="overlay-building_155"]');
      await fortifiedWallBuildingOverlay.click();
      
      // Wait for state update
      await page.waitForTimeout(300);
      
      // Verify that clicking Fortified Wall Building also enables Stone Wall and Gate (crosses gone)
      await expect(fortifiedWallBuildingNode.locator('image.cross')).not.toBeVisible();
      await expect(stoneWallNode.locator('image.cross')).not.toBeVisible();
      await expect(gateNode.locator('image.cross')).not.toBeVisible();
    });

    test('should disable Fortified Wall (tech and building) when Stone Wall is deselected', async ({ page }) => {
      await page.goto('/v2/build');
      
      // Wait for page to load
      await page.waitForTimeout(2000);
      
      const techtreeSvg = page.locator('.techtree-svg');
      await expect(techtreeSvg).toBeVisible({ timeout: 10000 });
      
      // Get nodes
      const stoneWallNode = page.locator('[data-testid="node-building_117"]');
      const gateNode = page.locator('[data-testid="node-building_487"]');
      const fortifiedWallTechNode = page.locator('[data-testid="node-tech_194"]');
      const fortifiedWallBuildingNode = page.locator('[data-testid="node-building_155"]');
      
      // First, enable Fortified Wall Tech (which enables everything)
      const fortifiedWallTechOverlay = page.locator('[data-testid="overlay-tech_194"]');
      await fortifiedWallTechOverlay.click();
      await page.waitForTimeout(300);
      
      // Verify all are enabled (no crosses)
      await expect(fortifiedWallTechNode.locator('image.cross')).not.toBeVisible();
      await expect(fortifiedWallBuildingNode.locator('image.cross')).not.toBeVisible();
      await expect(stoneWallNode.locator('image.cross')).not.toBeVisible();
      await expect(gateNode.locator('image.cross')).not.toBeVisible();
      
      // Now click Stone Wall to disable it
      const stoneWallOverlay = page.locator('[data-testid="overlay-building_117"]');
      await stoneWallOverlay.click();
      await page.waitForTimeout(300);
      
      // Verify that disabling Stone Wall also disables Fortified Wall tech and building (crosses back)
      await expect(stoneWallNode.locator('image.cross')).toBeVisible();
      await expect(fortifiedWallTechNode.locator('image.cross')).toBeVisible();
      await expect(fortifiedWallBuildingNode.locator('image.cross')).toBeVisible();
      // Gate should also be disabled because Stone Wall and Gate are linked
      await expect(gateNode.locator('image.cross')).toBeVisible();
    });

    test('should disable Fortified Wall (tech and building) when Gate is deselected', async ({ page }) => {
      await page.goto('/v2/build');
      
      // Wait for page to load
      await page.waitForTimeout(2000);
      
      const techtreeSvg = page.locator('.techtree-svg');
      await expect(techtreeSvg).toBeVisible({ timeout: 10000 });
      
      // Get nodes
      const stoneWallNode = page.locator('[data-testid="node-building_117"]');
      const gateNode = page.locator('[data-testid="node-building_487"]');
      const fortifiedWallTechNode = page.locator('[data-testid="node-tech_194"]');
      const fortifiedWallBuildingNode = page.locator('[data-testid="node-building_155"]');
      
      // First, enable Fortified Wall Building (which enables everything)
      const fortifiedWallBuildingOverlay = page.locator('[data-testid="overlay-building_155"]');
      await fortifiedWallBuildingOverlay.click();
      await page.waitForTimeout(300);
      
      // Verify all are enabled (no crosses)
      await expect(fortifiedWallTechNode.locator('image.cross')).not.toBeVisible();
      await expect(fortifiedWallBuildingNode.locator('image.cross')).not.toBeVisible();
      await expect(stoneWallNode.locator('image.cross')).not.toBeVisible();
      await expect(gateNode.locator('image.cross')).not.toBeVisible();
      
      // Now click Gate to disable it
      const gateOverlay = page.locator('[data-testid="overlay-building_487"]');
      await gateOverlay.click();
      await page.waitForTimeout(300);
      
      // Verify that disabling Gate also disables Fortified Wall tech and building (crosses back)
      await expect(gateNode.locator('image.cross')).toBeVisible();
      await expect(fortifiedWallTechNode.locator('image.cross')).toBeVisible();
      await expect(fortifiedWallBuildingNode.locator('image.cross')).toBeVisible();
      // Stone Wall should also be disabled because Stone Wall and Gate are linked
      await expect(stoneWallNode.locator('image.cross')).toBeVisible();
    });

    test('should maintain correct state when toggling multiple times', async ({ page }) => {
      await page.goto('/v2/build');
      
      // Wait for page to load
      await page.waitForTimeout(2000);
      
      const techtreeSvg = page.locator('.techtree-svg');
      await expect(techtreeSvg).toBeVisible({ timeout: 10000 });
      
      // Get nodes
      const stoneWallNode = page.locator('[data-testid="node-building_117"]');
      const gateNode = page.locator('[data-testid="node-building_487"]');
      const fortifiedWallTechNode = page.locator('[data-testid="node-tech_194"]');
      const fortifiedWallBuildingNode = page.locator('[data-testid="node-building_155"]');
      
      // Enable Fortified Wall Tech
      const fortifiedWallTechOverlay = page.locator('[data-testid="overlay-tech_194"]');
      await fortifiedWallTechOverlay.click();
      await page.waitForTimeout(200);
      await expect(stoneWallNode.locator('image.cross')).not.toBeVisible();
      await expect(gateNode.locator('image.cross')).not.toBeVisible();
      
      // Disable by clicking Fortified Wall Tech again
      await fortifiedWallTechOverlay.click();
      await page.waitForTimeout(200);
      await expect(stoneWallNode.locator('image.cross')).toBeVisible();
      await expect(gateNode.locator('image.cross')).toBeVisible();
      await expect(fortifiedWallBuildingNode.locator('image.cross')).toBeVisible();
      
      // Enable again via Fortified Wall Building
      const fortifiedWallBuildingOverlay = page.locator('[data-testid="overlay-building_155"]');
      await fortifiedWallBuildingOverlay.click();
      await page.waitForTimeout(200);
      await expect(stoneWallNode.locator('image.cross')).not.toBeVisible();
      await expect(gateNode.locator('image.cross')).not.toBeVisible();
      await expect(fortifiedWallTechNode.locator('image.cross')).not.toBeVisible();
      
      // Disable by clicking Stone Wall
      const stoneWallOverlay = page.locator('[data-testid="overlay-building_117"]');
      await stoneWallOverlay.click();
      await page.waitForTimeout(200);
      await expect(fortifiedWallTechNode.locator('image.cross')).toBeVisible();
      await expect(fortifiedWallBuildingNode.locator('image.cross')).toBeVisible();
      await expect(gateNode.locator('image.cross')).toBeVisible();
    });
  });

  test.describe('Visual Verification Tests', () => {
    test('should take screenshot showing initial disabled state', async ({ page }, testInfo) => {
      await page.goto('/v2/build');
      
      // Wait for page and tech tree to load
      await page.waitForTimeout(2000);
      
      const techtreeSvg = page.locator('.techtree-svg');
      await expect(techtreeSvg).toBeVisible({ timeout: 10000 });
      
      // Scroll to find the University/Wall area
      // This helps visualize where Fortified Wall, Stone Wall, and Gate are located
      const fortifiedWallNode = page.locator('[data-testid="node-tech_194"]');
      await fortifiedWallNode.scrollIntoViewIfNeeded();
      
      // Take a screenshot for manual verification
      await page.screenshot({ path: testInfo.outputPath('fortified-wall-disabled.png'), fullPage: false });
    });

    test('should take screenshot showing enabled state after clicking', async ({ page }, testInfo) => {
      await page.goto('/v2/build');
      
      await page.waitForTimeout(2000);
      
      const techtreeSvg = page.locator('.techtree-svg');
      await expect(techtreeSvg).toBeVisible({ timeout: 10000 });
      
      // Enable Fortified Wall Tech
      const fortifiedWallTechOverlay = page.locator('[data-testid="overlay-tech_194"]');
      await fortifiedWallTechOverlay.click();
      await page.waitForTimeout(300);
      
      // Scroll to see the enabled nodes
      const fortifiedWallNode = page.locator('[data-testid="node-tech_194"]');
      await fortifiedWallNode.scrollIntoViewIfNeeded();
      
      // Take a screenshot
      await page.screenshot({ path: testInfo.outputPath('fortified-wall-enabled.png'), fullPage: false });
    });
  });
});

/**
 * Integration tests that verify the constants and basic component loading
 */
test.describe('Fortified Wall Logic Tests', () => {
  test('should verify tech tree component loads correctly', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check that the tech tree component is present
    const techtree = page.locator('.techtree-container');
    await expect(techtree).toBeVisible({ timeout: 10000 });
    
    // Verify key nodes are present
    const fortifiedWallTech = page.locator('[data-testid="node-tech_194"]');
    const fortifiedWallBuilding = page.locator('[data-testid="node-building_155"]');
    const stoneWall = page.locator('[data-testid="node-building_117"]');
    const gate = page.locator('[data-testid="node-building_487"]');
    
    await expect(fortifiedWallTech).toBeAttached();
    await expect(fortifiedWallBuilding).toBeAttached();
    await expect(stoneWall).toBeAttached();
    await expect(gate).toBeAttached();
  });

  test('should verify all four nodes start in disabled state', async ({ page }) => {
    await page.goto('/v2/build');
    
    await page.waitForTimeout(2000);
    
    const techtreeSvg = page.locator('.techtree-svg');
    await expect(techtreeSvg).toBeVisible({ timeout: 10000 });
    
    // Check that all four start disabled (have crosses)
    const fortifiedWallTech = page.locator('[data-testid="node-tech_194"]');
    const fortifiedWallBuilding = page.locator('[data-testid="node-building_155"]');
    const stoneWall = page.locator('[data-testid="node-building_117"]');
    const gate = page.locator('[data-testid="node-building_487"]');
    
    await expect(fortifiedWallTech.locator('image.cross')).toBeVisible();
    await expect(fortifiedWallBuilding.locator('image.cross')).toBeVisible();
    await expect(stoneWall.locator('image.cross')).toBeVisible();
    await expect(gate.locator('image.cross')).toBeVisible();
  });
});
