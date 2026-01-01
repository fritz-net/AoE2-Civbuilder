import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for Flag Creator improvements
 * Tests the enhanced flag creator with color pickers, dropdowns, and custom flag uploads
 */

/**
 * Helper to navigate to build page and wait for flag creator to load
 */
async function goToBuildPage(page: Page) {
  await page.goto('/v2/build/');
  await page.waitForSelector('.flag-creator', { timeout: 10000 });
}

test.describe('Flag Creator - Color Picker', () => {
  test('should display color pickers for all 5 colors', async ({ page }) => {
    await goToBuildPage(page);
    
    // Check that color pickers are visible for Color 1-5
    const colorPickers = page.locator('input[type="color"]');
    await expect(colorPickers).toHaveCount(5);
    
    // Verify each color picker has the correct title
    for (let i = 0; i < 5; i++) {
      const picker = colorPickers.nth(i);
      await expect(picker).toHaveAttribute('title', 'Pick a custom color');
    }
  });

  test('should update flag when color picker is used', async ({ page }) => {
    await goToBuildPage(page);
    
    // Get the first color picker
    const firstColorPicker = page.locator('input[type="color"]').first();
    
    // Get initial color value
    const initialColor = await firstColorPicker.inputValue();
    
    // Set a new color (red)
    await firstColorPicker.fill('#ff0000');
    
    // Wait a moment for the flag to render
    await page.waitForTimeout(500);
    
    // Verify the color picker now has the new value
    await expect(firstColorPicker).toHaveValue('#ff0000');
    
    // Verify the flag canvas exists and is visible
    const canvas = page.locator('canvas.flag-canvas');
    await expect(canvas).toBeVisible();
  });

  test('should disable color picker when custom flag is selected', async ({ page }) => {
    await goToBuildPage(page);
    
    // Get first color picker
    const firstColorPicker = page.locator('input[type="color"]').first();
    
    // Initially should be enabled
    await expect(firstColorPicker).toBeEnabled();
    
    // Enable custom flag
    const customFlagCheckbox = page.locator('.custom-flag-checkbox input[type="checkbox"]');
    await customFlagCheckbox.check();
    
    // Color picker should now be disabled
    await expect(firstColorPicker).toBeDisabled();
  });

  test('should clear custom color when cycling through presets with arrows', async ({ page }) => {
    await goToBuildPage(page);
    
    // Get first color picker
    const firstColorPicker = page.locator('input[type="color"]').first();
    
    // Set a custom color
    await firstColorPicker.fill('#123456');
    await page.waitForTimeout(300);
    
    // Click the next arrow button for Color 1
    const firstNextButton = page.locator('.flag-control-row').first().locator('button').nth(1);
    await firstNextButton.click();
    await page.waitForTimeout(300);
    
    // The color should have changed to a preset color (not the custom one)
    const newColor = await firstColorPicker.inputValue();
    expect(newColor).not.toBe('#123456');
  });
});

test.describe('Flag Creator - Color Dropdown', () => {
  test('should display dropdown selectors for all 5 colors', async ({ page }) => {
    await goToBuildPage(page);
    
    // Check that dropdowns are visible for Color 1-5
    const colorDropdowns = page.locator('select.color-dropdown');
    await expect(colorDropdowns).toHaveCount(5);
    
    // Verify each dropdown has the correct title
    for (let i = 0; i < 5; i++) {
      const dropdown = colorDropdowns.nth(i);
      await expect(dropdown).toHaveAttribute('title', 'Select a preset color');
    }
  });

  test('should have all 15 color options in dropdown', async ({ page }) => {
    await goToBuildPage(page);
    
    // Get first dropdown
    const firstDropdown = page.locator('select.color-dropdown').first();
    
    // Get all options
    const options = firstDropdown.locator('option');
    await expect(options).toHaveCount(15);
    
    // Verify some color names
    await expect(options.nth(0)).toHaveText('Black');
    await expect(options.nth(1)).toHaveText('White');
    await expect(options.nth(2)).toHaveText('Red');
    await expect(options.nth(3)).toHaveText('Green');
    await expect(options.nth(4)).toHaveText('Yellow');
  });

  test('should update flag when color is selected from dropdown', async ({ page }) => {
    await goToBuildPage(page);
    
    // Get first dropdown
    const firstDropdown = page.locator('select.color-dropdown').first();
    
    // Select Red (index 2)
    await firstDropdown.selectOption({ index: 2 });
    await page.waitForTimeout(300);
    
    // Verify selection
    const selectedOption = await firstDropdown.inputValue();
    expect(selectedOption).toBe('2');
    
    // Verify the flag canvas is visible
    const canvas = page.locator('canvas.flag-canvas');
    await expect(canvas).toBeVisible();
  });

  test('should synchronize dropdown with arrow navigation', async ({ page }) => {
    await goToBuildPage(page);
    
    // Get first dropdown and arrow buttons
    const firstRow = page.locator('.flag-control-row').first();
    const firstDropdown = firstRow.locator('select.color-dropdown');
    const nextButton = firstRow.locator('button').nth(1);
    
    // Get initial value
    const initialValue = await firstDropdown.inputValue();
    
    // Click next arrow
    await nextButton.click();
    await page.waitForTimeout(300);
    
    // Dropdown value should have changed
    const newValue = await firstDropdown.inputValue();
    expect(newValue).not.toBe(initialValue);
  });

  test('should disable dropdown when custom flag is selected', async ({ page }) => {
    await goToBuildPage(page);
    
    // Get first dropdown
    const firstDropdown = page.locator('select.color-dropdown').first();
    
    // Initially should be enabled
    await expect(firstDropdown).toBeEnabled();
    
    // Enable custom flag
    const customFlagCheckbox = page.locator('.custom-flag-checkbox input[type="checkbox"]');
    await customFlagCheckbox.check();
    
    // Dropdown should now be disabled
    await expect(firstDropdown).toBeDisabled();
  });
});

