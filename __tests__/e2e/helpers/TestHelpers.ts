import { Page, expect } from '@playwright/test';

/**
 * Helper utilities for common test operations
 * Following DRY principle to reduce code duplication
 */

/**
 * Modal interaction helper
 * Encapsulates common modal operations
 */
export class ModalHelper {
  constructor(private page: Page) {}

  /**
   * Wait for modal to appear
   */
  async waitForModal(selector: string = '.modal-overlay', timeout: number = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Close modal by clicking close button
   */
  async closeModal(closeButtonSelector: string = 'button:has-text("Close")'): Promise<void> {
    await this.page.click(closeButtonSelector);
  }

  /**
   * Close modal by clicking overlay
   */
  async closeByOverlay(overlaySelector: string = '.modal-overlay'): Promise<void> {
    await this.page.click(overlaySelector, { position: { x: 10, y: 10 } });
  }

  /**
   * Check if modal is visible
   */
  async isModalVisible(selector: string = '.modal-overlay'): Promise<boolean> {
    return await this.page.locator(selector).isVisible().catch(() => false);
  }

  /**
   * Assert modal is visible
   */
  async assertModalVisible(selector: string = '.modal-overlay'): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  /**
   * Assert modal is not visible
   */
  async assertModalNotVisible(selector: string = '.modal-overlay'): Promise<void> {
    await expect(this.page.locator(selector)).not.toBeVisible();
  }
}

/**
 * Form interaction helper
 * Simplifies common form operations
 */
export class FormHelper {
  constructor(private page: Page) {}

  /**
   * Fill a form field and verify the value
   */
  async fillAndVerify(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).fill(value);
    await expect(this.page.locator(selector)).toHaveValue(value);
  }

  /**
   * Fill multiple form fields
   */
  async fillFields(fields: Array<{ selector: string; value: string }>): Promise<void> {
    for (const field of fields) {
      await this.page.locator(field.selector).fill(field.value);
    }
  }

  /**
   * Check a checkbox
   */
  async checkCheckbox(selector: string): Promise<void> {
    await this.page.locator(selector).check();
    await expect(this.page.locator(selector)).toBeChecked();
  }

  /**
   * Uncheck a checkbox
   */
  async uncheckCheckbox(selector: string): Promise<void> {
    await this.page.locator(selector).uncheck();
    await expect(this.page.locator(selector)).not.toBeChecked();
  }

  /**
   * Select option from dropdown
   */
  async selectOption(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).selectOption(value);
  }

  /**
   * Submit form by clicking button
   */
  async submitForm(buttonSelector: string): Promise<void> {
    await this.page.click(buttonSelector);
  }

  /**
   * Assert field has value
   */
  async assertFieldValue(selector: string, value: string): Promise<void> {
    await expect(this.page.locator(selector)).toHaveValue(value);
  }

  /**
   * Assert field has attribute
   */
  async assertAttribute(selector: string, attribute: string, value: string): Promise<void> {
    await expect(this.page.locator(selector)).toHaveAttribute(attribute, value);
  }
}

/**
 * Navigation helper
 * Simplifies common navigation operations
 */
export class NavigationHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to URL and wait for load
   */
  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Click link and wait for navigation
   */
  async clickLinkAndNavigate(linkText: RegExp, expectedUrl: RegExp): Promise<void> {
    await this.page.getByRole('link', { name: linkText }).click();
    await expect(this.page).toHaveURL(expectedUrl);
  }

  /**
   * Click button and wait for navigation
   */
  async clickButtonAndNavigate(buttonText: RegExp, expectedUrl: RegExp): Promise<void> {
    await this.page.getByRole('button', { name: buttonText }).click();
    await expect(this.page).toHaveURL(expectedUrl);
  }

  /**
   * Go back and verify URL
   */
  async goBackAndVerify(expectedUrl: RegExp): Promise<void> {
    await this.page.goBack();
    await expect(this.page).toHaveURL(expectedUrl);
  }

  /**
   * Assert current URL matches pattern
   */
  async assertUrl(pattern: RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }
}

/**
 * Assertion helper
 * Provides common assertion patterns
 */
export class AssertionHelper {
  constructor(private page: Page) {}

  /**
   * Assert element is visible with custom timeout
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
   * Assert element has text
   */
  async assertText(selector: string, text: RegExp | string): Promise<void> {
    await expect(this.page.locator(selector)).toHaveText(text);
  }

  /**
   * Assert element contains text
   */
  async assertContainsText(selector: string, text: string): Promise<void> {
    await expect(this.page.locator(selector)).toContainText(text);
  }

  /**
   * Assert count of elements
   */
  async assertCount(selector: string, count: number): Promise<void> {
    await expect(this.page.locator(selector)).toHaveCount(count);
  }

  /**
   * Assert page title
   */
  async assertTitle(title: RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  /**
   * Assert element is enabled
   */
  async assertEnabled(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeEnabled();
  }

  /**
   * Assert element is disabled
   */
  async assertDisabled(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeDisabled();
  }

  /**
   * Assert multiple elements are visible
   */
  async assertAllVisible(selectors: string[]): Promise<void> {
    for (const selector of selectors) {
      await this.assertVisible(selector);
    }
  }
}

/**
 * Wait helper
 * Provides consistent waiting patterns
 */
export class WaitHelper {
  constructor(private page: Page) {}

  /**
   * Wait for element to be visible
   */
  async waitForVisible(selector: string, timeout: number = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Wait for element to be hidden
   */
  async waitForHidden(selector: string, timeout: number = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'hidden', timeout });
  }

  /**
   * Wait for specific duration
   */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Wait for URL to match pattern
   */
  async waitForUrl(pattern: RegExp, timeout: number = 10000): Promise<void> {
    await this.page.waitForURL(pattern, { timeout });
  }

  /**
   * Wait for network idle
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for element and then additional time
   */
  async waitForElementAndSettle(selector: string, elementTimeout: number = 10000, settleMs: number = 500): Promise<void> {
    await this.waitForVisible(selector, elementTimeout);
    await this.wait(settleMs);
  }
}
