const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

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
    // Look for input fields or selectors for these values
    const numPlayersInput = page.locator('input[type="number"], select, #numPlayers, #playerCount');
    if (await numPlayersInput.count() > 0) {
      const firstInput = numPlayersInput.first();
      const tagName = await firstInput.evaluate(el => el.tagName.toLowerCase());
      
      if (tagName === 'select') {
        await firstInput.selectOption('1');
      } else {
        await firstInput.fill('1');
      }
    }

    const bonusesPerPlayerInput = page.locator('#bonusesPerPlayer, #numBonuses, input[type="number"]').nth(1);
    if (await bonusesPerPlayerInput.count() > 0) {
      const tagName = await bonusesPerPlayerInput.evaluate(el => el.tagName.toLowerCase());
      
      if (tagName === 'select') {
        await bonusesPerPlayerInput.selectOption('1');
      } else {
        await bonusesPerPlayerInput.fill('1');
      }
    }

    // Step 4: Click "Start Draft" to confirm
    const startDraftButton = page.locator('button:has-text("Start Draft")');
    await expect(startDraftButton.first()).toBeVisible({ timeout: 10000 });
    await startDraftButton.first().click();

    // Step 5: Wait for "Draft Created!" message and find the "Host Link"
    await expect(page.locator('text=Draft Created!')).toBeVisible({ timeout: 10000 });

    // Find the host link - it should be in format http://127.0.0.1:4000/draft/host/[id]
    const hostLink = page.locator('a[href*="/draft/host/"], input[value*="/draft/host/"]');
    await expect(hostLink.first()).toBeVisible({ timeout: 5000 });
    
    const hostLinkHref = await hostLink.first().evaluate(el => {
      if (el.tagName === 'A') {
        return el.href;
      } else if (el.tagName === 'INPUT') {
        return el.value;
      }
      return el.textContent;
    });

    console.log('Host link:', hostLinkHref);
    expect(hostLinkHref).toMatch(/\/draft\/host\/\d+/);

    // Step 6: Navigate to the host link
    await page.goto(hostLinkHref);
    await page.waitForTimeout(1000);

    // Step 7: Enter player name and click "Join Draft"
    const playerNameInput = page.locator('input[type="text"], #playerName, #name');
    if (await playerNameInput.count() > 0) {
      await playerNameInput.first().fill('TestPlayer');
    }

    const joinButton = page.locator('button:has-text("Join Draft"), button:has-text("Join")');
    if (await joinButton.count() > 0) {
      await joinButton.first().click();
      await page.waitForTimeout(1000);
    }

    // Step 8: Since we're just 1 player, click "Start Draft" button
    const startButton = page.locator('button:has-text("Start Draft"), button:has-text("Start")');
    if (await startButton.count() > 0) {
      await startButton.first().click();
      await page.waitForTimeout(1000);
    }

    // Step 9: Select flag, civ style, and civ name
    // Similar to build workflow
    await page.waitForTimeout(1000);

    // Select a color/flag
    const colorOptions = page.locator('#colorPicker option, select option');
    if (await colorOptions.count() > 1) {
      await page.selectOption('select', { index: 1 });
    }

    // Select architecture style if available
    const archSelect = page.locator('#archPicker, select').nth(1);
    if (await archSelect.count() > 0) {
      const archOptions = await archSelect.locator('option');
      if (await archOptions.count() > 1) {
        await archSelect.selectOption({ index: 1 });
      }
    }

    // Enter civ name
    const civNameInput = page.locator('#civName, input[type="text"]');
    if (await civNameInput.count() > 0) {
      await civNameInput.first().fill('DraftTestCiv');
    }

    // Click continue
    const continueButton = page.locator('button:has-text("Continue")');
    if (await continueButton.count() > 0) {
      await continueButton.click();
      await page.waitForTimeout(1000);
    }

    // Step 10-15: Navigate through draft mode bonus selection
    // The order is: Civ Boni -> Unique Units -> Unique Techs: Castle -> 
    // Unique Techs: Imperial -> Team Bonuses -> Tech Tree

    const draftPages = [
      { name: 'Civ Boni', hasOptions: true },
      { name: 'Unique Units', hasOptions: true },
      { name: 'Unique Techs: Castle', hasOptions: true },
      { name: 'Unique Techs: Imperial', hasOptions: true },
      { name: 'Team Bonuses', hasOptions: true },
    ];

    for (const { name, hasOptions } of draftPages) {
      console.log('Processing draft page:', name);
      await page.waitForTimeout(1000);

      if (hasOptions) {
        // Try to find and click a bonus/option
        const options = page.locator('.bonus, .card, .option, [onclick], div[style*="cursor"]');
        const optionCount = await options.count();
        
        if (optionCount > 0) {
          await options.first().click({ timeout: 5000 }).catch(() => {
            console.log(`Could not click option on ${name}, continuing...`);
          });
        }
      }

      await page.waitForTimeout(500);
    }

    // Step 16: Now the tech tree should open - select one tech and press "Done"
    await page.waitForTimeout(2000);

    const techElements = page.locator('.tech, .unit, [data-tech], [data-unit], rect[fill]:not([fill="none"])');
    const techCount = await techElements.count();
    
    if (techCount > 0) {
      await techElements.first().click({ timeout: 5000 }).catch(() => {
        console.log('Could not click tech element, continuing...');
      });
    }

    // Click "Done" button
    const doneButton = page.locator('button:has-text("Done")');
    if (await doneButton.count() > 0) {
      await doneButton.click();
    }

    // Step 17: Should be forwarded to "Creating Mod..." page
    await expect(page.locator('text=Creating Mod')).toBeVisible({ timeout: 10000 });

    // Step 18: Wait for navigation to "Mod Created" page
    await expect(page.locator('text=Mod Created')).toBeVisible({ timeout: 30000 });

    // Step 19: Click the "Download MOD" button
    const downloadModButton = page.locator('button:has-text("Download MOD"), button:has-text("Download")');
    await expect(downloadModButton.first()).toBeVisible({ timeout: 10000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadModButton.first().click();
    const download = await downloadPromise;

    // Step 20: Save and verify the zip file
    downloadedZipPath = path.join('/tmp', download.suggestedFilename());
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
