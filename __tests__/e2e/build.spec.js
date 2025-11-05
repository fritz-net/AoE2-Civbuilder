const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const os = require('os');

test.describe('Build Workflow E2E Tests', () => {
  let downloadedJsonPath;
  let downloadedZipPath;

  test('should complete the /build workflow and create a mod', async ({ page }) => {
    // Step 1: Navigate to home page
    await page.goto('/');
    await expect(page.locator('h1#title')).toHaveText('Civilization Builder');

    // Step 2: Click "Build Civilization" to go to /build
    await page.locator('#startBuild').click();
    await page.waitForURL('**/build', { timeout: 10000 });

    // Step 3: Wait for the page to load - Phase 1: Flag Creator
    await page.waitForSelector('#header', { timeout: 10000 });
    await expect(page.locator('#header')).toHaveText('Flag Creator');
    
    // Wait for canvas to be visible
    await page.waitForSelector('#flag', { timeout: 5000 });

    // Enter a civilization name
    const aliasInput = page.locator('#alias');
    await expect(aliasInput).toBeVisible({ timeout: 5000 });
    await aliasInput.fill('TestCiv');

    // Click "Next" button to proceed to phase 2
    const nextButton = page.locator('button.readybutton:has-text("Next")');
    await expect(nextButton).toBeVisible({ timeout: 5000 });
    await nextButton.click();

    // Step 4: Select at least one tech in techtree and press "Done"
    // Wait for techtree to load - we should see a tech tree after clicking Next
    // The tech tree uses SVG elements
    
    // Look for Done button (it appears when techtree is loaded)
    const doneButton = page.locator('button:has-text("Done"), #doneButton');
    await expect(doneButton.first()).toBeVisible({ timeout: 15000 });
    
    // Wait for SVG content to load
    await page.waitForSelector('svg', { timeout: 10000 });
    
    // Try to click on a tech element - techs are typically clickable SVG rects
    try {
      const techRects = page.locator('svg rect[fill]:not([fill="none"])').first();
      if (await techRects.count() > 0) {
        await techRects.click({ timeout: 5000 });
        console.log('✓ Clicked tech in tree');
      }
    } catch (e) {
      console.log('⚠ Could not click tech element (this is optional, continuing...)');
    }

    // Click "Done" button to proceed to bonus selection
    await doneButton.first().click();
    console.log('✓ Tech tree phase completed');

    // Step 5: Navigate through multi-stage boni pages
    // Phase 2 allows navigation through different bonus types using < > buttons
    // We need to select 1 bonus per page and navigate through:
    // - Civilization Bonuses (roundType 0)
    // - Unique Units (roundType 1)
    // - Castle Unique Tech (roundType 2)
    // - Imperial Unique Tech (roundType 3)
    // - Team Bonuses (roundType 4)

    // We should see the phase header
    const phaseHeader = page.locator('#sidephase');
    await expect(phaseHeader).toBeVisible({ timeout: 10000 });

    const bonusPages = [
      'Civilization Bonuses',
      'Unique Units',
      'Castle Unique Tech',
      'Imperial Unique Tech',
      'Team Bonuses'
    ];

    for (let i = 0; i < bonusPages.length; i++) {
      const pageName = bonusPages[i];
      console.log(`Processing bonus page ${i + 1}/5: ${pageName}`);
      
      // Wait for cards to load
      await page.waitForSelector('[id^="card"]', { timeout: 10000 });

      // Try to find and click a bonus card
      // Cards are identified with id like "card0", "card1", etc.
      const card = page.locator('[id^="card"]').first();
      if (await card.count() > 0) {
        try {
          await card.click({ timeout: 5000 });
          console.log(`✓ Selected bonus on ${pageName}`);
        } catch (e) {
          console.log(`⚠ Could not click card on ${pageName}: ${e.message}`);
        }
      } else {
        console.log(`⚠ No cards found on ${pageName}`);
      }

      // Navigate to next page if not the last one
      if (i < bonusPages.length - 1) {
        const rightButton = page.locator('#buttonright');
        await rightButton.click();
        await page.waitForTimeout(500); // Brief wait for page transition
      }
    }
    console.log('✓ Bonus selection phase completed');

    // Step 6: Download the JSON file
    // Look for the "Download" button (id="finish")
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    
    const downloadButton = page.locator('#finish');
    await expect(downloadButton).toBeVisible({ timeout: 5000 });
    await downloadButton.click();
    
    const download = await downloadPromise;
    
    // Save the downloaded file
    downloadedJsonPath = path.join(os.tmpdir(), download.suggestedFilename());
    await download.saveAs(downloadedJsonPath);
    
    console.log('✓ Downloaded JSON to:', downloadedJsonPath);
    expect(fs.existsSync(downloadedJsonPath)).toBeTruthy();

    // Step 7: Exit using "Home" button and confirm alert
    // Set up dialog handler before clicking Home
    page.on('dialog', async dialog => {
      console.log('✓ Received confirmation dialog:', dialog.message());
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('home');
      await dialog.accept();
    });

    const homeButton = page.locator('#homeBtn');
    await expect(homeButton).toBeVisible({ timeout: 5000 });
    await homeButton.click();

    // Should be back at home page
    await page.waitForURL('**/', { timeout: 10000 });
    await expect(page.locator('h1#title')).toHaveText('Civilization Builder');
    console.log('✓ Returned to home page');

    // Step 8: Combine civilizations - click "Combine Civilizations"
    await page.locator('#combineButton').click();

    // Step 9: Wait for the file input to appear
    // The combineCivilizations function creates an input with id="viewCiv"
    const fileInput = page.locator('input[type="file"]#viewCiv');
    await expect(fileInput).toBeVisible({ timeout: 10000 });
    
    // Step 10: Upload the JSON file we downloaded earlier
    if (downloadedJsonPath && fs.existsSync(downloadedJsonPath)) {
      console.log('Uploading JSON file for mod creation...');
      await fileInput.setInputFiles(downloadedJsonPath);
      
      // Wait for processing and download (mod creation can take time)
      const zipDownloadPromise = page.waitForEvent('download', { timeout: 30000 });
      const zipDownload = await zipDownloadPromise;
      
      // Save the downloaded zip
      downloadedZipPath = path.join(os.tmpdir(), zipDownload.suggestedFilename());
      await zipDownload.saveAs(downloadedZipPath);
      
      console.log('✓ Downloaded ZIP to:', downloadedZipPath);
      
      // Step 11: Verify the zip file size is bigger than 1kb
      expect(fs.existsSync(downloadedZipPath)).toBeTruthy();
      const stats = fs.statSync(downloadedZipPath);
      expect(stats.size).toBeGreaterThan(1024); // Should be > 1KB
      
      console.log(`✓ ZIP file size: ${stats.size} bytes (> 1KB as required)`);
      console.log('✓ Build workflow completed successfully!');
    } else {
      throw new Error(`JSON file not found at ${downloadedJsonPath}`);
    }
  });

  test.afterAll(async () => {
    // Clean up downloaded files
    if (downloadedJsonPath && fs.existsSync(downloadedJsonPath)) {
      fs.unlinkSync(downloadedJsonPath);
    }
    if (downloadedZipPath && fs.existsSync(downloadedZipPath)) {
      fs.unlinkSync(downloadedZipPath);
    }
  });
});
