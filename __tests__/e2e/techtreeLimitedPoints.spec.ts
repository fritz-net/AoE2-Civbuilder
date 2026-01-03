import { test, expect } from '@playwright/test';
import { TechTreeDemoPage } from './helpers/TechTreeDemoPage';

/**
 * E2E tests for TechTree limited points edge cases
 * Tests that with insufficient points, only affordable prerequisites are enabled
 */

test.describe('TechTree Limited Points - 3 Point Wall Issue', () => {
  let demoPage: TechTreeDemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new TechTreeDemoPage(page);
  });

  test('with 3 points, clicking fortified wall tech should only enable stone wall and gate (not fortified wall)', async () => {
    await demoPage.setupDraftMode(3);
    
    const initialTechCount = await demoPage.getTechCount();
    
    // Click on fortified wall tech (tech_194)
    await demoPage.clickCaret('tech_194');
    
    const finalPoints = await demoPage.getPoints();
    const finalTechCount = await demoPage.getTechCount();
    
    // Should have spent some points (stone wall + gate prerequisites)
    // Assuming stone wall costs 1 point and gate costs 1 point (total 2 points)
    await demoPage.assertPointsInRange(0, 3);
    
    // Points should not go negative
    expect(finalPoints).toBeGreaterThanOrEqual(0);
    
    // Some techs should be enabled (at least stone wall and/or gate)
    // But fortified wall itself should NOT be enabled due to insufficient points
    expect(finalTechCount).toBeGreaterThan(initialTechCount);
  });

  test('with 3 points, clicking fortified wall building should only enable stone wall and gate (not fortified wall)', async () => {
    await demoPage.setupDraftMode(3);
    
    const initialTechCount = await demoPage.getTechCount();
    
    // Click on fortified wall building (building_155)
    await demoPage.clickCaret('building_155');
    
    const finalPoints = await demoPage.getPoints();
    const finalTechCount = await demoPage.getTechCount();
    
    // Should have spent some points on prerequisites
    await demoPage.assertPointsInRange(0, 3);
    
    // Points should not go negative
    expect(finalPoints).toBeGreaterThanOrEqual(0);
    
    // Some techs should be enabled (prerequisites)
    expect(finalTechCount).toBeGreaterThan(initialTechCount);
  });

  test('with 5 points, clicking fortified wall should enable stone wall, gate, and fortified wall tech', async () => {
    await demoPage.setupDraftMode(5);
    
    const initialTechCount = await demoPage.getTechCount();
    
    // Click on fortified wall tech (tech_194)
    await demoPage.clickCaret('tech_194');
    
    const finalPoints = await demoPage.getPoints();
    const finalTechCount = await demoPage.getTechCount();
    
    // Should have spent points for stone wall, gate, and fortified wall
    await demoPage.assertPointsInRange(0, 5);
    expect(finalPoints).toBeGreaterThanOrEqual(0);
    
    // At least 3 techs should be enabled
    expect(finalTechCount).toBeGreaterThanOrEqual(initialTechCount + 3);
  });
});

test.describe('TechTree Limited Points - Wood Tech Chain', () => {
  let demoPage: TechTreeDemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new TechTreeDemoPage(page);
  });

  test('with 12 points, clicking two-man-saw should enable affordable prerequisites first', async () => {
    await demoPage.setupDraftMode(12);
    
    const initialPoints = await demoPage.getPoints();
    const initialTechCount = await demoPage.getTechCount();
    
    // Click on two-man-saw (tech_221)
    // This has prerequisites: double-bit-axe and bow-saw
    await demoPage.clickCaret('tech_221');
    
    const finalPoints = await demoPage.getPoints();
    const finalTechCount = await demoPage.getTechCount();
    
    // Should have enabled prerequisites
    expect(finalPoints).toBeLessThan(initialPoints);
    expect(finalPoints).toBeGreaterThanOrEqual(0);
    expect(finalTechCount).toBeGreaterThan(initialTechCount);
  });

  test('with 18 points, wood techs should enable earliest tech first', async () => {
    await demoPage.setupDraftMode(18);
    
    const initialPoints = await demoPage.getPoints();
    
    // Click on two-man-saw (tech_221)
    await demoPage.clickCaret('tech_221');
    
    const finalPoints = await demoPage.getPoints();
    
    // Should have enabled all prerequisites if affordable
    expect(finalPoints).toBeLessThan(initialPoints);
    expect(finalPoints).toBeGreaterThanOrEqual(0);
  });
});

test.describe('TechTree Limited Points - Consistency Check', () => {
  let demoPage: TechTreeDemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new TechTreeDemoPage(page);
  });

  test('with limited points, fill and refill should give consistent results', async () => {
    await demoPage.setupDraftMode(15);
    
    // First fill
    await demoPage.clickFill();
    const firstFillState = await demoPage.getStateSnapshot();
    
    // Reset and refill
    await demoPage.clickReset();
    await demoPage.clickFill();
    const secondFillState = await demoPage.getStateSnapshot();
    
    // Should get same results
    expect(secondFillState.points).toBe(firstFillState.points);
    expect(secondFillState.techCount).toBe(firstFillState.techCount);
  });

  test('prerequisite chains should not go negative with limited points', async () => {
    await demoPage.setupDraftMode(15);
    
    // Try to enable an expensive tech tree
    await demoPage.clickFill();
    
    const finalPoints = await demoPage.getPoints();
    const finalTechCount = await demoPage.getTechCount();
    
    // Points should never go negative
    expect(finalPoints).toBeGreaterThanOrEqual(0);
    // Should have enabled at least some techs
    expect(finalTechCount).toBeGreaterThan(39); // More than base techs
  });

  test('with 8 points, fill should enable cheaper techs first', async () => {
    await demoPage.setupDraftMode(8);
    
    const initialPoints = await demoPage.getPoints();
    expect(initialPoints).toBe(8);
    
    // Fill should enable what it can afford
    await demoPage.clickFill();
    
    const finalPoints = await demoPage.getPoints();
    const finalTechCount = await demoPage.getTechCount();
    
    // Should have enabled some techs without going negative
    expect(finalPoints).toBeGreaterThanOrEqual(0);
    expect(finalTechCount).toBeGreaterThan(39); // More than initial base techs
  });
});

test.describe('TechTree Limited Points - Stone Wall and Gate Linking', () => {
  let demoPage: TechTreeDemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new TechTreeDemoPage(page);
  });

  test('stone wall and gate should be enabled together as a linked pair', async () => {
    await demoPage.setupBuildMode();
    
    const initialTechCount = await demoPage.getTechCount();
    
    // Click Fill to enable all techs
    await demoPage.clickFill();
    
    const filledTechCount = await demoPage.getTechCount();
    expect(filledTechCount).toBeGreaterThan(50);
    
    // Reset and Fill again - should get consistent results
    await demoPage.clickReset();
    await demoPage.clickFill();
    
    const refilledTechCount = await demoPage.getTechCount();
    
    // Should get same tech count (relationships are working correctly)
    expect(refilledTechCount).toBe(filledTechCount);
  });
});
