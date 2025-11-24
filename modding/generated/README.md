# Generated DAT File Data

This directory contains extracted data from the Age of Empires 2 DAT file.

## Files

- `extracted_data.json` - Full extraction from the DAT file including units, techs, and effects
- `unique_units_reference.txt` - List of unique unit IDs and names for reference
- `civ_names_reference.txt` - List of civilization names extracted from effects
- `README.md` - This file

## Usage

### Updating modStrings.js

The `uniqueNames` array in `process_mod/modStrings.js` should contain the names of unique units
in plural form. Use `unique_units_reference.txt` as a reference.

### Updating common.js

The `civNames` array in `public/js/common.js` should contain civilization names.
Use `civ_names_reference.txt` as a reference.

### Updating strings.txt

The `misc/strings.txt` file contains civilization bonus strings in the format:
```
["Bonus description text", number1, number2],
```

This file is typically updated manually based on game data.

## Regenerating

To regenerate these files, run:
```bash
cd modding
./scripts/extract-and-document.sh [path/to/dat/file]
```

If no DAT file is specified, it defaults to `empires2_x2_p1_october2025.dat`.
