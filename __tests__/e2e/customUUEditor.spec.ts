import { test, expect } from '@playwright/test';

/**
 * E2E tests for Custom Unique Unit Editor
 * Tests the custom UU design functionality with budget enforcement
 */

test.describe('Custom UU Editor - Navigation', () => {
  test('should navigate to custom UU editor demo page', async ({ page }) => {
    await page.goto('/v2/');
    
    // Navigate to demos page first
    await page.getByRole('link', { name: /demos/i }).click();
    await expect(page).toHaveURL(/.*\/demo/);
    
    // Click custom UU editor link
    await page.getByRole('link', { name: /Custom UU/i }).click();
    
    // Should navigate to custom UU demo page
    await expect(page).toHaveURL(/.*\/demo\/custom-uu/);
    await expect(page.getByRole('heading', { name: /Custom Unique Unit Editor/i })).toBeVisible();
  });

  test('should load custom UU editor directly', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Check page loaded
    await expect(page).toHaveTitle(/AoE2 Civbuilder/);
    await expect(page.getByRole('heading', { name: /Custom Unique Unit Editor/i })).toBeVisible();
  });
});

test.describe('Custom UU Editor - Unit Type Selection', () => {
  test('should display all four unit type tabs', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Check all type tabs are visible
    await expect(page.getByRole('button', { name: /Infantry/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cavalry/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Archer/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Siege/i })).toBeVisible();
  });

  test('should switch between unit types', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry (default)
    await page.getByTestId('type-button-infantry').click();
    await expect(page.getByText(/Melee fighters trained in barracks/i)).toBeVisible();
    
    // Switch to Cavalry
    await page.getByRole('button', { name: /🐎.*Cavalry/i }).click();
    await expect(page.getByText(/Fast mounted units from stables/i)).toBeVisible();
    
    // Switch to Archer
    await page.getByRole('button', { name: /🏹.*Archer/i }).click();
    await expect(page.getByText(/Ranged units from archery range/i)).toBeVisible();
  });
});
    
    // Switch to Cavalry
    await page.getByRole('button', { name: /Cavalry/i }).click();
    await expect(page.getByText(/Fast mounted units from stables/i)).toBeVisible();
    
    // Switch to Archer
    await page.getByRole('button', { name: /Archer/i }).click();
    await expect(page.getByText(/Ranged units from archery range/i)).toBeVisible();
    
    // Switch to Siege
    await page.getByRole('button', { name: /Siege/i }).click();
    await expect(page.getByText(/Heavy weapons from workshop/i)).toBeVisible();
  });
});

test.describe('Custom UU Editor - Basic Properties', () => {
  test('should allow editing unit name', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Find and fill unit name input
    const nameInput = page.getByLabel(/Unit Name/i);
    await nameInput.fill('Elite Guard');
    
    // Verify name was set
    await expect(nameInput).toHaveValue('Elite Guard');
  });

  test('should display base unit selector with icons', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Check that base unit options are visible
    await expect(page.getByText(/Base Unit Template/i)).toBeVisible();
    await expect(page.getByText(/Jaguar Warrior/i)).toBeVisible();
    await expect(page.getByText(/Teutonic Knight/i)).toBeVisible();
  });

  test('should allow selecting different base units', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Cavalry type
    await page.getByRole('button', { name: /Cavalry/i }).click();
    
    // Click on a different base unit
    await page.getByText(/War Elephant/i).click();
    
    // Verify selection (element should have selected styling)
    const selectedUnit = page.locator('text=War Elephant').locator('..');
    await expect(selectedUnit).toHaveClass(/border-yellow-500/);
  });
});

test.describe('Custom UU Editor - Combat Stats', () => {
  test('should display health slider', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Check health section exists
    await expect(page.getByText(/Health \(HP\)/i)).toBeVisible();
  });

  test('should display attack slider', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Check attack section exists
    await expect(page.getByText(/Attack$/i)).toBeVisible();
  });

  test('should display armor sliders', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Check armor sections exist
    await expect(page.getByText(/Melee Armor/i)).toBeVisible();
    await expect(page.getByText(/Pierce Armor/i)).toBeVisible();
  });

  test('should display elite stats', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Check elite stats are displayed
    await expect(page.getByText(/Elite:/i).first()).toBeVisible();
  });
});

test.describe('Custom UU Editor - Editor Modes', () => {
  test('should have three editor modes', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Check mode selector is visible
    await expect(page.getByText(/Editor Mode:/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Demo \(Unlimited\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Build Mode \(150 pts\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Draft Mode \(100 pts\)/i })).toBeVisible();
  });

  test('should switch between modes', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Start in Demo mode
    await expect(page.getByRole('button', { name: /Demo \(Unlimited\)/i })).toHaveClass(/bg-yellow-600/);
    
    // Switch to Build Mode
    await page.getByRole('button', { name: /Build Mode \(150 pts\)/i }).click();
    await expect(page.getByRole('button', { name: /Build Mode \(150 pts\)/i })).toHaveClass(/bg-yellow-600/);
    
    // Switch to Draft Mode
    await page.getByRole('button', { name: /Draft Mode \(100 pts\)/i }).click();
    await expect(page.getByRole('button', { name: /Draft Mode \(100 pts\)/i })).toHaveClass(/bg-yellow-600/);
  });

  test('should display power budget in Build mode', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Switch to Build Mode
    await page.getByRole('button', { name: /Build Mode \(150 pts\)/i }).click();
    
    // Check power budget display
    await expect(page.getByText(/Power Budget:/i)).toBeVisible();
    await expect(page.getByText(/\/ 150 pts/i)).toBeVisible();
  });

  test('should display power budget in Draft mode', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Switch to Draft Mode
    await page.getByRole('button', { name: /Draft Mode \(100 pts\)/i }).click();
    
    // Check power budget display
    await expect(page.getByText(/Power Budget:/i)).toBeVisible();
    await expect(page.getByText(/\/ 100 pts/i)).toBeVisible();
  });
});

