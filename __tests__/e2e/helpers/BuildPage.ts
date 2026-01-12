import { type Page, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class BuildPage extends BasePage {
  readonly url: string = '/v2/build'
  
  // Main components
  readonly pageTitle: Locator
  readonly bonusGrid: Locator
  
  // Stepper navigation
  readonly stepper: Locator
  readonly step1BasicInfo: Locator
  readonly step2CivBonuses: Locator
  readonly step3UniqueUnit: Locator
  readonly step4CastleTech: Locator
  readonly step5ImpTech: Locator
  
  // Bonus cards
  readonly bonusCards: Locator
  
  // Next button
  readonly nextButton: Locator
  
  constructor(page: Page) {
    super(page)
    this.pageTitle = page.locator('h1.civ-builder-title')
    this.bonusGrid = page.locator('.bonus-selector-grid')
    
    // Stepper
    this.stepper = page.locator('.stepper')
    this.step1BasicInfo = page.locator('.step-item').nth(0)
    this.step2CivBonuses = page.locator('.step-item').nth(1)
    this.step3UniqueUnit = page.locator('.step-item').nth(2)
    this.step4CastleTech = page.locator('.step-item').nth(3)
    this.step5ImpTech = page.locator('.step-item').nth(4)
    
    // Bonus cards
    this.bonusCards = page.locator('.bonus-card')
    
    // Next button
    this.nextButton = page.locator('button', { hasText: /Next|Create Mod/ })
  }
  
  /**
   * Navigate to the build page
   */
  async goto() {
    await this.page.goto(this.url)
    // Wait for the main heading to ensure page is loaded
    await this.page.getByRole('heading', { name: /Create Your Civilization/i }).waitFor({ state: 'visible', timeout: 15000 })
  }
  
  /**
   * Navigate to the civ bonuses step by filling basic info and clicking Next
   */
  async goToCivBonusesStep() {
    // Fill in a civ name to enable the Next button
    const civNameInput = this.page.getByPlaceholder(/Enter civilization name/i)
    await civNameInput.fill('TestCiv')
    
    // Click Next to go to Civ Bonuses step
    const nextButton = this.page.getByRole('button', { name: /Next →/i })
    await nextButton.click()
    
    // Wait for the Civ Bonuses heading
    await this.page.getByRole('heading', { name: /Civilization Bonuses/i }).waitFor({ state: 'visible', timeout: 10000 })
  }
  
  /**
   * Get bonus card by ID
   */
  getBonusCard(bonusId: number): Locator {
    return this.page.locator(`.bonus-card[data-bonus-id="${bonusId}"]`)
  }
  
  /**
   * Get bonus card by text content (searches in title and description)
   */
  getBonusCardByText(text: string): Locator {
    return this.bonusCards.filter({ hasText: text }).first()
  }
  
  /**
   * Select a bonus by ID
   */
  async selectBonus(bonusId: number) {
    const card = this.getBonusCard(bonusId)
    await card.scrollIntoViewIfNeeded()
    await card.click()
    await this.page.waitForTimeout(300) // Wait for selection animation
  }
  
  /**
   * Select a bonus by text
   */
  async selectBonusByText(text: string) {
    const card = this.getBonusCardByText(text)
    await card.scrollIntoViewIfNeeded()
    await card.click()
    await this.page.waitForTimeout(300) // Wait for selection animation
  }
  
  /**
   * Check if a bonus is selected
   */
  async isBonusSelected(bonusId: number): Promise<boolean> {
    const card = this.getBonusCard(bonusId)
    const classes = await card.getAttribute('class')
    return classes?.includes('selected') || false
  }
  
  /**
   * Get the total number of bonus cards
   */
  async getBonusCardCount(): Promise<number> {
    return await this.bonusCards.count()
  }
  
  /**
   * Get the number of selected bonuses
   */
  async getSelectedBonusCount(): Promise<number> {
    return await this.page.locator('.bonus-card.selected').count()
  }
  
  /**
   * Search for a bonus
   */
  async searchBonus(query: string) {
    // Use the filter input that's currently visible (in the active step)
    const searchInput = this.page.locator('.step-content:visible .filter-input')
    await searchInput.fill(query)
    await this.page.waitForTimeout(500) // Wait for search to filter
  }
  
  /**
   * Clear search
   */
  async clearSearch() {
    // Use the filter input that's currently visible (in the active step)
    const searchInput = this.page.locator('.step-content:visible .filter-input')
    await searchInput.clear()
    await this.page.waitForTimeout(500)
  }
}
