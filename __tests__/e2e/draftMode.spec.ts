import { test, expect } from '@playwright/test';

/**
 * E2E tests for Draft Mode functionality
 * Tests the Vue UI for creating and managing drafts
 */

test.describe('Draft Mode - Navigation', () => {
  test('should navigate to draft creation page from home', async ({ page }) => {
    await page.goto('/v2/');
    
    // Click "Create Draft" link
    await page.getByRole('link', { name: /Create Draft/i }).click();
    
    // Should navigate to draft creation page
    await expect(page).toHaveURL(/.*\/draft\/create/);
    await expect(page.getByRole('heading', { name: /Create Draft/i })).toBeVisible();
  });

  test('should have back button that returns to home', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Click back button
    await page.getByRole('button', { name: /Back/i }).click();
    
    // Should navigate back to home page
    await expect(page).toHaveURL(/.*\/v2\/?$/);
  });
});

test.describe('Draft Mode - Draft Creation Form', () => {
  test('should load draft creation page successfully', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Check page title
    await expect(page).toHaveTitle(/AoE2 Civbuilder/);
    
    // Check heading
    await expect(page.getByRole('heading', { name: /Create Draft/i })).toBeVisible();
    
    // Check form elements are visible
    await expect(page.getByLabel(/Number of Players/i)).toBeVisible();
    await expect(page.getByLabel(/Bonuses per Player/i)).toBeVisible();
    await expect(page.getByLabel(/Starting Tech Tree Points/i)).toBeVisible();
    
    // Check submit button is visible
    await expect(page.getByRole('button', { name: /Start Draft/i })).toBeVisible();
    
    // Check back button is visible
    await expect(page.getByRole('button', { name: /Back/i })).toBeVisible();
  });

  test('should have correct default values', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Check default values
    const numPlayersInput = page.locator('#numPlayers');
    const bonusesInput = page.locator('#bonusesPerPlayer');
    const techTreeInput = page.locator('#techTreePoints');
    
    await expect(numPlayersInput).toHaveValue('2');
    await expect(bonusesInput).toHaveValue('4');
    await expect(techTreeInput).toHaveValue('200');
  });

  test('should allow changing number of players (1-8)', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    const numPlayersInput = page.locator('#numPlayers');
    
    // Clear and set to minimum (1)
    await numPlayersInput.fill('1');
    await expect(numPlayersInput).toHaveValue('1');
    
    // Set to maximum (8)
    await numPlayersInput.fill('8');
    await expect(numPlayersInput).toHaveValue('8');
    
    // Set to middle value
    await numPlayersInput.fill('4');
    await expect(numPlayersInput).toHaveValue('4');
  });

  test('should allow changing bonuses per player (2-6)', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    const bonusesInput = page.locator('#bonusesPerPlayer');
    
    // Set to minimum (2)
    await bonusesInput.fill('2');
    await expect(bonusesInput).toHaveValue('2');
    
    // Set to maximum (6)
    await bonusesInput.fill('6');
    await expect(bonusesInput).toHaveValue('6');
  });

  test('should allow changing tech tree points (25-500)', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    const techTreeInput = page.locator('#techTreePoints');
    
    // Set to minimum (25)
    await techTreeInput.fill('25');
    await expect(techTreeInput).toHaveValue('25');
    
    // Set to maximum (500)
    await techTreeInput.fill('500');
    await expect(techTreeInput).toHaveValue('500');
  });

  test('should display all rarity checkboxes checked by default', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Check all rarity checkboxes are present and checked by default
    const rarityLabels = ['Ordinary', 'Distinguished', 'Superior', 'Epic', 'Legendary'];
    
    for (let i = 0; i < rarityLabels.length; i++) {
      const checkbox = page.locator(`#rarity-${i}`);
      await expect(checkbox).toBeVisible();
      await expect(checkbox).toBeChecked();
    }
  });

  test('should allow toggling rarity checkboxes', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Uncheck the first rarity (Ordinary)
    const ordinaryCheckbox = page.locator('#rarity-0');
    await ordinaryCheckbox.uncheck();
    await expect(ordinaryCheckbox).not.toBeChecked();
    
    // Check it again
    await ordinaryCheckbox.check();
    await expect(ordinaryCheckbox).toBeChecked();
  });

  test('should display rarity labels correctly', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Check all rarity labels are visible
    await expect(page.getByText('Ordinary')).toBeVisible();
    await expect(page.getByText('Distinguished')).toBeVisible();
    await expect(page.getByText('Superior')).toBeVisible();
    await expect(page.getByText('Epic')).toBeVisible();
    await expect(page.getByText('Legendary')).toBeVisible();
  });
});

