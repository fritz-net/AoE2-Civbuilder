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

### 1.4 Create the Unit (if adding a new unit)

**File:** `modding/civbuilder.cpp`

If you're adding a new unit (not just enabling an existing one), create it in the `initialize()` method around line 2600. Base it on an existing similar unit:

```cpp
// Create Imperial Paladin (upgrade from Paladin, uses Crusader Knight graphics)
for (Civ &civ : this->df->Civs) {
    civ.Units[UNIT_IMPERIAL_PALADIN] = civ.Units[UNIT_PALADIN]; // Base on Paladin
    civ.Units[UNIT_IMPERIAL_PALADIN].Name = "IMPALADN";
    civ.Units[UNIT_IMPERIAL_PALADIN].LanguageDLLName = 5243;
    civ.Units[UNIT_IMPERIAL_PALADIN].LanguageDLLCreation = 6243;
    civ.Units[UNIT_IMPERIAL_PALADIN].LanguageDLLHelp = 26243;
    // Use graphics from another unit (e.g., Crusader Knight 1723)
    civ.Units[UNIT_IMPERIAL_PALADIN].StandingGraphic = civ.Units[UNIT_CRUSADERKNIGHT].StandingGraphic;
    civ.Units[UNIT_IMPERIAL_PALADIN].Type50.AttackGraphic = civ.Units[UNIT_CRUSADERKNIGHT].Type50.AttackGraphic;
    civ.Units[UNIT_IMPERIAL_PALADIN].DyingGraphic = civ.Units[UNIT_CRUSADERKNIGHT].DyingGraphic;
    civ.Units[UNIT_IMPERIAL_PALADIN].DeadFish.WalkingGraphic = civ.Units[UNIT_CRUSADERKNIGHT].DeadFish.WalkingGraphic;
    // Enhanced stats
    civ.Units[UNIT_IMPERIAL_PALADIN].HitPoints = 180;
    civ.Units[UNIT_IMPERIAL_PALADIN].Type50.DisplayedAttack = 16;
    civ.Units[UNIT_IMPERIAL_PALADIN].Type50.Attacks[0].Amount = 16;
}
```

**Key points:**
- Copy stats from a similar unit as a base
- Set unique Name (internal game name, max 8 chars)
- Set LanguageDLL IDs for displayed name, creation message, and help text
- Copy graphics from an existing unit or set custom graphics
- Adjust stats (HP, attack, armor) as needed

### 1.5 Create Research Tech and Effect

**File:** `modding/civbuilder.cpp`

Create the effect and tech that enables the unit (around line 3065):

```cpp
// Imperial Paladin (upgrade from Paladin)
e.EffectCommands.clear();
e.Name = "Imperial Paladin";
e.EffectCommands.push_back(createEC(3, UNIT_PALADIN, UNIT_IMPERIAL_PALADIN, -1, 0));
this->df->Effects.push_back(e);

t = Tech();
t.Name = "Imperial Paladin";
t.LanguageDLLName = 7603;
t.LanguageDLLDescription = 8603;
t.LanguageDLLHelp = 28603;
t.LanguageDLLTechTree = 7603;
t.RequiredTechs.push_back(716);  // Requires Paladin tech
t.RequiredTechCount = 1;
t.ResourceCosts[0].Type = 0;  // Food
t.ResourceCosts[0].Amount = 1300;
t.ResourceCosts[0].Flag = 1;
t.ResourceCosts[1].Type = 3;  // Gold
t.ResourceCosts[1].Amount = 750;
t.ResourceCosts[1].Flag = 1;
t.Civ = 99;  // Available to all civs
setResearchLocation(t, 101, 150, 10);  // Stable (101), 150s, button 10
t.EffectID = (this->df->Effects.size() - 1);
this->df->Techs.push_back(t);
this->civBonuses[CIV_BONUS_363_CAN_UPGRADE_PALADIN_TO_IMPERIAL_PALADIN] = {(int)(this->df->Techs.size() - 1)};
```

**Effect command types:**
- Type 3: Upgrade unit (transforms unit A to unit B)
- Type 101: Enable tech
- Type 102: Disable tech
- Other types available in game engine documentation

**Research location IDs:**
- 101: Stable
- 82: Barracks
- 87: Archery Range
- 68: Town Center

### 1.6 Implement Bonus Logic

**File:** `modding/civbuilder.cpp`

If not already done in step 1.5, map the bonus to its tech:

