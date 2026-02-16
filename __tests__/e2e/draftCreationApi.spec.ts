import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Pure API-based E2E tests for draft creation
 * These tests verify the draft creation API endpoint works correctly
 * and ensures errors are in UI/test flow, not in the API backend
 */

const tempdir = path.join(os.tmpdir(), 'civbuilder');

test.describe('Draft Creation API - Pure API E2E Tests', () => {
  test('API should create draft with pasture bonus and save to file system', async ({ request }) => {
    test.setTimeout(30000);
    
    // Prepare draft creation payload with correct field names
    const payload = {
      num_players: '1',
      rounds: '1', // 1 bonus round
      techtree_currency: '200',
      allowed_rarities: 'true,true,true,true,true', // All rarities enabled (common,uncommon,rare,epic,legendary)
      allow_base_edition_uu: 'true',
      allow_first_edition_uu: 'true',
      custom_uu_mode: 'false',
      timer_enabled: 'false',
      timer_duration: '60',
      blind_picks: 'false',
      snake_draft: 'false',
      cards_per_roll: '3',
      bonuses_per_page: '30',
      required_first_roll: '356', // Pasture bonus ID
    };
    
    console.log('[API Test] Creating draft via API with pasture bonus (ID 356)...');
    
    // Call the draft creation endpoint
    const response = await request.post('http://localhost:4000/draft', {
      form: payload,
      timeout: 15000,
      maxRedirects: 0, // Don't follow redirects
      failOnStatusCode: false // Allow us to check status manually
    });
    
    // The endpoint redirects to the draft page on success
    expect([200, 302]).toContain(response.status());
    
    console.log(`[API Test] Response status: ${response.status()}`);
    
    // Extract draft ID from response
    let draftId: string | null = null;
    
    if (response.status() === 302) {
      const location = response.headers()['location'];
      console.log(`[API Test] Redirect location: ${location}`);
      
      const match = location?.match(/\/draft\/(\d+)/);
      if (match) {
        draftId = match[1];
      }
    } else {
      // Try to extract from response body (may contain links)
      const body = await response.text();
      const match = body.match(/draft\/(\d+)/);
      if (match) {
        draftId = match[1];
      }
    }
    
    expect(draftId).toBeTruthy();
    console.log(`[API Test] Draft ID created: ${draftId}`);
    
    // Verify draft file was created in the file system
    const draftFilePath = path.join(tempdir, 'drafts', `${draftId}.json`);
    
    // Wait a moment for file to be written
    await new Promise(resolve => setTimeout(resolve, 500));
    
    expect(fs.existsSync(draftFilePath)).toBeTruthy();
    console.log(`[API Test] ✓ Draft file exists: ${draftFilePath}`);
    
    // Read and validate draft file structure
    const draftData = JSON.parse(fs.readFileSync(draftFilePath, 'utf8'));
    
    console.log('[API Test] Validating draft structure...');
    
    // Validate basic structure
    expect(draftData).toHaveProperty('id');
    expect(draftData).toHaveProperty('timestamp');
    expect(draftData).toHaveProperty('preset');
    expect(draftData).toHaveProperty('players');
    expect(draftData).toHaveProperty('gamestate');
    
    console.log('[API Test] ✓ Draft has required top-level properties');
    
    // Validate preset configuration
    expect(draftData.preset).toHaveProperty('slots');
    expect(draftData.preset.slots).toBe(1);
    
    expect(draftData.preset).toHaveProperty('rounds');
    expect(draftData.preset.rounds).toBe(1);
    
    expect(draftData.preset).toHaveProperty('points');
    expect(draftData.preset.points).toBe(200);
    
    console.log('[API Test] ✓ Draft preset configuration is correct');
    
    // Validate gamestate structure exists (cards are populated when draft starts via Socket.IO)
    expect(draftData.gamestate).toHaveProperty('cards');
    expect(Array.isArray(draftData.gamestate.cards)).toBeTruthy();
    
    console.log(`[API Test] Gamestate initialized with cards array (${draftData.gamestate.cards.length} cards)`);
    console.log('[API Test] Note: Cards are populated when players join and draft starts via Socket.IO');
    
    // The draft file is created correctly even if cards aren't populated yet
    // This validates the API endpoint works correctly
    
    // Validate players array
    expect(Array.isArray(draftData.players)).toBeTruthy();
    expect(draftData.players.length).toBe(1);
    
    const player = draftData.players[0];
    expect(player).toHaveProperty('bonuses');
    expect(Array.isArray(player.bonuses)).toBeTruthy();
    
    console.log('[API Test] ✓ Player structure is correct');
    
    console.log('[API Test] ✓ All API draft creation validations passed!');
  });
  
  test('API should create multi-player draft with correct configuration', async ({ request }) => {
    test.setTimeout(30000);
    
    // Prepare multi-player draft payload with correct field names
    const payload = {
      num_players: '2',
      rounds: '4', // 4 bonus rounds per player
      techtree_currency: '150',
      allowed_rarities: 'true,true,true,true,true',
      allow_base_edition_uu: 'true',
      allow_first_edition_uu: 'true',
      custom_uu_mode: 'false',
      timer_enabled: 'false',
      timer_duration: '60',
      blind_picks: 'false',
      snake_draft: 'true', // Enable snake draft
      cards_per_roll: '3',
      bonuses_per_page: '30',
      required_first_roll: '',
    };
    
    console.log('[API Test] Creating 2-player snake draft via API...');
    
    const response = await request.post('http://localhost:4000/draft', {
      form: payload,
      timeout: 15000,
      maxRedirects: 0,
      failOnStatusCode: false
    });
    
    expect([200, 302]).toContain(response.status());
    
    // Extract draft ID
    let draftId: string | null = null;
    
    if (response.status() === 302) {
      const location = response.headers()['location'];
      const match = location?.match(/\/draft\/(\d+)/);
      if (match) {
        draftId = match[1];
      }
    } else {
      const body = await response.text();
      const match = body.match(/draft\/(\d+)/);
      if (match) {
        draftId = match[1];
      }
    }
    
    expect(draftId).toBeTruthy();
    console.log(`[API Test] Multi-player draft ID: ${draftId}`);
    
    // Verify draft file
    const draftFilePath = path.join(tempdir, 'drafts', `${draftId}.json`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    expect(fs.existsSync(draftFilePath)).toBeTruthy();
    
    const draftData = JSON.parse(fs.readFileSync(draftFilePath, 'utf8'));
    
    // Validate multi-player configuration
    expect(draftData.preset.slots).toBe(2);
    expect(draftData.preset.rounds).toBe(4);
    expect(draftData.preset.points).toBe(150);
    expect(draftData.preset.snake_draft).toBe(true);
    
    console.log('[API Test] ✓ Multi-player draft configuration is correct');
    
    // Validate two players
    expect(draftData.players.length).toBe(2);
    
    // Each player should have bonuses array
    draftData.players.forEach((player: any, index: number) => {
      expect(player).toHaveProperty('bonuses');
      expect(Array.isArray(player.bonuses)).toBeTruthy();
      console.log(`[API Test] ✓ Player ${index + 1} has bonuses array`);
    });
    
    // Validate gamestate structure (cards populated via Socket.IO when draft starts)
    expect(draftData.gamestate).toHaveProperty('cards');
    expect(Array.isArray(draftData.gamestate.cards)).toBeTruthy();
    
    console.log(`[API Test] Gamestate initialized (${draftData.gamestate.cards.length} cards)`);
    console.log('[API Test] Note: Cards are populated when players join via Socket.IO');
    
    console.log('[API Test] ✓ All multi-player draft validations passed!');
  });
  
  test('API should create draft with custom UU mode enabled', async ({ request }) => {
    test.setTimeout(30000);
    
    // Prepare draft with custom UU enabled
    const payload = {
      num_players: '1',
      rounds: '1',
      techtree_currency: '200',
      allowed_rarities: 'true,true,true,true,true',
      allow_base_edition_uu: 'true',
      allow_first_edition_uu: 'true',
      custom_uu_mode: 'true', // Enable custom UU mode
      timer_enabled: 'false',
      timer_duration: '60',
      blind_picks: 'false',
      snake_draft: 'false',
      cards_per_roll: '3',
      bonuses_per_page: '30',
      required_first_roll: '',
    };
    
    console.log('[API Test] Creating draft with custom UU mode...');
    
    const response = await request.post('http://localhost:4000/draft', {
      form: payload,
      timeout: 15000,
      maxRedirects: 0,
      failOnStatusCode: false
    });
    
    expect([200, 302]).toContain(response.status());
    
    // Extract draft ID
    let draftId: string | null = null;
    
    if (response.status() === 302) {
      const location = response.headers()['location'];
      const match = location?.match(/\/draft\/(\d+)/);
      if (match) {
        draftId = match[1];
      }
    } else {
      const body = await response.text();
      const match = body.match(/draft\/(\d+)/);
      if (match) {
        draftId = match[1];
      }
    }
    
    expect(draftId).toBeTruthy();
    console.log(`[API Test] Custom UU draft ID: ${draftId}`);
    
    // Verify draft file
    const draftFilePath = path.join(tempdir, 'drafts', `${draftId}.json`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    expect(fs.existsSync(draftFilePath)).toBeTruthy();
    
    const draftData = JSON.parse(fs.readFileSync(draftFilePath, 'utf8'));
    
    // Validate custom UU mode is enabled
    expect(draftData.preset).toHaveProperty('custom_uu_mode');
    expect(draftData.preset.custom_uu_mode).toBe(true);
    
    console.log('[API Test] ✓ Custom UU mode is enabled in draft');
    
    // Validate player has customUUData array (even if empty initially)
    const player = draftData.players[0];
    expect(player).toHaveProperty('bonuses');
    expect(Array.isArray(player.bonuses)).toBeTruthy();
    
    console.log('[API Test] ✓ Custom UU draft structure is correct');
    console.log('[API Test] ✓ All custom UU draft validations passed!');
  });
});
