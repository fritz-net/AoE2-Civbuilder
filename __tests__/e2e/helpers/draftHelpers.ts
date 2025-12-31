import { Page, expect } from '@playwright/test';
import { DraftCreatePage } from './DraftCreatePage';
import { DraftHostPage } from './DraftHostPage';

/**
 * Draft Helper Functions for E2E Tests
 * Refactored to use Page Object Model pattern for better test organization and reusability
 * 
 * These functions provide a backward-compatible API while using the new page objects internally.
 * New tests should prefer using the page object classes directly.
 */

/**
 * Expands the Advanced Settings section on the draft creation page
 * @param page - Playwright page object
 * @deprecated Use DraftCreatePage.expandAdvancedSettings() instead
 */
export async function expandAdvancedSettings(page: Page) {
  const draftCreatePage = new DraftCreatePage(page);
  await draftCreatePage.expandAdvancedSettings();
}

/**
 * Expands the Testing Settings section on the draft creation page
 * @param page - Playwright page object
 * @deprecated Use DraftCreatePage.expandTestingSettings() instead
 */
export async function expandTestingSettings(page: Page) {
  const draftCreatePage = new DraftCreatePage(page);
  await draftCreatePage.expandTestingSettings();
}

/**
 * Creates a draft via the UI
 * @param page - Playwright page object
 * @param numPlayers - Number of players for the draft
 * @returns Object containing host, player, and spectator links, plus draft ID
 * @deprecated Use DraftCreatePage.createDraft() instead
 */
export async function createDraft(page: Page, numPlayers: number = 1) {
  const draftCreatePage = new DraftCreatePage(page);
  await draftCreatePage.navigate();
  return await draftCreatePage.createDraft({ numPlayers });
}

/**
 * Joins a draft as a host
 * @param page - Playwright page object
 * @param hostLink - The host link URL
 * @param playerName - Name for the player
 * @deprecated Use DraftHostPage.joinAsHost() instead
 */
export async function joinAsHost(page: Page, hostLink: string, playerName: string) {
  const draftHostPage = new DraftHostPage(page);
  await draftHostPage.navigate(hostLink);
  await draftHostPage.joinAsHost(playerName);
}

/**
 * Starts the draft from the lobby
 * @param page - Playwright page object
 * @deprecated Use DraftHostPage.startDraft() instead
 */
export async function startDraft(page: Page) {
  const draftHostPage = new DraftHostPage(page);
  await draftHostPage.startDraft();
}

/**
 * Completes the setup phase if present
 * @param page - Playwright page object
 * @param civName - Name for the civilization
 * @deprecated Use DraftHostPage.completeSetupPhase() instead
 */
export async function completeSetupPhase(page: Page, civName: string) {
  const draftHostPage = new DraftHostPage(page);
  await draftHostPage.completeSetupPhase(civName);
}

/**
 * Completes card drafting rounds by selecting cards
 * @param page - Playwright page object
 * @param maxRounds - Maximum number of rounds to attempt (safety limit)
 * @returns Number of rounds completed
 * @deprecated Use DraftHostPage.completeCardDrafting() instead
 */
export async function completeCardDrafting(page: Page, maxRounds: number = 20): Promise<number> {
  const draftHostPage = new DraftHostPage(page);
  return await draftHostPage.completeCardDrafting(maxRounds);
}

/**
 * Completes the tech tree phase if present
 * @param page - Playwright page object
 * @deprecated Use DraftHostPage.completeTechTreePhase() instead
 */
export async function completeTechTreePhase(page: Page) {
  const draftHostPage = new DraftHostPage(page);
  await draftHostPage.completeTechTreePhase();
}

/**
 * Completes a full draft flow from creation to download phase
 * Facade pattern to simplify complex multi-step operation
 * @param page - Playwright page object
 * @param numPlayers - Number of players for the draft
 * @param playerName - Name for the player
 * @param civName - Name for the civilization
 * @returns Draft ID
 * @deprecated Use DraftHostPage.completeFullDraftFlow() with DraftCreatePage instead
 */
export async function completeFullDraft(
  page: Page, 
  numPlayers: number = 1, 
  playerName: string = 'E2E Test Player',
  civName: string = 'E2E Test Civ'
): Promise<string> {
  // Use new page objects internally
  const draftCreatePage = new DraftCreatePage(page);
  await draftCreatePage.navigate();
  const { hostLink, draftId } = await draftCreatePage.createDraft({ numPlayers });
  
  if (!draftId) {
    throw new Error('Failed to extract draft ID from host link');
  }
  
  const draftHostPage = new DraftHostPage(page);
  await draftHostPage.navigate(hostLink);
  await draftHostPage.completeFullDraftFlow(playerName, civName);
  
  return draftId;
}
