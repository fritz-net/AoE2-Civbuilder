import { test, expect } from '@playwright/test';

/**
 * E2E tests for TechTree component in Build and Draft modes
 * Tests the demo page functionality for both variants
 */

test.describe('TechTree Demo - Navigation', () => {
  test('should navigate to demo index from home', async ({ page }) => {
    await page.goto('/v2/');
    
    // Navigate to demo (may need to scroll or find the link)
    await page.goto('/v2/demo');
    
    // Check page title
    await expect(page).toHaveTitle(/AoE2 Civbuilder/);
    
    // Check heading
    await expect(page.getByRole('heading', { name: /Component Demos/i })).toBeVisible();
  });

  test('should navigate to techtree demo from demo index', async ({ page }) => {
    await page.goto('/v2/demo');
    
    // Click on Tech Tree demo link
    await page.getByRole('link', { name: /Tech Tree/i }).click();
    
    // Should navigate to techtree demo page
    await expect(page).toHaveURL(/.*\/demo\/techtree/);
  });

  test('should load techtree demo page successfully', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Check page title
    await expect(page).toHaveTitle(/AoE2 Civbuilder/);
    
    // Check demo settings heading
    await expect(page.getByRole('heading', { name: /Tech Tree Demo Settings/i })).toBeVisible();
    
    // Check tech tree is visible
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
  });
});

test.describe('TechTree Demo - Build Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Ensure we're in build mode (should be default)
    const buildModeRadio = page.getByRole('radio', { name: /Build Mode/i });
    await expect(buildModeRadio).toBeChecked();
  });

  test('should display build mode settings correctly', async ({ page }) => {
    // Check mode label
    await expect(page.getByText('Mode: build')).toBeVisible();
    
    // Check points display starts at 0
    await expect(page.getByText('Points: 0')).toBeVisible();
    
    // Check label is "Points Spent"
    await expect(page.getByText('Label: Points Spent')).toBeVisible();
    
    // Check point limit input is disabled
    const pointLimitInput = page.locator('input[type="number"]').first();
    await expect(pointLimitInput).toBeDisabled();
    
    // Check info text about build mode
    await expect(page.getByText(/Build mode always starts at 0/i)).toBeVisible();
  });

  test('should show Points Spent label in build mode', async ({ page }) => {
    // Main tech tree should show "Points Spent"
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
  });

  test('should start with 0 points in build mode', async ({ page }) => {
    // Check current state shows 0 points
    await expect(page.getByText('Points: 0')).toBeVisible();
    
    // Check tech tree display
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
  });

  test('should have unlimited points (no limit check) in build mode', async ({ page }) => {
    // In build mode, there should be no limit mentioned
    // Check that we can see the unlimited description
    await expect(page.getByText(/Start at 0, count up, unlimited/i)).toBeVisible();
  });

  test('should allow toggling editable checkbox', async ({ page }) => {
    const editableCheckbox = page.getByRole('checkbox', { name: /Editable/i });
    
    // Should be checked by default
    await expect(editableCheckbox).toBeChecked();
    
    // Uncheck it
    await editableCheckbox.click();
    await expect(editableCheckbox).not.toBeChecked();
    
    // Check it again
    await editableCheckbox.click();
    await expect(editableCheckbox).toBeChecked();
  });

  test('should reset tree in build mode', async ({ page }) => {
    // Click reset button
    await page.getByRole('button', { name: /Reset Tree/i }).click();
    
    // Points should still be 0
    await expect(page.getByText('Points: 0')).toBeVisible();
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
  });
});

test.describe('TechTree Demo - Draft Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Switch to draft mode
    const draftModeRadio = page.getByRole('radio', { name: /Draft Mode/i });
    await draftModeRadio.click();
    
    // Wait for mode to change
    await page.waitForTimeout(500);
  });

  test('should switch to draft mode correctly', async ({ page }) => {
    // Check draft mode radio is selected
    const draftModeRadio = page.getByRole('radio', { name: /Draft Mode/i });
    await expect(draftModeRadio).toBeChecked();
    
    // Check mode label updated
    await expect(page.getByText('Mode: draft')).toBeVisible();
  });

  test('should display draft mode settings correctly', async ({ page }) => {
    // Check points display starts at limit (250)
    await expect(page.getByText('Points: 250')).toBeVisible();
    
    // Check label is "Points Remaining"
    await expect(page.getByText('Label: Points Remaining')).toBeVisible();
    
    // Check point limit input is enabled
    const pointLimitInput = page.locator('input[type="number"]').first();
    await expect(pointLimitInput).toBeEnabled();
    await expect(pointLimitInput).toHaveValue('250');
  });

  test('should show Points Remaining label in draft mode', async ({ page }) => {
    // Main tech tree should show "Points Remaining"
    await expect(page.getByText(/Points Remaining: 250/i)).toBeVisible();
  });

  test('should start with point limit in draft mode', async ({ page }) => {
    // Check current state shows 250 points (default limit)
    await expect(page.getByText('Points: 250')).toBeVisible();
    
    // Check tech tree display
    await expect(page.getByText(/Points Remaining: 250/i)).toBeVisible();
  });

  test('should allow changing point limit in draft mode', async ({ page }) => {
    const pointLimitInput = page.locator('input[type="number"]').first();
    
    // Change to 300
    await pointLimitInput.fill('300');
    
    // Wait for update
    await page.waitForTimeout(1000);
    
    // Check updated points
    await expect(page.getByText('Points: 300')).toBeVisible();
  });

  test('should reset tree in draft mode', async ({ page }) => {
    // Click reset button
    await page.getByRole('button', { name: /Reset Tree/i }).click();
    
    // Points should be back to limit
    await expect(page.getByText('Points: 250')).toBeVisible();
    await expect(page.getByText(/Points Remaining: 250/i)).toBeVisible();
  });
});

