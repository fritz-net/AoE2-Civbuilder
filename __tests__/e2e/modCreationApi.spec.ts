import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

/**
 * Pure API-based E2E tests for mod creation
 * These tests call the /create API endpoint directly without using the UI
 * They verify that the error is not in the API, but was in the UI/test flow
 */

const VANILLA_CIVS_DIR = path.join(__dirname, '../../public/vanillaFiles/vanillaCivs/VanillaJson');

// Skip download tests locally (C++ backend not built), but run in CI
const shouldSkipDownloadTests = !process.env.CI;

/**
 * Helper function to load a vanilla civilization JSON
 */
function loadVanillaCiv(civName: string): any {
  const civPath = path.join(VANILLA_CIVS_DIR, `${civName}.json`);
  if (!fs.existsSync(civPath)) {
    throw new Error(`Vanilla civ not found: ${civName}`);
  }
  return JSON.parse(fs.readFileSync(civPath, 'utf8'));
}

/**
 * Helper to prepare mod data payload for /create endpoint
 */
function prepareModPayload(civs: any[], seed?: string): any {
  const modSeed = seed || `api-test-${Date.now()}`;
  
  const presets = {
    presets: civs.map(civ => ({
      alias: civ.alias,
      description: civ.description,
      flag_palette: civ.flag_palette,
      customFlag: civ.customFlag || false,
      customFlagData: civ.customFlagData || '',
      tree: civ.tree,
      bonuses: civ.bonuses,
      architecture: civ.architecture,
      language: civ.language,
      wonder: civ.wonder
    }))
  };

  const modifiers = {
    randomCosts: false,
    hp: 1.0,
    speed: 1.0,
    blind: false,
    infinity: false,
    building: 1.0
  };

  return {
    seed: modSeed,
    presets: JSON.stringify(presets),
    modifiers: JSON.stringify(modifiers)
  };
}

