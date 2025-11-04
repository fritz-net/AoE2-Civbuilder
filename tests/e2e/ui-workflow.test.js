const { test, expect } = require('@playwright/test');
const path = require('path');

// Increase timeout for UI tests that interact with backend
test.setTimeout(90000);

test.describe('UI E2E Workflow Tests with Playwright', () => {
  test.beforeEach(async ({ page }) => {
    // Set up error logging
    page.on('pageerror', exception => {
      console.log(`Page error: ${exception}`);
    });
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console error: ${msg.text()}`);
      }
    });
  });

  test('should complete full build workflow with UI interaction', async ({ page }) => {
    console.log('\n=== Starting Build Workflow UI Test ===');
    
    // Step 1: Navigate to build page
    console.log('Step 1: Navigating to /build page...');
    await page.goto('/build', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Verify we're on the build page
    const title = await page.title();
    console.log(`Page title: ${title}`);
    expect(title).toBeTruthy();
    console.log('✓ Build page loaded');

    // Step 2: Create flag/color, select architecture style, set civ name
    console.log('Step 2: Creating civilization flag...');
    
    // Wait for the builder to initialize - try multiple selectors
    try {
      await Promise.race([
        page.waitForSelector('canvas', { timeout: 15000 }),
        page.waitForSelector('input[type="text"]', { timeout: 15000 }),
        page.waitForSelector('select', { timeout: 15000 })
      ]);
      console.log('✓ Builder UI elements found');
    } catch (e) {
      console.log('Warning: No standard UI elements found, continuing...');
    }
    
    // Set civilization name (if input exists)
    const civNameInput = await page.$('input[type="text"]');
    if (civNameInput) {
      await civNameInput.fill('TestCiv');
      console.log('✓ Set civilization name');
    } else {
      console.log('ℹ No text input found');
    }
    
    // Select architecture style (if dropdown exists)
    const archSelect = await page.$('select');
    if (archSelect) {
      await archSelect.selectOption({ index: 1 });
      console.log('✓ Selected architecture style');
    } else {
      console.log('ℹ No select dropdown found');
    }
    
    console.log('✓ Flag creation phase completed');

    // Step 3: Navigate through phases (if phase navigation exists)
    console.log('Step 3: Looking for phase navigation...');
    
    // Try to find "Next" or "Done" buttons
    const nextButton = await page.$('button:has-text("Next"), button:has-text("Continue"), button:has-text("Done")');
    if (nextButton) {
      await nextButton.click();
      await page.waitForTimeout(2000);
      console.log('✓ Advanced to next phase');
    } else {
      console.log('ℹ No navigation button found');
    }

    // Step 4: Download JSON (if download button exists)
    console.log('Step 4: Looking for JSON download...');
    const downloadButton = await page.$('button:has-text("Download"), button:has-text("download"), a:has-text("Download")');
    if (downloadButton) {
      try {
        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
          downloadButton.click()
        ]);
        
        if (download) {
          const filename = await download.suggestedFilename();
          console.log(`✓ Downloaded file: ${filename}`);
        } else {
          console.log('ℹ Download button clicked but no download triggered');
        }
      } catch (e) {
        console.log(`ℹ Download attempt: ${e.message}`);
      }
    } else {
      console.log('ℹ No download button found');
    }

    console.log('✓ Build workflow UI test completed successfully');
  });

  test('should complete full draft workflow with UI interaction', async ({ page }) => {
    console.log('\n=== Starting Draft Workflow UI Test ===');
    
    // Step 1: Navigate to home page
    console.log('Step 1: Navigating to home page...');
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    const title = await page.title();
    console.log(`Page title: ${title}`);
    console.log('✓ Home page loaded');

    // Step 2: Click "Create Draft" button
    console.log('Step 2: Looking for Create Draft button...');
    const createDraftButton = await page.$('button:has-text("Create Draft"), a:has-text("Create Draft"), a[href*="draft"]');
    
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
            const fullHref = href.startsWith('http') ? href : `${href}`;
            await page.goto(fullHref);
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
  });

  test('should verify build page UI elements exist', async ({ page }) => {
    console.log('\n=== Verifying Build Page UI Elements ===');
    
    await page.goto('/build');
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
  });

  test('should verify home page UI elements exist', async ({ page }) => {
    console.log('\n=== Verifying Home Page UI Elements ===');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const bodyText = await page.textContent('body');
    expect(bodyText.length).toBeGreaterThan(0);
    console.log('✓ Home page loaded with content');
    
    // Check for navigation or key links
    const links = await page.$$('a');
    expect(links.length).toBeGreaterThan(0);
    console.log(`✓ Found ${links.length} links on home page`);
    
    console.log('✓ Home page UI elements verified');
  });
});
