import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Draft Host page
 * Encapsulates all interactions with the draft host interface
 */
export class DraftHostPage extends BasePage {
  // Selectors
  private readonly selectors = {
    playerNameInput: '#playerName',
    joinButton: '.join-button',
    lobbyTitle: '.lobby-title, h1:has-text("Civilization Drafter")',
    startDraftButton: 'button:has-text("Start Draft")',
    notReadyButton: 'button:has-text("Lobby Not Ready")',
    setupPhase: '.setup-phase',
    civNameInput: '#civName',
    nextButton: 'button:has-text("Next")',
    draftBoard: '.draft-board',
    draftCard: '.draft-card:not(.card-hidden)',
    techTreePhase: '.techtree-phase',
    doneButton: 'button:has-text("Done")',
    confirmDoneButton: 'button:has-text("Yes, Done")',
    creatingPhase: '.creating-phase',
    downloadPhase: '.download-phase',
    downloadButton: '.download-button',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to host page with draft link
   */
  async navigate(hostLink: string): Promise<void> {
    await this.goto(hostLink);
  }

  /**
   * Join as host with player name
   */
  async joinAsHost(playerName: string): Promise<void> {
    await this.waitForElement(this.selectors.playerNameInput, 10000);
    await this.fillInput(this.selectors.playerNameInput, playerName);
    await this.clickElement(this.selectors.joinButton);
    await this.wait(3000);
  }

  /**
   * Wait for lobby to load
   */
  async waitForLobby(): Promise<void> {
    await expect(this.page.locator(this.selectors.lobbyTitle)).toBeVisible({ timeout: 10000 });
  }

  /**
   * Start the draft from lobby
   */
  async startDraft(): Promise<void> {
    await this.waitForLobby();
    const startButton = this.page.getByRole('button', { name: /Start Draft/i });
    await expect(startButton).toBeVisible({ timeout: 5000 });
    await startButton.click();
    await this.wait(3000);
  }

  /**
   * Complete setup phase with civ name
   */
  async completeSetupPhase(civName: string): Promise<void> {
    const isSetupVisible = await this.isVisible(this.selectors.setupPhase);
    
    if (isSetupVisible) {
      const civNameInput = this.page.locator(this.selectors.civNameInput);
      if (await civNameInput.isVisible()) {
        await civNameInput.fill(civName);
      }
      
      const nextButton = this.page.getByRole('button', { name: /Next/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await this.wait(3000);
      }
    }
  }

  /**
   * Select a card in the drafting phase
   */
  async selectCard(): Promise<boolean> {
    const cards = this.page.locator(this.selectors.draftCard);
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      await cards.first().click();
      await this.wait(1500);
      return true;
    }
    return false;
  }

  /**
   * Complete all card drafting rounds
   */
  async completeCardDrafting(maxRounds: number = 20): Promise<number> {
    let rounds = 0;
    let noCardRounds = 0;
    
    while (rounds < maxRounds) {
      const isDraftBoardVisible = await this.isVisible(this.selectors.draftBoard);
      
      if (!isDraftBoardVisible) {
        break;
      }
      
      const cardSelected = await this.selectCard();
      
      if (cardSelected) {
        rounds++;
        noCardRounds = 0;
      } else {
        noCardRounds++;
        
        if (noCardRounds >= 3) {
          await this.wait(3000);
          const stillVisible = await this.isVisible(this.selectors.draftBoard);
          if (!stillVisible) {
            break;
          }
          break;
        }
        
        await this.wait(2000);
      }
    }
    
    return rounds;
  }

  /**
   * Complete tech tree phase
   */
  async completeTechTreePhase(): Promise<void> {
    const techTreePhaseLocator = this.page.locator(this.selectors.techTreePhase);
    
    try {
      await techTreePhaseLocator.waitFor({ state: 'visible', timeout: 15000 });
      await this.wait(2000);
      
      const doneButton = this.page.getByRole('button', { name: /Done/i });
      await doneButton.waitFor({ state: 'visible', timeout: 15000 });
      await doneButton.click();
      
      await this.wait(1000);
      
      const confirmButton = this.page.getByRole('button', { name: /Yes, Done/i });
      const isConfirmVisible = await confirmButton.isVisible().catch(() => false);
      
      if (isConfirmVisible) {
        await confirmButton.click();
      }
      
      await this.wait(3000);
    } catch (error) {
      // Phase might be skipped or already complete
    }
  }

  /**
   * Complete entire draft flow from lobby to download
   * Facade pattern to simplify complex multi-step operation
   */
  async completeFullDraftFlow(playerName: string, civName: string): Promise<number> {
    await this.joinAsHost(playerName);
    await this.startDraft();
    await this.completeSetupPhase(civName);
    const rounds = await this.completeCardDrafting();
    await this.completeTechTreePhase();
    await this.wait(2000);
    
    return rounds;
  }

  /**
   * Wait for download phase to be ready
   */
  async waitForDownloadPhase(): Promise<void> {
    await this.waitForElement(this.selectors.downloadButton, 15000);
  }

  /**
   * Check if in specific phase
   */
  async isInPhase(phase: 'lobby' | 'setup' | 'drafting' | 'techtree' | 'creating' | 'download'): Promise<boolean> {
    const phaseSelectors = {
      lobby: this.selectors.lobbyTitle,
      setup: this.selectors.setupPhase,
      drafting: this.selectors.draftBoard,
      techtree: this.selectors.techTreePhase,
      creating: this.selectors.creatingPhase,
      download: this.selectors.downloadPhase,
    };
    
    return await this.isVisible(phaseSelectors[phase]);
  }
}