test.describe('Mod Creation API - Pure API E2E Tests', () => {
  (shouldSkipDownloadTests ? test.skip : test)('API should create single-civ mod and return valid zip file', async ({ request }) => {
    test.setTimeout(90000); // API mod creation can take time
    
    const projectRoot = path.join(__dirname, '../..');
    const extractDir = path.join(projectRoot, 'test-downloads', `extract-api-single-${Date.now()}`);
    
    try {
      // Load Britons as test civilization
      const britons = loadVanillaCiv('Britons');
      const payload = prepareModPayload([britons], 'api-e2e-britons');
      
      console.log('[API Test] Calling /create endpoint with single civ...');
      
      // Make API call to /create endpoint
      const response = await request.post('http://localhost:4000/create', {
        data: payload,
        timeout: 60000
      });
      
      // Verify response is successful
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toContain('application/zip');
      
      console.log('[API Test] Response received, downloading zip...');
      
      // Get the zip file as buffer
      const zipBuffer = await response.body();
      expect(zipBuffer.length).toBeGreaterThan(0);
      
      // Save zip to temp location
      const downloadsDir = path.join(projectRoot, 'test-downloads');
      fs.mkdirSync(downloadsDir, { recursive: true });
      
      const zipPath = path.join(downloadsDir, 'api-test-single.zip');
      fs.writeFileSync(zipPath, zipBuffer);
      
      console.log(`[API Test] Zip saved to: ${zipPath}`);
      
      // Verify zip file size is greater than 1MB
      const stats = fs.statSync(zipPath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      console.log(`[API Test] Zip file size: ${fileSizeInMB.toFixed(2)} MB`);
      
      expect(stats.size).toBeGreaterThan(1024 * 1024);
      console.log('[API Test] ✓ Zip file size is greater than 1MB');
      
      // Extract and verify contents
      console.log(`[API Test] Extracting zip to: ${extractDir}`);
      fs.mkdirSync(extractDir, { recursive: true });
      execSync(`unzip -q "${zipPath}" -d "${extractDir}"`, {
        cwd: projectRoot,
        stdio: 'pipe'
      });
      
      // Verify data.json exists
      const dataJsonPath = path.join(extractDir, 'data.json');
      expect(fs.existsSync(dataJsonPath)).toBeTruthy();
      
      const dataJson = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));
      console.log(`[API Test] data.json loaded successfully`);
      
      // Verify data structure
      expect(dataJson).toHaveProperty('name');
      expect(Array.isArray(dataJson.name)).toBeTruthy();
      expect(dataJson.name.length).toBeGreaterThan(0);
      expect(dataJson.name[0]).toBe('Britons');
      
      expect(dataJson).toHaveProperty('techtree');
      expect(Array.isArray(dataJson.techtree)).toBeTruthy();
      expect(dataJson).toHaveProperty('civ_bonus');
      expect(Array.isArray(dataJson.civ_bonus)).toBeTruthy();
      
      console.log('[API Test] ✓ All API verifications passed for single-civ mod!');
      
    } finally {
      // Cleanup
      try {
        const downloadsDir = path.join(projectRoot, 'test-downloads');
        if (fs.existsSync(downloadsDir)) {
          fs.rmSync(downloadsDir, { recursive: true, force: true });
        }
      } catch (err) {
        console.error('Error cleaning up:', err);
      }
    }
  });

  (shouldSkipDownloadTests ? test.skip : test)('API should create multi-civ mod and return valid zip file', async ({ request }) => {
    test.setTimeout(90000);
    
    const projectRoot = path.join(__dirname, '../..');
    const extractDir = path.join(projectRoot, 'test-downloads', `extract-api-multi-${Date.now()}`);
    
    try {
      // Load multiple civs for combining
      const britons = loadVanillaCiv('Britons');
      const franks = loadVanillaCiv('Franks');
      const payload = prepareModPayload([britons, franks], 'api-e2e-multi');
      
      console.log('[API Test] Calling /create endpoint with multiple civs...');
      
      // Make API call
      const response = await request.post('http://localhost:4000/create', {
        data: payload,
        timeout: 60000
      });
      
      // Verify response
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toContain('application/zip');
      
      console.log('[API Test] Response received for multi-civ mod');
      
      // Download and save zip
      const zipBuffer = await response.body();
      expect(zipBuffer.length).toBeGreaterThan(0);
      
      const downloadsDir = path.join(projectRoot, 'test-downloads');
      fs.mkdirSync(downloadsDir, { recursive: true });
      
      const zipPath = path.join(downloadsDir, 'api-test-multi.zip');
      fs.writeFileSync(zipPath, zipBuffer);
      
      console.log(`[API Test] Multi-civ zip saved to: ${zipPath}`);
      
      // Verify size
      const stats = fs.statSync(zipPath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      console.log(`[API Test] Multi-civ zip size: ${fileSizeInMB.toFixed(2)} MB`);
      
      expect(stats.size).toBeGreaterThan(1024 * 1024);
      
      // Extract and verify
      fs.mkdirSync(extractDir, { recursive: true });
      execSync(`unzip -q "${zipPath}" -d "${extractDir}"`, {
        cwd: projectRoot,
        stdio: 'pipe'
      });
      
      const dataJsonPath = path.join(extractDir, 'data.json');
      expect(fs.existsSync(dataJsonPath)).toBeTruthy();
      
      const dataJson = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));
      
      // Verify multi-civ structure
      expect(dataJson).toHaveProperty('name');
      expect(Array.isArray(dataJson.name)).toBeTruthy();
      expect(dataJson.name.length).toBe(2); // Should have 2 civs
      
      // Check both civs are present
      expect(dataJson.name).toContain('Britons');
      expect(dataJson.name).toContain('Franks');
      
      console.log('[API Test] ✓ All API verifications passed for multi-civ mod!');
      
    } finally {
      // Cleanup
      try {
        const downloadsDir = path.join(projectRoot, 'test-downloads');
        if (fs.existsSync(downloadsDir)) {
          fs.rmSync(downloadsDir, { recursive: true, force: true });
        }
      } catch (err) {
        console.error('Error cleaning up:', err);
      }
    }
  });
});
