# E2E Tests for Vue/Nuxt UI

This directory contains end-to-end tests for the Vue/Nuxt UI using Playwright. The tests have been refactored to follow industry best practices and design patterns to reduce code duplication and improve maintainability.

## Design Patterns Used

### 1. Page Object Model (POM)

The Page Object Model pattern encapsulates page interactions into reusable classes. Each page in the application has a corresponding page object that provides methods for interacting with that page.

**Benefits:**
- Reduces code duplication
- Makes tests more readable and maintainable
- Centralizes page structure knowledge
- Makes tests resilient to UI changes

**Example:**
```typescript
// Old approach (duplicated code)
await page.goto('/v2/draft/create');
await page.locator('#numPlayers').fill('2');
await page.getByRole('button', { name: /Start Draft/i }).click();

// New approach (using Page Object)
const draftCreatePage = new DraftCreatePage(page);
await draftCreatePage.navigate();
await draftCreatePage.setNumPlayers(2);
await draftCreatePage.clickStartDraft();
```

**Available Page Objects:**
- `BasePage` - Base class with common functionality
- `DraftCreatePage` - Draft creation page interactions
- `DraftHostPage` - Draft host page interactions

### 2. Builder Pattern

The Builder pattern is used for complex test data configuration, making it easy to create test scenarios with different configurations.

**Example:**
```typescript
// Create a draft with custom configuration
const { hostLink, draftId } = await draftCreatePage.createDraft({
  numPlayers: 2,
  bonuses: 4,
  techTreePoints: 250,
  timerEnabled: true,
  timerDuration: 60
});
```

### 3. Facade Pattern

The Facade pattern simplifies complex multi-step operations by providing a simple interface.

**Example:**
```typescript
// Complete entire draft flow with one method call
const rounds = await draftHostPage.completeFullDraftFlow(
  'Test Player',
  'Test Civ'
);
```

### 4. Helper Classes

Helper classes encapsulate common operations and provide utilities for:

- **ModalHelper** - Modal interactions (open, close, verify)
- **FormHelper** - Form filling and validation
- **NavigationHelper** - Page navigation operations
- **AssertionHelper** - Common assertion patterns
- **WaitHelper** - Consistent waiting patterns

**Example:**
```typescript
const formHelper = new FormHelper(page);
await formHelper.fillAndVerify('#civName', 'Test Civilization');

const assertHelper = new AssertionHelper(page);
await assertHelper.assertVisible('.draft-board');
```

## File Structure

```
__tests__/e2e/
├── helpers/
│   ├── BasePage.ts              # Base page object class
│   ├── DraftCreatePage.ts       # Draft creation page object
│   ├── DraftHostPage.ts         # Draft host page object
│   ├── TestHelpers.ts           # Utility helper classes
│   └── draftHelpers.ts          # Legacy helpers (backward compatible)
├── techtree.spec.ts             # Tech tree functionality tests
├── modCreation.spec.ts          # Mod creation tests
├── draftMode.spec.ts            # Draft mode tests
├── draftFlow.spec.ts            # Complete draft flow tests
├── draftTimer.spec.ts           # Draft timer tests
├── customUUEditor.spec.ts       # Custom UU editor tests
└── updatesPage.spec.ts          # Updates page tests
```

## Writing New Tests

### Using Page Objects

1. **Create a new page object** (if needed):
```typescript
import { BasePage } from './helpers/BasePage';

export class MyNewPage extends BasePage {
  private readonly selectors = {
    submitButton: 'button[type="submit"]',
    nameInput: '#name'
  };

  async navigate(): Promise<void> {
    await this.goto('/v2/my-page');
  }

  async fillName(name: string): Promise<void> {
    await this.fillInput(this.selectors.nameInput, name);
  }

  async submit(): Promise<void> {
    await this.clickElement(this.selectors.submitButton);
  }
}
```

