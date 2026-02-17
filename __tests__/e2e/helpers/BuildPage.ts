import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Build Page (/v2/build)
 * Handles navigation through the civilization builder stepper
 */
export class BuildPage extends BasePage {
  // Selectors
  private readonly selectors = {
    civNameInput: 'input[placeholder*="civilization name" i]',
    nextButton: 'button:has-text("Next")',
    previousButton: 'button:has-text("Previous")',
    doneButton: 'button:has-text("Done")',
    createModButton: 'button:has-text("Create Mod")',
    confirmButton: 'button:has-text("Yes")',
    techTreeContainer: '.techtree-container',
    stepperStep: '.step-label',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to build page (override with default URL)
   * Can be called with no arguments to go to /v2/build/
   */
  async goto(url: string = '/v2/build/'): Promise<void> {
    await super.goto(url);
  }

  /**
   * Navigate to build page
   */
  async navigate(): Promise<void> {
    await this.goto('/v2/build/');  // Note: trailing slash needed to avoid redirect
    // Wait for Vue app to mount and stepper to be ready
    await this.page.waitForLoadState('networkidle');
    await this.wait(1000);  // Give Vue time to render
  }

  /**
   * Fill in civilization name on step 1
   */
  async fillCivName(name: string): Promise<void> {
    // Wait a bit more for Vue to fully render the form
    await this.wait(500);
    // Try multiple possible selectors for the civ name input
    const input = this.page.locator('input[type="text"]').first();
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.fill(name);
  }

  /**
   * Click Next button to advance stepper
   */
  async clickNext(): Promise<void> {
    const nextButton = this.page.getByRole('button', { name: /Next/i });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    await this.wait(500);
  }

  /**
   * Navigate through stepper to specific step
   * @param targetStep - Number of steps to advance (0 = stay on current)
   */
  async navigateToStep(targetStep: number): Promise<void> {
    for (let i = 0; i < targetStep; i++) {
      await this.clickNext();
    }
  }

  /**
   * Navigate to the civ bonuses step by filling basic info and clicking Next
   * (From Imperial Paladin PR)
   */
  async goToCivBonusesStep() {
    // Fill in a civ name to enable the Next button
    await this.fillCivName('TestCiv');
    
    // Click Next to go to Civ Bonuses step
    await this.clickNext();
    
    // Wait for the Civ Bonuses heading
    await this.page.getByRole('heading', { name: /Civilization Bonuses/i }).waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Complete all stepper steps to reach tech tree
   * Steps: 1-Name, 2-Bonuses, 3-UU, 4-Castle, 5-Imperial, 6-Team, 7-TechTree
   */
  async navigateToTechTree(): Promise<void> {
    // Advance through 6 steps to reach tech tree (step 7)
    // The stepper should advance even with default/empty values
    await this.navigateToStep(6);
  }

  /**
   * Wait for tech tree to load
   */
  async waitForTechTree(): Promise<void> {
    const techTreeContainer = this.page.locator(this.selectors.techTreeContainer);
    await expect(techTreeContainer).toBeVisible({ timeout: 10000 });
  }

  /**
   * Complete tech tree and submit for mod creation
   * This handles the multi-step process:
   * 1. Click "Done" on Tech Tree step to advance to Review step
   * 2. Click "Create Mod" on Review step to trigger download
   */
  async completeTechTree(): Promise<void> {
    await this.waitForTechTree();
    
    // Step 1: Click Done button on Tech Tree step
    const doneButton = this.page.getByRole('button', { name: /Done/i });
    
    try {
      await expect(doneButton).toBeVisible({ timeout: 5000 });
      await expect(doneButton).toBeEnabled();
      console.log('[BuildPage] Found and clicking Done button on Tech Tree');
      await doneButton.click();
      console.log('[BuildPage] Done button clicked - advancing to Review step');
    } catch (error) {
      console.error('[BuildPage] Failed to find or click Done button:', error);
      // Take a screenshot for debugging
      await this.page.screenshot({ path: `debug-done-button-not-found-${Date.now()}.png` });
      throw new Error('Done button not found or not clickable');
    }

    // Handle optional confirmation modal after Done
    const confirmButton = this.page.getByRole('button', { name: /Yes, Done|Confirm/i });
    try {
      await expect(confirmButton).toBeVisible({ timeout: 2000 });
      await confirmButton.click();
      console.log('[BuildPage] Clicked confirmation button');
    } catch {
      // No confirmation modal - that's fine
      console.log('[BuildPage] No confirmation modal found (this is OK)');
    }
    
    // Step 2: Wait for Review step to load and click "Create Mod"
    await this.wait(500); // Give time for step transition
    const createModButton = this.page.getByRole('button', { name: /Create Mod/i });
    
    try {
      await expect(createModButton).toBeVisible({ timeout: 5000 });
      await expect(createModButton).toBeEnabled();
      console.log('[BuildPage] Found and clicking Create Mod button on Review step');
      await createModButton.click();
      console.log('[BuildPage] Create Mod button clicked - mod creation should start');
    } catch (error) {
      console.error('[BuildPage] Failed to find or click Create Mod button:', error);
      // Take a screenshot for debugging
      await this.page.screenshot({ path: `debug-create-mod-button-not-found-${Date.now()}.png` });
      throw new Error('Create Mod button not found or not clickable on Review step');
    }
  }

  /**
   * Wait for mod creation to complete
   * Returns true if navigated to download-success page, false if download button appeared
   */
  async waitForModCreation(): Promise<boolean> {
    // Approach 1: Check for navigation to download-success page
    try {
      await this.page.waitForURL('**/v2/download-success*', { timeout: 30000 });
      return true;
    } catch {
      // Approach 2: Check for download button in current page
      const downloadButton = this.page.locator(
        'button:has-text("Download"), .download-button, button:has-text("Download Mod")'
      );
      await expect(downloadButton.first()).toBeVisible({ timeout: 30000 });
      return false;
    }
  }

  /**
   * Complete full build flow from start to mod creation
   */
  async completeBuildFlow(civName: string): Promise<void> {
    await this.navigate();
    await this.fillCivName(civName);
    await this.navigateToTechTree();
    await this.completeTechTree();
    await this.waitForModCreation();
  }

  /**
   * Enable custom UU mode in advanced settings
   */
  async enableCustomUU(): Promise<void> {
    // Navigate to UU step (step 3)
    await this.navigateToStep(2);
    
    // Look for custom UU checkbox or toggle
    const customUUCheckbox = this.page.getByRole('checkbox', { name: /Custom.*Unit|Design.*Unit/i });
    if (await customUUCheckbox.isVisible().catch(() => false)) {
      await customUUCheckbox.check();
    }
  }

  /**
   * Select a bonus card by index
   */
  async selectBonusCard(index: number = 0): Promise<void> {
    const bonusCards = this.page.locator('.bonus-card');
    await expect(bonusCards.first()).toBeVisible();
    await bonusCards.nth(index).click();
  }

  /**
   * Assert we're on a specific step by checking heading
   */
  async assertStep(stepName: RegExp): Promise<void> {
    await expect(this.page.getByRole('heading', { name: stepName })).toBeVisible();
  }

  // ========================================
  // Imperial Paladin PR - Bonus Management Methods
  // ========================================

  /**
   * Get bonus card by ID
   * (From Imperial Paladin PR)
   */
  getBonusCard(bonusId: number) {
    return this.page.locator(`.bonus-card[data-bonus-id="${bonusId}"]`);
  }

  /**
   * Get bonus card by text content (searches in title and description) - only in visible step
   * (From Imperial Paladin PR)
   */
  getBonusCardByText(text: string) {
    return this.page.locator('.step-content:visible .bonus-card').filter({ hasText: text }).first();
  }

  /**
   * Select a bonus by ID
   * (From Imperial Paladin PR)
   */
  async selectBonus(bonusId: number) {
    const card = this.getBonusCard(bonusId);
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await this.page.waitForTimeout(300); // Wait for selection animation
  }

  /**
   * Select a bonus by text
   * (From Imperial Paladin PR)
   */
  async selectBonusByText(text: string) {
    const card = this.getBonusCardByText(text);
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await this.page.waitForTimeout(300); // Wait for selection animation
  }

  /**
   * Check if a bonus is selected
   * (From Imperial Paladin PR)
   */
  async isBonusSelected(bonusId: number): Promise<boolean> {
    const card = this.getBonusCard(bonusId);
    const classes = await card.getAttribute('class');
    return classes?.includes('selected') || false;
  }

  /**
   * Get the total number of bonus cards (visible ones only in current step)
   * (From Imperial Paladin PR)
   */
  async getBonusCardCount(): Promise<number> {
    return await this.page.locator('.step-content:visible .bonus-card').count();
  }

  /**
   * Get the number of selected bonuses (visible ones only in current step)
   * (From Imperial Paladin PR)
   */
  async getSelectedBonusCount(): Promise<number> {
    return await this.page.locator('.step-content:visible .bonus-card.bonus-selected').count();
  }

  /**
   * Search for a bonus
   * (From Imperial Paladin PR)
   */
  async searchBonus(query: string) {
    // Use the filter input that's currently visible (in the active step)
    const searchInput = this.page.locator('.step-content:visible .filter-input');
    await searchInput.fill(query);
    await this.page.waitForTimeout(500); // Wait for search to filter
  }

  /**
   * Clear search
   * (From Imperial Paladin PR)
   */
  async clearSearch() {
    // Use the filter input that's currently visible (in the active step)
    const searchInput = this.page.locator('.step-content:visible .filter-input');
    await searchInput.clear();
    await this.page.waitForTimeout(500);
  }
}
