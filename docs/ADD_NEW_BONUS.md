# Guide: How to Add New Bonuses

This guide explains the process of adding new civilization bonuses to the AoE2-Civbuilder project. A bonus can grant units, techs, or modify game behavior.

## Overview

Adding a new bonus requires changes across multiple systems:
1. **C++ Backend** - Core game logic and mod generation
2. **JavaScript/TypeScript Frontend** - UI and tech tree display
3. **Data Files** - Bonus descriptions and constants
4. **Tests** - E2E tests to verify functionality

## Table of Contents
- [Prerequisites](#prerequisites)
- [Step 1: Add Bonus to C++ Backend](#step-1-add-bonus-to-c-backend)
- [Step 2: Add Bonus Description to Frontend](#step-2-add-bonus-description-to-frontend)
- [Step 3: Add Frontend Tech Tree Support](#step-3-add-frontend-tech-tree-support)
- [Step 4: Add E2E Tests](#step-4-add-e2e-tests)
- [Example: Imperial Paladin Implementation](#example-imperial-paladin-implementation)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Understanding of AoE2 game mechanics
- Knowledge of C++, JavaScript/TypeScript
- Familiarity with the project structure
- C++ compiler for building modding tools (optional - pre-compiled binaries are included)

## Step 1: Add Bonus to C++ Backend

### 1.1 Add Unit ID (if creating a new unit)

**File:** `modding/enums/unit_ids.h`

Add your new unit ID to the enum. Follow the existing naming convention:

```cpp
// Find the appropriate location in the enum (maintain numerical order)
UNIT_IMPERIAL_PALADIN = 2500, // IMPALADN - Example ID
```

**Notes:**
- Use descriptive names with `UNIT_` prefix
- Internal names (comments) should match game file conventions
- Choose an unused ID number (check existing IDs)

### 1.2 Add Tech IDs (if bonus requires enabling/disabling techs)

**File:** `modding/enums/tech_ids.h`

Add tech IDs needed to enable the bonus or disable replaced units:

```cpp
TECH_IMPERIAL_PALADIN = 1100,          // Enable Imperial Paladin
TECH_FTT_DISABLE_CAVALIER = 1101,      // Disable Cavalier in tech tree
```

### 1.3 Add Bonus Enum

**File:** `modding/CivBonusEnum.h`

Add a new enum entry with a descriptive name:

```cpp
CIV_BONUS_363_IMPERIAL_PALADIN_REPLACES_CAVALIER = 363, // Imperial Paladin replaces Cavalier
```

**Notes:**
- The number (363) corresponds to the line number in the bonus description list
- Description after `//` should match the player-facing text
- Increment from the last bonus number

### 1.4 Implement Bonus Logic

**File:** `modding/civbuilder.cpp`

Add the bonus implementation in the `initialize()` method:

```cpp
// Imperial Paladin (replacement bonus)
this->civBonuses[CIV_BONUS_363_IMPERIAL_PALADIN_REPLACES_CAVALIER] = {
    TECH_IMPERIAL_PALADIN,          // Enable the new unit
    TECH_FTT_DISABLE_CAVALIER       // Disable replaced unit
};
```

**For replacement bonuses:**
- First tech enables the new unit
- Second tech disables the replaced unit in tech tree

**For additive bonuses (like "Can recruit X"):**
- Only need one tech to enable the unit
```cpp
this->civBonuses[CIV_BONUS_XXX_CAN_RECRUIT_UNIT] = {TECH_ENABLE_UNIT};
```

### 1.5 Add Unit to Unit Classes (if applicable)

If the unit belongs to a unit class (barracks, stable, archery, etc.), add it:

```cpp
this->unitClasses["stable"] = {
    // ... existing units ...
    UNIT_IMPERIAL_PALADIN,  // Add new unit
    // ... rest of units ...
};
```

## Step 2: Add Bonus Description to Frontend

### 2.1 Legacy Frontend (public/js/common.js)

**File:** `public/js/common.js`

Add the bonus description to the `card_descriptions` array at the appropriate index:

```javascript
const card_descriptions = [
    [
        // ... existing bonuses (index 0-362) ...
        ["Imperial Paladin replaces Cavalier", 2, -X, 0],  // Index 363
        // [text, rarity, edition, image_version]
        // rarity: 0=common, 1=uncommon, 2=rare, 3=epic, 4=legendary
        // edition: negative = vanilla civ number, positive = custom
    ],
    // ...
];
```

### 2.2 Vue Frontend Bonus Data

**File:** `src/frontend/app/composables/useBonusData.ts`

Add the bonus to the bonusData array:

```typescript
export const bonusData: BonusCard[] = [
  // ... existing bonuses ...
  ["Imperial Paladin replaces Cavalier", 2, -X, 0],  // Index 363
  // ...
];
```

### 2.3 Vue Frontend Bonus-Tech Mapping

**File:** `src/frontend/app/composables/useBonusTechMapping.ts`

Map the bonus to its effect:

```typescript
export const bonusTechMapping: Record<string, BonusMapping> = {
  // ... existing mappings ...
  
  CIV_BONUS_363: "Imperial Paladin replaces Cavalier",
  // or with more details:
  CIV_BONUS_363: {
    name: "Imperial Paladin replaces Cavalier",
    replaces: [283],  // Cavalier ID
    units: [2500],    // Imperial Paladin ID
    cost: 0,          // Free bonus unit
  },
};
```

## Step 3: Add Frontend Tech Tree Support

### 3.1 Add Unit Constant

**File:** `src/frontend/app/composables/useTechtree.ts`

First, add the unit ID constant at the top:

```typescript
export const IMPERIAL_PALADIN = 2500;
```

### 3.2 Implement Replacement Logic

For **replacement bonuses** (replaces existing unit):

```typescript
// In buildTree function, find the section handling replacement bonuses
// Add your bonus handling similar to Savar:

// Imperial Paladin replaces Cavalier (bonus 363)
if (selectedBonuses.has(CIV_BONUS_363_IMPERIAL_PALADIN_REPLACES_CAVALIER)) {
  stablelane.rows.imperial_1.push(unit(IMPERIAL_PALADIN));
  replacedIds.add(u(CAVALIER));  // Mark Cavalier as replaced
} else {
  stablelane.rows.imperial_1.push(unit(CAVALIER));
}
```

For **additive bonuses** (adds new unit):

```typescript
// In the appropriate lane and row
if (selectedBonuses.has(CIV_BONUS_XXX_CAN_RECRUIT_UNIT)) {
  archerylane.rows.castle_1.push(unit(NEW_UNIT));
}
```

### 3.3 Add to Bonus-Granted Logic

If the unit should be free and auto-enabled:

```typescript
// In the bonus prerequisites section
if (selectedBonuses.has(CIV_BONUS_363_IMPERIAL_PALADIN_REPLACES_CAVALIER)) {
  // Add prerequisites if needed (e.g., Knight, Cavalier)
  bonusGrantedPrereqs.add(u(KNIGHT));
  bonusGrantedPrereqs.add(u(CAVALIER));
}
```

## Step 4: Add E2E Tests

### 4.1 Create Test File

**File:** `__tests__/e2e/bonusUnit<Name>.spec.ts`

Create a test file following existing patterns:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Imperial Paladin Bonus', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/v2/demo/techtree');
    await page.locator('.techtree-svg').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(1000);
  });

  test('should replace Cavalier with Imperial Paladin when bonus is selected', async ({ page }) => {
    // Get initial tech count
    const initialText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
    
    // Select bonus
    const bonusCheckbox = page.getByRole('checkbox', { name: /Imperial Paladin/i });
    await bonusCheckbox.check();
    await page.waitForTimeout(500);
    
    // Verify tech count includes prerequisites
    const finalText = await page.getByText(/Techs Enabled: \d+/i).textContent();
    const finalCount = parseInt(finalText?.match(/\d+/)?.[0] || '0');
    expect(finalCount).toBeGreaterThan(initialCount);
    
    // Verify Cavalier is replaced (not visible)
    const cavalierElement = page.locator('[data-caret-id="unit_283"]');
    await expect(cavalierElement).not.toBeVisible();
  });
});
```

### 4.2 Test Mod Creation

Add test to verify mod generation works:

```typescript
test('should create downloadable mod with Imperial Paladin', async ({ page }) => {
  // Only run in CI environment
  if (!process.env.CI) {
    test.skip();
  }
  
  await page.goto('/v2/build');
  
  // Select bonus
  const bonusCheckbox = page.getByRole('checkbox', { name: /Imperial Paladin/i });
  await bonusCheckbox.check();
  
  // Fill required fields and create mod
  // ... test mod creation flow ...
  
  // Verify download
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download/i }).click();
  const download = await downloadPromise;
  
  expect(download.suggestedFilename()).toContain('.zip');
});
```

## Example: Imperial Paladin Implementation

This is a complete example of adding "Imperial Paladin replaces Cavalier" bonus:

### C++ Changes

```cpp
// modding/enums/unit_ids.h
UNIT_IMPERIAL_PALADIN = 2500, // IMPALADN

