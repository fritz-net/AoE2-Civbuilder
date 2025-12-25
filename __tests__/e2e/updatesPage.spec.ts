import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Updates/Changelog page
 */

// Minimum expected changelog length to verify content loaded
const MIN_CHANGELOG_LENGTH = 1000;

test.describe('Updates Page - Changelog Display', () => {
  test('should load updates page successfully', async ({ page }) => {
    await page.goto('/v2/updates');
    
    // Check page title
    await expect(page).toHaveTitle(/AoE2 Civbuilder/);
    
    // Check heading
    await expect(page.getByRole('heading', { name: /Update Log/i })).toBeVisible();
  });

  test('should display changelog content', async ({ page }) => {
    await page.goto('/v2/updates');
    
    // Wait for changelog to load
    await page.waitForSelector('.changelog-content', { timeout: 10000 });
    
    // Check that loading state disappears
    await expect(page.locator('.loading')).not.toBeVisible({ timeout: 10000 });
    
    // Check that error state is not shown
    await expect(page.locator('.error')).not.toBeVisible();
    
    // Check that changelog content is visible
    const changelogContent = page.locator('.changelog-content');
    await expect(changelogContent).toBeVisible();
    
    // Verify changelog has version entries
    const versionHeaders = page.locator('.version-header');
    const count = await versionHeaders.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display changelog with version dates', async ({ page }) => {
    await page.goto('/v2/updates');
    
    // Wait for changelog to load
    await page.waitForSelector('.changelog-content', { timeout: 10000 });
    
    // Check for version dates in the format YYYY-MM-DD
    const versionDates = page.locator('.version-date');
    const dateCount = await versionDates.count();
    expect(dateCount).toBeGreaterThan(0);
    
    // Verify date format (YYYY-MM-DD)
    const firstDate = await versionDates.first().textContent();
    expect(firstDate).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  test('should have back button that navigates to home', async ({ page }) => {
    await page.goto('/v2/updates');
    
    // Check back button exists
    const backButton = page.locator('.back-button');
    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveText(/Back to Home/i);
    
    // Click back button and verify navigation
    await backButton.click();
    
    // Should navigate to home page
    await expect(page).toHaveURL(/\/v2\/?$/);
  });

  test('should not show error when loading changelog', async ({ page }) => {
    // Start with a listener for console errors related to changelog
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('changelog')) {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/v2/updates');
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Check no 404 errors for changelog
    await expect(page.locator('.error')).not.toBeVisible();
    
    // Verify changelog loaded successfully
    const changelogContent = page.locator('.changelog-content');
    await expect(changelogContent).toBeVisible({ timeout: 10000 });
  });

  test('should display changelog with full content including bullets', async ({ page }) => {
    await page.goto('/v2/updates');
    
    // Wait for changelog to load
    await page.waitForSelector('.changelog-content', { timeout: 10000 });
    
    // Get the changelog text content
    const changelogText = await page.locator('.changelog-content').textContent();
    
    // Verify it's not empty or just loading
    expect(changelogText).toBeTruthy();
    expect(changelogText!.length).toBeGreaterThan(MIN_CHANGELOG_LENGTH);
    
    // Verify it contains version numbers
    expect(changelogText).toMatch(/v\d+\.\d+\.\d+/);
    
    // Verify it contains dates
    expect(changelogText).toMatch(/\d{4}-\d{2}-\d{2}/);
    
    // Verify it contains bullet points (actual content)
    expect(changelogText).toContain('•');
  });

  test('should fetch changelog from /v2/CHANGELOG.md path', async ({ page }) => {
    const requestUrls: string[] = [];
    
    // Listen for network requests
    page.on('request', request => {
      if (request.url().includes('CHANGELOG.md')) {
        requestUrls.push(request.url());
      }
    });
    
    await page.goto('/v2/updates');
    
    // Wait for changelog to load
    await page.waitForSelector('.changelog-content', { timeout: 10000 });
    
    // Should have fetched the changelog
    expect(requestUrls.length).toBeGreaterThan(0);
    
    // The URL should contain /v2/CHANGELOG.md
    expect(requestUrls[0]).toContain('/v2/CHANGELOG.md');
  });
});
