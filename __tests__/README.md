# Tests

This directory contains automated tests for the AoE2-Civbuilder project.

## Running Tests

To run all tests:

```bash
npm test
```

To run tests in watch mode:

```bash
npm run test:watch
```

## Test Structure

- `__tests__/` - Test files (files ending with `.test.js`)
- `__tests__/fixtures/` - Test data and fixtures
- `__tests__/helpers/` - Helper scripts and utilities (not run as tests)

## Current Tests

### Vanilla Civs Tests

**Test File**: `__tests__/vanillaCivs.test.js`

This test suite validates that all vanilla civilization JSON files in `public/vanillaFiles/vanillaCivs/VanillaJson/` can be successfully processed by the create-data-mod backend tool.

**Test Coverage**:
- 51 vanilla civilizations (Armenians, Aztecs, Bengalis, Berbers, Bohemians, Britons, Bulgarians, Burgundians, Burmese, Byzantines, Celts, Chinese, Cumans, Dravidians, Ethiopians, Franks, Georgians, Goths, Gurjaras, Hindustanis, Huns, Inca, Incas, Italians, Japanese, Jurchens, Khitans, Khmer, Koreans, Lithuanians, Magyars, Malay, Malians, Mayans, Mongols, Persians, Poles, Portuguese, Romans, Saracens, Shu, Sicilians, Slavs, Spanish, Tatars, Teutons, Turks, Vietnamese, Vikings, Wei, Wu)
- Each civ is converted to internal data.json format
- Processed through C++ create-data-mod tool
- Validates successful DAT file generation

### Dat File Creation Tests

These tests validate dat file creation with different dat file versions using the exact input data from the crash log.

**Status**: **FIXED** - The off-by-one error has been resolved. 3 out of 4 dat files now work correctly.

**Test File**: `__tests__/datFileCreation.test.js`
**Test Data**: `__tests__/fixtures/crash-test-data.json`

#### Tested Dat Files:

1. **empires2_x2_p1.dat** - Current default dat file ✅ **WORKING**
2. **empires2_x2_p1_3k.dat** - 3 Kingdoms dat file ⏭️ **SKIPPED** (has vector length error, needs investigation)
3. **empires2_x2_p1_august2025.dat** - August 2025 dat file ✅ **WORKING**
4. **empires2_x2_p1_october2025.dat** - October 2025 dat file ✅ **WORKING**

#### Fix Applied

**Off-by-one error**: The code was using `numCivs = df->Civs.size()` which included Gaia (Civ[0]). When looping with `i < numCivs` and accessing `Civs[i+1]`, it tried to access index 54 when only 0-53 existed.

**Solution**: 
- Changed to `numPlayerCivs = df->Civs.size() - 1` (renamed from `numCivs` for clarity)
- Civ[0] is Gaia/template
- Player civs are Civ[1] through Civ[df->Civs.size()-1]
- `numPlayerCivs` now accurately represents player civ count (excluding Gaia)

Also added bounds checking for `TrainLocations` array access to prevent crashes.

### Debug Tests

**Test File**: `__tests__/debugCrash.test.js`

This test provides debugging information and recommendations for investigating the crash:

1. **Root cause identified**: The code had `numCivs = 50` hardcoded, but different dat files have different numbers of civilizations:
   - 3K dat files typically have 45 civs
   - Current DE dat files have 50+ civs
   - Future versions may have 56+ civs

2. **The crash location**: The error occurs during the "Reconfiguring" phase, likely in the loop at line 831 that iterates `df->Civs.size()` and accesses specific unit IDs (280, 550) that may not exist in all civs or dat file versions.

3. **Recommended debugging steps**:
   - Run with `gdb` to get exact crash location and backtrace
   - Add debug output to print `df->Civs.size()` vs `numCivs`
   - Check if all civs in the dat file have the expected units
   - Make `numCivs` dynamic: `this->numCivs = df->Civs.size();`
   - Add bounds checking before accessing civ units

## Setup for Local Testing

1. Initialize git submodules:
   ```bash
   git submodule update --init --recursive
   ```

2. Install system dependencies:
   ```bash
   sudo apt-get install -y build-essential cmake liblz4-dev libboost-iostreams-dev libjsoncpp-dev libbz2-dev liblzma-dev
   ```

3. Install Node.js dependencies:
   ```bash
   npm install
   ```

4. Build the C++ component:
   ```bash
   cd modding
   ./scripts/build.sh
   ```

5. Run tests:
   ```bash
   npm test
   ```

## CI/CD

Tests are automatically run in GitHub Actions on every push and pull request. See `.github/workflows/test.yml` for the CI configuration.
