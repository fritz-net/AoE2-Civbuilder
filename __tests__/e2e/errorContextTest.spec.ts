import { test, expect } from '@playwright/test';

/**
 * Test to verify error context capture functionality
 * This test is intentionally designed to fail to test error reporting
 */

test.describe('Error Context Test (Intentional Failure)', () => {
  test.skip('should capture error context on failure', async ({ page }) => {
    // Navigate to a page
    await page.goto('/v2/demo');
    
    // Log some console messages
    await page.evaluate(() => {
      console.log('Test log message 1');
      console.warn('Test warning message');
      console.error('Test error message');
    });
    
    // Make some network requests
    await page.goto('/v2/demo/custom-uu');
    
    // Intentionally fail the test
    await expect(page.locator('.this-element-does-not-exist')).toBeVisible({ timeout: 2000 });
  });
});
