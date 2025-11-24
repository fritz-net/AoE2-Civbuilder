#!/bin/bash
#
# extract-and-document.sh
# 
# This script extracts data from the DAT file and creates documentation
# for updating magic files (strings.txt, modStrings.js, common.js)
#
# Usage: ./extract-and-document.sh [dat_file]
#

set -e

# Determine paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODDING_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$MODDING_DIR")"
BUILD_DIR="$MODDING_DIR/build"
OUTPUT_DIR="$MODDING_DIR/generated"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Default DAT file
DAT_FILE="${1:-$PROJECT_ROOT/public/vanillaFiles/empires2_x2_p1_october2025.dat}"

echo "=================================================="
echo "  DAT File Data Extraction and Documentation"
echo "=================================================="
echo ""
echo "DAT file: $DAT_FILE"
echo "Output directory: $OUTPUT_DIR"
echo ""

# Check if extract-dat-info exists
if [ ! -f "$BUILD_DIR/extract-dat-info" ]; then
    echo "Error: extract-dat-info not found in $BUILD_DIR"
    echo "Please run ./scripts/build.sh first"
    exit 1
fi

# Extract data
echo "Step 1: Extracting data from DAT file..."
"$BUILD_DIR/extract-dat-info" "$DAT_FILE" "$OUTPUT_DIR/extracted_data.json"
echo ""

# Generate documentation
echo "Step 2: Generating documentation..."
cat > "$OUTPUT_DIR/README.md" << 'EOFREADME'
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
EOFREADME

echo "Step 3: Creating reference files..."

# Extract unique units
echo "  - Extracting unique unit reference..."
node - "$OUTPUT_DIR/extracted_data.json" "$OUTPUT_DIR/unique_units_reference.txt" << 'EOFNODE'
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

// Known unique unit IDs from civbuilder.cpp (base form, not elite)
const knownUniqueUnitIDs = [
  8, 281, 41, 25, 73, 40, 239, 46, 94, 11, 232, 771, 725, 763, 755, 827,
  866, 1747, 879, 869, 876, 1001, 1016, 1013, 1007, 1120, 1123, 1126, 1129,
  1225, 1252, 1228, 1231, 1234, 1655, 1658, 1701, 1735, 1738, 1741, 1759,
  1800, 1803, 1959, 1968, 1949, 1908, 1920
];

let output = 'Unique Unit IDs and Names (Base Form)\n';
output += '=====================================\n\n';
output += 'Format: [Unit ID] Unit Name (Internal Name)\n\n';

const uniqueUnits = data.units
  .filter(u => knownUniqueUnitIDs.includes(u.id))
  .sort((a, b) => a.id - b.id);

for (const unit of uniqueUnits) {
  output += `[${unit.id}] ${unit.name}\n`;
}

output += '\n\nNote: These are base form unique units. Elite versions have different IDs.\n';
output += 'The uniqueNames array in modStrings.js should use plural forms of the unit names.\n';

fs.writeFileSync(process.argv[3], output);
console.log(`  ✓ Wrote ${uniqueUnits.length} unique units to ${process.argv[3]}`);
EOFNODE

# Extract civ names
echo "  - Extracting civilization names..."
node - "$OUTPUT_DIR/extracted_data.json" "$OUTPUT_DIR/civ_names_reference.txt" << 'EOFNODE'
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

let output = 'Civilization Names\n';
output += '==================\n\n';
output += 'Extracted from effect names (e.g., "Britons Tech Tree", "Franks Team Bonus")\n\n';

const civSet = new Set(['Gaia']);
const civPattern = / (Tech Tree|Team Bonus)$/;

for (const effect of data.effects) {
  const match = effect.name.match(/^(.+) (Tech Tree|Team Bonus)$/);
  if (match) {
    civSet.add(match[1]);
  }
}

const civs = Array.from(civSet).sort();
output += civs.join('\n');
output += '\n\n';
output += `Total: ${civs.length} civilizations\n`;

fs.writeFileSync(process.argv[3], output);
console.log(`  ✓ Wrote ${civs.length} civilization names to ${process.argv[3]}`);
EOFNODE

echo ""
echo "=================================================="
echo "  Extraction Complete!"
echo "=================================================="
echo ""
echo "Generated files in: $OUTPUT_DIR"
echo ""
echo "- extracted_data.json     : Full DAT file data"
echo "- unique_units_reference.txt : Unique unit reference"
echo "- civ_names_reference.txt : Civilization names"
echo "- README.md              : Documentation"
echo ""
echo "Next steps:"
echo "1. Review the generated reference files"
echo "2. Update arrays in source files as needed:"
echo "   - process_mod/modStrings.js (uniqueNames, civBonusStrings)"
echo "   - public/js/common.js (civNames)"
echo "   - misc/strings.txt (bonus strings)"
echo ""
