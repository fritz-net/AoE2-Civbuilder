# Using Draft JSON Files with Combine Civilizations

## Overview

When you download a mod created through Draft Mode, it now includes `draft-config.json` which contains all the civilization configurations from your draft session. You can extract individual civilizations from this file and use them in the **Combine Civilizations** feature.

## How to Extract Civilizations from draft-config.json

### Step 1: Open draft-config.json

After downloading your draft mod, extract the zip file. You'll find `draft-config.json` in the root of the zip file.

### Step 2: Locate the Players Array

Open `draft-config.json` in a text editor. The structure looks like this:

```json
{
  "id": "123456789",
  "timestamp": 1234567890,
  "preset": { ... },
  "players": [
    {
      "alias": "Romans",
      "description": "Strong military civilization",
      "flag_palette": [3, 4, 5, 6, 7, 3, 3, 3],
      "tree": [ ... ],
      "bonuses": [ ... ],
      "architecture": 1,
      "language": 0,
      "wonder": 0,
      "castle": 0
    },
    {
      "alias": "Vikings",
      ...
    }
  ],
  "gamestate": { ... }
}
```

### Step 3: Extract Individual Players

Each object in the `players` array represents one civilization. To use a civilization in the Combine feature:

1. Copy a player object from the array
2. Extract only these fields:
   - `alias`
   - `description`
   - `flag_palette`
   - `tree`
   - `bonuses`
   - `architecture`
   - `language`
   - `wonder`
   - `castle`
3. Remove any extra fields like `ready`, `name`, `priority`, etc.
4. Save as a new JSON file (e.g., `Romans.json`)

**Example of extracted civilization JSON:**

```json
{
  "alias": "Romans",
  "description": "Strong military civilization",
  "flag_palette": [3, 4, 5, 6, 7, 3, 3, 3],
  "tree": [
    [13, 17, 21, 74, 545, 539, 331, 125, 83, 128, 440],
    [12, 45, 49, 50, 68, 70, 72, 79, 82, 84, 87, 101, 103, 104, 109],
    [22, 101, 102, 103, 408]
  ],
  "bonuses": [
    [10, 15],
    [5],
    [3],
    [2],
    [1]
  ],
  "architecture": 1,
  "language": 0,
  "wonder": 0,
  "castle": 0,
  "customFlag": false,
  "customFlagData": ""
}
```

### Step 4: Use in Combine Civilizations

1. Go to the **Combine Civilizations** page
2. Upload your extracted civilization JSON files
3. Create a combined mod with the civilizations you selected

## Quick Extraction Script

If you're comfortable with JavaScript, you can use this script to automatically extract all civilizations:

```javascript
const fs = require('fs');
const path = require('path');

try {
  // Read draft-config.json
  const draftPath = 'draft-config.json';
  
  if (!fs.existsSync(draftPath)) {
    console.error('Error: draft-config.json not found');
    process.exit(1);
  }
  
  const draftContent = fs.readFileSync(draftPath, 'utf8');
  const draft = JSON.parse(draftContent);
  
  // Validate structure
  if (!draft.players || !Array.isArray(draft.players)) {
    console.error('Error: Invalid draft JSON - missing or invalid players array');
    process.exit(1);
  }
  
  // Extract each player as a separate file
  draft.players.forEach((player, index) => {
    const civ = {
      alias: player.alias,
      description: player.description,
      flag_palette: player.flag_palette,
      tree: player.tree,
      bonuses: player.bonuses,
      architecture: player.architecture,
      language: player.language,
      wonder: player.wonder,
      castle: player.castle,
      customFlag: player.customFlag || false,
      customFlagData: player.customFlagData || ''
    };
    
    // Sanitize filename to remove unsafe characters
    const safeName = (player.alias || `civ${index}`)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50); // Limit length
    const filename = `${safeName}.json`;
    
    fs.writeFileSync(filename, JSON.stringify(civ, null, 2));
    console.log(`✓ Extracted: ${filename}`);
  });
  
  console.log(`\n✅ Successfully extracted ${draft.players.length} civilization(s)`);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
```

## Notes

- The draft-config.json preserves the exact configuration of each civilization from your draft session
- You can mix civilizations from different draft sessions by extracting them individually
- The data.json file in the zip is used internally by the mod and has a different format
- If a player didn't complete their civilization setup, their entry might have incomplete data

## Compatibility

✅ Draft JSON player format is **fully compatible** with the Combine Civilizations feature
✅ All civilization properties (bonuses, tech tree, architecture, etc.) are preserved
✅ Works with both legacy UI and new Nuxt UI
