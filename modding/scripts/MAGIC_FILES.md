# Magic Files from DAT File

This document describes the "magic files" that contain game data extracted from the Age of Empires 2 DAT file, and how to regenerate them.

## Overview

The following files contain hardcoded game data that should be kept in sync with the game's DAT file:

1. **misc/strings.txt** - Civilization bonus strings
2. **process_mod/modStrings.js** - Arrays for unique unit names and civ bonus strings
3. **public/js/common.js** - Arrays for civilization names and other constants

## Tool: extract-dat-info

The `extract-dat-info` C++ tool (from issue #35) extracts structured data from DAT files:

- **Location**: `modding/extract-dat-info.cpp`
- **Build**: Run `./modding/scripts/build.sh`
- **Output**: JSON file with units, techs, and effects
- **Documentation**: `modding/scripts/README_extract-dat-info.md`

## Automated Extraction Script

### extract-and-document.sh

**Location**: `modding/scripts/extract-and-document.sh`

**Usage**:
```bash
cd modding
./scripts/extract-and-document.sh [path/to/dat/file]
```

If no DAT file is specified, it defaults to `public/vanillaFiles/empires2_x2_p1_october2025.dat`.

**Output Directory**: `modding/generated/`

**Generated Files**:
- `extracted_data.json` - Full DAT file data (units, techs, effects)
- `unique_units_reference.txt` - List of unique unit IDs and internal names
- `civ_names_reference.txt` - List of civilization names
- `README.md` - Documentation

## File Descriptions and Update Process

### 1. misc/strings.txt

**Purpose**: Contains civilization bonus strings used for generating mod files.

**Format**:
```javascript
["Bonus description text", number1, number2],
```

**Update Process**:
1. Run `./modding/scripts/extract-and-document.sh`
2. Review game changes and update bonus strings manually
3. The first element is the human-readable bonus description
4. The second and third elements are category/type identifiers

**Note**: This file is typically updated manually based on game balance changes and new civilizations.

### 2. process_mod/modStrings.js

**Purpose**: Contains arrays used when generating mod string files.

**Arrays**:

#### `uniqueNames` (96 elements)
- Plural names of unique units (e.g., "Longbowmen", "Throwing Axemen")
- Used to reference unique units in generated mod strings
- Indexed by unique unit type

**Update Process**:
1. Run `./modding/scripts/extract-and-document.sh`
2. Review `modding/generated/unique_units_reference.txt`
3. Convert internal names (e.g., "LNGBW") to plural display names (e.g., "Longbowmen")
4. Update the array in modStrings.js

#### `civBonusStrings` (560+ elements)
- Human-readable civilization bonus descriptions
- Mirrors the content from misc/strings.txt but as a pure string array
- Used when writing mod string files

**Update Process**:
1. Keep in sync with misc/strings.txt
2. Extract just the string portion (first element of each array in strings.txt)
3. Update the array in modStrings.js

**Usage in Code**:
```javascript
// Get unique unit name by index
const unitName = uniqueNames[civs.techtree[index][0]];

// Get bonus description
const bonusText = civBonusStrings[civs.civ_bonus[i][j]];
```

### 3. public/js/common.js

**Purpose**: Contains shared constants used across the web interface.

**Arrays**:

#### `civNames` (71 elements)
- Names of all civilizations
- Used for filtering and display throughout the UI

**Update Process**:
1. Run `./modding/scripts/extract-and-document.sh`
2. Review `modding/generated/civ_names_reference.txt`
3. Update the civNames array in common.js
4. Ensure order matches game data expectations

**Other Constants**:
- `num_cards` - Number of cards of each type
- `rarities` - Card rarity levels
- `classToName` - Unit class ID to name mapping

**Usage in Code**:
```javascript
// Filter by civilization name
if (!civNames[-1 * card_descriptions[roundType][i][2]].toLowerCase().includes(filterText)) {
  // ...
}
```

## Workflow for Updating After Game Patch

When a new game patch is released:

1. **Obtain new DAT file**
   - Copy updated DAT file to `public/vanillaFiles/`
   - Name it appropriately (e.g., `empires2_x2_p1_december2025.dat`)

2. **Extract data**
   ```bash
   cd modding
   ./scripts/extract-and-document.sh ../public/vanillaFiles/empires2_x2_p1_december2025.dat
   ```

3. **Review changes**
   - Check `modding/generated/` for updated reference files
   - Compare with previous versions to identify changes

4. **Update source files**
   - Update `misc/strings.txt` with new/changed bonus strings
   - Update `process_mod/modStrings.js` arrays:
     - Add new unique units to `uniqueNames`
     - Update `civBonusStrings` to match strings.txt
   - Update `public/js/common.js`:
     - Add new civilizations to `civNames`
     - Update any changed constants

5. **Test**
   - Run existing tests: `npm test`
   - Test mod generation with new data
   - Verify web interface displays correctly

6. **Commit**
   - Commit updated magic files
   - Include generated reference files for documentation
   - Note game version in commit message

## Design Decisions

### Why Not Fully Automated?

The magic files are not automatically generated and updated for several reasons:

1. **Human-Readable Names**: Internal DAT names (e.g., "LNGBW") need manual conversion to display names (e.g., "Longbowmen")

2. **Pluralization**: Unique unit names need proper English pluralization

3. **Ordering**: Arrays must maintain specific ordering for backward compatibility with existing generated mods

4. **Manual Curation**: Some bonus strings require manual editing for clarity and consistency

5. **Validation**: Changes should be reviewed before deployment to avoid breaking existing functionality

### Future Improvements

Potential enhancements to this system:

1. **Name Mapping Table**: Create a mapping file from internal names to display names
2. **Diff Tool**: Script to compare old and new extracted data and highlight changes
3. **Validation Script**: Automated checks to ensure arrays are properly formatted
4. **Test Generation**: Auto-generate tests based on extracted data

## Files Summary

| File | Purpose | Update Method |
|------|---------|---------------|
| `misc/strings.txt` | Bonus strings for mod generation | Manual + reference |
| `process_mod/modStrings.js` | Unique units and bonus arrays | Manual + reference |
| `public/js/common.js` | Civ names and constants | Manual + reference |
| `modding/generated/*.txt` | Reference files | Auto-generated |
| `modding/generated/extracted_data.json` | Full DAT data | Auto-generated |

## Related Issues

- #35 - Original issue for creating the extract-dat-info tool
- Current issue - Create magic files from DAT file

## Maintainers

When updating these files, ensure:
- Arrays maintain consistent indexing
- New entries are appended to the end when possible
- Changes are tested thoroughly before deployment
- Documentation is updated if structure changes
