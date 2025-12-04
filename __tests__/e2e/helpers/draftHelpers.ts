import { Page, expect } from '@playwright/test';

/**
 * Draft Helper Functions for E2E Tests
 * Following Page Object Model pattern for better test organization and reusability
 */

/**
 * Creates a draft via the UI
 * @param page - Playwright page object
 * @param numPlayers - Number of players for the draft
 * @returns Object containing host, player, and spectator links, plus draft ID
 */
export async function createDraft(page: Page, numPlayers: number = 1) {
  await page.goto('/v2/draft/create');
  
  const numPlayersInput = page.locator('#numPlayers');
  await numPlayersInput.fill(numPlayers.toString());
  
  const startButton = page.getByRole('button', { name: /Start Draft/i });
  await startButton.click();
  
  // Wait for modal with links
  await page.waitForSelector('.modal-overlay', { timeout: 10000 });
  
  // Get all links
  const hostLink = await page.locator('#hostLink').inputValue();
  const playerLink = await page.locator('#playerLink').inputValue();
  const spectatorLink = await page.locator('#spectatorLink').inputValue();
  
  // Extract draft ID from host link
  const match = hostLink.match(/\/host\/(\d+)/);
  const draftId = match ? match[1] : null;
  
  return { hostLink, playerLink, spectatorLink, draftId };
}

/**
 * Joins a draft as a host
 * @param page - Playwright page object
 * @param hostLink - The host link URL
 * @param playerName - Name for the player
 */
export async function joinAsHost(page: Page, hostLink: string, playerName: string) {
  await page.goto(hostLink);
  await page.waitForSelector('#playerName', { timeout: 10000 });
  await page.fill('#playerName', playerName);
  await page.click('.join-button');
  await page.waitForTimeout(3000);
}

/**
 * Starts the draft from the lobby
 * @param page - Playwright page object
 */
export async function startDraft(page: Page) {
  const lobbyTitle = page.locator('.lobby-title, h1:has-text("Civilization Drafter")');
  await expect(lobbyTitle).toBeVisible({ timeout: 10000 });
  
  const startDraftButton = page.getByRole('button', { name: /Start Draft/i });
  await expect(startDraftButton).toBeVisible({ timeout: 5000 });
  await startDraftButton.click();
  await page.waitForTimeout(3000);
}

/**
 * Completes the setup phase if present
 * @param page - Playwright page object
 * @param civName - Name for the civilization
 */
export async function completeSetupPhase(page: Page, civName: string) {
  const setupPhase = page.locator('.setup-phase');
  const isSetupVisible = await setupPhase.isVisible().catch(() => false);
  
  if (isSetupVisible) {
    const civNameInput = page.locator('#civName');
    if (await civNameInput.isVisible()) {
      await civNameInput.fill(civName);
    }
    
    const nextButton = page.getByRole('button', { name: /Next/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(3000);
    }
  }
}

/**
 * Completes card drafting rounds by selecting cards
 * @param page - Playwright page object
 * @param maxRounds - Maximum number of rounds to attempt (safety limit)
 * @returns Number of rounds completed
 */
export async function completeCardDrafting(page: Page, maxRounds: number = 20): Promise<number> {
  let rounds = 0;
  
  while (rounds < maxRounds) {
    const draftBoard = page.locator('.draft-board');
    const isDraftBoardVisible = await draftBoard.isVisible().catch(() => false);
    
    if (isDraftBoardVisible) {
      const cards = page.locator('.draft-card:not(.card-disabled)');
      const cardCount = await cards.count();
      
      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForTimeout(1500);
        rounds++;
      } else {
        await page.waitForTimeout(1000);
        rounds++;
      }
    } else {
      break;
    }
  }
  
  return rounds;
}

/**
 * Completes the tech tree phase if present
 * @param page - Playwright page object
 */
export async function completeTechTreePhase(page: Page) {
  const techTreePhase = page.locator('.techtree-phase, #techTree');
  const isTechTreeVisible = await techTreePhase.isVisible().catch(() => false);
  
  if (isTechTreeVisible) {
    const doneButton = page.getByRole('button', { name: /Done/i });
    if (await doneButton.isVisible()) {
      await doneButton.click();
      await page.waitForTimeout(3000);
    }
  }
}

/**
 * Completes a full draft flow from creation to download phase
 * @param page - Playwright page object
 * @param numPlayers - Number of players for the draft
 * @param playerName - Name for the player
 * @param civName - Name for the civilization
 * @returns Draft ID
 */
export async function completeFullDraft(
  page: Page, 
  numPlayers: number = 1, 
  playerName: string = 'E2E Test Player',
  civName: string = 'E2E Test Civ'
): Promise<string> {
  const { hostLink, draftId } = await createDraft(page, numPlayers);
  
  if (!draftId) {
    throw new Error('Failed to extract draft ID from host link');
  }
  
  await joinAsHost(page, hostLink, playerName);
  await startDraft(page);
  await completeSetupPhase(page, civName);
  await completeCardDrafting(page);
  await completeTechTreePhase(page);
  
  // Wait briefly to allow server to start processing
  await page.waitForTimeout(2000);
  
  return draftId;
}
