const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const os = require('os');

test.describe('Draft Workflow E2E Tests', () => {
  let downloadedZipPath;
  const NUM_BONUS_ROUNDS = 5; // Civ Bonuses, Unique Units, Castle Tech, Imperial Tech, Team Bonuses

  test('should complete the /draft workflow and create a mod', async ({ page }) => {
    // Step 1: Navigate to home page
    await page.goto('/');
    await expect(page.locator('h1#title')).toHaveText('Civilization Builder');

    // Step 2: Click "Create Draft" to enter draft creation
    await page.locator('#startDraft').click();

    // Step 3: Select "1" as "Number of Players" and "1" as "Bonuses Per Player"
    const numPlayersInput = page.locator('#numPlayersInput');
    await expect(numPlayersInput).toBeVisible({ timeout: 5000 });
    await numPlayersInput.fill('1');
    console.log('✓ Set number of players to 1');

    const roundsInput = page.locator('#roundsInput');
    await expect(roundsInput).toBeVisible({ timeout: 5000 });
    await roundsInput.fill('1');
    console.log('✓ Set bonuses per player to 1');

    // Step 4: Click "Start Draft" to confirm
    const startDraftButton = page.locator('input[type="submit"][value="Start Draft"]');
    await expect(startDraftButton).toBeVisible({ timeout: 5000 });
    await startDraftButton.click();

    // Step 5: Wait for "Draft Created!" message and find the "Host Link"
    // The draft creation redirects to a page showing the draft links
    
    // Look for the host link in the page
    // The page uses pug template draft_links.pug which shows links
    const hostLink = page.locator('a[href*="/draft/host/"]');
    await expect(hostLink.first()).toBeVisible({ timeout: 15000 });
    
    const hostLinkHref = await hostLink.first().getAttribute('href');
    console.log('✓ Draft created with host link:', hostLinkHref);
    expect(hostLinkHref).toMatch(/\/draft\/host\/\d+/);

    // Step 6: Navigate to the host link
    await page.goto(hostLinkHref);

    // Step 7: Enter player name and click "Join Draft"
    // The join page has an input with name="civ_name" and id="name"
    const playerNameInput = page.locator('input#name[name="civ_name"]');
    await expect(playerNameInput).toBeVisible({ timeout: 10000 });
    await playerNameInput.fill('TestPlayer');

    const joinButton = page.locator('input[type="submit"][value="Join Draft"]');
    await expect(joinButton).toBeVisible({ timeout: 5000 });
    await joinButton.click();
    console.log('✓ Joined draft as TestPlayer');

    // Step 8: The draft page should load with socket.io connection
    // After joining, we need to wait for the draft to be ready and start it
    // Since we're the only player, we should see a "Start Draft" button
    
    // Look for the Start Draft button in the draft page
    const startButton = page.locator('button:has-text("Start Draft")');
    await expect(startButton).toBeVisible({ timeout: 15000 });
    await startButton.click();
    console.log('✓ Started draft');

    // Step 9: After starting, the draft begins with flag/civ selection phase
    // This should be similar to the builder phase 1
    
    // Look for the alias input (civ name)
    const aliasInput = page.locator('#alias');
    await expect(aliasInput).toBeVisible({ timeout: 10000 });
    await aliasInput.fill('DraftTestCiv');
    
    // Click Next to proceed
    const nextButton = page.locator('button.readybutton:has-text("Next")');
    await expect(nextButton).toBeVisible({ timeout: 10000 });
    await nextButton.click();
    console.log('✓ Entered civ name and proceeded to bonus selection');

    // Step 10-15: Navigate through draft mode bonus selection
    // In draft mode, the order is determined by the game state
    // With 1 bonus per player, we'll go through each type once
    // The draft uses socket.io to manage state

    // We'll try to select bonuses by clicking on cards
    // The draft progresses automatically after each selection
    for (let round = 0; round < NUM_BONUS_ROUNDS; round++) {
      console.log(`Draft round ${round + 1}/${NUM_BONUS_ROUNDS}`);
      
      // Wait for cards to appear
      await page.waitForSelector('[id^="card"]', { timeout: 15000 });
      
      // Try to click on a card
      const card = page.locator('[id^="card"]').first();
      if (await card.count() > 0) {
        try {
          await card.click({ timeout: 5000 });
          console.log(`✓ Clicked card in round ${round + 1}`);
          // Brief wait for socket.io to process
          await page.waitForTimeout(500);
        } catch (e) {
          console.log(`⚠ Could not click card in round ${round + 1}: ${e.message}`);
          // Try to continue anyway as the draft might have progressed
        }
      } else {
        console.log(`⚠ No cards found in round ${round + 1}`);
      }
    }
    console.log('✓ Bonus selection rounds completed');

    // Step 16: After all bonuses, the tech tree should open
    // Look for the Done button which appears with the tech tree
    const doneButton = page.locator('button:has-text("Done"), #doneButton');
    await expect(doneButton).toBeVisible({ timeout: 15000 });
    
    // Try to click a tech if possible
    try {
      const techRect = page.locator('svg rect[fill]:not([fill="none"])').first();
      if (await techRect.count() > 0) {
        await techRect.click({ timeout: 5000 });
        console.log('✓ Clicked tech in tree');
      }
    } catch (e) {
      console.log('⚠ Could not click tech (this is optional, continuing...)');
    }
    
    // Click Done
    await doneButton.click();
    console.log('✓ Tech tree phase completed');

    // Step 17: Should be forwarded to "Creating Mod..." page
    // Wait for the "Creating Mod..." title
    const creatingModTitle = page.locator('h1:has-text("Creating Mod")');
    await expect(creatingModTitle).toBeVisible({ timeout: 15000 });
    console.log('✓ Mod creation started');

    // Step 18: Wait for navigation to "Mod Created" page
    // Mod creation can take some time - allow up to 30 seconds
    const modCreatedTitle = page.locator('h1:has-text("Mod Created")');
    await expect(modCreatedTitle).toBeVisible({ timeout: 30000 });
    console.log('✓ Mod created successfully');

    // Step 19: Click the "Download Mod" button (id="download")
    const downloadModButton = page.locator('button#download');
    await expect(downloadModButton).toBeVisible({ timeout: 5000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadModButton.click();
    const download = await downloadPromise;

    // Step 20: Save and verify the zip file
    downloadedZipPath = path.join(os.tmpdir(), download.suggestedFilename());
    await download.saveAs(downloadedZipPath);

    console.log('✓ Downloaded ZIP to:', downloadedZipPath);

    // Verify the zip file exists and size is > 1KB
    expect(fs.existsSync(downloadedZipPath)).toBeTruthy();
    const stats = fs.statSync(downloadedZipPath);
    expect(stats.size).toBeGreaterThan(1024);

    console.log(`✓ ZIP file size: ${stats.size} bytes (> 1KB as required)`);
    console.log('✓ Draft workflow completed successfully!');
  });

  test.afterAll(async () => {
    // Clean up downloaded files
    if (downloadedZipPath && fs.existsSync(downloadedZipPath)) {
      fs.unlinkSync(downloadedZipPath);
    }
  });
});
