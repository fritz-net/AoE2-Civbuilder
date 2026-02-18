import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for TechTree Demo page
 * Encapsulates all interactions with the techtree demo interface
 */
export class TechTreeDemoPage extends BasePage {
  // Selectors
  private readonly selectors = {
    buildModeRadio: 'radio[name="mode"][value="build"]',
    draftModeRadio: 'radio[name="mode"][value="draft"]',
    pointLimitInput: 'input[type="number"]',
    fillButton: '.techtree-toolbar button:has-text("Fill")',
    resetButton: '.techtree-toolbar button:has-text("Reset")',
    techtreeSvg: '.techtree-svg',
    infoBox: '.info-box',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to techtree demo page
   */
  async navigate(): Promise<void> {
    await this.goto('/v2/demo/techtree');
  }

  /**
   * Wait for techtree to be fully loaded
   */
  async waitForTechtreeLoaded(timeout: number = 15000): Promise<void> {
    await this.page.locator(this.selectors.techtreeSvg).waitFor({ 
      state: 'visible', 
      timeout 
    });
    await this.wait(1000); // Allow time for initialization
  }

  /**
   * Switch to build mode
   */
  async switchToBuildMode(): Promise<void> {
    const buildModeRadio = this.page.getByRole('radio', { name: /Build Mode/i });
    await buildModeRadio.click();
    await this.wait(500);
  }

  /**
   * Switch to draft mode
   */
  async switchToDraftMode(): Promise<void> {
    const draftModeRadio = this.page.getByRole('radio', { name: /Draft Mode/i });
    await draftModeRadio.click();
    await this.wait(500);
  }

  /**
   * Set point limit (draft mode only)
   */
  async setPointLimit(points: number): Promise<void> {
    const pointLimitInput = this.page.locator(this.selectors.pointLimitInput).first();
    await pointLimitInput.fill(String(points));
    await this.wait(1000);
  }

  /**
   * Click the Fill button
   */
  async clickFill(): Promise<void> {
    await this.page.locator(this.selectors.fillButton).click();
    await this.wait(1000);
  }

  /**
   * Click the Reset button
   */
  async clickReset(): Promise<void> {
    await this.page.locator(this.selectors.resetButton).click();
    await this.wait(500);
  }

  /**
   * Click on a specific caret by ID
   */
  async clickCaret(caretId: string): Promise<void> {
    await this.page.locator(`[data-caret-id="${caretId}"]`).click();
    await this.wait(2000); // Allow time for reactive updates
  }

  /**
   * Get current points value
   * @returns {number} Current points value
   */
  async getPoints(): Promise<number> {
    const pointsText = await this.page.getByText(/Points (Spent|Remaining): \d+/i).textContent();
    const match = pointsText?.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Get points label (either "Points Spent" or "Points Remaining")
   */
  async getPointsLabel(): Promise<string> {
    const pointsText = await this.page.getByText(/Points (Spent|Remaining): \d+/i).textContent();
    return pointsText?.includes('Remaining') ? 'Points Remaining' : 'Points Spent';
  }

  /**
   * Get current tech count
   */
  async getTechCount(): Promise<number> {
    const techCountText = await this.page.locator(this.selectors.infoBox)
      .getByText(/Techs Enabled: \d+/i).textContent();
    const match = techCountText?.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Assert points value
   */
  async assertPoints(expectedPoints: number): Promise<void> {
    const points = await this.getPoints();
    expect(points).toBe(expectedPoints);
  }

  /**
   * Assert points are within a range
   */
  async assertPointsInRange(min: number, max: number): Promise<void> {
    const points = await this.getPoints();
    expect(points).toBeGreaterThanOrEqual(min);
    expect(points).toBeLessThanOrEqual(max);
  }

  /**
   * Assert points label
   */
  async assertPointsLabel(label: 'Points Spent' | 'Points Remaining'): Promise<void> {
    await expect(this.page.getByText(new RegExp(label, 'i'))).toBeVisible();
  }

  /**
   * Assert tech count is greater than expected
   */
  async assertTechCountGreaterThan(count: number): Promise<void> {
    const techCount = await this.getTechCount();
    expect(techCount).toBeGreaterThan(count);
  }

  /**
   * Assert tech count equals expected
   */
  async assertTechCount(expectedCount: number): Promise<void> {
    const techCount = await this.getTechCount();
    expect(techCount).toBe(expectedCount);
  }

  /**
   * Get a caret locator by ID
   */
  getCaretLocator(caretId: string): Locator {
    return this.page.locator(`[data-caret-id="${caretId}"]`);
  }

  /**
   * Check if a caret is enabled (visible check can be used as proxy)
   */
  async isCaretEnabled(caretId: string): Promise<boolean> {
    return await this.getCaretLocator(caretId).isVisible();
  }

  /**
   * Setup demo page in build mode with reset state
   */
  async setupBuildMode(): Promise<void> {
    await this.navigate();
    await this.switchToBuildMode();
    await this.waitForTechtreeLoaded();
    await this.clickReset();
  }

  /**
   * Setup demo page in draft mode with specific point limit
   */
  async setupDraftMode(pointLimit: number): Promise<void> {
    await this.navigate();
    await this.switchToDraftMode();
    await this.waitForTechtreeLoaded();
    await this.setPointLimit(pointLimit);
    await this.clickReset();
  }

  /**
   * Get state snapshot for comparison
   */
  async getStateSnapshot(): Promise<{ points: number; techCount: number }> {
    return {
      points: await this.getPoints(),
      techCount: await this.getTechCount(),
    };
  }
}