test.describe('TechTree Demo - Mode Switching', () => {
  test('should switch from build to draft mode', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Start in build mode
    await expect(page.getByText('Mode: build')).toBeVisible();
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
    
    // Switch to draft mode
    const draftModeRadio = page.getByRole('radio', { name: /Draft Mode/i });
    await draftModeRadio.click();
    
    // Wait for mode change
    await page.waitForTimeout(500);
    
    // Check mode changed
    await expect(page.getByText('Mode: draft')).toBeVisible();
    await expect(page.getByText(/Points Remaining: 250/i)).toBeVisible();
  });

  test('should switch from draft to build mode', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Switch to draft mode first
    const draftModeRadio = page.getByRole('radio', { name: /Draft Mode/i });
    await draftModeRadio.click();
    await page.waitForTimeout(500);
    
    // Verify we're in draft mode
    await expect(page.getByText('Mode: draft')).toBeVisible();
    
    // Switch back to build mode
    const buildModeRadio = page.getByRole('radio', { name: /Build Mode/i });
    await buildModeRadio.click();
    
    // Wait for mode change
    await page.waitForTimeout(500);
    
    // Check mode changed back
    await expect(page.getByText('Mode: build')).toBeVisible();
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
  });

  test('should maintain state when switching modes', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Check initial tech count
    const initialTechsText = await page.getByText(/Techs Enabled: \d+/).textContent();
    const initialTechs = parseInt(initialTechsText?.match(/\d+/)?.[0] || '0');
    
    // Switch to draft and back
    await page.getByRole('radio', { name: /Draft Mode/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('radio', { name: /Build Mode/i }).click();
    await page.waitForTimeout(500);
    
    // Tech count should be the same
    await expect(page.getByText(new RegExp(`Techs Enabled: ${initialTechs}`))).toBeVisible();
  });
});

test.describe('TechTree Demo - UI Elements', () => {
  test('should display current state info box', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Check info box heading
    await expect(page.getByRole('heading', { name: /Current State/i })).toBeVisible();
    
    // Check all state items are displayed
    await expect(page.getByText(/Mode:/i)).toBeVisible();
    await expect(page.getByText(/Points:/i)).toBeVisible();
    await expect(page.getByText(/Label:/i)).toBeVisible();
    await expect(page.getByText(/Techs Enabled:/i)).toBeVisible();
  });

  test('should display sidebar with mode information', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Check sidebar title
    await expect(page.getByRole('heading', { name: /Tech Tree Demo/i })).toBeVisible();
    
    // Check demo civilization name
    await expect(page.getByText(/Demo Civilization/i)).toBeVisible();
    
    // Check mode information section
    await expect(page.getByRole('heading', { name: /Mode Information/i })).toBeVisible();
    
    // Check test instructions
    await expect(page.getByRole('heading', { name: /Test Instructions/i })).toBeVisible();
  });

  test('should have show pastures toggle', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    const pasturesCheckbox = page.getByRole('checkbox', { name: /Show Pastures/i });
    
    // Should be unchecked by default
    await expect(pasturesCheckbox).not.toBeChecked();
    
    // Toggle it
    await pasturesCheckbox.click();
    await expect(pasturesCheckbox).toBeChecked();
  });

  test('should display reset tree button', async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Check reset button is visible and clickable
    const resetButton = page.getByRole('button', { name: /Reset Tree/i });
    await expect(resetButton).toBeVisible();
    await expect(resetButton).toBeEnabled();
  });
});

test.describe('TechTree Production - Build Page', () => {
  test('should use build mode on /build page', async ({ page }) => {
    await page.goto('/v2/build');
    
    // Navigate to tech tree step
    // First fill in civilization name
    await page.getByPlaceholder(/Enter civilization name/i).fill('Test Civ');
    
    // Click Next to navigate through steps
    // This is a simplified version - may need adjustment based on actual flow
    const nextButton = page.getByRole('button', { name: /Next/i });
    
    // Navigate through steps (6 times to reach tech tree)
    for (let i = 0; i < 6; i++) {
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Should show Points Spent: 0
    await expect(page.getByText(/Points Spent: 0/i)).toBeVisible();
  });
});

test.describe('TechTree Production - Draft Pages', () => {
  test('should use draft mode on draft pages', async ({ page }) => {
    // Navigate to draft techtree page (existing /v2/techtree)
    await page.goto('/v2/techtree');
    
    // Should show Points Remaining (draft mode)
    await expect(page.getByText(/Points Remaining: \d+/i)).toBeVisible();
  });
});