2. **Write tests using the page object**:
```typescript
import { test } from '@playwright/test';
import { MyNewPage } from './helpers/MyNewPage';

test('should submit form successfully', async ({ page }) => {
  const myPage = new MyNewPage(page);
  await myPage.navigate();
  await myPage.fillName('Test Name');
  await myPage.submit();
  await myPage.assertVisible('.success-message');
});
```

### Using Helper Classes

```typescript
import { test } from '@playwright/test';
import { FormHelper, AssertionHelper, WaitHelper } from './helpers/TestHelpers';

test('should fill complex form', async ({ page }) => {
  const formHelper = new FormHelper(page);
  const assertHelper = new AssertionHelper(page);
  const waitHelper = new WaitHelper(page);
  
  await page.goto('/v2/form');
  
  // Use helpers for common operations
  await formHelper.fillFields([
    { selector: '#firstName', value: 'John' },
    { selector: '#lastName', value: 'Doe' }
  ]);
  
  await waitHelper.waitForVisible('.preview');
  await assertHelper.assertText('.preview', /John Doe/);
});
```

## Migration Guide

For tests still using the legacy `draftHelpers.ts` functions:

1. The old functions are marked as `@deprecated` but still work
2. They internally use the new page objects
3. Gradually migrate tests to use page objects directly:

```typescript
// Old way (still works, but deprecated)
const { hostLink } = await createDraft(page, 1);
await joinAsHost(page, hostLink, 'Test Player');

// New way (preferred)
const draftCreatePage = new DraftCreatePage(page);
await draftCreatePage.navigate();
const { hostLink } = await draftCreatePage.createDraft({ numPlayers: 1 });

const draftHostPage = new DraftHostPage(page);
await draftHostPage.navigate(hostLink);
await draftHostPage.joinAsHost('Test Player');
```

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

# Run specific test file
npx playwright test __tests__/e2e/draftFlow.spec.ts
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

### `draftFlow.spec.ts`

Complete draft flow tests using the new page object pattern:
- Single player draft from creation to lobby
- Complete draft flow selecting cards through all rounds
- Phase transitions and validations

### `draftMode.spec.ts`

Draft mode functionality tests:
- Navigation and form validation
- Draft creation with various configurations
- Modal interactions

### `techtree.spec.ts`

Tech tree component tests:
- Build mode vs Draft mode functionality
- Point calculation and limits
- Fill and Reset button behavior

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

## Best Practices

1. **Use Page Objects for page-specific interactions**
   - Encapsulate selectors within page objects
   - Provide meaningful method names

2. **Use Helper classes for cross-cutting concerns**
   - Common assertions
   - Form operations
   - Modal interactions
   - Waiting patterns

3. **Keep tests focused and readable**
   - One test should verify one behavior
   - Use descriptive test names
   - Use the Arrange-Act-Assert pattern

4. **Avoid test interdependencies**
   - Each test should be independent
   - Clean up after tests when necessary

5. **Use consistent waiting strategies**
   - Use `WaitHelper` for consistent timeouts
   - Avoid arbitrary `waitForTimeout` calls

## Benefits of This Architecture

1. **Reduced Code Duplication**
   - Common operations are centralized in page objects and helpers
   - No repeated selectors or interaction patterns

2. **Improved Maintainability**
   - Changes to UI only require updates to page objects
   - Tests remain stable even when implementation changes

3. **Better Readability**
   - Tests read like business requirements
   - Technical details are hidden in page objects

4. **Easier Testing**
   - Complex workflows are simplified with facade methods
   - New test writers can use existing patterns

5. **Type Safety**
   - TypeScript provides intellisense and compile-time checks
   - Reduces runtime errors

## Future Improvements

- [ ] Add more page objects for remaining pages (Build, Combine, TechTree demo)
- [ ] Create test data factories for complex test scenarios
- [ ] Add visual regression testing
- [ ] Implement custom Playwright fixtures for common setups
- [ ] Add API test helpers for faster test setup

## Notes

- Tests automatically start the server before running
- Tests interact with actual UI elements (buttons, inputs, etc.)
- File uploads are tested with real JSON files
- Download tests are implemented but skipped until binary is available
- The new page object pattern provides backward compatibility with existing tests
