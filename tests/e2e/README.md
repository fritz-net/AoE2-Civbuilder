# E2E UI Tests

This directory contains End-to-End (E2E) tests for the AoE2 Civbuilder application.

## Overview

The E2E tests cover two main user workflows:

1. **Build Path** (`build.test.js`) - Tests for the civilization building functionality
2. **Draft Path** (`draft.test.js`) - Tests for the drafting functionality (including single-player scenarios)

## Test Structure

### Build Path Tests
- Home page navigation and UI elements
- Build page accessibility and resources
- Edit and view civilization workflows
- Mod creation endpoint availability

### Draft Path Tests
- Single-player draft creation (primary test case)
- Draft resource accessibility
- Join workflow validation
- Multiple configuration support

## Running Tests

```bash
# Run all E2E tests
npm test

# Run tests in CI mode (for GitHub Actions)
npm run test:ci
```

## Test Environment

- Tests use a separate test server instance on a random port to avoid conflicts
- Mock data is used to test endpoints without requiring full mod generation dependencies
- Tests validate that endpoints exist and handle requests appropriately
- Some operations may fail due to missing external dependencies in test environments, which is expected

## GitHub Actions Integration

The tests are automatically run on:
- Push to main branch
- Pull requests to main branch

See `.github/workflows/e2e-tests.yml` for the CI configuration.

## Notes

- Tests are designed to be robust and handle expected failures gracefully
- The focus is on validating that key user paths are accessible and functional
- Single-player draft testing avoids the complexity of multi-browser coordination
- Some mod creation operations may timeout or fail in test environments due to missing dependencies