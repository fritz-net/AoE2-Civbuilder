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
   */
  async selectCards(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.selectFirstCard();
    }
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

    // Handle confirmation modal if it appears
    const confirmButton = this.page.getByRole('button', { name: /Yes, Done/i });
    const isConfirmVisible = await confirmButton.isVisible();
    if (isConfirmVisible) {
      await confirmButton.click();
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
    const locator = text instanceof RegExp
      ? this.page.locator(`text=${text.source}`)
      : this.page.getByText(text, { exact: false });
    await expect(locator.first()).toBeVisible();
  }
}
