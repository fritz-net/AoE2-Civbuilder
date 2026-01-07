import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Custom Unique Unit Editor
 * Encapsulates interactions with the custom UU designer interface
 */
export class CustomUUEditorPage extends BasePage {
  // Selectors
  private readonly selectors = {
    infantryButton: 'button:has-text("Infantry")',
    archerButton: 'button:has-text("Archer")',
    cavalryButton: 'button:has-text("Cavalry")',
    siegeButton: 'button:has-text("Siege")',
    navalButton: 'button:has-text("Naval")',
    unitNameInput: 'input[id*="unitName"], input[placeholder*="name" i]',
    submitButton: 'button:has-text("Submit")',
    editorTitle: 'text=/Design Your Custom Unique Unit|Custom Unique Unit|Custom UU/i',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Wait for Custom UU Editor to be visible
   */
  async waitForEditor(): Promise<void> {
    const title = this.page.locator(this.selectors.editorTitle).first();
    await expect(title).toBeVisible();
  }

  /**
   * Select unit type
   */
  async selectUnitType(type: 'Infantry' | 'Archer' | 'Cavalry' | 'Siege' | 'Naval'): Promise<void> {
    const button = this.page.getByRole('button', { name: new RegExp(type, 'i') });
    await expect(button).toBeVisible();
    await button.click();
  }

  /**
   * Fill unit name
   */
  async fillUnitName(name: string): Promise<void> {
    const input = this.page.getByLabel(/Unit Name/i);
    await expect(input).toBeVisible();
    await input.fill(name);
  }

  /**
   * Submit custom unit
   */
  async submitUnit(): Promise<void> {
    const submitButton = this.page.getByRole('button', { name: /Submit Custom Unit|Submit/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
  }

  /**
   * Create a complete custom unit (convenience method)
   */
  async createCustomUnit(unitType: 'Infantry' | 'Archer' | 'Cavalry' | 'Siege' | 'Naval', unitName: string): Promise<void> {
    await this.waitForEditor();
    await this.selectUnitType(unitType);
    await this.fillUnitName(unitName);
    await this.submitUnit();
  }

  /**
   * Assert submit button is enabled
   */
  async assertSubmitEnabled(): Promise<void> {
    const submitButton = this.page.getByRole('button', { name: /Submit Custom Unit|Submit/i });
    await expect(submitButton).toBeEnabled();
  }

  /**
   * Assert submit button is disabled
   */
  async assertSubmitDisabled(): Promise<void> {
    const submitButton = this.page.getByRole('button', { name: /Submit Custom Unit|Submit/i });
    await expect(submitButton).toBeDisabled();
  }
}
