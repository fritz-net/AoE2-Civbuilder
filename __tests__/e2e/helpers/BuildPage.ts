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
   * Complete all stepper steps to reach tech tree
   * Steps: 1-Name, 2-Bonuses, 3-UU, 4-Castle, 5-Imperial, 6-Team, 7-TechTree
   */
  async navigateToTechTree(): Promise<void> {
    // Advance through 6 steps to reach tech tree (step 7)
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
   */
  async completeTechTree(): Promise<void> {
    await this.waitForTechTree();
    
    // Click Done or Create Mod button
    const doneButton = this.page.getByRole('button', { name: /Done|Create Mod/i });
    
    try {
      await expect(doneButton).toBeVisible({ timeout: 5000 });
      await expect(doneButton).toBeEnabled();
      console.log('[BuildPage] Found and clicking Done/Create Mod button');
      await doneButton.click();
      console.log('[BuildPage] Button clicked successfully');
    } catch (error) {
      console.error('[BuildPage] Failed to find or click Done/Create Mod button:', error);
      // Take a screenshot for debugging
      await this.page.screenshot({ path: `debug-button-not-found-${Date.now()}.png` });
      throw new Error('Done/Create Mod button not found or not clickable');
    }

    // Handle optional confirmation modal
    const confirmButton = this.page.getByRole('button', { name: /Yes, Done|Confirm/i });
    try {
      await expect(confirmButton).toBeVisible({ timeout: 2000 });
      await confirmButton.click();
      console.log('[BuildPage] Clicked confirmation button');
    } catch {
      // No confirmation modal - that's fine
      console.log('[BuildPage] No confirmation modal found (this is OK)');
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
}
