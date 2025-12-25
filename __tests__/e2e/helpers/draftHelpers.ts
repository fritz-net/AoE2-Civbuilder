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
  let noCardRounds = 0; // Track consecutive rounds with no cards
  console.log('[completeCardDrafting] Starting card drafting...');
  
  while (rounds < maxRounds) {
    const draftBoard = page.locator('.draft-board');
    const isDraftBoardVisible = await draftBoard.isVisible().catch(() => false);
    
    if (!isDraftBoardVisible) {
      console.log(`[completeCardDrafting] Draft board no longer visible after ${rounds} rounds`);
      break;
    }
    
    // Use the correct selector: .draft-card that is not hidden
    const cards = page.locator('.draft-card:not(.card-hidden)');
    const cardCount = await cards.count();
    
    console.log(`[completeCardDrafting] Found ${cardCount} clickable cards`);
    
    if (cardCount > 0) {
      await cards.first().click();
      await page.waitForTimeout(1500);
      rounds++;
      noCardRounds = 0; // Reset counter when we find cards
      console.log(`[completeCardDrafting] Completed round ${rounds}`);
    } else {
      noCardRounds++;
      console.log(`[completeCardDrafting] No clickable cards available (attempt ${noCardRounds})`);
      
      // If we've had no cards for multiple checks, the drafting might be complete
      // Wait a bit longer for phase transition
      if (noCardRounds >= 3) {
        console.log('[completeCardDrafting] No cards for 3+ attempts, waiting for phase transition...');
        await page.waitForTimeout(3000);
        
        // Check again if draft board is still visible
        const stillVisible = await draftBoard.isVisible().catch(() => false);
        if (!stillVisible) {
          console.log('[completeCardDrafting] Draft board disappeared, drafting complete');
          break;
        }
        
        // If still visible after 3 attempts, something is wrong - break to avoid infinite loop
        console.log('[completeCardDrafting] Draft board still visible after no cards - breaking');
        break;
      }
      
      await page.waitForTimeout(2000);
    }
  }
  
  console.log(`[completeCardDrafting] Draft flow test completed ${rounds} rounds`);
  return rounds;
}

/**
 * Completes the tech tree phase if present
 * @param page - Playwright page object
 */
export async function completeTechTreePhase(page: Page) {
  console.log('[completeTechTreePhase] Starting tech tree phase completion...');
  
  // First check what phase we're actually in
  const currentURL = page.url();
  console.log(`[completeTechTreePhase] Current URL: ${currentURL}`);
  
  // Check for different phase indicators
  const draftBoard = await page.locator('.draft-board').isVisible().catch(() => false);
  const techTreePhase = await page.locator('.techtree-phase').isVisible().catch(() => false);
  const creatingPhase = await page.locator('.creating-phase').isVisible().catch(() => false);
  const downloadPhase = await page.locator('.download-phase').isVisible().catch(() => false);
  
  console.log(`[completeTechTreePhase] Phase visibility: draft-board=${draftBoard}, techtree=${techTreePhase}, creating=${creatingPhase}, download=${downloadPhase}`);
  
  // If we're already in creating or download phase, we're done
  if (creatingPhase) {
    console.log('[completeTechTreePhase] Already in creating phase (Phase 5)');
    return;
  }
  if (downloadPhase) {
    console.log('[completeTechTreePhase] Already in download phase (Phase 6)');
    return;
  }
  
  // Wait for tech tree phase to be visible (Phase 3 in drafts)
  const techTreePhaseLocator = page.locator('.techtree-phase');
  
  try {
    console.log('[completeTechTreePhase] Waiting for tech tree phase to be visible...');
    await techTreePhaseLocator.waitFor({ state: 'visible', timeout: 15000 });
    console.log('[completeTechTreePhase] Tech tree phase is visible');
    
    // Wait a moment for any animations or state updates
    await page.waitForTimeout(2000);
    
    // Wait for the Done button to be visible and clickable
    const doneButton = page.getByRole('button', { name: /Done/i });
    console.log('[completeTechTreePhase] Waiting for Done button to be visible...');
    await doneButton.waitFor({ state: 'visible', timeout: 15000 });
    console.log('[completeTechTreePhase] Done button is visible, clicking...');
    
    await doneButton.click();
    console.log('[completeTechTreePhase] Done button clicked');
    
    // Wait for the click to be processed and socket event to be sent
    await page.waitForTimeout(3000);
    console.log('[completeTechTreePhase] Completed tech tree phase');
  } catch (error) {
    console.log('[completeTechTreePhase] Error:', error.message);
    console.log('[completeTechTreePhase] Tech tree phase or Done button not found - may already be complete or phase skipped');
    // Don't throw - phase might be skipped or already complete
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
