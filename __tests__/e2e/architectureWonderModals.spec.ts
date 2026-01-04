import { test, expect } from '@playwright/test';

/**
 * E2E tests for Architecture and Wonder image selection modals
 * Tests the modal functionality and 2-column layout for /v2/build page
 */

test.describe('Architecture and Wonder Selection Modals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/v2/build');
  });

  test('should display architecture image and open modal on click', async ({ page }) => {
    // Check that architecture image is visible
    const architectureImage = page.getByRole('img', { name: /Central European|Western European|East Asian/i }).first();
    await expect(architectureImage).toBeVisible();
    
    // Click on the architecture image to open modal
    await architectureImage.click();
    
    // Verify modal is open
    await expect(page.getByRole('heading', { name: 'Select Architecture' })).toBeVisible();
    
    // Verify close button is visible
    await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
  });

  test('should display all architecture options in modal with 2-column layout', async ({ page }) => {
    // Open architecture modal
    const architectureImage = page.getByRole('img', { name: /Central European/i }).first();
    await architectureImage.click();
    
    // Wait for modal to be visible
    await expect(page.getByRole('heading', { name: 'Select Architecture' })).toBeVisible();
    
    // Check that multiple architecture options are visible (at least 6 to verify grid)
    const architectureOptions = page.locator('.grid-item');
    await expect(architectureOptions).toHaveCount(11); // There are 11 architectures
    
    // Verify some specific architectures are visible in the modal
    await expect(page.locator('.grid-item').filter({ hasText: /^Central European$/ })).toBeVisible();
    await expect(page.locator('.grid-item').filter({ hasText: /^Western European$/ })).toBeVisible();
    await expect(page.locator('.grid-item').filter({ hasText: /^East Asian$/ })).toBeVisible();
    await expect(page.locator('.grid-item').filter({ hasText: /^Middle Eastern$/ })).toBeVisible();
  });

  test('should select architecture from modal', async ({ page }) => {
    // Open architecture modal
    const architectureImage = page.getByRole('img', { name: /Central European/i }).first();
    await architectureImage.click();
    
    // Wait for modal
    await expect(page.getByRole('heading', { name: 'Select Architecture' })).toBeVisible();
    
    // Click on a different architecture (Western European)
    const westernEuropean = page.locator('.grid-item').filter({ hasText: 'Western European' });
    await westernEuropean.click();
    
    // Modal should close
    await expect(page.getByRole('heading', { name: 'Select Architecture' })).not.toBeVisible();
    
    // Verify the selection changed in the dropdown
    const architectureDropdown = page.locator('.architecture-selector select');
    await expect(architectureDropdown).toHaveValue('2'); // Western European is index 2
  });

  test('should close architecture modal when clicking close button', async ({ page }) => {
    // Open architecture modal
    const architectureImage = page.getByRole('img', { name: /Central European/i }).first();
    await architectureImage.click();
    
    // Wait for modal
    await expect(page.getByRole('heading', { name: 'Select Architecture' })).toBeVisible();
    
    // Click close button
    await page.getByRole('button', { name: 'Close' }).click();
    
    // Modal should be closed
    await expect(page.getByRole('heading', { name: 'Select Architecture' })).not.toBeVisible();
  });

  test('should display wonder image and open modal on click', async ({ page }) => {
    // Check that wonder image is visible
    const wonderImage = page.getByRole('img', { name: /Cathedral|Temple|Mosque/i }).first();
    await expect(wonderImage).toBeVisible();
    
    // Click on the wonder image to open modal
    await wonderImage.click();
    
    // Verify modal is open
    await expect(page.getByRole('heading', { name: 'Select Wonder' })).toBeVisible();
    
    // Verify close button is visible
    await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
  });

  test('should display all wonder options in modal with 2-column layout', async ({ page }) => {
    // Open wonder modal
    const wonderImage = page.getByRole('img', { name: /Chichester Cathedral/i }).first();
    await wonderImage.click();
    
    // Wait for modal to be visible
    await expect(page.getByRole('heading', { name: 'Select Wonder' })).toBeVisible();
    
    // Check that multiple wonder options are visible (at least 10 to verify grid)
    const wonderOptions = page.locator('.grid-item');
    const count = await wonderOptions.count();
    expect(count).toBeGreaterThan(10); // There are 50 wonders
    
    // Verify some specific wonders are visible in the modal
    await expect(page.locator('.grid-item').filter({ hasText: 'Chichester Cathedral (Britons)' })).toBeVisible();
    await expect(page.locator('.grid-item').filter({ hasText: 'Chartres Cathedral (Franks)' })).toBeVisible();
  });

  test('should select wonder from modal', async ({ page }) => {
    // Open wonder modal
    const wonderImage = page.getByRole('img', { name: /Chichester Cathedral/i }).first();
    await wonderImage.click();
    
    // Wait for modal
    await expect(page.getByRole('heading', { name: 'Select Wonder' })).toBeVisible();
    
    // Click on a different wonder (Chartres Cathedral)
    const chartresCathedral = page.locator('.grid-item').filter({ hasText: 'Chartres Cathedral (Franks)' });
    await chartresCathedral.click();
    
    // Modal should close
    await expect(page.getByRole('heading', { name: 'Select Wonder' })).not.toBeVisible();
    
    // Verify the selection changed in the dropdown
    const wonderDropdown = page.locator('.wonder-selector select');
    await expect(wonderDropdown).toHaveValue('1'); // Chartres Cathedral is index 1
  });

  test('should close wonder modal when clicking close button', async ({ page }) => {
    // Open wonder modal
    const wonderImage = page.getByRole('img', { name: /Chichester Cathedral/i }).first();
    await wonderImage.click();
    
    // Wait for modal
    await expect(page.getByRole('heading', { name: 'Select Wonder' })).toBeVisible();
    
    // Click close button
    await page.getByRole('button', { name: 'Close' }).click();
    
    // Modal should be closed
    await expect(page.getByRole('heading', { name: 'Select Wonder' })).not.toBeVisible();
  });

  test('should close modal when clicking outside (on overlay)', async ({ page }) => {
    // Open architecture modal
    const architectureImage = page.getByRole('img', { name: /Central European/i }).first();
    await architectureImage.click();
    
    // Wait for modal
    await expect(page.getByRole('heading', { name: 'Select Architecture' })).toBeVisible();
    
    // Click on the overlay (outside the modal content)
    await page.locator('.image-grid-overlay').click({ position: { x: 10, y: 10 } });
    
    // Modal should be closed
    await expect(page.getByRole('heading', { name: 'Select Architecture' })).not.toBeVisible();
  });

  test('should highlight selected item in architecture modal', async ({ page }) => {
    // Open architecture modal
    const architectureImage = page.getByRole('img', { name: /Central European/i }).first();
    await architectureImage.click();
    
    // Wait for modal
    await expect(page.getByRole('heading', { name: 'Select Architecture' })).toBeVisible();
    
    // Check that Central European (first item) has the selected class
    const selectedItem = page.locator('.grid-item.selected');
    await expect(selectedItem).toBeVisible();
    await expect(selectedItem).toContainText('Central European');
  });

  test('should highlight selected item in wonder modal', async ({ page }) => {
    // Open wonder modal
    const wonderImage = page.getByRole('img', { name: /Chichester Cathedral/i }).first();
    await wonderImage.click();
    
    // Wait for modal
    await expect(page.getByRole('heading', { name: 'Select Wonder' })).toBeVisible();
    
    // Check that Chichester Cathedral (first item) has the selected class
    const selectedItem = page.locator('.grid-item.selected');
    await expect(selectedItem).toBeVisible();
    await expect(selectedItem).toContainText('Chichester Cathedral');
  });

  test('should navigate between architectures using arrow buttons', async ({ page }) => {
    // Get initial architecture value
    const architectureDropdown = page.locator('.architecture-selector select');
    const initialValue = await architectureDropdown.inputValue();
    
    // Click next button
    const nextButton = page.locator('.architecture-selector .nav-btn').filter({ hasText: '>' });
    await nextButton.click();
    
    // Verify value changed
    const newValue = await architectureDropdown.inputValue();
    expect(newValue).not.toBe(initialValue);
    
    // Click previous button
    const prevButton = page.locator('.architecture-selector .nav-btn').filter({ hasText: '<' });
    await prevButton.click();
    
    // Should be back to initial value
    const finalValue = await architectureDropdown.inputValue();
    expect(finalValue).toBe(initialValue);
  });

  test('should navigate between wonders using arrow buttons', async ({ page }) => {
    // Get initial wonder value
    const wonderDropdown = page.locator('.wonder-selector select');
    const initialValue = await wonderDropdown.inputValue();
    
    // Click next button
    const nextButton = page.locator('.wonder-selector .nav-btn').filter({ hasText: '>' });
    await nextButton.click();
    
    // Verify value changed
    const newValue = await wonderDropdown.inputValue();
    expect(newValue).not.toBe(initialValue);
    
    // Click previous button
    const prevButton = page.locator('.wonder-selector .nav-btn').filter({ hasText: '<' });
    await prevButton.click();
    
    // Should be back to initial value
    const finalValue = await wonderDropdown.inputValue();
    expect(finalValue).toBe(initialValue);
  });
});
