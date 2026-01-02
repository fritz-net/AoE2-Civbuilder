import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Combine page
 * Encapsulates interactions with the civilization combining page
 */
export class CombinePage extends BasePage {
  // Selectors
  private readonly selectors = {
    heading: 'h1, h2',
    addCivilizationsHeading: 'heading:has-text("Add Civilizations")',
    useVanillaBtn: 'button:has-text("Use Vanilla Civs")',
    switchToCustomBtn: 'button:has-text("Switch to Custom Mode")',
    chooseJsonBtn: 'text=/Choose JSON Files/i',
    downloadLink: 'a:has-text("download vanilla civs")',
    dragDropHint: 'text=/drag and drop JSON files here/i',
    emptyStateMessage: 'text=/No civilizations loaded yet/i',
    loadedCivsText: 'text=/Loaded Civilizations/i',
    warningText: 'text=/Warning:/i',
    civCard: '.civ-card',
    civName: '.civ-name',
    removeButton: '.remove-btn, button:has-text("Remove")',
    clearAllButton: 'button:has-text("Clear All")',
    createModButton: 'button:has-text("Create Mod")',
    fileInput: 'input[type="file"]',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to the combine page
   */
  async navigate(): Promise<void> {
    await this.goto('/v2/combine');
  }

  /**
   * Click "Use Vanilla Civs" button
   */
  async clickUseVanillaCivs(): Promise<void> {
    await this.clickElement(this.selectors.useVanillaBtn);
    await this.wait(3000); // Wait for civs to load
  }

  /**
   * Click "Switch to Custom Mode" button
   */
  async clickSwitchToCustomMode(): Promise<void> {
    await this.clickElement(this.selectors.switchToCustomBtn);
    await this.wait(500);
  }

  /**
   * Get all civilization cards
   */
  getCivCards() {
    return this.page.locator(this.selectors.civCard);
  }

  /**
   * Get count of loaded civs
   */
  async getCivCount(): Promise<number> {
    return await this.getCivCards().count();
  }

  /**
   * Get civilization name by index
   */
  async getCivName(index: number): Promise<string | null> {
    const card = this.getCivCards().nth(index);
    return await card.locator(this.selectors.civName).textContent();
  }

  /**
   * Remove a civilization by index
   */
  async removeCiv(index: number): Promise<void> {
    const card = this.getCivCards().nth(index);
    await card.locator(this.selectors.removeButton).click();
    await this.wait(500);
  }

  /**
   * Click "Clear All" button
   */
  async clickClearAll(): Promise<void> {
    await this.clickElement(this.selectors.clearAllButton);
    await this.wait(500);
  }

  /**
   * Upload JSON files
   */
  async uploadFiles(filePaths: string[]): Promise<void> {
    const fileInput = this.page.locator(this.selectors.fileInput);
    await fileInput.setInputFiles(filePaths);
    await this.wait(1000);
  }

  /**
   * Click "Create Mod" button
   */
  async clickCreateMod(): Promise<void> {
    await this.clickElement(this.selectors.createModButton);
  }

  /**
   * Assert page loaded correctly
   */
  async assertPageLoaded(): Promise<void> {
    await this.assertTitle(/AoE2 Civbuilder/);
    await expect(this.page.getByRole('heading', { name: /Combine Civilizations/i })).toBeVisible();
  }

  /**
   * Assert in Custom Mode
   */
  async assertCustomMode(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /Add Civilizations/i })).toBeVisible();
    await expect(this.page.getByRole('button', { name: /Use Vanilla Civs/i })).toBeVisible();
  }

  /**
   * Assert in Vanilla Mode
   */
  async assertVanillaMode(): Promise<void> {
    await expect(this.page.getByRole('button', { name: /Switch to Custom Mode/i })).toBeVisible();
    await expect(this.page.getByRole('heading', { name: /Add Civilizations/i })).not.toBeVisible();
  }

  /**
   * Assert civilization count
   */
  async assertCivCount(count: number): Promise<void> {
    // Need to escape parentheses in regex
    await expect(this.page.getByText(new RegExp(`Loaded Civilizations \\(${count}\\)`, 'i'))).toBeVisible();
  }

  /**
   * Assert warning visible for 50 civ limit
   */
  async assertLimitWarning(): Promise<void> {
    await expect(this.page.getByText(/Warning:/i)).toBeVisible();
    await expect(this.page.getByText(/50\/50 civilizations loaded/i)).toBeVisible();
  }
}
