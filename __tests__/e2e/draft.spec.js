const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const os = require('os');

test.describe('Draft Workflow E2E Tests', () => {
  let downloadedZipPath;

  test('should complete the /draft workflow and create a mod', async ({ page }) => {
    // Step 1: Navigate to home page
    await page.goto('/');
    await expect(page.locator('h1#title')).toHaveText('Civilization Builder');

    // Step 2: Click "Create Draft" to enter draft creation
    await page.click('#startDraft');
    await page.waitForTimeout(1000);

    // Step 3: Select "1" as "Number of Players" and "1" as "Bonuses Per Player"
    const numPlayersInput = page.locator('#numPlayersInput');
    await expect(numPlayersInput).toBeVisible({ timeout: 5000 });
    await numPlayersInput.fill('1');

    const roundsInput = page.locator('#roundsInput');
    await expect(roundsInput).toBeVisible({ timeout: 5000 });
    await roundsInput.fill('1');

    // Step 4: Click "Start Draft" to confirm
    const startDraftButton = page.locator('input[type="submit"][value="Start Draft"]');
    await expect(startDraftButton).toBeVisible({ timeout: 5000 });
    await startDraftButton.click();

    // Step 5: Wait for "Draft Created!" message and find the "Host Link"
    // The draft creation redirects to a page showing the draft links
    await page.waitForTimeout(2000);
    
    // Look for the host link in the page
    // The page uses pug template draft_links.pug which shows links
    const hostLink = page.locator('a[href*="/draft/host/"]');
    await expect(hostLink.first()).toBeVisible({ timeout: 10000 });
    
    const hostLinkHref = await hostLink.first().getAttribute('href');
    console.log('Host link:', hostLinkHref);
    expect(hostLinkHref).toMatch(/\/draft\/host\/\d+/);

    // Step 6: Navigate to the host link
    await page.goto(hostLinkHref);
    await page.waitForTimeout(1000);

    // Step 7: Enter player name and click "Join Draft"
    // The join page has an input with name="civ_name" and id="name"
    const playerNameInput = page.locator('input#name[name="civ_name"]');
    await expect(playerNameInput).toBeVisible({ timeout: 5000 });
    await playerNameInput.fill('TestPlayer');

    const joinButton = page.locator('input[type="submit"][value="Join Draft"]');
    await expect(joinButton).toBeVisible({ timeout: 5000 });
    await joinButton.click();
    await page.waitForTimeout(2000);

    // Step 8: The draft page should load with socket.io connection
    // After joining, we need to wait for the draft to be ready and start it
    // Since we're the only player, we should see a "Start Draft" button
    await page.waitForTimeout(2000);
    
    // Look for the Start Draft button in the draft page
    const startButton = page.locator('button:has-text("Start Draft")');
    if (await startButton.count() > 0) {
      await startButton.click();
      await page.waitForTimeout(2000);
    }

    // Step 9: After starting, the draft begins with flag/civ selection phase
    // This should be similar to the builder phase 1
    await page.waitForTimeout(2000);
    
    // Look for the alias input (civ name)
    const aliasInput = page.locator('#alias');
    if (await aliasInput.count() > 0) {
      await aliasInput.fill('DraftTestCiv');
      
      // Click Next to proceed
      const nextButton = page.locator('button.readybutton:has-text("Next")');
      if (await nextButton.count() > 0) {
        await nextButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Step 10-15: Navigate through draft mode bonus selection
    // In draft mode, the order is determined by the game state
    // With 1 bonus per player, we'll go through each type once
    // The draft uses socket.io to manage state
    
    await page.waitForTimeout(2000);

    // We'll try to select bonuses by clicking on cards
    // The draft progresses automatically after each selection
    for (let round = 0; round < 5; round++) {
      console.log('Draft round:', round);
      
      // Wait for cards to appear
      await page.waitForTimeout(1500);
      
      // Try to click on a card
      const card = page.locator('[id^="card"]').first();
      if (await card.count() > 0) {
        try {
          await card.click({ timeout: 3000 });
          console.log('Clicked card in round', round);
          await page.waitForTimeout(1000);
        } catch (e) {
          console.log(`Could not click card in round ${round}, continuing...`);
        }
      }
    }

    // Step 16: After all bonuses, the tech tree should open
    await page.waitForTimeout(3000);

    // Look for the Done button which appears with the tech tree
    const doneButton = page.locator('button:has-text("Done"), #doneButton');
    if (await doneButton.count() > 0) {
      // Try to click a tech if possible
      try {
        const techRect = page.locator('svg rect[fill]:not([fill="none"])').first();
        if (await techRect.count() > 0) {
          await techRect.click({ timeout: 2000 });
        }
      } catch (e) {
        console.log('Could not click tech, continuing...');
      }
      
      // Click Done
      await doneButton.click();
      await page.waitForTimeout(1000);
    }

    // Step 17: Should be forwarded to "Creating Mod..." page
    await page.waitForTimeout(2000);
    
    // Wait for the "Creating Mod..." title
    const creatingModTitle = page.locator('h1:has-text("Creating Mod")');
    await expect(creatingModTitle).toBeVisible({ timeout: 15000 });
    console.log('Creating mod...');

    // Step 18: Wait for navigation to "Mod Created" page
    const modCreatedTitle = page.locator('h1:has-text("Mod Created")');
    await expect(modCreatedTitle).toBeVisible({ timeout: 60000 }); // Give up to 60 seconds for mod creation
    console.log('Mod created!');

    // Step 19: Click the "Download Mod" button (id="download")
    const downloadModButton = page.locator('button#download');
    await expect(downloadModButton).toBeVisible({ timeout: 5000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadModButton.click();
    const download = await downloadPromise;

    // Step 20: Save and verify the zip file
    downloadedZipPath = path.join(os.tmpdir(), download.suggestedFilename());
    await download.saveAs(downloadedZipPath);

    console.log('Downloaded ZIP to:', downloadedZipPath);

    // Verify the zip file exists and size is > 1KB
    expect(fs.existsSync(downloadedZipPath)).toBeTruthy();
    const stats = fs.statSync(downloadedZipPath);
    expect(stats.size).toBeGreaterThan(1024);

    console.log('ZIP file size:', stats.size, 'bytes');
  });

  test.afterAll(async () => {
    // Clean up downloaded files
    if (downloadedZipPath && fs.existsSync(downloadedZipPath)) {
      fs.unlinkSync(downloadedZipPath);
    }
  });
});
