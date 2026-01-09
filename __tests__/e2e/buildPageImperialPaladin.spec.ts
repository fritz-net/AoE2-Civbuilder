import { test, expect } from '@playwright/test';
import { BasePage } from './helpers/BasePage';

/**
 * BuildPage helper for /v2/build interactions
 */
class BuildPage extends BasePage {
  async navigateToBuilder(): Promise<void> {
    await this.goto('/v2/build');
    await this.page.waitForLoadState('networkidle');
    // Wait for the stepper to be visible
    await this.page.waitForSelector('.stepper', { state: 'visible', timeout: 10000 });
  }

  async goToStep(stepIndex: number): Promise<void> {
    // Wait for stepper items to be available
    await this.page.waitForSelector('.step-item', { state: 'visible', timeout: 10000 });
    
    // Click on the step in stepper navigation
    const stepButton = this.page.locator(`.step-item`).nth(stepIndex);
    await stepButton.waitFor({ state: 'visible' });
    await stepButton.click();
    await this.wait(1000);
  }

  async findBonusCardByText(text: string) {
    // Wait for bonus selector grid to be visible
    await this.page.waitForSelector('.bonus-selector-grid', { state: 'visible', timeout: 10000 });
    
    // Find bonus card by looking for the text in alt attribute of card images
    const bonusCard = this.page.locator(`.bonus-card img[alt*="${text}"]`).first();
    return bonusCard;
  }

  async selectBonusByText(text: string): Promise<void> {
    const bonusCard = await this.findBonusCardByText(text);
    const parentCard = bonusCard.locator('xpath=ancestor::div[contains(@class, "bonus-card")]');
    await parentCard.scrollIntoViewIfNeeded();
    await parentCard.click();
    await this.wait(300);
  }

  async getSelectedBonusCount(): Promise<number> {
    const selectedBonuses = this.page.locator('.bonus-card.bonus-selected');
    return await selectedBonuses.count();
  }

  async isBonusCardSelected(text: string): Promise<boolean> {
    const bonusCard = await this.findBonusCardByText(text);
    const parentCard = bonusCard.locator('xpath=ancestor::div[contains(@class, "bonus-card")]');
    const classes = await parentCard.getAttribute('class');
    return classes?.includes('bonus-selected') || false;
  }
}

test.describe('Build Page - Imperial Paladin Bonus', () => {
  let buildPage: BuildPage;

  test.beforeEach(async ({ page }) => {
    buildPage = new BuildPage(page);
    await buildPage.navigateToBuilder();
  });

  test('should display Imperial Paladin bonus card on /v2/build', async () => {
    // Navigate to Civilization Bonuses step (step 1)
    await buildPage.goToStep(1);

    // Find Imperial Paladin bonus card by text
    const imperialPaladinCard = await buildPage.findBonusCardByText('upgrade Paladin to Imperial Paladin');
    
    // Verify it's visible
    await expect(imperialPaladinCard).toBeVisible({ timeout: 10000 });
  });

  test('should be able to select Imperial Paladin bonus', async () => {
    // Navigate to Civilization Bonuses step
    await buildPage.goToStep(1);

    // Verify bonus is not selected initially
    const initiallySelected = await buildPage.isBonusCardSelected('upgrade Paladin to Imperial Paladin');
    expect(initiallySelected).toBe(false);

    // Select the bonus
    await buildPage.selectBonusByText('upgrade Paladin to Imperial Paladin');

    // Verify bonus is now selected
    const nowSelected = await buildPage.isBonusCardSelected('upgrade Paladin to Imperial Paladin');
    expect(nowSelected).toBe(true);

    // Verify selected count increased
    const selectedCount = await buildPage.getSelectedBonusCount();
    expect(selectedCount).toBeGreaterThan(0);
  });

  test('should be able to deselect Imperial Paladin bonus', async () => {
    // Navigate to Civilization Bonuses step
    await buildPage.goToStep(1);

    // Select the bonus first
    await buildPage.selectBonusByText('upgrade Paladin to Imperial Paladin');
    let isSelected = await buildPage.isBonusCardSelected('upgrade Paladin to Imperial Paladin');
    expect(isSelected).toBe(true);

    // Deselect by clicking again
    await buildPage.selectBonusByText('upgrade Paladin to Imperial Paladin');
    isSelected = await buildPage.isBonusCardSelected('upgrade Paladin to Imperial Paladin');
    expect(isSelected).toBe(false);
  });

  test('should find Imperial Paladin among civ bonuses', async () => {
    // Navigate to Civilization Bonuses step
    await buildPage.goToStep(1);

    // Wait for bonus selector grid
    await buildPage.page.waitForSelector('.bonus-selector-grid', { state: 'visible', timeout: 10000 });

    // Imperial Paladin should be findable
    const imperialPaladinCard = await buildPage.findBonusCardByText('upgrade Paladin to Imperial Paladin');
    await expect(imperialPaladinCard).toBeVisible({ timeout: 10000 });
    
    // Verify the description text
    const altText = await imperialPaladinCard.getAttribute('alt');
    expect(altText).toContain('Paladin');
    expect(altText).toContain('Imperial');
  });
});
