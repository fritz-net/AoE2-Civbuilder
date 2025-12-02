# Version Number in Mod Filename - Implementation Summary

## Overview

This document describes the implementation of the new mod filename format that includes version, datetime, and a random hex identifier.

## New Filename Format

**Format:** `{iso_datetime}_{hex*4}_v{version}.zip`

**Example:** `2025-12-02T23-15-30Z_a3f2_v1.6.2.zip`

### Components

1. **ISO Datetime**: ISO 8601 format with colons replaced by hyphens for filesystem compatibility
   - Format: `YYYY-MM-DDTHH-MM-SSZ`
   - Example: `2025-12-02T23-15-30Z`

2. **4-digit Hex**: Random hexadecimal identifier to ensure uniqueness
   - Format: `[0-9a-f]{4}`
   - Example: `a3f2`

3. **Version**: Semantic version from `.release-please-manifest.json`
   - Format: `v{major}.{minor}.{patch}`
   - Example: `v1.6.2`

## Implementation Details

### New Module: `process_mod/modFilename.js`

Created a new module that provides:

- `getVersion(projectRoot)`: Reads version from manifest file
- `getIsoDatetime()`: Generates filesystem-safe ISO datetime string
- `getHex4()`: Generates 4-digit random hex string
- `generateModFilename(projectRoot)`: Generates complete filename with `.zip` extension
- `generateModFilenameNoExt(projectRoot)`: Generates filename without extension

### Modified Files

#### 1. `process_mod/zipModFolder.sh`

**Changes:**
- Added optional 3rd parameter for custom zip filename
- Maintains backward compatibility (uses draft ID if no custom filename provided)
- Added support for including JSON files in zip (data.json and draft-config.json)

**Usage:**
```bash
# With custom filename
bash ./process_mod/zipModFolder.sh <draft_id> <make_ui_mod> <custom_filename>

# Backward compatible (old way)
bash ./process_mod/zipModFolder.sh <draft_id> <make_ui_mod>
```

#### 2. `server.js`

**Changes:**
- Import `generateModFilename` and `generateModFilenameNoExt` from new module
- Update `zipModFolder` middleware to generate new filename and pass to shell script
- Store `modFilename` in request object for download routes
- Update `/random` and `/create` routes to use stored filename
- Update draft mode zip creation to use new filename format
- Store `modFilename` in draft JSON for later retrieval
- Update `/download` route to read filename from draft JSON
- Fix bug: Changed draft mode to use `__dirname` instead of `tempdir` for thumbnail path
- Add draft-config.json and data.json to draft mode zips

### Additional Features

#### 1. Thumbnail in Draft Mode

Fixed a bug where draft mode was using `tempdir` instead of `__dirname` to locate the thumbnail.
Now thumbnails are correctly included in both `/build` and `/draft` modes.

#### 2. JSON Files in Draft Zips

Draft mode zips now include:
- `draft-config.json`: The complete draft configuration (players, bonuses, settings, etc.)
- `data.json`: The generated mod data used to create the mod

These files allow users to:
- Understand what bonuses/settings were used
- Potentially recreate or modify the draft
- Debug issues with the generated mod

## Testing

### Unit Tests

Created comprehensive test suite in `__tests__/modFilename.test.js`:
- Version reading from manifest
- ISO datetime generation (filesystem-safe)
- Hex generation (4 digits, randomness)
- Complete filename generation and format validation
- All 15 tests passing ✅

### E2E Tests

Created test suites:

1. **`__tests__/modFilenameFormat.test.js`**: Tests the integration with shell scripts
   - Custom filename support
   - Backward compatibility
   - Format validation
   - All 5 tests passing ✅

2. **`__tests__/jsonInDraftZip.test.js`**: Tests JSON file inclusion
   - data.json inclusion
   - draft-config.json inclusion
   - Both files together
   - Backward compatibility (no JSON files)
   - Data-only mods (no UI)
   - All 5 tests passing ✅

### Existing Tests

All existing tests continue to pass:
- `thumbnailInZip.test.js`: ✅ (confirms backward compatibility)
- Other tests: Not affected by changes

## Backward Compatibility

The implementation maintains full backward compatibility:

1. **Shell Script**: If no custom filename is provided, uses the draft ID (old behavior)
2. **JSON Files**: If JSON files don't exist, zip is created without them (old behavior)
3. **Download Route**: Falls back to draft ID if modFilename is not stored in draft JSON

## Example Usage

### Build/Create Flow

```javascript
// User creates mod via /build or /create
// Server generates new filename
const newFilename = generateModFilenameNoExt(__dirname);
// Example: "2025-12-02T23-15-30Z_a3f2_v1.6.2"

// Pass to zip script
execCommand(`bash ./process_mod/zipModFolder.sh ${seed} 1 ${newFilename}`);

// Store in request for download
req.modFilename = newFilename;

// Download uses new filename
res.download(`./modding/requested_mods/${req.modFilename}.zip`);
```

### Draft Flow

```javascript
// When draft completes
const newFilename = generateModFilenameNoExt(__dirname);
draft["modFilename"] = newFilename;

// Copy JSON files before zipping
fs.copyFileSync(`${tempdir}/drafts/${draft["id"]}.json`, 
                `./modding/requested_mods/${draft["id"]}/draft-config.json`);

// Create zip with new filename
execCommand(`bash ./process_mod/zipModFolder.sh ${draft["id"]} 1 ${newFilename}`);

// Download later retrieves filename from draft
const draft = getDraft(draftID);
const filename = draft.modFilename || draftID; // Fallback for old drafts
res.download(`./modding/requested_mods/${filename}.zip`);
```

## Benefits

1. **Version Tracking**: Users can see which version of civbuilder created their mod
2. **Unique Filenames**: Datetime + hex ensures uniqueness, avoiding overwrites
3. **Organized Downloads**: Users can sort by date and identify mod versions
4. **Debugging**: JSON files in draft zips help with troubleshooting
5. **Backward Compatible**: Old code and old draft JSONs continue to work

## Future Enhancements

Potential improvements not included in this PR:
- Add Playwright E2E tests for actual download flow (requires C++ binary)
- Add version info to mod `info.json` files
- Create UI to display version info to users
- Add download history/management feature