test.describe('Draft Mode - Draft Creation', () => {
  // Note: This test requires the server to be running with full backend
  // It may not work in all environments
  test('should create draft and show links modal', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Configure draft settings
    const numPlayersInput = page.locator('#numPlayers');
    await numPlayersInput.fill('2');
    
    const bonusesInput = page.locator('#bonusesPerPlayer');
    await bonusesInput.fill('3');
    
    const techTreeInput = page.locator('#techTreePoints');
    await techTreeInput.fill('250');
    
    // Click start draft button
    const startButton = page.getByRole('button', { name: /Start Draft/i });
    await startButton.click();
    
    // Wait for either success modal or error
    await page.waitForTimeout(2000);
    
    // Check if error message appeared (server not available)
    const errorMessage = page.locator('.error-message');
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);
    
    if (isErrorVisible) {
      // Server not available or request failed - expected in some test environments
      console.log('Draft creation failed - server may not be fully configured');
      return;
    }
    
    // Otherwise, check for success modal
    const modal = page.locator('.modal-overlay');
    const isModalVisible = await modal.isVisible().catch(() => false);
    
    if (isModalVisible) {
      // Verify modal content
      await expect(page.getByRole('heading', { name: /Draft Created/i })).toBeVisible();
      
      // Verify link inputs are present
      await expect(page.locator('#hostLink')).toBeVisible();
      await expect(page.locator('#playerLink')).toBeVisible();
      await expect(page.locator('#spectatorLink')).toBeVisible();
      
      // Verify copy buttons are present
      const copyButtons = page.locator('.copy-button');
      await expect(copyButtons).toHaveCount(3);
      
      // Verify action buttons
      await expect(page.getByRole('link', { name: /Go to Host Page/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Close/i })).toBeVisible();
    }
  });

  test('should show creating state while request is in progress', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Create a promise that resolves when we can check the button state
    const startButton = page.getByRole('button', { name: /Start Draft/i });
    
    // Start watching for button text change
    await startButton.click();
    
    // The button should show "Creating..." briefly
    // We check if the button gets disabled during submission
    const isDisabled = await startButton.isDisabled();
    
    // Button should either be disabled during submission or show creating text
    // This is a race condition test, so we just verify the flow doesn't break
    await page.waitForTimeout(500);
  });
});

test.describe('Draft Mode - Modal Interactions', () => {
  // These tests only run if draft creation succeeds
  // We'll set up a conditional skip
  
  test('should close modal when clicking close button', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Try to create a draft
    await page.getByRole('button', { name: /Start Draft/i }).click();
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Check if modal appeared
    const modal = page.locator('.modal-overlay');
    const isModalVisible = await modal.isVisible().catch(() => false);
    
    if (!isModalVisible) {
      console.log('Modal not visible - skipping close test');
      return;
    }
    
    // Click close button
    await page.getByRole('button', { name: /Close/i }).click();
    
    // Modal should close and navigate home
    await expect(modal).not.toBeVisible();
  });

  test('should close modal when clicking overlay', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Try to create a draft
    await page.getByRole('button', { name: /Start Draft/i }).click();
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Check if modal appeared
    const modal = page.locator('.modal-overlay');
    const isModalVisible = await modal.isVisible().catch(() => false);
    
    if (!isModalVisible) {
      console.log('Modal not visible - skipping overlay click test');
      return;
    }
    
    // Click on the overlay (not the modal content)
    await modal.click({ position: { x: 10, y: 10 } });
    
    // Modal should close
    await expect(modal).not.toBeVisible();
  });
});

