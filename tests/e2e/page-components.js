let playwright;
try {
  playwright = require('playwright');
} catch (e) {
  // Playwright not available - use mock browser for basic testing
  playwright = null;
}

/**
 * Page component helpers for cleaner E2E tests
 * These methods encapsulate common page interactions for both build and draft workflows
 */
class PageComponents {
  constructor(page) {
    this.page = page;
    this.mockMode = !playwright;
  }

  // Common navigation methods
  async navigateHome(baseURL) {
    await this.page.goto(baseURL);
    await this.page.waitForSelector('body', { timeout: 10000 });
  }

  async clickBuildCivilization() {
    await this.page.click('text=Build Civilization', { timeout: 10000 });
    await this.page.waitForLoadState('networkidle', { timeout: 15000 });
  }

  async clickCreateDraft() {
    await this.page.click('text=Create Draft', { timeout: 10000 });
    await this.page.waitForLoadState('networkidle', { timeout: 15000 });
  }

  // Build workflow components
  async createCivFlag(civName = 'TestCiv') {
    // Step 1: Create color, select architecture style, set civ name
    // Wait for flag creator interface
    await this.page.waitForSelector('.color-picker, [name="civName"], input[type="text"]', { timeout: 10000 });
    
    // Set civilization name
    const nameInput = await this.page.$('input[name="civName"], input[type="text"]');
    if (nameInput) {
      await nameInput.fill(civName);
    }
    
    // Select a color if available
    const colorPicker = await this.page.$('.color-picker, input[type="color"]');
    if (colorPicker) {
      await colorPicker.click();
    }
    
    // Select architecture style if available
    const archSelect = await this.page.$('select, .architecture-select');
    if (archSelect) {
      await archSelect.selectOption({ index: 0 });
    }
    
    // Continue to next phase
    const nextButton = await this.page.$('button:has-text("Next"), button:has-text("Continue"), .next-button');
    if (nextButton) {
      await nextButton.click();
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    }
  }

  async selectTechTreeOptions() {
    // Step 2: Tech tree - select at least one tech and press "Done"
    await this.page.waitForSelector('.techtree, .tech-select', { timeout: 10000 });
    
    // Select first available tech
    const firstTech = await this.page.$('.tech-item:first-child, .technology:first-child, input[type="checkbox"]:first-child');
    if (firstTech) {
      await firstTech.click();
    }
    
    // Click Done button
    const doneButton = await this.page.$('button:has-text("Done"), .done-button');
    if (doneButton) {
      await doneButton.click();
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    }
  }

  async completeBonusPhases() {
    // Step 3: Multi-stage bonuses - cycle through all bonus pages
    const bonusPhases = [
      'Civ Bonuses',
      'Team Bonuses', 
      'Imperial Unique Tech',
      'Castle Unique Tech',
      'Unique Unit'
    ];
    
    for (const phase of bonusPhases) {
      await this.page.waitForSelector('body', { timeout: 5000 });
      
      // Look for phase switcher or current phase indicator
      const switcher = await this.page.$('.phase-switcher, .bonus-type-select');
      if (switcher && await switcher.textContent().includes(phase)) {
        // Select first available bonus in this phase
        const firstBonus = await this.page.$('.bonus-item:first-child, .bonus-option:first-child, input[type="checkbox"]:first-child');
        if (firstBonus) {
          await firstBonus.click();
        }
        
        // Move to next phase or exit
        const nextBtn = await this.page.$('button:has-text("Next"), .next-button');
        if (nextBtn) {
          await nextBtn.click();
          await this.page.waitForLoadState('networkidle', { timeout: 5000 });
        }
      }
    }
  }

  async downloadJSON() {
    // Step 4: Download JSON
    const downloadPromise = this.page.waitForEvent('download', { timeout: 15000 });
    const downloadBtn = await this.page.$('button:has-text("Download"), .download-button, button:has-text("download")');
    
    if (downloadBtn) {
      await downloadBtn.click();
      const download = await downloadPromise;
      return download;
    }
    return null;
  }

  async navigateToModCreation() {
    // Step 5: Navigate to mod creation via Home -> Combine Civilizations
    const homeBtn = await this.page.$('button:has-text("Home"), .home-button, a:has-text("Home")');
    if (homeBtn) {
      await homeBtn.click();
      
      // Handle alert dialog if it appears
      this.page.on('dialog', async dialog => {
        if (dialog.message().includes('changes will be lost')) {
          await dialog.accept();
        }
      });
      
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    }
    
    // Click Combine Civilizations
    const combineBtn = await this.page.$('text=Combine Civilizations, .combine-button');
    if (combineBtn) {
      await combineBtn.click();
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    }
  }

  async createModFromJSON(jsonFilePath) {
    // Create mod from JSON file
    const createModBtn = await this.page.$('text=Create Mod, .create-mod-button');
    if (createModBtn) {
      await createModBtn.click();
      
      // Handle file dialog
      const fileInput = await this.page.$('input[type="file"]');
      if (fileInput && jsonFilePath) {
        await fileInput.setInputFiles(jsonFilePath);
      }
      
      // Wait for mod creation and download
      const downloadPromise = this.page.waitForEvent('download', { timeout: 30000 });
      const download = await downloadPromise;
      return download;
    }
    return null;
  }

