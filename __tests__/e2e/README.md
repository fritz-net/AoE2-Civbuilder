# E2E Tests for Vue/Nuxt UI

This directory contains end-to-end tests for the Vue/Nuxt UI using Playwright.

## Running Tests

### Prerequisites

Install Playwright browsers:
```bash
npx playwright install
```

### Run Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests with UI mode (interactive)
npm run test:e2e:ui
```

## Test Structure

### `modCreation.spec.ts`

Comprehensive E2E tests for mod creation functionality:

**Combine Page Tests:**
- Load combine page
- Upload JSON files via file input
- Remove individual civilizations
- Clear all civilizations
- Create combined mod (requires C++ binary - skipped by default)

**Build Page Tests:**
- Load build page
- Fill in civilization name and enable next button
- Navigate through stepper steps
- Save config to browser storage
- Create mod at end of stepper (requires C++ binary - skipped by default)

**Navigation Tests:**
- Navigate to combine page from home
- Navigate to build page from home

## Skipped Tests

Some tests are skipped by default because they require the C++ `create-data-mod` binary to be built:
- Creating actual mod files and downloads

These tests will run in CI/CD environments where the binary is available.

## Test Data

Tests use vanilla civilization JSON files from:
```
public/vanillaFiles/vanillaCivs/VanillaJson/
```

## Configuration

Playwright configuration is in `playwright.config.ts` at the project root.

Key settings:
- Base URL: `http://localhost:4000`
- Browser: Chromium (Desktop Chrome)
- Screenshots on failure
- Traces on retry
- HTML reporter

## Notes

- Tests automatically start the server before running
- Tests interact with actual UI elements (buttons, inputs, etc.)
- File uploads are tested with real JSON files
- Download tests are implemented but skipped until binary is available