test.describe('Architecture Selector - Dropdown', () => {
  test('should display architecture dropdown', async ({ page }) => {
    await goToBuildPage(page);
    
    // Check that architecture dropdown is visible
    const architectureDropdown = page.locator('.architecture-selector select.architecture-dropdown');
    await expect(architectureDropdown).toBeVisible();
  });

  test('should have all 11 architecture options', async ({ page }) => {
    await goToBuildPage(page);
    
    // Get architecture dropdown
    const dropdown = page.locator('.architecture-selector select.architecture-dropdown');
    
    // Get all options
    const options = dropdown.locator('option');
    await expect(options).toHaveCount(11);
    
    // Verify some architecture names
    await expect(options.nth(0)).toHaveText('Central European');
    await expect(options.nth(1)).toHaveText('Western European');
    await expect(options.nth(2)).toHaveText('East Asian');
  });

  test('should update image when architecture is selected from dropdown', async ({ page }) => {
    await goToBuildPage(page);
    
    // Get architecture dropdown
    const dropdown = page.locator('.architecture-selector select.architecture-dropdown');
    
    // Select East Asian (value 3)
    await dropdown.selectOption({ value: '3' });
    await page.waitForTimeout(300);
    
    // Verify selection
    const selectedValue = await dropdown.inputValue();
    expect(selectedValue).toBe('3');
    
    // Verify the architecture image is visible
    const image = page.locator('.architecture-image');
    await expect(image).toBeVisible();
  });

  test('should synchronize dropdown with arrow navigation', async ({ page }) => {
    await goToBuildPage(page);
    
    // Get dropdown and arrow buttons
    const dropdown = page.locator('.architecture-selector select.architecture-dropdown');
    const nextButton = page.locator('.architecture-selector button').nth(1);
    
    // Get initial value
    const initialValue = await dropdown.inputValue();
    
    // Click next arrow
    await nextButton.click();
    await page.waitForTimeout(300);
    
    // Dropdown value should have changed
    const newValue = await dropdown.inputValue();
    expect(newValue).not.toBe(initialValue);
  });
});

test.describe('Language Selector - Dropdown', () => {
  test('should display language dropdown', async ({ page }) => {
    await goToBuildPage(page);
    
    // Language selector should be visible without needing to show advanced
    const languageDropdown = page.locator('.language-selector select.language-dropdown');
    await expect(languageDropdown).toBeVisible();
  });

  test('should have all 43 language options', async ({ page }) => {
    await goToBuildPage(page);
    
    // Get language dropdown (no need to show advanced settings)
    const dropdown = page.locator('.language-selector select.language-dropdown');
    
    // Get all options
    const options = dropdown.locator('option');
    await expect(options).toHaveCount(43);
    
    // Verify some language names
    await expect(options.nth(0)).toHaveText('British Language');
    await expect(options.nth(1)).toHaveText('French Language');
    await expect(options.nth(4)).toHaveText('Japanese Language');
  });

  test('should update when language is selected from dropdown', async ({ page }) => {
    await goToBuildPage(page);
    
    // Get language dropdown (no need to show advanced settings)
    const dropdown = page.locator('.language-selector select.language-dropdown');
    
    // Select French Language (index 1)
    await dropdown.selectOption({ index: 1 });
    await page.waitForTimeout(300);
    
    // Verify selection
    const selectedValue = await dropdown.inputValue();
    expect(selectedValue).toBe('1');
  });

  test('should synchronize dropdown with arrow navigation', async ({ page }) => {
    await goToBuildPage(page);
    
    // Get dropdown and arrow buttons (no need to show advanced settings)
    const dropdown = page.locator('.language-selector select.language-dropdown');
    const nextButton = page.locator('.language-selector button').nth(1);
    
    // Get initial value
    const initialValue = await dropdown.inputValue();
    
    // Click next arrow
    await nextButton.click();
    await page.waitForTimeout(300);
    
    // Dropdown value should have changed
    const newValue = await dropdown.inputValue();
    expect(newValue).not.toBe(initialValue);
  });
});

