import { test, expect } from '@playwright/test';
import { TechTreeDemoPage } from './helpers/TechTreeDemoPage';

/**
 * E2E tests for TechTree one-click enabling functionality
 * Tests that clicking advanced techs enables all prerequisites in one click
 */

test.describe('TechTree One-Click Enabling - Fortified Walls', () => {
  let demoPage: TechTreeDemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new TechTreeDemoPage(page);
  });

  test('clicking fortified wall tech should enable stone wall, gate, and fortified wall in one click (build mode)', async () => {
    await demoPage.setupBuildMode();
    
    const initialState = await demoPage.getStateSnapshot();
    
    // Click on fortified wall tech (tech_194)
    await demoPage.clickCaret('tech_194');
    
    const finalState = await demoPage.getStateSnapshot();
    
    // In build mode, points should have increased (at least 3 techs: stone wall, gate, fortified wall tech)
    expect(finalState.points).toBeGreaterThan(initialState.points);
    // At least 3 new techs should be enabled
    expect(finalState.techCount).toBeGreaterThanOrEqual(initialState.techCount + 3);
  });

  test('clicking fortified wall building should enable stone wall, gate, and fortified wall in one click (build mode)', async () => {
    await demoPage.setupBuildMode();
    
    const initialState = await demoPage.getStateSnapshot();
    
    // Click on fortified wall building (building_155)
    await demoPage.clickCaret('building_155');
    
    const finalState = await demoPage.getStateSnapshot();
    
    // In build mode, points should have increased
    expect(finalState.points).toBeGreaterThan(initialState.points);
    // At least 3 new techs should be enabled
    expect(finalState.techCount).toBeGreaterThanOrEqual(initialState.techCount + 3);
  });

  test('clicking fortified wall tech should enable stone wall, gate, and fortified wall in one click (draft mode with enough points)', async () => {
    await demoPage.setupDraftMode(100);
    
    const initialPoints = await demoPage.getPoints();
    const initialTechCount = await demoPage.getTechCount();
    
    // Click on fortified wall tech (tech_194)
    await demoPage.clickCaret('tech_194');
    
    const finalPoints = await demoPage.getPoints();
    const finalTechCount = await demoPage.getTechCount();
    
    // Points should have decreased (techs cost points in draft mode)
    expect(finalPoints).toBeLessThan(initialPoints);
    // At least 3 new techs should be enabled
    expect(finalTechCount).toBeGreaterThanOrEqual(initialTechCount + 3);
  });

  test('clicking fortified wall building should enable stone wall, gate, and fortified wall in one click (draft mode with enough points)', async () => {
    await demoPage.setupDraftMode(100);
    
    const initialPoints = await demoPage.getPoints();
    const initialTechCount = await demoPage.getTechCount();
    
    // Click on fortified wall building (building_155)
    await demoPage.clickCaret('building_155');
    
    const finalPoints = await demoPage.getPoints();
    const finalTechCount = await demoPage.getTechCount();
    
    // Points should have decreased
    expect(finalPoints).toBeLessThan(initialPoints);
    // At least 3 new techs should be enabled
    expect(finalTechCount).toBeGreaterThanOrEqual(initialTechCount + 3);
  });
});

test.describe('TechTree One-Click Enabling - Tower Techs', () => {
  let demoPage: TechTreeDemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new TechTreeDemoPage(page);
  });

  test('clicking keep tech should enable prerequisites and keep in one click (build mode)', async () => {
    await demoPage.setupBuildMode();
    
    const initialState = await demoPage.getStateSnapshot();
    
    // Click on keep tech (tech_63)
    await demoPage.clickCaret('tech_63');
    
    const finalState = await demoPage.getStateSnapshot();
    
    // In build mode, points should have increased
    expect(finalState.points).toBeGreaterThan(initialState.points);
    // At least the keep tech and its linked building should be enabled
    expect(finalState.techCount).toBeGreaterThan(initialState.techCount);
  });

  test('clicking guard tower tech should enable prerequisites and guard tower in one click (build mode)', async () => {
    await demoPage.setupBuildMode();
    
    const initialState = await demoPage.getStateSnapshot();
    
    // Click on guard tower tech (tech_140)
    await demoPage.clickCaret('tech_140');
    
    const finalState = await demoPage.getStateSnapshot();
    
    // In build mode, points should have increased
    expect(finalState.points).toBeGreaterThan(initialState.points);
    // At least the guard tower tech and its linked building should be enabled
    expect(finalState.techCount).toBeGreaterThan(initialState.techCount);
  });

  test('clicking keep tech should enable prerequisites and keep in one click (draft mode with enough points)', async () => {
    await demoPage.setupDraftMode(50);
    
    const initialPoints = await demoPage.getPoints();
    const initialTechCount = await demoPage.getTechCount();
    
    // Click on keep tech (tech_63)
    await demoPage.clickCaret('tech_63');
    
    const finalPoints = await demoPage.getPoints();
    const finalTechCount = await demoPage.getTechCount();
    
    // Points should have decreased
    expect(finalPoints).toBeLessThan(initialPoints);
    // At least one tech should be enabled
    expect(finalTechCount).toBeGreaterThan(initialTechCount);
  });

  test('clicking guard tower tech should enable prerequisites and guard tower in one click (draft mode with enough points)', async () => {
    await demoPage.setupDraftMode(50);
    
    const initialPoints = await demoPage.getPoints();
    const initialTechCount = await demoPage.getTechCount();
    
    // Click on guard tower tech (tech_140)
    await demoPage.clickCaret('tech_140');
    
    const finalPoints = await demoPage.getPoints();
    const finalTechCount = await demoPage.getTechCount();
    
    // Points should have decreased
    expect(finalPoints).toBeLessThan(initialPoints);
    // At least one tech should be enabled
    expect(finalTechCount).toBeGreaterThan(initialTechCount);
  });
});

test.describe('TechTree One-Click Enabling - Other Prerequisites', () => {
  let demoPage: TechTreeDemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new TechTreeDemoPage(page);
  });

  test('clicking arbalester should enable archer, crossbow, and arbalester in one click (draft mode)', async () => {
    await demoPage.setupDraftMode(50);
    
    const initialPoints = await demoPage.getPoints();
    const initialTechCount = await demoPage.getTechCount();
    
    // Click on arbalester (unit_492)
    await demoPage.clickCaret('unit_492');
    
    const finalPoints = await demoPage.getPoints();
    const finalTechCount = await demoPage.getTechCount();
    
    // Points should have decreased
    expect(finalPoints).toBeLessThan(initialPoints);
    // At least 3 units should be enabled (archer, crossbow, arbalester)
    expect(finalTechCount).toBeGreaterThanOrEqual(initialTechCount + 3);
  });

  test('clicking bombard tower building should enable chemistry and bombard tower in one click (build mode)', async () => {
    await demoPage.setupBuildMode();
    
    const initialState = await demoPage.getStateSnapshot();
    
    // Click on bombard tower building (building_236)
    await demoPage.clickCaret('building_236');
    
    const finalState = await demoPage.getStateSnapshot();
    
    // Points should have increased
    expect(finalState.points).toBeGreaterThan(initialState.points);
    // At least 2 techs should be enabled (bombard tower + chemistry prerequisite)
    expect(finalState.techCount).toBeGreaterThanOrEqual(initialState.techCount + 2);
  });
});
