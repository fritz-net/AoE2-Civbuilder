import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * E2E tests for data.json support in Combine Page
 * Tests the ability to upload a multi-civ data.json file and have it split into individual civs
 */

const TEST_DATA_JSON = path.join(__dirname, 'fixtures/test-data.json');
const TEST_DATA_ARRAY_JSON = path.join(__dirname, 'fixtures/test-data-array.json');
const TEST_DATA_PARALLEL_JSON = path.join(__dirname, 'fixtures/test-data-parallel.json');

test.describe('Combine Page - data.json Multi-Civ Support', () => {
  test('should upload and parse data.json with multiple civs', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Verify test data file exists
    expect(fs.existsSync(TEST_DATA_JSON)).toBeTruthy();
    
    // Verify file contains 3 civs (Britons, Franks, Aztecs)
    const testData = JSON.parse(fs.readFileSync(TEST_DATA_JSON, 'utf-8'));
    expect(Object.keys(testData.techtrees)).toHaveLength(3);
    expect(testData.techtrees.Britons).toBeDefined();
    expect(testData.techtrees.Franks).toBeDefined();
    expect(testData.techtrees.Aztecs).toBeDefined();
    
    // Upload the data.json file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([TEST_DATA_JSON]);
    
    // Wait for files to be processed
    await page.waitForTimeout(1000);
    
    // Check that all 3 civilizations are loaded as separate entries
    await expect(page.getByText(/Loaded Civilizations \(3\)/i)).toBeVisible();
    
    // Verify all 3 civ names are shown - use heading role for specificity
    await expect(page.getByRole('heading', { name: 'Britons' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Franks' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Aztecs' })).toBeVisible();
    
    // Check create button is enabled
    const createButton = page.getByRole('button', { name: /Create Combined Mod \(3 Civs\)/i });
    await expect(createButton).toBeEnabled();
  });

  test('should handle mixed upload of data.json and single civ files', async ({ page }) => {
    await page.goto('/v2/combine');
    
    const VANILLA_CIVS_DIR = path.join(__dirname, '../../public/vanillaFiles/vanillaCivs/VanillaJson');
    const singleCivPath = path.join(VANILLA_CIVS_DIR, 'Japanese.json');
    
    // Verify files exist
    expect(fs.existsSync(TEST_DATA_JSON)).toBeTruthy();
    expect(fs.existsSync(singleCivPath)).toBeTruthy();
    
    // Upload both files at once
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([TEST_DATA_JSON, singleCivPath]);
    
    // Wait for files to be processed
    await page.waitForTimeout(1000);
    
    // Check that 4 civilizations are loaded (3 from data.json + 1 single civ)
    await expect(page.getByText(/Loaded Civilizations \(4\)/i)).toBeVisible();
    
    // Verify all civ names are shown - use heading role for specificity
    await expect(page.getByRole('heading', { name: 'Britons' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Franks' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Aztecs' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Japanese' })).toBeVisible();
  });

  test('should remove individual civs from data.json upload', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Upload the data.json file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([TEST_DATA_JSON]);
    
    await page.waitForTimeout(1000);
    
    // Verify 3 civs are loaded
    await expect(page.getByText(/Loaded Civilizations \(3\)/i)).toBeVisible();
    
    // Click remove button on first civ
    const removeButtons = page.locator('.remove-btn');
    await removeButtons.first().click();
    
    // Verify only 2 civs remain
    await expect(page.getByText(/Loaded Civilizations \(2\)/i)).toBeVisible();
  });

  test('should handle drag and drop of data.json file', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Read the test data file
    const dataBuffer = fs.readFileSync(TEST_DATA_JSON);
    
    // Create a DataTransfer with the file
    const dataTransfer = await page.evaluateHandle((data) => {
      const dt = new DataTransfer();
      const file = new File([new Uint8Array(data)], 'test-data.json', { type: 'application/json' });
      dt.items.add(file);
      return dt;
    }, Array.from(dataBuffer));
    
    // Trigger drop event on the upload section
    const uploadSection = page.locator('.upload-section');
    await uploadSection.dispatchEvent('drop', { dataTransfer });
    
    // Wait for files to be processed
    await page.waitForTimeout(1000);
    
    // Check that 3 civilizations are loaded
    await expect(page.getByText(/Loaded Civilizations \(3\)/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Britons' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Franks' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Aztecs' })).toBeVisible();
  });

  test('should enforce 50 civ limit with data.json upload', async ({ page }) => {
    await page.goto('/v2/combine');
    
    const VANILLA_CIVS_DIR = path.join(__dirname, '../../public/vanillaFiles/vanillaCivs/VanillaJson');
    const vanillaCivs = fs.readdirSync(VANILLA_CIVS_DIR).filter(f => f.endsWith('.json'));
    
    // Upload 48 single civs first
    const first48Civs = vanillaCivs.slice(0, 48).map(f => path.join(VANILLA_CIVS_DIR, f));
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(first48Civs);
    
    // Wait for files to be processed
    await page.waitForTimeout(2000);
    
    // Verify 48 civs are loaded
    await expect(page.getByText(/Loaded Civilizations \(48\)/i)).toBeVisible();
    
    // Set up dialog handler to accept the alert (3 civs from data.json would exceed limit)
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Cannot add 3 civilization');
      expect(dialog.message()).toContain('You can only add 2 more');
      await dialog.accept();
    });
    
    // Try to upload data.json with 3 civs (should be rejected)
    await fileInput.setInputFiles([TEST_DATA_JSON]);
    
    // Wait for alert
    await page.waitForTimeout(500);
    
    // Verify still only 48 civs (upload was prevented)
    await expect(page.getByText(/Loaded Civilizations \(48\)/i)).toBeVisible();
  });

  test('should display civ descriptions from data.json', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Upload the data.json file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([TEST_DATA_JSON]);
    
    await page.waitForTimeout(1000);
    
    // Verify civ cards show descriptions
    // The description format should be "Civilization: {CivName}"
    await expect(page.getByText(/Civilization: Britons/i)).toBeVisible();
    await expect(page.getByText(/Civilization: Franks/i)).toBeVisible();
    await expect(page.getByText(/Civilization: Aztecs/i)).toBeVisible();
  });

  test('should upload and parse data.json with techtrees as array', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Verify test data file exists
    expect(fs.existsSync(TEST_DATA_ARRAY_JSON)).toBeTruthy();
    
    // Verify file has techtrees as an array
    const testData = JSON.parse(fs.readFileSync(TEST_DATA_ARRAY_JSON, 'utf-8'));
    expect(Array.isArray(testData.techtrees)).toBeTruthy();
    expect(testData.techtrees).toHaveLength(3);
    
    // Upload the data.json file with array format
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([TEST_DATA_ARRAY_JSON]);
    
    // Wait for files to be processed
    await page.waitForTimeout(1000);
    
    // Check that all 3 civilizations are loaded as separate entries
    await expect(page.getByText(/Loaded Civilizations \(3\)/i)).toBeVisible();
    
    // When techtrees is an array without names, civs are numbered
    // Should see "Civilization 1", "Civilization 2", "Civilization 3"
    await expect(page.getByRole('heading', { name: /Civilization 1/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Civilization 2/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Civilization 3/i })).toBeVisible();
    
    // Check create button is enabled
    const createButton = page.getByRole('button', { name: /Create Combined Mod \(3 Civs\)/i });
    await expect(createButton).toBeEnabled();
  });

  test('should upload and parse data.json with parallel arrays format', async ({ page }) => {
    await page.goto('/v2/combine');
    
    // Verify test data file exists
    expect(fs.existsSync(TEST_DATA_PARALLEL_JSON)).toBeTruthy();
    
    // Verify file has parallel arrays format (name, description, techtree)
    const testData = JSON.parse(fs.readFileSync(TEST_DATA_PARALLEL_JSON, 'utf-8'));
    expect(Array.isArray(testData.name)).toBeTruthy();
    expect(Array.isArray(testData.description)).toBeTruthy();
    expect(Array.isArray(testData.techtree)).toBeTruthy();
    expect(testData.name).toHaveLength(3);
    
    // Upload the data.json file with parallel arrays format
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([TEST_DATA_PARALLEL_JSON]);
    
    // Wait for files to be processed
    await page.waitForTimeout(1000);
    
    // Check that all 3 civilizations are loaded as separate entries
    await expect(page.getByText(/Loaded Civilizations \(3\)/i)).toBeVisible();
    
    // Verify civ names from the name array are used
    await expect(page.getByRole('heading', { name: 'ECO CAV DPS' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'better cumans' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'better britons + drill' })).toBeVisible();
    
    // Verify descriptions are used
    await expect(page.getByText(/CAV ECO/i)).toBeVisible();
    await expect(page.getByText(/Cav Archer/i)).toBeVisible();
    await expect(page.getByText(/archer, siege/i)).toBeVisible();
    
    // Check create button is enabled
    const createButton = page.getByRole('button', { name: /Create Combined Mod \(3 Civs\)/i });
    await expect(createButton).toBeEnabled();
  });
});
