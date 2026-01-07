import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Draft Player interactions
 * Handles joining draft, setup phase, and card selection
 */
export class DraftPlayerPage extends BasePage {
  // Selectors
  private readonly selectors = {
    playerNameInput: '#playerName, input[placeholder*="name" i]',
    joinButton: 'button:has-text("Join")',
    startDraftButton: 'button:has-text("Start Draft")',
    civNameInput: '#civName, input[placeholder*="civilization name" i]',
    nextButton: 'button:has-text("Next")',
    draftCard: '.draft-card, .bonus-card',
    techTreeContainer: '.techtree-container',
    doneButton: 'button:has-text("Done")',
    confirmDoneButton: 'button:has-text("Yes, Done")',
    downloadPhase: '.download-phase',
    downloadButton: 'button:has-text("Download Mod")',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to draft link (player or host)
   */
  async navigate(link: string): Promise<void> {
    await this.goto(link);
  }

  /**
   * Join draft as player
   */
  async joinDraft(playerName: string): Promise<void> {
    const nameInput = this.page.locator(this.selectors.playerNameInput).first();
    await expect(nameInput).toBeVisible();
    await nameInput.fill(playerName);

    const joinButton = this.page.getByRole('button', { name: /Join/i });
    await expect(joinButton).toBeVisible();
    await joinButton.click();
  }

  /**
   * Wait for Start Draft button and click it
   */
  async startDraft(): Promise<void> {
    const startButton = this.page.getByRole('button', { name: /Start Draft/i });
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();
    await startButton.click();
  }

  /**
   * Complete setup phase (civ name, flag, etc.)
   */
  async completeSetupPhase(civName: string = 'Test Civilization'): Promise<void> {
    const civNameInput = this.page.locator(this.selectors.civNameInput).first();
    await expect(civNameInput).toBeVisible();
    await civNameInput.fill(civName);

    const nextButton = this.page.getByRole('button', { name: /Next/i });
    await expect(nextButton).toBeVisible();
    await nextButton.click();
  }

  /**
   * Select first available card
   */
  async selectFirstCard(): Promise<void> {
    const firstCard = this.page.locator(this.selectors.draftCard).first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();
  }

  /**
   * Select multiple cards in sequence
   * @returns Number of cards successfully selected
   */
  async selectCards(count: number): Promise<number> {
    let selected = 0;
    for (let i = 0; i < count; i++) {
      try {
        await this.selectFirstCard();
        selected++;
      } catch {
        // No more cards available or moved to next phase
        break;
      }
    }
    return selected;
  }

  /**
   * Complete tech tree phase
   */
  async completeTechTree(): Promise<void> {
    const techTreeContainer = this.page.locator(this.selectors.techTreeContainer);
    await expect(techTreeContainer).toBeVisible();

    const doneButton = this.page.getByRole('button', { name: /Done/i });
    await expect(doneButton).toBeVisible();
    await expect(doneButton).toBeEnabled();
    await doneButton.click();

    // Handle optional confirmation modal
    // Modal appears when finishing tech tree with unspent points or in certain draft configurations
    const confirmButton = this.page.getByRole('button', { name: /Yes, Done/i });
    try {
      await expect(confirmButton).toBeVisible({ timeout: 2000 });
      await confirmButton.click();
    } catch {
      // No confirmation modal appeared - this is fine
    }
  }

  /**
   * Wait for download phase (mod generation can take up to 10 seconds)
   */
  async waitForDownloadPhase(): Promise<void> {
    const downloadPhase = this.page.locator(this.selectors.downloadPhase);
    // Mod generation is the exception that can take up to 10 seconds
    await expect(downloadPhase).toBeVisible({ timeout: 30000 });
  }

  /**
   * Check if download button is visible
   */
  async assertDownloadButtonVisible(): Promise<void> {
    const downloadButton = this.page.getByRole('button', { name: /Download Mod/i });
    await expect(downloadButton).toBeVisible();
  }

  /**
   * Assert element contains text
   */
  async assertTextVisible(text: string | RegExp): Promise<void> {
    if (text instanceof RegExp) {
      // For RegExp, use getByText which handles regex properly
      await expect(this.page.getByText(text).first()).toBeVisible();
    } else {
      // For string, use getByText with partial matching
      await expect(this.page.getByText(text, { exact: false }).first()).toBeVisible();
    }
  }

  /**
   * Check if currently in tech tree phase
   */
  async isInTechTreePhase(): Promise<boolean> {
    const techTreeContainer = this.page.locator(this.selectors.techTreeContainer);
    return await techTreeContainer.isVisible();
  }

  /**
   * Assert currently in tech tree phase
   */
  async assertInTechTreePhase(): Promise<void> {
    const techTreeContainer = this.page.locator(this.selectors.techTreeContainer);
    await expect(techTreeContainer).toBeVisible();
  }

  /**
   * Check if currently in download phase
   */
  async isInDownloadPhase(): Promise<boolean> {
    const downloadPhase = this.page.locator(this.selectors.downloadPhase);
    return await downloadPhase.isVisible();
  }

  /**
   * Assert currently in download phase
   */
  async assertInDownloadPhase(): Promise<void> {
    const downloadPhase = this.page.locator(this.selectors.downloadPhase);
    await expect(downloadPhase).toBeVisible();
  }
}