  // Draft workflow components  
  async setupDraftConfiguration(numPlayers = 1, bonusesPerPlayer = 1) {
    // Step 2: Configure draft parameters
    await this.page.waitForSelector('input, select', { timeout: 10000 });
    
    // Set number of players
    const playersInput = await this.page.$('input[name="num_players"], input:has([placeholder*="players"]');
    if (playersInput) {
      await playersInput.fill(numPlayers.toString());
    }
    
    // Set bonuses per player  
    const bonusesInput = await this.page.$('input[name="rounds"], input:has([placeholder*="bonuses"]');
    if (bonusesInput) {
      await bonusesInput.fill(bonusesPerPlayer.toString());
    }
    
    // Start draft
    const startBtn = await this.page.$('button:has-text("Start Draft"), .start-draft-button');
    if (startBtn) {
      await startBtn.click();
      await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    }
  }

  async extractDraftLinks() {
    // Step 3: Extract draft links
    await this.page.waitForSelector('text=Draft Created!', { timeout: 10000 });
    
    const hostLink = await this.page.$eval('a:has-text("Host Link"), a[href*="/draft/host/"]', el => el.href);
    const playerLink = await this.page.$eval('a:has-text("Player Link"), a[href*="/draft/player/"]', el => el.href);
    const spectatorLink = await this.page.$eval('a:has-text("Spectator Link"), a[href*="/draft/"]', el => el.href);
    
    return { hostLink, playerLink, spectatorLink };
  }

  async joinDraft(playerName = 'TestPlayer') {
    // Step 4: Join draft with player name
    await this.page.waitForSelector('input[name="playerName"], input[type="text"]', { timeout: 10000 });
    
    const nameInput = await this.page.$('input[name="playerName"], input[type="text"]');
    if (nameInput) {
      await nameInput.fill(playerName);
    }
    
    const joinBtn = await this.page.$('button:has-text("Join Draft"), .join-button');
    if (joinBtn) {
      await joinBtn.click();
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    }
  }

  async startDraftProcess() {
    // Step 5: Start the actual drafting
    const startBtn = await this.page.$('button:has-text("Start Draft"), .start-draft-button');
    if (startBtn) {
      await startBtn.click();
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    }
  }

  async completeDraftPhases() {
    // Steps 6-12: Complete all draft phases in order
    const draftPhases = [
      'Civ Bonuses',
      'Unique Units', 
      'Unique Techs: Castle',
      'Unique Techs: Imperial',
      'Team Bonuses'
    ];
    
    for (const phase of draftPhases) {
      await this.page.waitForSelector('body', { timeout: 10000 });
      
      // Select first available option in current phase
      const firstOption = await this.page.$('.draft-option:first-child, .selectable:first-child, button:first-child');
      if (firstOption) {
        await firstOption.click();
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
      }
    }
    
    // Handle tech tree phase
    await this.selectTechTreeOptions();
  }

  async completeDraftModCreation() {
    // Steps 13: Complete mod creation and download
    await this.page.waitForSelector('text=Creating Mod...', { timeout: 15000 });
    await this.page.waitForSelector('text=Mod Created', { timeout: 30000 });
    
    const downloadPromise = this.page.waitForEvent('download', { timeout: 15000 });
    const downloadBtn = await this.page.$('button:has-text("Download MOD"), .download-mod-button');
    
    if (downloadBtn) {
      await downloadBtn.click();
      const download = await downloadPromise;
      return download;
    }
    return null;
  }

  // Utility methods
  async waitForElement(selector, timeout = 10000) {
    return await this.page.waitForSelector(selector, { timeout });
  }

  async isElementVisible(selector) {
    return await this.page.isVisible(selector);
  }

  async getElementText(selector) {
    return await this.page.textContent(selector);
  }
}

// Browser setup helper
class BrowserHelper {
  constructor() {
    this.browser = null;
    this.context = null;
    this.mockMode = !playwright;
  }

  async launch() {
    if (this.mockMode) {
      // Return mock browser context for environments without Playwright
      this.context = {
        newPage: async () => ({
          goto: async () => {},
          waitForSelector: async () => ({}),
          click: async () => {},
          fill: async () => {},
          waitForLoadState: async () => {},
          url: () => 'http://localhost:4000',
          isVisible: async () => true,
          textContent: async () => 'Mock content',
          $: async () => ({ click: async () => {}, fill: async () => {} }),
          $eval: async () => 'http://localhost:4000/mock',
          on: () => {},
          waitForEvent: async () => ({ suggestedFilename: () => 'mock.zip' }),
          setInputFiles: async () => {}
        })
      };
      return this.context;
    }
    
    this.browser = await playwright.chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    this.context = await this.browser.newContext();
    return this.context;
  }

  async newPage() {
    if (this.mockMode) {
      return new PageComponents(await this.context.newPage());
    }
    const page = await this.context.newPage();
    return new PageComponents(page);
  }

  async close() {
    if (!this.mockMode) {
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

module.exports = { PageComponents, BrowserHelper };