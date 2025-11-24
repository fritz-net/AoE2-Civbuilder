# extract-dat-info - DAT File Information Extractor

## Overview

`extract-dat-info` is a helper program that extracts unit names, tech names, and effect names from Age of Empires 2 DAT files. It outputs the data in a machine and human-readable JSON format.

This tool is designed to make it easier to:
- Generate enums for unit IDs in civbuilder.cpp
- Understand the structure of units, techs, and effects in the game
- Create mappings between unit IDs and their names
- Future expansion to extract more game data

## Building

The tool is automatically built when you run the standard build script:

```bash
cd modding
./scripts/build.sh
```

This will create the `extract-dat-info` executable in the `modding/build/` directory.

## Usage

```bash
./extract-dat-info <input_dat_file> <output_json_file> [strings_json_file]
```

### Examples

Extract data from the vanilla DAT file (without display names):

```bash
cd modding
./build/extract-dat-info ../public/vanillaFiles/empires2_x2_p1.dat unit_data.json
```

Extract data with display names from strings.json:

```bash
cd modding
./build/extract-dat-info ../public/vanillaFiles/empires2_x2_p1.dat unit_data.json ../public/aoe2techtree/data/locales/en/strings.json
```

Extract data from a different DAT version:

```bash
./build/extract-dat-info ../public/vanillaFiles/empires2_x2_p1_3k.dat unit_data_3k.json
```

## Output Format

The output JSON file contains three main sections:

### Metadata

```json
{
  "metadata": {
    "source_file": "../public/vanillaFiles/empires2_x2_p1.dat",
    "game_version": "LatestDE2",
    "compilation_date": "Nov 24 2025",
    "has_display_names": true
  }
}
```

Note: `compilation_date` represents when the tool was compiled, not when the extraction was performed. The `has_display_names` field indicates whether a strings.json file was provided.

### Units

Each unit entry contains:
- `id`: Unit ID (used in code)
- `name`: Internal unit name (e.g., "ARCHR", "SPRMN")
- `display_name`: Human-readable name (e.g., "Archer", "Militia") - only if strings.json was provided
- `language_dll_name`: DLL string ID for the unit name
- `language_dll_creation`: DLL string ID for creation text
- `type`: Unit type (see UnitType enum in Unit.h)
- `class`: Unit class
- `train_locations`: Array of buildings where this unit can be trained (for creatable units)

Example:
```json
{
  "id": 74,
  "name": "SPRMN",
  "display_name": "Militia",
  "language_dll_name": 5079,
  "language_dll_creation": 6079,
  "type": 70,
  "class": 6,
  "train_locations": [
    {
      "unit_id": 12,
      "button_id": 1,
      "train_time": 21,
      "hotkey_id": 16079
    }
  ]
}
```

### Techs

Each tech entry contains:
- `id`: Tech ID
- `name`: Internal tech name
- `display_name`: Human-readable name (e.g., "Town Watch") - only if strings.json was provided
- `language_dll_name`: DLL string ID for tech name
- `language_dll_description`: DLL string ID for description
- `civ`: Civilization ID (-1 for all civs)
- `research_time`: Time to research (legacy field)
- `research_location`: Building ID where it's researched (legacy field)
- `research_locations`: Array of buildings where this tech can be researched (new structure)

Example:
```json
{
  "id": 8,
  "name": "Town Watch",
  "display_name": "Town Watch",
  "language_dll_name": 7008,
  "language_dll_description": 8008,
  "civ": -1,
  "research_location": -1,
  "research_time": 0,
  "research_locations": [
    {
      "location_id": 109,
      "button_id": 8,
      "research_time": 25
    }
  ]
}
```

### Effects

Each effect entry contains:
- `id`: Effect ID
- `name`: Internal effect name
- `num_commands`: Number of effect commands

Example:
```json
{
  "id": 1,
  "name": "Hindustanis Tech Tree",
  "num_commands": 51
}
```

## Using the Output

### Creating Unit ID Enums

You can use the output to create C++ enums or constants. For example:

```cpp
// Extract unit IDs from JSON and create:
enum UnitID {
    ARCHER = 4,
    MILITIA = 74,
    SCOUT = 448,
    BATTERING_RAM = 35,
    // ... etc
};
```

### Building Unit Class Maps

You can also use it to verify or update the unit class mappings in civbuilder.cpp:

```cpp
// From the issue:
this->unitClasses["barracks"] = {74, 75, 77, 473, 567, 93, 358, 359, ...};
this->unitClasses["archery"] = {4, 24, 492, 5, 7, 6, 1155, 39, 474, ...};
```

### Query Specific Units

Use `jq` to filter the JSON output:

```bash
# Find all units with ID between 4 and 10
cat unit_data.json | jq '.units[] | select(.id >= 4 and .id <= 10)'

# Find a specific unit by ID
cat unit_data.json | jq '.units[] | select(.id == 74)'

# Find units by name pattern
cat unit_data.json | jq '.units[] | select(.name | contains("ARCHR"))'
```

## Future Enhancements

This tool is designed to be extensible. Future versions could include:
- More detailed unit properties (HP, attack, armor, etc.)
- Building information
- Civilization data
- Graphics and sound references
- Custom output formats (CSV, C++ header files, etc.)

## Related Files

- Source: `modding/extract-dat-info.cpp`
- Build config: `modding/CMakeLists.txt`
- Related: `modding/civbuilder.cpp` (uses unit IDs)
