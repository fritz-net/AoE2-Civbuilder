# Playwright UI E2E Tests

This directory contains UI end-to-end tests using Playwright for browser automation.

## Overview

The Playwright tests complement the existing API-level tests by actually clicking through the UI workflows as a real user would.

### Test Files

- **ui-workflow.test.js** - Main Playwright UI tests that:
  - Navigate through the build workflow (flag creation, tech tree, bonuses, mod creation)
  - Navigate through the draft workflow (create draft, join, player selection, mod download)
  - Verify UI elements exist and are accessible

## Running Tests

### Locally

```bash
# Install dependencies (including Playwright browsers)
npm install
npx playwright install chromium

# Run Playwright UI tests
npm run test:playwright

# Run in CI mode with JSON output
npm run test:playwright:ci
```

### In CI

The Playwright tests run automatically in GitHub Actions as part of the `playwright-ui-tests` job.

## Test Structure

### Build Workflow Test
Tests the complete 5-step build workflow:
1. Navigate to /build page
2. Create civilization flag (color, architecture style, name)
3. Navigate through phases
4. Download JSON configuration
5. Verify mod creation works

### Draft Workflow Test
Tests the complete 13-step draft workflow:
1. Click "Create Draft" from home
2. Configure draft settings (players, bonuses)
3. Start draft and get Host/Player/Spectator links
4. Join draft as a player
5. Navigate through draft phases
6. Download final mod

## Configuration

Configuration is in `playwright.config.js`:
- **Base URL**: Uses `CIVBUILDER_HOSTNAME` env var or defaults to `http://localhost:4000`
- **Browser**: Chromium (headless in CI)
- **Timeouts**: 15s action timeout, 60s test timeout
- **Retries**: 1 retry in CI, 0 locally
- **Reporters**: List, HTML, JSON, JUnit

## Output

### GitHub Actions
Test results are automatically published to:
- **Job Summary**: Markdown summary with pass/fail stats
- **Artifacts**: Full test results, screenshots on failure, videos on failure

### Local
- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `playwright-jest-results.json`

## Debugging Failed Tests

1. Check the GitHub Actions job summary for high-level results
2. Download the `playwright-failures` artifact for:
   - Screenshots of failed tests
   - Videos of failed test runs
   - Full test traces

3. View the HTML report locally:
   ```bash
   npx playwright show-report playwright-report
   ```

## Writing New Tests

Follow the existing pattern:

```javascript
test('should do something in UI', async () => {
  // Navigate to page
  await page.goto(`${baseURL}/some-page`);
  
  // Wait for elements
  await page.waitForSelector('button.my-button');
  
  // Interact
  await page.click('button.my-button');
  
  // Assert
  const text = await page.textContent('.result');
  expect(text).toContain('Expected text');
}, 30000); // 30s timeout
```

## Key Differences from API Tests

| Aspect | API Tests (workflow.test.js) | UI Tests (ui-workflow.test.js) |
|--------|------------------------------|--------------------------------|
| Method | HTTP requests with node-fetch | Real browser automation |
| Tests | Endpoint responses, file contents | User workflows, UI interaction |
| Speed | Fast (~5s) | Slower (~30s) |
| Reliability | High | Medium (UI changes affect tests) |
| Coverage | Backend API | Frontend + Backend integration |

## Troubleshooting

### Browser installation fails
```bash
npx playwright install-deps chromium
npx playwright install chromium
```

### Tests timeout
- Increase timeout in test or config
- Check if service is actually running
- Verify `CIVBUILDER_HOSTNAME` is correct

### Tests fail locally but pass in CI
- Ensure you have the C++ backend running
- Set `CIVBUILDER_HOSTNAME=http://localhost:4000`
- Check browser version matches CI

### Screenshots/videos not generated
- Only created on failure
- Check `playwright.config.js` settings
- Ensure sufficient disk space