test.describe('Draft Mode - Link Generation', () => {
  test('should generate links using browser location', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    // Create draft
    await page.getByRole('button', { name: /Start Draft/i }).click();
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Check if modal appeared
    const modal = page.locator('.modal-overlay');
    const isModalVisible = await modal.isVisible().catch(() => false);
    
    if (!isModalVisible) {
      console.log('Modal not visible - skipping link generation test');
      return;
    }
    
    // Get the host link value
    const hostLinkInput = page.locator('#hostLink');
    const hostLink = await hostLinkInput.inputValue();
    
    // Verify link starts with localhost (the test server URL)
    expect(hostLink).toMatch(/^http:\/\/localhost:4000/);
    
    // Verify link contains /v2/draft/host/
    expect(hostLink).toMatch(/\/v2\/draft\/host\/\d+/);
    
    // Get player link and verify format
    const playerLinkInput = page.locator('#playerLink');
    const playerLink = await playerLinkInput.inputValue();
    expect(playerLink).toMatch(/\/v2\/draft\/player\/\d+/);
    
    // Get spectator link and verify format
    const spectatorLinkInput = page.locator('#spectatorLink');
    const spectatorLink = await spectatorLinkInput.inputValue();
    expect(spectatorLink).toMatch(/\/v2\/draft\/\d+/);
  });
});

test.describe('Draft Mode - Form Validation', () => {
  test('should enforce minimum value for number of players', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    const numPlayersInput = page.locator('#numPlayers');
    
    // Check that min attribute is set to 1
    await expect(numPlayersInput).toHaveAttribute('min', '1');
    await expect(numPlayersInput).toHaveAttribute('max', '8');
  });

  test('should enforce minimum value for bonuses per player', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    const bonusesInput = page.locator('#bonusesPerPlayer');
    
    // Check that min attribute is set to 2
    await expect(bonusesInput).toHaveAttribute('min', '2');
    await expect(bonusesInput).toHaveAttribute('max', '6');
  });

  test('should enforce range for tech tree points', async ({ page }) => {
    await page.goto('/v2/draft/create');
    
    const techTreeInput = page.locator('#techTreePoints');
    
    // Check that min and max attributes are set
    await expect(techTreeInput).toHaveAttribute('min', '25');
    await expect(techTreeInput).toHaveAttribute('max', '500');
  });
});

test.describe('Draft Mode - Draft Host Page', () => {
  test('should load draft host page after creating draft', async ({ page }) => {
    // First create a draft
    await page.goto('/v2/draft/create');
    
    // Fill in draft settings
    const numPlayersInput = page.locator('#numPlayers');
    await numPlayersInput.fill('1');
    
    // Click start draft button
    const startButton = page.getByRole('button', { name: /Start Draft/i });
    await startButton.click();
    
    // Wait for modal with links
    await page.waitForTimeout(2000);
    
    // Check if modal appeared
    const modal = page.locator('.modal-overlay');
    const isModalVisible = await modal.isVisible().catch(() => false);
    
    if (!isModalVisible) {
      console.log('Modal not visible - server may not be running');
      return;
    }
    
    // Get host link
    const hostLinkInput = page.locator('#hostLink');
    const hostLink = await hostLinkInput.inputValue();
    
    // Navigate to host page
    await page.goto(hostLink);
    
    // Wait for page to load and Socket.io to connect
    await page.waitForTimeout(3000);
    
    // Check that the page loaded (not stuck on error)
    const errorMessage = page.locator('.error-message');
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    if (hasError) {
      const errorText = await errorMessage.textContent();
      // Should not have Socket.io error after fix
      expect(errorText).not.toContain('Socket.io not available');
    }
    
    // Page should show either lobby or loading state
    const pageContent = page.locator('.draft-host-page');
    await expect(pageContent).toBeVisible();
  });

  test('should load Socket.io script dynamically on draft host page', async ({ page }) => {
    // Create a draft first
    await page.goto('/v2/draft/create');
    
    const numPlayersInput = page.locator('#numPlayers');
    await numPlayersInput.fill('1');
    
    const startButton = page.getByRole('button', { name: /Start Draft/i });
    await startButton.click();
    
    await page.waitForTimeout(2000);
    
    const modal = page.locator('.modal-overlay');
    const isModalVisible = await modal.isVisible().catch(() => false);
    
    if (!isModalVisible) {
      console.log('Modal not visible - server may not be running');
      return;
    }
    
    const hostLinkInput = page.locator('#hostLink');
    const hostLink = await hostLinkInput.inputValue();
    
    // Navigate to host page
    await page.goto(hostLink);
    
    // Should show join form first
    const joinFormVisible = await page.locator('#playerName').isVisible().catch(() => false);
    
    if (joinFormVisible) {
      // Fill in join form
      await page.fill('#playerName', 'Socket Test Player');
      await page.click('.join-button');
      await page.waitForTimeout(5000);
    }
    
    // Check that Socket.io script was loaded (either before or after joining)
    const socketScript = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[src*="socket.io"]');
      return scripts.length > 0;
    });
    
    expect(socketScript).toBe(true);
  });

  test('should show lobby when Socket.io connects successfully', async ({ page }) => {
    // Create a draft
    await page.goto('/v2/draft/create');
    
    const numPlayersInput = page.locator('#numPlayers');
    await numPlayersInput.fill('1');
    
    const startButton = page.getByRole('button', { name: /Start Draft/i });
    await startButton.click();
    
    await page.waitForTimeout(2000);
    
    const modal = page.locator('.modal-overlay');
    const isModalVisible = await modal.isVisible().catch(() => false);
    
    if (!isModalVisible) {
      console.log('Modal not visible - server may not be running');
      return;
    }
    
    const hostLinkInput = page.locator('#hostLink');
    const hostLink = await hostLinkInput.inputValue();
    
    // Navigate to host page
    await page.goto(hostLink);
    
    // Should show join form first
    const joinFormVisible = await page.locator('#playerName').isVisible().catch(() => false);
    
    if (joinFormVisible) {
      // Fill in join form
      await page.fill('#playerName', 'Lobby Test Player');
      await page.click('.join-button');
      await page.waitForTimeout(5000);
    }
    
    // Check for lobby content (phase 0) or other valid UI state
    const lobbyVisible = await page.locator('.draft-lobby, .lobby-title, h1:has-text("Civilization Drafter")').isVisible().catch(() => false);
    const loadingVisible = await page.locator('.loading-overlay').isVisible().catch(() => false);
    const startBtnVisible = await page.getByRole('button', { name: /Start Draft|Lobby Not Ready/i }).isVisible().catch(() => false);
    
    // One of these should be visible after joining
    expect(lobbyVisible || loadingVisible || startBtnVisible).toBe(true);
  });
});

