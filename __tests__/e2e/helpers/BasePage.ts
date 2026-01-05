import { Page, expect } from '@playwright/test';

/**
 * Base Page Object Model class
 * Provides common functionality for all page objects following the POM design pattern
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a URL with error handling
   */
  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  /**
   * Wait for an element to be visible with consistent timeout
   */
  async waitForElement(selector: string, timeout: number = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Wait for a specific duration
   */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Check if an element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible().catch(() => false);
  }

  /**
   * Get text content of an element
   */
  async getText(selector: string): Promise<string | null> {
    return await this.page.locator(selector).textContent();
  }

  /**
   * Click an element with optional force
   */
  async clickElement(selector: string, force: boolean = false): Promise<void> {
    await this.page.locator(selector).click({ force });
  }

  /**
   * Fill an input field
   */
  async fillInput(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).fill(value);
  }

  /**
   * Get the current URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for URL to match a pattern
   */
  async waitForUrl(pattern: RegExp, timeout: number = 10000): Promise<void> {
    await this.page.waitForURL(pattern, { timeout });
  }

  /**
   * Assert element is visible
   */
  async assertVisible(selector: string, timeout: number = 5000): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible({ timeout });
  }

  /**
   * Assert element is not visible
   */
  async assertNotVisible(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).not.toBeVisible();
  }

  /**
   * Assert page title contains text
   */
  async assertTitle(text: RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(text);
  }
}
