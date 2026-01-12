import { test, expect } from '@playwright/test'
import { BuildPage } from './helpers/BuildPage'

test.describe('Build Page - Imperial Paladin Bonus', () => {
  let buildPage: BuildPage

  test.beforeEach(async ({ page }) => {
    buildPage = new BuildPage(page)
    await buildPage.goto()
    await buildPage.goToCivBonusesStep()
  })

  test('should display Imperial Paladin bonus card on /v2/build', async () => {
    // Search for Imperial Paladin bonus
    await buildPage.searchBonus('upgrade Paladin')
    
    // Verify the bonus card is visible
    const imperialPaladinCard = buildPage.getBonusCardByText('Can upgrade Paladin to Imperial Paladin')
    await expect(imperialPaladinCard).toBeVisible()
    
    // Verify the description is correct
    await expect(imperialPaladinCard).toContainText('Can upgrade Paladin to Imperial Paladin')
  })

  test('should find Imperial Paladin among all 364 civ bonuses', async () => {
    // Clear any search filters
    await buildPage.clearSearch()
    
    // Get total number of bonuses
    const totalBonuses = await buildPage.getBonusCardCount()
    expect(totalBonuses).toBe(364) // Should have 364 total bonuses including Imperial Paladin (bonus 363)
    
    // Search for Imperial Paladin
    await buildPage.searchBonus('upgrade Paladin')
    
    // Should find at least one result
    const searchResults = await buildPage.getBonusCardCount()
    expect(searchResults).toBeGreaterThanOrEqual(1)
    
    // Verify the bonus is there
    const imperialPaladinCard = buildPage.getBonusCardByText('Can upgrade Paladin to Imperial Paladin')
    await expect(imperialPaladinCard).toBeVisible()
  })

  test('should be able to select Imperial Paladin bonus', async () => {
    // Search for Imperial Paladin
    await buildPage.searchBonus('upgrade Paladin')
    
    // Select the bonus
    await buildPage.selectBonusByText('Can upgrade Paladin to Imperial Paladin')
    
    // Verify it's selected
    const imperialPaladinCard = buildPage.getBonusCardByText('Can upgrade Paladin to Imperial Paladin')
    await expect(imperialPaladinCard).toHaveClass(/selected/)
    
    // Verify selected count increased
    const selectedCount = await buildPage.getSelectedBonusCount()
    expect(selectedCount).toBeGreaterThanOrEqual(1)
  })

  test('should be able to deselect Imperial Paladin bonus', async () => {
    // Search and select Imperial Paladin
    await buildPage.searchBonus('upgrade Paladin')
    await buildPage.selectBonusByText('Can upgrade Paladin to Imperial Paladin')
    
    // Verify it's selected
    let imperialPaladinCard = buildPage.getBonusCardByText('Can upgrade Paladin to Imperial Paladin')
    await expect(imperialPaladinCard).toHaveClass(/selected/)
    
    // Deselect it
    await buildPage.selectBonusByText('Can upgrade Paladin to Imperial Paladin')
    
    // Verify it's no longer selected
    imperialPaladinCard = buildPage.getBonusCardByText('Can upgrade Paladin to Imperial Paladin')
    await expect(imperialPaladinCard).not.toHaveClass(/selected/)
  })
})
