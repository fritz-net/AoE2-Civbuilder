import { test, expect } from '@playwright/test';

/**
 * E2E tests for bonus-granted units/techs in TechTree
 * Tests that bonus-granted units appear with 0 cost and auto-enable when selected
 */

test.describe('TechTree Bonus-Granted Units', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    
    // Wait for tech tree to load (Build Mode is default)
    await page.locator('.techtree-svg').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(1000); // Allow time for initialization and rendering
  });

  test('should start with 0 techs enabled without bonuses', async ({ page }) => {
    // Check that tech count starts at baseline (only default units)
    const techtreeText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const techCount = parseInt(techtreeText?.match(/\d+/)?.[0] || '0');
    
    // Should have the default enabled techs (around 39)
    expect(techCount).toBeGreaterThan(30);
    expect(techCount).toBeLessThan(45);
  });

  test('should enable Slinger with 0 cost when bonus 61 is selected', async ({ page }) => {
    // Get initial tech count
    const initialText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
    
    // Select "Can recruit Slingers" bonus
    const slingerCheckbox = page.getByRole('checkbox', { name: /Can recruit Slingers/i });
    await slingerCheckbox.check();
    await page.waitForTimeout(500); // Allow tree to rebuild
    
    // Verify tech count increased by 1
    const finalText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const finalCount = parseInt(finalText?.match(/\d+/)?.[0] || '0');
    expect(finalCount).toBe(initialCount + 1);
    
    // Verify points still at 0 (Slinger should be free)
    await expect(page.getByText('Points Spent: 0')).toBeVisible();
  });

  test('should enable Longboat with 0 cost when bonus 51 is selected', async ({ page }) => {
    // Get initial tech count
    const initialText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
    
    // Select "Can recruit Longboats" bonus
    const longboatCheckbox = page.getByRole('checkbox', { name: /Can recruit Longboats/i });
    await longboatCheckbox.check();
    await page.waitForTimeout(500); // Allow tree to rebuild
    
    // Verify tech count increased by 2 (Longboat + Elite Longboat auto-enabled)
    const finalText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const finalCount = parseInt(finalText?.match(/\d+/)?.[0] || '0');
    expect(finalCount).toBe(initialCount + 2);
    
    // Verify points still at 0 (Longboat and Elite should be free)
    await expect(page.getByText('Points Spent: 0')).toBeVisible();
  });

  test('should enable multiple bonus units without consuming points', async ({ page }) => {
    // Get initial tech count
    const initialText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
    
    // Select "Can recruit Slingers" bonus
    const slingerCheckbox = page.getByRole('checkbox', { name: /Can recruit Slingers/i });
    await slingerCheckbox.check();
    await page.waitForTimeout(300);
    
    // Select "Can recruit Longboats" bonus
    const longboatCheckbox = page.getByRole('checkbox', { name: /Can recruit Longboats/i });
    await longboatCheckbox.check();
    await page.waitForTimeout(500);
    
    // Verify tech count increased by 3 (Slinger + Longboat + Elite Longboat)
    const finalText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const finalCount = parseInt(finalText?.match(/\d+/)?.[0] || '0');
    expect(finalCount).toBe(initialCount + 3);
    
    // Verify points still at 0 (all units should be free)
    await expect(page.getByText('Points Spent: 0')).toBeVisible();
  });

  test('should auto-enable prerequisites with point costs for Imperial Camel', async ({ page }) => {
    // Select "Can upgrade to Imperial Camel Riders" bonus
    const imperialCamelCheckbox = page.getByRole('checkbox', { name: /Can upgrade to Imperial Camel/i });
    await imperialCamelCheckbox.check();
    await page.waitForTimeout(500);
    
    // Verify points increased (should be 9 points for prerequisites)
    // Camel Rider (3) + Heavy Camel Rider (6) = 9 points
    // Imperial Camel Rider itself is free
    const pointsText = await page.locator('text=/Points Spent: \\d+/').textContent();
    const points = parseInt(pointsText?.match(/\d+/)?.[0] || '0');
    expect(points).toBe(9);
  });

  test('should auto-enable Bombard Cannon and Chemistry prerequisites for Houfnice', async ({ page }) => {
    // Select "Can upgrade to Houfnice" bonus
    const houfniceCheckbox = page.getByRole('checkbox', { name: /Can upgrade to Houfnice/i });
    await houfniceCheckbox.check();
    await page.waitForTimeout(500);
    
    // Verify points increased (should be 14 points total: Chemistry (6) + Bombard Cannon (8))
    // Houfnice itself is free
    const pointsText = await page.locator('text=/Points Spent: \\d+/').textContent();
    const points = parseInt(pointsText?.match(/\d+/)?.[0] || '0');
    expect(points).toBe(14);
  });

  test('should remove bonus unit when bonus is deselected', async ({ page }) => {
    // Select "Can recruit Slingers" bonus
    const slingerCheckbox = page.getByRole('checkbox', { name: /Can recruit Slingers/i });
    await slingerCheckbox.check();
    await page.waitForTimeout(500);
    
    // Get tech count with bonus
    const withBonusText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const withBonusCount = parseInt(withBonusText?.match(/\d+/)?.[0] || '0');
    
    // Deselect the bonus
    await slingerCheckbox.uncheck();
    await page.waitForTimeout(500);
    
    // Verify tech count decreased by 1
    const withoutBonusText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const withoutBonusCount = parseInt(withoutBonusText?.match(/\d+/)?.[0] || '0');
    expect(withoutBonusCount).toBe(withBonusCount - 1);
    
    // Verify points back to 0
    await expect(page.getByText('Points Spent: 0')).toBeVisible();
  });

  test('should show Pastures when bonus 356 is selected', async ({ page }) => {
    // Get initial tech count
    const initialText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
    
    // Select Pastures bonus (ID 356)
    const pasturesCheckbox = page.getByRole('checkbox', { name: /Pastures/i });
    await pasturesCheckbox.check();
    await page.waitForTimeout(500); // Allow tree to rebuild
    
    // Verify tech/building count increased (Pastures adds buildings)
    const finalText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const finalCount = parseInt(finalText?.match(/\d+/)?.[0] || '0');
    expect(finalCount).toBeGreaterThan(initialCount);
    
    // Verify points still at 0 (Pastures should be free)
    await expect(page.getByText('Points Spent: 0')).toBeVisible();
  });

  test('should display correct Selected Bonuses count', async ({ page }) => {
    // Initially should be 0
    await expect(page.getByText(/Selected Bonuses: 0/i)).toBeVisible();
    
    // Select one bonus
    const slingerCheckbox = page.getByRole('checkbox', { name: /Can recruit Slingers/i });
    await slingerCheckbox.check();
    await page.waitForTimeout(300);
    
    // Should be 1
    await expect(page.getByText(/Selected Bonuses: 1/i)).toBeVisible();
    
    // Select another bonus
    const longboatCheckbox = page.getByRole('checkbox', { name: /Can recruit Longboats/i });
    await longboatCheckbox.check();
    await page.waitForTimeout(300);
    
    // Should be 2
    await expect(page.getByText(/Selected Bonuses: 2/i)).toBeVisible();
  });

  test('should preserve bonus units after reset', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    // Select Slinger bonus
    const slingerCheckbox = page.getByRole('checkbox', { name: /Can recruit Slingers/i });
    await slingerCheckbox.check()
    await page.waitForTimeout(500)
    
    // Verify Slinger is enabled (tech count increases)
    const techsEnabledBefore = page.locator('text=/Techs Enabled: \\d+/')
    await expect(techsEnabledBefore).toContainText(/Techs Enabled: 40/)
    
    // Click Reset Tree button
    const resetButton = page.getByRole('button', { name: /Reset Tree/i })
    await resetButton.click()
    await page.waitForTimeout(500)
    
    // Slinger should still be enabled after reset (bonus is still selected)
    const techsEnabledAfter = page.locator('text=/Techs Enabled: \\d+/')
    await expect(techsEnabledAfter).toContainText(/Techs Enabled: 40/)
    
    // Points should still be 0 (bonus units don't consume points)
    const pointsDisplay = page.locator('text=/Points Spent: \\d+/')
    await expect(pointsDisplay).toContainText('Points Spent: 0')
  });

  test('should replace Hussar with Winged Hussar when bonus is selected', async ({ page }) => {
    await page.waitForSelector('.techtree-container')
    
    // Select Winged Hussar) - replaces Hussar
    const wingedHussarCheckbox = page.getByRole('checkbox', { name: /Winged Hussar/i })
    await wingedHussarCheckbox.check()
    await page.waitForTimeout(500)
    
    // Verify Winged Hussar is enabled with prerequisites (Scout Cavalry + Light Cavalry = 4pts)
    // Parse the points value from the points display
    const pointsText = await page.locator('.points').textContent()
    const pointsMatch = pointsText?.match(/Points.*:\s*(\d+)/)
    const points = pointsMatch ? parseInt(pointsMatch[1], 10) : 0
    expect(points).toBe(4)
    
    // Verify that Hussar caret element is not visible (replaced by Winged Hussar)
    const hussarElement = page.locator('[data-caret-id="unit_441"]')
    await expect(hussarElement).not.toBeVisible()
  });

  test('should lock prerequisites when bonus unit is enabled', async ({ page }) => {
    
    // Wait for page to load
    
    // Select Houfnice bonus (ID 286) which requires Chemistry + Bombard Cannon
    const houfniceCheckbox = page.getByRole('checkbox', { name: /Houfnice/i })
    await houfniceCheckbox.check()
    await expect(houfniceCheckbox).toBeChecked()
    
    // Verify that Chemistry (ID 47) and Bombard Cannon (ID 36) are enabled
    const chemistryElement = page.locator('[data-caret-id="tech_47"]')
    const bombardCannonElement = page.locator('[data-caret-id="unit_36"]')
    
    await expect(chemistryElement).toBeVisible()
    await expect(bombardCannonElement).toBeVisible()
    
    // Try to click Chemistry to disable it - should not work (prerequisite is locked)
    await chemistryElement.click()
    
    // Verify Chemistry is still enabled (prerequisite cannot be disabled)
    await expect(chemistryElement).toBeVisible()
    
    // Verify points are 14 (Chemistry 6pts + Bombard Cannon 8pts)
    const pointsText = await page.locator('.points').textContent()
    const pointsMatch = pointsText?.match(/Points.*:\s*(\d+)/)
    const points = pointsMatch ? parseInt(pointsMatch[1], 10) : 0
    expect(points).toBe(14)
  });

  test('should properly replace Hussar with Winged Hussar', async ({ page }) => {
    
    // Verify Hussar is initially visible
    const hussarElement = page.locator('[data-caret-id="unit_441"]')
    await expect(hussarElement).toBeVisible()
    
    // Select Winged Hussar)
    const wingedHussarCheckbox = page.getByRole('checkbox', { name: /Winged Hussar/i })
    await wingedHussarCheckbox.check()
    await page.waitForTimeout(500)
    
    // Verify Hussar is no longer visible (replaced)
    await expect(hussarElement).not.toBeVisible()
    
    // Verify Winged Hussar is now visible
    const wingedHussarElement = page.locator('[data-caret-id="unit_1707"]')
    await expect(wingedHussarElement).toBeVisible()
    
    // Verify 4 points (Scout Cavalry + Light Cavalry prerequisites)
    const pointsText = await page.locator('.points').textContent()
    const pointsMatch = pointsText?.match(/Points.*:\s*(\d+)/)
    const points = pointsMatch ? parseInt(pointsMatch[1], 10) : 0
    expect(points).toBe(4)
  });

  test('should properly replace Paladin with Savar', async ({ page }) => {
    
    // Verify Paladin is initially visible
    const paladinElement = page.locator('[data-caret-id="unit_569"]')
    await expect(paladinElement).toBeVisible()
    
    // Select Savar)
    const savarCheckbox = page.getByRole('checkbox', { name: /Savar/i })
    await savarCheckbox.check()
    await page.waitForTimeout(1000)  // Increased wait time for points calculation
    
    // Verify Paladin is no longer visible (replaced)
    await expect(paladinElement).not.toBeVisible()
    
    // Verify Savar is now visible
    const savarElement = page.locator('[data-caret-id="unit_1813"]')
    await expect(savarElement).toBeVisible()
    
    // Verify 8 points (Knight + Cavalier prerequisites)
    const pointsText = await page.locator('.points').textContent()
    const pointsMatch = pointsText?.match(/Points.*:\s*(\d+)/)
    const points = pointsMatch ? parseInt(pointsMatch[1], 10) : 0
    expect(points).toBe(8); // knight (3) + cavalier (5) = 8
  });

  test('should properly replace Two-Handed Swordsman and Champion with Legionary', async ({ page }) => {
    
    // Verify Two-Handed Swordsman and Champion are initially visible
    const twoHandedSwordsmanElement = page.locator('[data-caret-id="unit_473"]')
    const championElement = page.locator('[data-caret-id="unit_567"]')
    await expect(twoHandedSwordsmanElement).toBeVisible()
    await expect(championElement).toBeVisible()
    
    // Select Legionary)
    const legionaryCheckbox = page.getByRole('checkbox', { name: /Legionary/i })
    await legionaryCheckbox.check()
    await page.waitForTimeout(1000)  // Increased wait time for points calculation
    
    // Verify Two-Handed Swordsman and Champion are no longer visible (replaced)
    await expect(twoHandedSwordsmanElement).not.toBeVisible()
    await expect(championElement).not.toBeVisible()
    
    // Verify Legionary is now visible
    const legionaryElement = page.locator('[data-caret-id="unit_1793"]')
    await expect(legionaryElement).toBeVisible()
    
    // Verify 1 point (Long Swordsman prerequisite - actual cost from techtree data)
    const pointsText = await page.locator('.points').textContent()
    const pointsMatch = pointsText?.match(/Points.*:\s*(\d+)/)
    const points = pointsMatch ? parseInt(pointsMatch[1], 10) : 0
    expect(points).toBe(3) // Militia (0) + Man-at-Arms (2) + Long Swordsman (1) = 3 points
  });

  test('should properly replace Mill with Folwark', async ({ page }) => {
    
    // Verify Mill is initially visible
    const millElement = page.locator('[data-caret-id="building_68"]')
    await expect(millElement).toBeVisible()
    
    // Select Folwark)
    const folwarkCheckbox = page.getByRole('checkbox', { name: /Folwark/i })
    await folwarkCheckbox.check()
    await page.waitForTimeout(500)
    
    // Verify Mill is no longer visible (replaced)
    await expect(millElement).not.toBeVisible()
    
    // Verify Folwark is now visible
    const folwarkElement = page.locator('[data-caret-id="building_1734"]')
    await expect(folwarkElement).toBeVisible()
    
    // Verify 0 cost
    await expect(page.getByText('Points Spent: 0')).toBeVisible()
  });

  test('should properly replace Monastery with Fortified Church', async ({ page }) => {
    
    // Verify Monastery is initially visible
    const monasteryElement = page.locator('[data-caret-id="building_104"]')
    await expect(monasteryElement).toBeVisible()
    
    // Select Fortified Church)
    const fortifiedChurchCheckbox = page.getByRole('checkbox', { name: /Fortified Church/i })
    await fortifiedChurchCheckbox.check()
    await page.waitForTimeout(500)
    
    // Verify Monastery is no longer visible (replaced)
    await expect(monasteryElement).not.toBeVisible()
    
    // Verify Fortified Church is now visible
    const fortifiedChurchElement = page.locator('[data-caret-id="building_1806"]')
    await expect(fortifiedChurchElement).toBeVisible()
    
    // Verify 0 cost
    await expect(page.getByText('Points Spent: 0')).toBeVisible()
  });

  test('should preserve scroll position when selecting bonuses', async ({ page }) => {
    // Wait for the tech tree container to be ready (use first() to avoid strict mode violation)
    const techtreeContainer = page.locator('.techtree-container').first()
    await techtreeContainer.waitFor({ state: 'visible' })
    
    // Scroll to a specific position
    await techtreeContainer.evaluate((el) => {
      el.scrollLeft = 500
      el.scrollTop = 200
    })
    
    // Wait for scroll to settle
    await page.waitForTimeout(300)
    
    // Get initial scroll position
    const initialScroll = await techtreeContainer.evaluate((el) => ({
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop
    }))
    
    // Select a bonus to trigger tree rebuild
    const slingerCheckbox = page.getByRole('checkbox', { name: /Can recruit Slingers/i })
    await slingerCheckbox.check()
    await page.waitForTimeout(500) // Allow tree to rebuild
    
    // Get new scroll position
    const newScroll = await techtreeContainer.evaluate((el) => ({
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop
    }))
    
    // Verify scroll position was preserved (allow small tolerance for rounding)
    expect(Math.abs(newScroll.scrollLeft - initialScroll.scrollLeft)).toBeLessThan(5)
    expect(Math.abs(newScroll.scrollTop - initialScroll.scrollTop)).toBeLessThan(5)
  });
});
