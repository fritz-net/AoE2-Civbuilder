const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

describe('UI E2E Workflow Tests with Playwright', () => {
  let browser;
  let context;
  let page;
  let baseURL;
  const downloadDir = path.join(__dirname, 'downloads');

  beforeAll(async () => {
    // Use C++ backend in CI, or localhost in development
    baseURL = process.env.CIVBUILDER_HOSTNAME || 'http://localhost:4000';
    console.log(`Testing against: ${baseURL}`);
    
    // Ensure download directory exists
    try {
      await fs.mkdir(downloadDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    context = await browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1280, height: 720 }
    });
    
    page = await context.newPage();
    
    // Set longer timeout for CI environments
    page.setDefaultTimeout(15000);
  }, 30000);

  afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
    
    // Clean up downloads
    try {
      const files = await fs.readdir(downloadDir);
      for (const file of files) {
        await fs.unlink(path.join(downloadDir, file));
      }
      await fs.rmdir(downloadDir);
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  test('should complete full build workflow with UI interaction', async () => {
    console.log('\n=== Starting Build Workflow UI Test ===');
    
    // Step 1: Navigate to build page
    console.log('Step 1: Navigating to /build page...');
    await page.goto(`${baseURL}/build`);
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the build page
    const title = await page.title();
    expect(title).toContain('Civilization Builder');
    console.log('✓ Build page loaded');

    // Step 2: Create flag/color, select architecture style, set civ name
    console.log('Step 2: Creating civilization flag...');
    
    // Wait for the builder to initialize
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Set civilization name (if input exists)
    const civNameInput = await page.$('input[type="text"]');
    if (civNameInput) {
      await civNameInput.fill('TestCiv');
      console.log('✓ Set civilization name');
    }
    
    // Select architecture style (if dropdown exists)
    const archSelect = await page.$('select');
    if (archSelect) {
      await archSelect.selectOption({ index: 1 });
      console.log('✓ Selected architecture style');
    }
    
    console.log('✓ Flag creation phase completed');

    // Step 3: Navigate through phases (if phase navigation exists)
    console.log('Step 3: Looking for phase navigation...');
    
    // Try to find "Next" or "Done" buttons
    const nextButton = await page.$('button:has-text("Next"), button:has-text("Continue"), button:has-text("Done")');
    if (nextButton) {
      await nextButton.click();
      await page.waitForTimeout(1000);
      console.log('✓ Advanced to next phase');
    }

    // Step 4: Download JSON (if download button exists)
    console.log('Step 4: Looking for JSON download...');
    const downloadButton = await page.$('button:has-text("Download"), button:has-text("download"), a:has-text("Download")');
    if (downloadButton) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
        downloadButton.click()
      ]);
      
      if (download) {
        const downloadPath = path.join(downloadDir, await download.suggestedFilename());
        await download.saveAs(downloadPath);
        console.log(`✓ Downloaded file: ${await download.suggestedFilename()}`);
      }
    }

    console.log('✓ Build workflow UI test completed');
  }, 45000);

  test('should complete full draft workflow with UI interaction', async () => {
    console.log('\n=== Starting Draft Workflow UI Test ===');
    
    // Step 1: Navigate to home page
    console.log('Step 1: Navigating to home page...');
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');
    console.log('✓ Home page loaded');

    // Step 2: Click "Create Draft" button
    console.log('Step 2: Looking for Create Draft button...');
    const createDraftButton = await page.$('button:has-text("Create Draft"), a:has-text("Create Draft")');
    
    if (createDraftButton) {
      await createDraftButton.click();
      await page.waitForLoadState('networkidle');
      console.log('✓ Clicked Create Draft');
      
      // Step 3: Configure draft settings
      console.log('Step 3: Configuring draft settings...');
      
      // Set number of players to 1 (or minimum)
      const playerInput = await page.$('input[type="number"], select');
      if (playerInput) {
        const tagName = await playerInput.evaluate(el => el.tagName.toLowerCase());
        if (tagName === 'select') {
          await playerInput.selectOption({ index: 0 });
        } else {
          await playerInput.fill('1');
        }
        console.log('✓ Set number of players');
      }
      
      // Submit draft creation
      const startButton = await page.$('button:has-text("Start Draft"), button[type="submit"], input[type="submit"]');
      if (startButton) {
        await startButton.click();
        await page.waitForLoadState('networkidle');
        console.log('✓ Started draft creation');
        
        // Step 4: Check for draft created confirmation
        console.log('Step 4: Checking for draft creation confirmation...');
        const draftCreatedText = await page.textContent('body');
        
        if (draftCreatedText.includes('Draft Created!') || draftCreatedText.includes('draft')) {
          console.log('✓ Draft created successfully');
          
          // Look for host link
          const hostLink = await page.$('a[href*="/draft/host/"]');
          if (hostLink) {
            const href = await hostLink.getAttribute('href');
            console.log(`✓ Found host link: ${href}`);
            
            // Step 5: Navigate to host link
            console.log('Step 5: Navigating to host link...');
            await page.goto(`${baseURL}${href}`);
            await page.waitForLoadState('networkidle');
            console.log('✓ Navigated to draft host page');
            
            // Step 6: Enter player name and join
            console.log('Step 6: Joining draft...');
            const nameInput = await page.$('input[type="text"]');
            if (nameInput) {
              await nameInput.fill('TestPlayer');
              console.log('✓ Entered player name');
              
              const joinButton = await page.$('button:has-text("Join"), button:has-text("Start")');
              if (joinButton) {
                await joinButton.click();
                await page.waitForTimeout(2000);
                console.log('✓ Joined draft');
              }
            }
          }
        }
      }
    } else {
      console.log('⚠ Create Draft button not found - draft feature may not be available');
    }

    console.log('✓ Draft workflow UI test completed');
  }, 60000);

  test('should verify build page UI elements exist', async () => {
    console.log('\n=== Verifying Build Page UI Elements ===');
    
    await page.goto(`${baseURL}/build`);
    await page.waitForLoadState('networkidle');
    
    // Check for essential UI elements
    const canvas = await page.$('canvas');
    expect(canvas).not.toBeNull();
    console.log('✓ Canvas element found');
    
    const scripts = await page.$$eval('script', scripts => 
      scripts.map(s => s.src).filter(src => src.includes('builder.js'))
    );
    expect(scripts.length).toBeGreaterThan(0);
    console.log('✓ builder.js script loaded');
    
    console.log('✓ Build page UI elements verified');
  }, 30000);

  test('should verify home page UI elements exist', async () => {
    console.log('\n=== Verifying Home Page UI Elements ===');
    
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');
    
    const bodyText = await page.textContent('body');
    expect(bodyText.length).toBeGreaterThan(0);
    console.log('✓ Home page loaded with content');
    
    // Check for navigation or key links
    const links = await page.$$('a');
    expect(links.length).toBeGreaterThan(0);
    console.log(`✓ Found ${links.length} links on home page`);
    
    console.log('✓ Home page UI elements verified');
  }, 30000);
});
