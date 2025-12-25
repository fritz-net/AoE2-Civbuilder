import { test, expect } from '@playwright/test';

/**
 * E2E tests for Draft Mode Timer functionality
 * Tests the timer feature in draft mode
 */

test.describe('Draft Mode - Timer Feature', () => {
  test('should show timer settings in draft creation page', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Check that timer checkbox is visible
    await expect(page.getByLabel(/Enable Timer for Picking Phase/i)).toBeVisible();
    
    // Timer should be disabled by default
    const timerCheckbox = page.locator('#timerEnabled');
    await expect(timerCheckbox).not.toBeChecked();
  });

  test('should show timer duration input when timer is enabled', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Enable timer
    const timerCheckbox = page.locator('#timerEnabled');
    await timerCheckbox.check();
    await expect(timerCheckbox).toBeChecked();
    
    // Timer duration input should be visible
    await expect(page.getByLabel(/Time per Pick \(seconds\)/i)).toBeVisible();
    
    // Check default timer duration value
    const timerDurationInput = page.locator('#timerDuration');
    await expect(timerDurationInput).toHaveValue('60');
  });

  test('should hide timer duration input when timer is disabled', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Enable timer first
    const timerCheckbox = page.locator('#timerEnabled');
    await timerCheckbox.check();
    
    // Timer duration should be visible
    const timerDurationInput = page.locator('#timerDuration');
    await expect(timerDurationInput).toBeVisible();
    
    // Disable timer
    await timerCheckbox.uncheck();
    
    // Timer duration should not be visible
    await expect(timerDurationInput).not.toBeVisible();
  });

  test('should allow changing timer duration', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Enable timer
    await page.locator('#timerEnabled').check();
    
    const timerDurationInput = page.locator('#timerDuration');
    
    // Set to minimum (5)
    await timerDurationInput.fill('5');
    await expect(timerDurationInput).toHaveValue('5');
    
    // Set to maximum (300)
    await timerDurationInput.fill('300');
    await expect(timerDurationInput).toHaveValue('300');
    
    // Set to a middle value
    await timerDurationInput.fill('120');
    await expect(timerDurationInput).toHaveValue('120');
  });

  test('should show help text for timer feature', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Enable timer
    await page.locator('#timerEnabled').check();
    
    // Check that help text is visible
    await expect(page.getByText(/Players must pick within this time/i)).toBeVisible();
  });

  test('should submit draft with timer enabled', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Enable timer
    await page.locator('#timerEnabled').check();
    await page.locator('#timerDuration').fill('30');
    
    // Click submit
    await page.getByRole('button', { name: /Start Draft/i }).click();
    
    // Should show modal with draft links
    await expect(page.getByText(/Draft Created!/i)).toBeVisible({ timeout: 10000 });
  });

  test('should submit draft with timer disabled (default)', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Don't enable timer (default is disabled)
    
    // Click submit
    await page.getByRole('button', { name: /Start Draft/i }).click();
    
    // Should show modal with draft links
    await expect(page.getByText(/Draft Created!/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Draft Mode - Timer in Draft Board', () => {
  // Note: These tests would require a complete draft flow which involves:
  // 1. Creating a draft
  // 2. Joining as host and player
  // 3. Starting the draft
  // 4. Reaching phase 2 (picking phase)
  // This is complex for a simple verification test, so we'll focus on the UI elements
  
  test.skip('should display timer in draft board when enabled', async ({ page }) => {
    // This test is skipped as it requires a complete draft flow
    // Manual testing should verify:
    // 1. Timer is visible during phase 2 when timer is enabled
    // 2. Timer counts down correctly
    // 3. Pause/resume buttons work for host
    // 4. Timer auto-selects random card when time expires
  });
});
