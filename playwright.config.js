const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './__tests__/e2e',
  // Maximum time one test can run
  timeout: 120000, // 2 minutes
  expect: {
    timeout: 10000
  },
  // Run tests in files in parallel
  fullyParallel: false,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI
  workers: 1,
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['github'] // GitHub Actions summary
  ],
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:4000',
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    // Capture screenshot on failure
    screenshot: 'only-on-failure',
    // Capture video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'node server.js',
    url: 'http://127.0.0.1:4000',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
    env: {
      CIVBUILDER_HOSTNAME: 'http://127.0.0.1:4000',
    },
  },
});
