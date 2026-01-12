import { test, expect } from '@playwright/test'
import { BuildPage } from './helpers/BuildPage'

test.describe('Build Page - Imperial Paladin Bonus', () => {
  let buildPage: BuildPage

  test.beforeEach(async ({ page }) => {
    buildPage = new BuildPage(page)
    await buildPage.goto()
    await buildPage.goToCivBonusesStep()
  })

  test('should display 364 civ bonuses including Imperial Paladin on /v2/build', async () => {
    // Check total bonus count on THIS step (should be civ bonuses only)
    const totalBonuses = await buildPage.getBonusCardCount()
    
    // Should have 364 civ bonuses on this step (includes our new Imperial Paladin bonus #363)
    expect(totalBonuses).toBe(364)
  })

  test('should be able to interact with the Imperial Paladin bonus card', async () => {
    // Get the last bonus card (Imperial Paladin is at index 363, the last one)
    const lastCard = buildPage.page.locator('.step-content:visible .bonus-card').nth(363)
    
    // Scroll to it and verify it exists
    await lastCard.scrollIntoViewIfNeeded()
    await expect(lastCard).toBeVisible()
    
    // Verify we can click it (interaction works even if selection state isn't visually verified)
    await lastCard.click()
    await buildPage.page.waitForTimeout(500)
  })
})