test.describe('Custom Flag Upload', () => {
  test('should show custom flag checkbox', async ({ page }) => {
    await goToBuildPage(page);
    
    // Check custom flag checkbox is visible
    const checkbox = page.locator('.custom-flag-checkbox input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
  });

  test('should show file upload when custom flag is enabled', async ({ page }) => {
    await goToBuildPage(page);
    
    // Enable custom flag
    const customFlagCheckbox = page.locator('.custom-flag-checkbox input[type="checkbox"]');
    await customFlagCheckbox.check();
    
    // File upload should appear
    const fileUpload = page.locator('.custom-flag-upload');
    await expect(fileUpload).toBeVisible();
  });

  test('should disable flag controls when custom flag is enabled', async ({ page }) => {
    await goToBuildPage(page);
    
    // Get some controls
    const firstDropdown = page.locator('select.color-dropdown').first();
    const firstColorPicker = page.locator('input[type="color"]').first();
    const firstNextButton = page.locator('.flag-control-row').first().locator('button').nth(1);
    
    // All should be enabled initially
    await expect(firstDropdown).toBeEnabled();
    await expect(firstColorPicker).toBeEnabled();
    await expect(firstNextButton).toBeEnabled();
    
    // Enable custom flag
    const customFlagCheckbox = page.locator('.custom-flag-checkbox input[type="checkbox"]');
    await customFlagCheckbox.check();
    
    // Controls should be disabled
    await expect(firstDropdown).toBeDisabled();
    await expect(firstColorPicker).toBeDisabled();
  });
});

test.describe('Flag Creator - Integration', () => {
  test('should maintain state when switching between arrows, dropdown, and color picker', async ({ page }) => {
    await goToBuildPage(page);
    
    // Get first row controls
    const firstRow = page.locator('.flag-control-row').first();
    const dropdown = firstRow.locator('select.color-dropdown');
    const colorPicker = firstRow.locator('input[type="color"]');
    
    // Select Red from dropdown
    await dropdown.selectOption({ label: 'Red' });
    await page.waitForTimeout(300);
    
    // Verify color picker reflects red
    const colorValue = await colorPicker.inputValue();
    expect(colorValue.toLowerCase()).toBe('#d90000');
    
    // Now set custom color
    await colorPicker.fill('#00ff00');
    await page.waitForTimeout(300);
    
    // Verify it updates
    await expect(colorPicker).toHaveValue('#00ff00');
  });

  test('should render flag preview with selected colors', async ({ page }) => {
    await goToBuildPage(page);
    
    // Wait for initial render
    await page.waitForTimeout(500);
    
    // Get flag canvas
    const canvas = page.locator('canvas.flag-canvas');
    await expect(canvas).toBeVisible();
    
    // Verify canvas has correct dimensions
    await expect(canvas).toHaveAttribute('width', '256');
    await expect(canvas).toHaveAttribute('height', '256');
  });

  test('should work correctly in draft mode', async ({ page }) => {
    // This test requires creating a draft first
    // Navigate to draft creation
    await page.goto('/v2/draft/create');
    
    // Create a draft with 1 player
    const numPlayersInput = page.locator('#numPlayers');
    await numPlayersInput.fill('1');
    
    const startButton = page.getByRole('button', { name: /Start Draft/i });
    await startButton.click();
    
    // Wait for modal with links
    await page.waitForTimeout(2000);
    
    // Get host link
    const hostLink = await page.locator('#hostLink').inputValue();
    
    // Navigate to host page
    await page.goto(hostLink);
    await page.waitForTimeout(1000);
    
    // Join as host
    const playerNameInput = page.locator('#playerName');
    if (await playerNameInput.isVisible()) {
      await playerNameInput.fill('TestHost');
      await page.getByRole('button', { name: /Join Draft/i }).click();
      await page.waitForTimeout(2000);
    }
    
    // Should be in lobby, start the draft
    const startDraftButton = page.getByRole('button', { name: /Start Draft/i });
    if (await startDraftButton.isVisible()) {
      await startDraftButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Should now be on flag customization page (Phase 1)
    // Check for flag creator elements
    const flagCreator = page.locator('.flag-creator');
    if (await flagCreator.isVisible()) {
      // Verify color dropdowns exist in draft mode
      const colorDropdowns = page.locator('select.color-dropdown');
      await expect(colorDropdowns).toHaveCount(5);
      
      // Verify color pickers exist in draft mode
      const colorPickers = page.locator('input[type="color"]');
      await expect(colorPickers).toHaveCount(5);
      
      // Test selecting a color
      const firstDropdown = colorDropdowns.first();
      await firstDropdown.selectOption({ label: 'Red' });
      await page.waitForTimeout(300);
    }
  });
});