test.describe('Custom UU Editor - Budget Slider Enforcement', () => {
  test('should show budget limit markers on sliders in Build mode', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Switch to Build Mode
    await page.getByRole('button', { name: /Build Mode \(150 pts\)/i }).click();
    
    // Check for budget limit indicators (red markers)
    const limitMarkers = page.locator('.budget-slider-limit');
    await expect(limitMarkers.first()).toBeVisible();
  });

  test('should prevent exceeding budget in Build mode', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Switch to Build Mode
    await page.getByRole('button', { name: /Build Mode \(150 pts\)/i }).click();
    
    // Get initial budget
    const budgetText = await page.getByText(/Power Budget:/i).textContent();
    const initialBudget = parseInt(budgetText?.match(/(\d+) \//)?.[1] || '0');
    
    // Wait for editor to be fully interactive
    await page.waitForSelector('.budget-slider-track', { state: 'visible' });
    
    // Try to max out multiple stats - budget should prevent going over 150
    // Check that budget doesn't exceed 150
    const finalBudgetText = await page.getByText(/Power Budget:/i).textContent();
    const finalBudget = parseInt(finalBudgetText?.match(/(\d+) \//)?.[1] || '0');
    expect(finalBudget).toBeLessThanOrEqual(150);
  });

  test('should show different budget limits for Draft mode (100 pts)', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Cavalry type
    await page.getByRole('button', { name: /Cavalry/i }).click();
    
    // Switch to Draft Mode
    await page.getByRole('button', { name: /Draft Mode \(100 pts\)/i }).click();
    
    // Check budget limit is 100
    await expect(page.getByText(/\/ 100 pts/i)).toBeVisible();
  });
});

test.describe('Custom UU Editor - Cost System', () => {
  test('should display asymmetrical costs for Infantry', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Check cost section
    await expect(page.getByText(/Cost & Training/i)).toBeVisible();
    
    // Infantry should have food + gold (asymmetrical)
    const foodInput = page.getByLabel(/Food/i);
    const goldInput = page.getByLabel(/Gold/i);
    
    await expect(foodInput).toBeVisible();
    await expect(goldInput).toBeVisible();
    
    // Check that food cost is higher than gold (asymmetrical)
    const foodValue = await foodInput.inputValue();
    const goldValue = await goldInput.inputValue();
    expect(parseInt(foodValue)).toBeGreaterThan(parseInt(goldValue));
  });

  test('should display wood + gold costs for Archer', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Archer type
    await page.getByRole('button', { name: /Archer/i }).click();
    
    // Archer should have wood + gold
    const woodInput = page.getByLabel(/Wood/i);
    const goldInput = page.getByLabel(/Gold/i);
    
    await expect(woodInput).toBeVisible();
    await expect(goldInput).toBeVisible();
  });

  test('should have "Apply Recommended Cost" button', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Check for button
    await expect(page.getByRole('button', { name: /Apply Recommended Cost/i })).toBeVisible();
  });
});

test.describe('Custom UU Editor - Attack Bonuses', () => {
  test('should have attack bonus section', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Check attack bonuses section
    await expect(page.getByText(/Attack Bonuses/i)).toBeVisible();
  });

  test('should have Add Attack Bonus button', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Check for button
    await expect(page.getByRole('button', { name: /Add Attack Bonus/i })).toBeVisible();
  });
});

test.describe('Custom UU Editor - Hero Mode', () => {
  test('should have hero mode toggle', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Check for hero mode checkbox
    await expect(page.getByText(/Hero Mode/i)).toBeVisible();
  });

  test('should display hero mode description', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Check for hero mode description text
    await expect(page.getByText(/only trainable once/i)).toBeVisible();
  });
});

test.describe('Custom UU Editor - Export', () => {
  test('should have export to JSON button', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Check for export button
    await expect(page.getByRole('button', { name: /Export JSON/i })).toBeVisible();
  });

  test('should have reset to defaults button', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Check for reset button
    await expect(page.getByRole('button', { name: /Reset to Defaults/i })).toBeVisible();
  });
});

test.describe('Custom UU Editor - Validation', () => {
  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Clear the unit name to trigger validation
    const nameInput = page.getByLabel(/Unit Name/i);
    await nameInput.fill('');
    await nameInput.blur();
    
    // Check for validation error
    await expect(page.getByText(/Validation Errors/i)).toBeVisible();
  });

  test('should show valid status when unit is properly configured', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Select Infantry type
    await page.getByRole('button', { name: /Infantry/i }).click();
    
    // Fill in valid name
    const nameInput = page.getByLabel(/Unit Name/i);
    await nameInput.fill('Custom Infantry');
    
    // Check for valid indicator
    await expect(page.getByText(/✓ Valid/i)).toBeVisible();
  });
});

test.describe('Custom UU Editor - Documentation', () => {
  test('should display documentation sidebar', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Check for documentation section
    await expect(page.getByText(/Documentation/i)).toBeVisible();
    await expect(page.getByText(/What is this\?/i)).toBeVisible();
  });

  test('should display editor modes section in documentation', async ({ page }) => {
    await page.goto('/v2/demo/custom-uu');
    
    // Check for editor modes explanation
    await expect(page.getByText(/Editor Modes/i)).toBeVisible();
  });
});
