import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Draft Creation page
 * Following the POM design pattern to encapsulate page interactions
 */
export class DraftCreatePage extends BasePage {
  // Selectors
  private readonly selectors = {
    numPlayersInput: '#numPlayers',
    bonusesInput: '#bonusesPerPlayer',
    techTreePointsInput: '#techTreePoints',
    startDraftButton: 'button:has-text("Start Draft")',
    backButton: 'button:has-text("Back")',
    heading: 'h1, h2',
    timerCheckbox: '#timerEnabled',
    timerDurationInput: '#timerDuration',
    modalOverlay: '.modal-overlay',
    hostLinkInput: '#hostLink',
    playerLinkInput: '#playerLink',
    spectatorLinkInput: '#spectatorLink',
    advancedSettings: 'summary:has-text("Advanced Settings")',
    testingSettings: 'summary:has-text("Testing Settings")',
    requiredFirstRollInput: '#requiredFirstRoll',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to the draft creation page
   */
  async navigate(): Promise<void> {
    await this.goto('/v2/draft/create');
  }

  /**
   * Set the number of players
   */
  async setNumPlayers(numPlayers: number): Promise<void> {
    await this.fillInput(this.selectors.numPlayersInput, numPlayers.toString());
  }

  /**
   * Set bonuses per player
   */
  async setBonusesPerPlayer(bonuses: number): Promise<void> {
    await this.fillInput(this.selectors.bonusesInput, bonuses.toString());
  }

  /**
   * Set tech tree points
   */
  async setTechTreePoints(points: number): Promise<void> {
    await this.fillInput(this.selectors.techTreePointsInput, points.toString());
  }

  /**
   * Click the Start Draft button
   */
  async clickStartDraft(): Promise<void> {
    await this.clickElement(this.selectors.startDraftButton);
  }

  /**
   * Expand advanced settings section
   */
  async expandAdvancedSettings(): Promise<void> {
    await this.clickElement(this.selectors.advancedSettings);
    await this.waitForElement('#rarity-0', 5000);
  }

  /**
   * Expand testing settings section
   */
  async expandTestingSettings(): Promise<void> {
    await this.clickElement(this.selectors.testingSettings);
    await this.waitForElement(this.selectors.requiredFirstRollInput, 5000);
  }

  /**
   * Enable timer with optional duration
   */
  async enableTimer(duration?: number): Promise<void> {
    await this.page.locator(this.selectors.timerCheckbox).check();
    if (duration) {
      await this.fillInput(this.selectors.timerDurationInput, duration.toString());
    }
  }

  /**
   * Set required first roll bonus (for testing)
   */
  async setRequiredFirstRoll(bonusId: string): Promise<void> {
    await this.fillInput(this.selectors.requiredFirstRollInput, bonusId);
  }

  /**
   * Wait for the draft creation modal to appear
   */
  async waitForModal(): Promise<void> {
    await this.waitForElement(this.selectors.modalOverlay, 10000);
  }

  /**
   * Get draft links from the modal
   */
  async getDraftLinks(): Promise<{ hostLink: string; playerLink: string; spectatorLink: string; draftId: string | null }> {
    await this.waitForModal();
    
    const hostLink = await this.page.locator(this.selectors.hostLinkInput).inputValue();
    const playerLink = await this.page.locator(this.selectors.playerLinkInput).inputValue();
    const spectatorLink = await this.page.locator(this.selectors.spectatorLinkInput).inputValue();
    
    // Extract draft ID from host link
    const match = hostLink.match(/\/host\/(\d+)/);
    const draftId = match ? match[1] : null;
    
    return { hostLink, playerLink, spectatorLink, draftId };
  }

  /**
   * Create a draft with specific configuration
   * Builder pattern for complex test setup
   */
  async createDraft(config: {
    numPlayers?: number;
    bonuses?: number;
    techTreePoints?: number;
    timerEnabled?: boolean;
    timerDuration?: number;
    requiredFirstRoll?: string;
  } = {}): Promise<{ hostLink: string; playerLink: string; spectatorLink: string; draftId: string | null }> {
    // Set configuration with defaults
    if (config.numPlayers !== undefined) {
      await this.setNumPlayers(config.numPlayers);
    }
    if (config.bonuses !== undefined) {
      await this.setBonusesPerPlayer(config.bonuses);
    }
    if (config.techTreePoints !== undefined) {
      await this.setTechTreePoints(config.techTreePoints);
    }
    
    // Advanced settings
    if (config.timerEnabled) {
      await this.expandAdvancedSettings();
      await this.enableTimer(config.timerDuration);
    }
    
    // Testing settings
    if (config.requiredFirstRoll) {
      await this.expandTestingSettings();
      await this.setRequiredFirstRoll(config.requiredFirstRoll);
    }
    
    // Start draft
    await this.clickStartDraft();
    
    // Get links
    return await this.getDraftLinks();
  }

  /**
   * Assert page loaded correctly
   */
  async assertPageLoaded(): Promise<void> {
    await this.assertTitle(/AoE2 Civbuilder/);
    await expect(this.page.getByRole('heading', { name: /Create Draft/i })).toBeVisible();
  }
}