// modding/enums/tech_ids.h  
TECH_IMPERIAL_PALADIN = 1100,
TECH_FTT_DISABLE_CAVALIER = 1101,

// modding/CivBonusEnum.h
CIV_BONUS_363_IMPERIAL_PALADIN_REPLACES_CAVALIER = 363, // Imperial Paladin replaces Cavalier

// modding/civbuilder.cpp (in initialize())
this->civBonuses[CIV_BONUS_363_IMPERIAL_PALADIN_REPLACES_CAVALIER] = {
    TECH_IMPERIAL_PALADIN,
    TECH_FTT_DISABLE_CAVALIER
};

this->unitClasses["stable"] = {
    // ... existing units ...
    UNIT_IMPERIAL_PALADIN,
    // ... rest ...
};
```

### Frontend Changes

```javascript
// public/js/common.js
["Imperial Paladin replaces Cavalier", 2, -8, 0],  // Index 363

// src/frontend/app/composables/useBonusData.ts
["Imperial Paladin replaces Cavalier", 2, -8, 0],

// src/frontend/app/composables/useBonusTechMapping.ts
CIV_BONUS_363: "Imperial Paladin replaces Cavalier"

// src/frontend/app/composables/useTechtree.ts
export const IMPERIAL_PALADIN = 2500;

