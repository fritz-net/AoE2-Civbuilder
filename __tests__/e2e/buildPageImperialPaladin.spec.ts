import { test, expect } from '@playwright/test';
import { BasePage } from './helpers/BasePage';

/**
 * BuildPage helper for /v2/build interactions
 */
class BuildPage extends BasePage {
  async navigateToBuilder(): Promise<void> {
    await this.goto('/v2/build');
    await this.page.waitForLoadState('networkidle');
  }

  async goToStep(stepIndex: number): Promise<void> {
    // Click on the step in stepper navigation
    const stepButton = this.page.locator(`.stepper-step`).nth(stepIndex);
    await stepButton.click();
    await this.wait(500);
  }

  async selectCivBonus(bonusId: number): Promise<void> {
    // Click on bonus card
    const bonusCard = this.page.locator(`.bonus-card[data-bonus-id="${bonusId}"]`);
    await bonusCard.scrollIntoViewIfNeeded();
    await bonusCard.click();
    await this.wait(300);
  }

  async getBonusCardText(bonusId: number): Promise<string | null> {
    const bonusCard = this.page.locator(`.bonus-card[data-bonus-id="${bonusId}"]`);
    return await bonusCard.textContent();
  }

  async isBonusCardVisible(bonusId: number): Promise<boolean> {
    const bonusCard = this.page.locator(`.bonus-card[data-bonus-id="${bonusId}"]`);
    return await bonusCard.isVisible();
  }

  async isBonusSelected(bonusId: number): Promise<boolean> {
    const bonusCard = this.page.locator(`.bonus-card[data-bonus-id="${bonusId}"]`);
    const classes = await bonusCard.getAttribute('class');
    return classes?.includes('selected') || false;
  }

  async getSelectedBonusCount(): Promise<number> {
    const selectedBonuses = this.page.locator('.bonus-card.selected');
    return await selectedBonuses.count();
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

    // Verify Imperial Paladin bonus (ID 363) is visible
    const isVisible = await buildPage.isBonusCardVisible(363);
    expect(isVisible).toBe(true);

    // Verify the card text contains "Imperial Paladin"
    const cardText = await buildPage.getBonusCardText(363);
    expect(cardText).toContain('Imperial Paladin');
  });

  test('should be able to select Imperial Paladin bonus', async () => {
    // Navigate to Civilization Bonuses step
    await buildPage.goToStep(1);

    // Verify bonus is not selected initially
    const initiallySelected = await buildPage.isBonusSelected(363);
    expect(initiallySelected).toBe(false);

    // Select the bonus
    await buildPage.selectCivBonus(363);

    // Verify bonus is now selected
    const nowSelected = await buildPage.isBonusSelected(363);
    expect(nowSelected).toBe(true);

    // Verify selected count increased
    const selectedCount = await buildPage.getSelectedBonusCount();
    expect(selectedCount).toBeGreaterThan(0);
  });

  test('should be able to deselect Imperial Paladin bonus', async () => {
    // Navigate to Civilization Bonuses step
    await buildPage.goToStep(1);

    // Select the bonus first
    await buildPage.selectCivBonus(363);
    let isSelected = await buildPage.isBonusSelected(363);
    expect(isSelected).toBe(true);

    // Deselect by clicking again
    await buildPage.selectCivBonus(363);
    isSelected = await buildPage.isBonusSelected(363);
    expect(isSelected).toBe(false);
  });

  test('should find Imperial Paladin in bonus count of 364 civ bonuses', async () => {
    // Navigate to Civilization Bonuses step
    await buildPage.goToStep(1);

    // Count all bonus cards
    const allBonusCards = buildPage.page.locator('.bonus-card');
    const totalCount = await allBonusCards.count();

    // Should have 364 civ bonuses (including Imperial Paladin)
    expect(totalCount).toBe(364);

    // Imperial Paladin should be among them (index 363)
    const imperialPaladinCard = await buildPage.isBonusCardVisible(363);
    expect(imperialPaladinCard).toBe(true);
  });
});