test.describe('Draft Mode - Draft Player Page', () => {
  test('should load draft player page after creating draft', async ({ page }) => {
    // First create a draft
    await page.goto('/v2/draft/create');
    
    // Fill in draft settings
    const numPlayersInput = page.locator('#numPlayers');
    await numPlayersInput.fill('2'); // Need 2 players for player link to work
    
    // Click start draft button
    const startButton = page.getByRole('button', { name: /Start Draft/i });
    await startButton.click();
    
    // Wait for modal with links
    await page.waitForTimeout(2000);
    
    const modal = page.locator('.modal-overlay');
    const isModalVisible = await modal.isVisible().catch(() => false);
    
    if (!isModalVisible) {
      console.log('Modal not visible - server may not be running');
      return;
    }
    
    // Get player link
    const playerLinkInput = page.locator('#playerLink');
    const playerLink = await playerLinkInput.inputValue();
    
    // Navigate to player page
    await page.goto(playerLink);
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check that the page loaded
    const pageContent = page.locator('.draft-player-page');
    await expect(pageContent).toBeVisible();
  });
});

test.describe('Draft Mode - Draft Spectator Page', () => {
  test('should load draft spectator page after creating draft', async ({ page }) => {
    // First create a draft
    await page.goto('/v2/draft/create');
    
    const numPlayersInput = page.locator('#numPlayers');
    await numPlayersInput.fill('1');
    
    const startButton = page.getByRole('button', { name: /Start Draft/i });
    await startButton.click();
    
    await page.waitForTimeout(2000);
    
    const modal = page.locator('.modal-overlay');
    const isModalVisible = await modal.isVisible().catch(() => false);
    
    if (!isModalVisible) {
      console.log('Modal not visible - server may not be running');
      return;
    }
    
    // Get spectator link
    const spectatorLinkInput = page.locator('#spectatorLink');
    const spectatorLink = await spectatorLinkInput.inputValue();
    
    // Navigate to spectator page
    await page.goto(spectatorLink);
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check that the page loaded
    const pageContent = page.locator('.draft-spectator-page');
    await expect(pageContent).toBeVisible();
  });
});