// In buildTree():
if (selectedBonuses.has(363)) {
  stablelane.rows.imperial_1.push(unit(IMPERIAL_PALADIN));
  replacedIds.add(u(CAVALIER));
} else {
  stablelane.rows.imperial_1.push(unit(CAVALIER));
}
```

## Troubleshooting

### Common Issues

**Issue:** Bonus doesn't appear in UI
- Check that bonus description is added at correct index in both frontend files
- Verify CivBonusEnum index matches description array index

**Issue:** Unit doesn't show in tech tree
- Ensure unit is added to appropriate lane/row in useTechtree.ts
- Check that unit ID constant is defined
- Verify bonus selection logic is implemented

**Issue:** Mod creation fails
- Check that C++ implementation is correct
- Ensure all tech IDs are unique
- Verify unit ID doesn't conflict with existing IDs

**Issue:** Graphics missing
- Unit graphics are sourced from game files, not included in repo
- Default/placeholder graphics will be used if specific graphics not found
- Graphics mapping is by unit ID (e.g., `569.jpg` for Paladin)

### Testing Your Changes

1. **Run linter:**
   ```bash
   npm test
   ```

2. **Test E2E:**
   ```bash
   npm run test:e2e
   ```

3. **Manual testing:**
   - Start server: `npm start`
   - Navigate to `/v2/demo/techtree`
   - Select your bonus and verify it appears correctly

## Notes on Graphics

- Unit graphics are stored in `public/aoe2techtree/img/Units/`
- Files are named by unit ID (e.g., `38.jpg` for Knight, `283.jpg` for Cavalier)
- Graphics come from the game's data files
- For testing, you can use placeholder graphics or reference existing unit graphics
- The issue mentions "ritterbruder graphics" - this refers to using existing Teutonic/medieval knight sprites
- Graphics are not essential for functionality - missing graphics will show placeholder

## Additional Resources

- **AoE2 Tech Tree**: Based on [SiegeEngineers/aoe2techtree](https://github.com/SiegeEngineers/aoe2techtree)
- **Related Issues**: 
  - #247 (web tech tree)
  - #218 (in-game tech tree)
- **Existing Examples**: Search codebase for `SAVAR` or `IMPERIAL_CAMEL_RIDER` for replacement unit patterns

## Summary Checklist

When adding a new bonus:

- [ ] Add unit ID to `modding/enums/unit_ids.h` (if new unit)
- [ ] Add tech IDs to `modding/enums/tech_ids.h`
- [ ] Add bonus enum to `modding/CivBonusEnum.h`
- [ ] Implement logic in `modding/civbuilder.cpp`
- [ ] Add to unit class if applicable
- [ ] Add description to `public/js/common.js`
- [ ] Add description to `src/frontend/app/composables/useBonusData.ts`
- [ ] Add mapping to `src/frontend/app/composables/useBonusTechMapping.ts`
- [ ] Add unit constant to `src/frontend/app/composables/useTechtree.ts`
- [ ] Implement tech tree display logic
- [ ] Create E2E test file
- [ ] Test manually in browser
- [ ] Run automated tests
