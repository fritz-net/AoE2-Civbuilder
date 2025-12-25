import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Legacy UI Changelog display
 */

// Minimum expected changelog length to verify content loaded
const MIN_CHANGELOG_LENGTH = 1000;

test.describe('Legacy UI - Changelog Display', () => {
  test('should load legacy home page successfully', async ({ page }) => {
    await page.goto('/civbuilder');
    
    // Check that the updates button exists
    await expect(page.locator('#updates')).toBeVisible();
  });

  test('should display changelog when clicking updates button', async ({ page }) => {
    await page.goto('/civbuilder');
    
    // Click the updates button
    await page.click('#updates');
    
    // Wait for changelog to load
    await page.waitForSelector('#instructionstext', { timeout: 10000 });
    
    // Check that the instructions box is visible
    await expect(page.locator('#instructionsbox')).toBeVisible();
    
    // Check that the title is correct
    const title = await page.locator('#instructionstitle').textContent();
    expect(title).toContain('Update Log');
  });

  test('should display changelog content with version numbers and bullets', async ({ page }) => {
    await page.goto('/civbuilder');
    
    // Click the updates button
    await page.click('#updates');
    
    // Wait for changelog content to be loaded (not just "Loading...")
    await page.waitForFunction((minLength) => {
      const text = document.querySelector('#instructionstext')?.textContent || '';
      return text.length > minLength && text.includes('•') && !text.includes('Loading changelog...');
    }, MIN_CHANGELOG_LENGTH, { timeout: 10000 });
    
    // Get the changelog text
    const changelogText = await page.locator('#instructionstext').textContent();
    
    // Verify it's not just "Loading changelog..."
    expect(changelogText).not.toContain('Loading changelog...');
    expect(changelogText).not.toContain('Failed to load changelog');
    
    // Verify it contains version numbers
    expect(changelogText).toMatch(/v\d+\.\d+\.\d+/);
    
    // Verify it contains dates in YYYY-MM-DD format
    expect(changelogText).toMatch(/\d{4}-\d{2}-\d{2}/);
    
    // Verify it contains bullet points (actual content, not just headers)
    expect(changelogText).toContain('•');
    
    // Verify content length (should be substantial if properly loaded)
    expect(changelogText.length).toBeGreaterThan(MIN_CHANGELOG_LENGTH);
  });

  test('should parse markdown links in changelog', async ({ page }) => {
    await page.goto('/civbuilder');
    
    // Click the updates button
    await page.click('#updates');
    
    // Wait for changelog content with links to be loaded
    await page.waitForFunction(() => {
      const html = document.querySelector('#instructionstext')?.innerHTML || '';
      return html.includes('github.com');
    }, { timeout: 10000 });
    
    // Get the inner HTML to check for links
    const changelogHtml = await page.locator('#instructionstext').innerHTML();
    
    // Should contain links to GitHub
    expect(changelogHtml).toContain('github.com');
  });

  test('should fetch changelog from correct route path', async ({ page }) => {
    const requestUrls: string[] = [];
    
    // Listen for network requests
    page.on('request', request => {
      if (request.url().includes('CHANGELOG.md')) {
        requestUrls.push(request.url());
      }
    });
    
    await page.goto('/civbuilder');
    await page.click('#updates');
    
    // Wait for the changelog fetch to complete
    await page.waitForFunction(() => {
      const text = document.querySelector('#instructionstext')?.textContent || '';
      return !text.includes('Loading changelog...');
    }, { timeout: 10000 });
    
    // Should have fetched the changelog
    expect(requestUrls.length).toBeGreaterThan(0);
    
    // The URL should end with /civbuilder/CHANGELOG.md (based on the route variable)
    expect(requestUrls[0]).toContain('/civbuilder/CHANGELOG.md');
  });

  test('should not show error when loading changelog', async ({ page }) => {
    await page.goto('/civbuilder');
    await page.click('#updates');
    
    // Wait for changelog to load
    await page.waitForFunction((minLength) => {
      const text = document.querySelector('#instructionstext')?.textContent || '';
      return text.length > minLength && !text.includes('Loading changelog...');
    }, MIN_CHANGELOG_LENGTH, { timeout: 10000 });
    
    const changelogText = await page.locator('#instructionstext').textContent();
    
    // Should not show error message
    expect(changelogText).not.toContain('Failed to load changelog');
    
    // Should have actual content
    expect(changelogText.length).toBeGreaterThan(MIN_CHANGELOG_LENGTH);
    expect(changelogText).toContain('•');
  });
});
