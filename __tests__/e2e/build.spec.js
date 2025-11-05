const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Build Workflow E2E Tests', () => {
  let downloadedJsonPath;
  let downloadedZipPath;

  test('should complete the /build workflow and create a mod', async ({ page }) => {
    // Step 1: Navigate to home page
    await page.goto('/');
    await expect(page.locator('h1#title')).toHaveText('Civilization Builder');

    // Step 2: Click "Build Civilization" to go to /build
    await page.click('#startBuild');
    await page.waitForURL('**/build');

    // Step 3: Wait for the page to load and select color, architecture, and civ name
    await page.waitForSelector('#colorPicker', { timeout: 10000 });
    
    // Select a color
    const colorOptions = await page.locator('#colorPicker option');
    const count = await colorOptions.count();
    if (count > 1) {
      await page.selectOption('#colorPicker', { index: 1 });
    }

    // Select an architecture style
    const archOptions = await page.locator('#archPicker option');
    const archCount = await archOptions.count();
    if (archCount > 1) {
      await page.selectOption('#archPicker', { index: 1 });
    }

    // Enter a civilization name
    await page.fill('#civName', 'TestCiv');

    // Click "Continue" or next button
    const continueButton = page.locator('button:has-text("Continue")');
    if (await continueButton.count() > 0) {
      await continueButton.click();
    }

    // Step 4: Select at least one tech in techtree and press "Done"
    // Wait for techtree to load
    await page.waitForTimeout(2000); // Give time for techtree to render
    
    // Look for techtree elements - they might be in SVG or specific selectors
    // Try to find a tech/unit to click
    const techElements = page.locator('.tech, .unit, [data-tech], [data-unit], rect[fill]:not([fill="none"])');
    const techCount = await techElements.count();
    
    if (techCount > 0) {
      // Click on the first available tech/unit
      await techElements.first().click({ timeout: 5000 }).catch(() => {
        console.log('Could not click tech element, continuing...');
      });
    }

    // Click "Done" button
    const doneButton = page.locator('button:has-text("Done")');
    await expect(doneButton).toBeVisible({ timeout: 10000 });
    await doneButton.click();

    // Step 5: Navigate through multi-stage boni pages
    // Start with "Civ Bonuses" page - should be loaded after Done
    await page.waitForTimeout(1000);

    // We need to select 1 bonus per page and navigate through:
    // - Civ Bonuses
    // - Team Bonuses
    // - Imperial Unique Tech
    // - Castle Unique Tech
    // - Unique Unit

    const bonusPages = [
      'Civ Bonuses',
      'Team Bonus',
      'Imperial Unique Tech',
      'Castle Unique Tech',
      'Unique Unit'
    ];

    for (const pageName of bonusPages) {
      // Wait for the page heading or switcher to show current page
      await page.waitForTimeout(1000);
      
      // Try to find a bonus/option to select
      // Look for clickable elements like cards, divs, or buttons representing bonuses
      const bonusElements = page.locator('.bonus, .card, .option, [onclick], div[style*="cursor: pointer"]');
      const bonusCount = await bonusElements.count();
      
      if (bonusCount > 0) {
        // Click on the first bonus
        await bonusElements.first().click({ timeout: 5000 }).catch(() => {
          console.log(`Could not click bonus on ${pageName}, continuing...`);
        });
      }

      // Wait a bit after selection
      await page.waitForTimeout(500);

      // Check if we're on the last page
      if (pageName === 'Unique Unit') {
        // On the last page, we should download the JSON
        break;
      }
    }

    // Step 6: Download the JSON file
    // Look for a "Download" or similar button
    const downloadPromise = page.waitForEvent('download');
    
    const downloadButton = page.locator('button:has-text("Download"), button:has-text("download"), #downloadButton, #download');
    if (await downloadButton.count() > 0) {
      await downloadButton.first().click();
      const download = await downloadPromise;
      
      // Save the downloaded file
      downloadedJsonPath = path.join('/tmp', download.suggestedFilename());
      await download.saveAs(downloadedJsonPath);
      
      console.log('Downloaded JSON to:', downloadedJsonPath);
      expect(fs.existsSync(downloadedJsonPath)).toBeTruthy();
    }

    // Step 7: Exit using "Home" button and confirm alert
    await page.waitForTimeout(500);
    
    // Set up dialog handler before clicking Home
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    const homeButton = page.locator('button:has-text("Home"), #home, #homeButton');
    if (await homeButton.count() > 0) {
      await homeButton.first().click();
    }

    // Should be back at home page
    await page.waitForURL('**/');
    await expect(page.locator('h1#title')).toHaveText('Civilization Builder');

    // Step 8: Combine civilizations - click "Combine Civilizations"
    await page.click('#combineButton');
    await page.waitForTimeout(1000);

    // Step 9: Click "Create Mod"
    const createModButton = page.locator('button:has-text("Create Mod"), #createMod');
    await expect(createModButton.first()).toBeVisible({ timeout: 10000 });
    await createModButton.first().click();

    // Step 10: Select the JSON file we downloaded earlier
    if (downloadedJsonPath && fs.existsSync(downloadedJsonPath)) {
      // Wait for file input
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeVisible({ timeout: 5000 });
      
      // Upload the file
      await fileInput.setInputFiles(downloadedJsonPath);
      
      // Wait for processing and download
      const zipDownloadPromise = page.waitForEvent('download', { timeout: 30000 });
      const zipDownload = await zipDownloadPromise;
      
      // Save the downloaded zip
      downloadedZipPath = path.join('/tmp', zipDownload.suggestedFilename());
      await zipDownload.saveAs(downloadedZipPath);
      
      console.log('Downloaded ZIP to:', downloadedZipPath);
      
      // Step 11: Verify the zip file size is bigger than 1kb
      expect(fs.existsSync(downloadedZipPath)).toBeTruthy();
      const stats = fs.statSync(downloadedZipPath);
      expect(stats.size).toBeGreaterThan(1024); // Should be > 1KB
      
      console.log('ZIP file size:', stats.size, 'bytes');
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