```cpp
// This is usually done in the tech creation above
this->civBonuses[CIV_BONUS_363_CAN_UPGRADE_PALADIN_TO_IMPERIAL_PALADIN] = {imperialPaladinTech};
```

**For replacement bonuses:**
- First tech enables the new unit
- Second tech disables the replaced unit in tech tree

**For additive bonuses (like "Can recruit X"):**
- Only need one tech to enable the unit

### 1.7 Add Unit to Unit Classes (if applicable)

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

For **additive bonuses** (adds new unit after existing one):

```typescript
// In the appropriate lane and row
// IMPORTANT: Keep units in the same column position as their predecessors to avoid crossing lines
// Example: Imperial Paladin comes after Paladin, so it should be in the same column
if (isBonusSelected(BONUS_ID_IMPERIAL_PALADIN)) {
  stablelane.rows.imperial_3.push(unit(IMPERIAL_PALADIN)); // Same column as Paladin in imperial_2
}
```

**Important Notes on Row Placement:**
- Units that upgrade from each other should be placed in the same column position across different rows
- This prevents visual crossing of connection lines in the tech tree
- Example: Knight (castle_1) → Cavalier (imperial_1) → Paladin (imperial_2) → Imperial Paladin (imperial_3)
- If adding a new unit line that requires a new row (e.g., imperial_3), you must:
  1. Add the row to `LaneRows` interface in `useTechtreeData.ts`
  2. Add the row to `TreeOffsets` interface in `useTechtreeData.ts`
  3. Initialize the row in `createLane()` function in `useTechtree.ts`
  4. Add offset calculation in `buildTree()` function in `useTechtree.ts`

For **recruit/train bonuses** (adds unit at specific age):

```typescript
// In the appropriate lane and row
if (selectedBonuses.has(CIV_BONUS_XXX_CAN_RECRUIT_UNIT)) {
  archerylane.rows.castle_1.push(unit(NEW_UNIT));
}
```

### 3.3 Add Techtree Image

**Directory:** `public/aoe2techtree/img/Units/`

Add a unit image with the filename matching the unit ID:

```bash
# Copy from an existing unit (e.g., Paladin unit ID 569)
cp public/aoe2techtree/img/Units/569.jpg public/aoe2techtree/img/Units/2540.jpg

# Or add your own custom image (must be in .jpg format)
# Image should be 50x50 pixels for optimal display
```

**Note:** The filename must exactly match the unit ID (e.g., `2540.jpg` for unit ID 2540).

### 3.4 Add to Bonus-Granted Logic

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

This is a complete example of adding "Can upgrade Paladin to Imperial Paladin" bonus (similar to Imperial Camel):

### C++ Changes

```cpp
// modding/enums/unit_ids.h
UNIT_IMPERIAL_PALADIN = 2540, // IMPALADN

// modding/enums/tech_ids.h  
TECH_IMPERIAL_PALADIN = 1510,

// modding/CivBonusEnum.h
CIV_BONUS_363_CAN_UPGRADE_PALADIN_TO_IMPERIAL_PALADIN = 363, // Can upgrade Paladin to Imperial Paladin

// modding/civbuilder.cpp (in initialize())
this->civBonuses[CIV_BONUS_363_CAN_UPGRADE_PALADIN_TO_IMPERIAL_PALADIN] = {TECH_IMPERIAL_PALADIN};

this->unitClasses["stable"] = {
    // ... existing units ...
    UNIT_IMPERIAL_PALADIN,
    // ... rest ...
};
```

### Frontend Changes

```javascript
// public/js/common.js
["Can upgrade Paladin to Imperial Paladin", 2, 1, 0],  // Index 363

// src/frontend/app/composables/useBonusData.ts
["Can upgrade Paladin to Imperial Paladin", 2, 1, 0],

// src/frontend/app/composables/useBonusTechMapping.ts
{
  bonusId: 363,
  bonusType: 'civ',
  units: [2540],  // Imperial Paladin
  prerequisites: {
    units: [38, 283, 569],  // Knight, Cavalier, Paladin
  },
  requiresPrerequisites: true,
}

// src/frontend/app/composables/useTechtree.ts
export const IMPERIAL_PALADIN = 2540;

// In buildTree() - add to imperial_2 row (after Paladin):
if (isBonusSelected(BONUS_ID_IMPERIAL_PALADIN)) {
  stablelane.rows.imperial_2.push(unit(IMPERIAL_PALADIN));
}

// Add connection from Paladin to Imperial Paladin:
[u(PALADIN), u(IMPERIAL_PALADIN)],
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
