# E2E Tests

This directory contains end-to-end (E2E) tests for the AoE2 Civbuilder application using Playwright.

## Test Files

- **build.spec.js**: Tests the `/build` workflow for creating custom civilizations
- **draft.spec.js**: Tests the `/draft` workflow for drafting civilizations

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the C++ component (required for mod creation):
   ```bash
   cd modding
   ./scripts/build.sh
   ```

3. Install Playwright browsers:
   ```bash
   npx playwright install chromium
   ```

### Running the Tests

Run all E2E tests:
```bash
npm run test:e2e
```

Run tests in UI mode (for development):
```bash
npm run test:e2e:ui
```

Run tests in headed mode (see browser):
```bash
npm run test:e2e:headed
```

## Test Coverage

### Build Workflow (`build.spec.js`)

Tests the complete flow of building a custom civilization:

1. Navigate to `/build` page
2. Enter civilization name and customize flag
3. Click "Next" to proceed to tech tree selection
4. Select at least one tech and click "Done"
5. Navigate through bonus pages (Civ Bonuses, Unique Units, Castle/Imperial Techs, Team Bonuses)
6. Download the JSON configuration file
7. Return home via "Home" button (confirms alert dialog)
8. Click "Combine Civilizations"
9. Upload the downloaded JSON file
10. Download and verify the generated mod ZIP file (> 1KB)

### Draft Workflow (`draft.spec.js`)

Tests the complete flow of creating a draft:

1. Navigate from home to draft creation
2. Set "Number of Players" to 1
3. Set "Bonuses Per Player" to 1
4. Click "Start Draft" to create the draft
5. Navigate to the host link
6. Enter player name and click "Join Draft"
7. Click "Start Draft" to begin
8. Enter civilization name and customize flag
9. Navigate through draft bonus selection (5 rounds)
10. Select at least one tech in the tech tree
11. Wait for "Creating Mod..." page
12. Wait for "Mod Created!" page
13. Download and verify the generated mod ZIP file (> 1KB)

## CI/CD Integration

The E2E tests are integrated into the GitHub Actions workflow (`.github/workflows/ci-cd.yml`):

- Tests run on every push and pull request
- Playwright browsers are installed automatically
- Test results and videos are uploaded as artifacts on failure
- A test summary is added to the GitHub Actions output

## Test Artifacts

When tests fail, the following artifacts are available:

- **playwright-report/**: HTML report with test results
- **test-results/**: Videos and screenshots of failed tests

These are automatically uploaded to GitHub Actions for review.

## Configuration

The Playwright configuration is in `playwright.config.js`:

- Tests run on Chromium browser
- Screenshots captured on failure
- Videos recorded on failure
- Traces captured on retry
- Web server automatically starts before tests
- Timeout: 2 minutes per test
- Retries: 2 on CI, 0 locally

## Notes

- E2E tests require the C++ component to be built (for mod creation)
- Tests use the server running on `http://127.0.0.1:4000`
- The server is automatically started and stopped by Playwright
- Tests are designed to run sequentially (not in parallel) to avoid conflicts
