#!/usr/bin/env node
/**
 * generate-magic-files.js
 * 
 * Script to generate magic files from extracted DAT data.
 * This script reads the JSON output from extract-dat-info and generates:
 * - misc/strings.txt (civ bonus strings array)
 * - Arrays for process_mod/modStrings.js (uniqueNames, civBonusStrings)
 * - Arrays for public/js/common.js (civNames)
 * 
 * Usage: node generate-magic-files.js <extracted_data.json>
 */

const fs = require('fs');
const path = require('path');

// Process command line arguments
if (process.argv.length < 3) {
  console.error('Usage: node generate-magic-files.js <extracted_data.json>');
  process.exit(1);
}

const extractedDataPath = process.argv[2];
const projectRoot = path.join(__dirname, '../..');

// Read extracted data
console.log(`Reading extracted data from: ${extractedDataPath}`);
const extractedData = JSON.parse(fs.readFileSync(extractedDataPath, 'utf8'));

console.log(`Found ${extractedData.units.length} units`);
console.log(`Found ${extractedData.techs.length} techs`);
console.log(`Found ${extractedData.effects.length} effects`);

/**
 * Extract unique unit names from the data
 * Unique units typically have specific naming patterns
 */
function extractUniqueUnitNames(units) {
  // List of known unique unit name patterns from the original code
  const knownUniqueUnits = [
    'Longbowman', 'Throwing Axeman', 'Huskarl', 'Teutonic Knight', 'Samurai',
    'Chu Ko Nu', 'Cataphract', 'Mameluke', 'War Elephant', 'Janissary',
    'Berserk', 'Mangudai', 'Woad Raider', 'Conquistador', 'Jaguar Warrior',
    'Plumed Archer', 'Tarkan', 'War Wagon', 'Genoese Crossbowman', 'Ghulam',
    'Kamayuk', 'Magyar Huszar', 'Boyar', 'Organ Gun', 'Shotel Warrior',
    'Gbeto', 'Camel Archer', 'Ballista Elephant', 'Karambit Warrior',
    'Arambai', 'Rattan Archer', 'Konnik', 'Keshik', 'Kipchak', 'Leitis',
    'Coustillier', 'Serjeant', 'Obuch', 'Hussite Wagon', 'Crusader Knight',
    'Xolotl Warrior', 'Saboteur', 'Ninja', 'Flamethrower', 'Photonman',
    'Centurion', 'Apukispay', 'Monkey Boy', 'Amazon Warrior', 'Amazon Archer',
    'Iroquois Warrior', 'Varangian Guard', 'Gendarme', 'Cuahchiqueh',
    'Ritterbruder', 'Kazak', 'Szlachcic', 'Cuirassier', 'Rajput',
    'Seljuk Archer', 'Numidian Javelinman', 'Sosso Guard', 'Swiss Pikeman',
    'Headhunter', 'Teulu', 'Maillotin', 'Hashashin', 'Highlander', 'Stradiot',
    'Ahosi', 'Landsknecht', 'Clibinarii', 'Silahtar', 'Jaridah', 'Wolf Warrior',
    'Warrior Monk', 'Castellan', 'Wind Warrior', 'Chakram Thrower',
    'Urumi Swordsman', 'Ratha', 'Composite Bowman', 'Monaspa',
    'White Feather Guard', 'Fire Archer', 'Tiger Cavalry', 'Iron Pagoda',
    'Liao Dao'
  ];
  
  const uniqueUnitMap = new Map();
  
  // Find units that match known patterns
  for (const unit of units) {
    const name = unit.name;
    
    // Check if this matches a known unique unit (case-insensitive)
    for (const knownUnit of knownUniqueUnits) {
      const knownUnitInternal = knownUnit.toUpperCase().replace(/\s+/g, '');
      const unitInternal = name.toUpperCase().replace(/[_\s-]+/g, '');
      
      // Match base unit names (not elite/dead/projectile variants)
      if (unitInternal === knownUnitInternal && 
          !name.includes('Elite') && 
          !name.includes('Dead') && 
          !name.includes('Projectile') &&
          !name.includes('Pattiyodha')) {
        uniqueUnitMap.set(unit.id, knownUnit + 's'); // Pluralize
        break;
      }
    }
  }
  
  // Return array sorted by unit ID
  const sortedEntries = Array.from(uniqueUnitMap.entries()).sort((a, b) => a[0] - b[0]);
  return sortedEntries.map(entry => entry[1]);
}

/**
 * Extract civ bonus strings from the original strings.txt format
 * The format in strings.txt is: ["bonus text", number1, number2]
 */
function extractCivBonusStrings() {
  const stringsPath = path.join(projectRoot, 'misc/strings.txt');
  const content = fs.readFileSync(stringsPath, 'utf8');
  
  // Parse the file line by line
  const lines = content.split('\n').filter(line => line.trim().startsWith('["'));
  const bonusStrings = [];
  
  for (const line of lines) {
    try {
      // Extract just the text part (first element of array)
      const match = line.match(/^\s*\["(.+?)",/);
      if (match) {
        bonusStrings.push(match[1]);
      }
    } catch (e) {
      console.warn(`Failed to parse line: ${line}`);
    }
  }
  
  return bonusStrings;
}

/**
 * Extract civilization names from effects
 * Many effects are named like "Britons Tech Tree", "Franks Team Bonus", etc.
 */
function extractCivNames(effects) {
  const civNames = ['Gaia']; // Start with Gaia
  const civSet = new Set(civNames);
  
  // Known civ list from the existing code
  const knownCivs = [
    'Britons', 'Franks', 'Goths', 'Teutons', 'Japanese', 'Chinese', 'Byzantines',
    'Persians', 'Saracens', 'Turks', 'Vikings', 'Mongols', 'Celts', 'Spanish',
    'Aztecs', 'Mayans', 'Huns', 'Koreans', 'Italians', 'Hindustanis', 'Incas',
    'Magyars', 'Slavs', 'Portuguese', 'Ethiopians', 'Malians', 'Berbers', 'Khmer',
    'Malay', 'Burmese', 'Vietnamese', 'Bulgarians', 'Tatars', 'Cumans', 'Lithuanians',
    'Burgundians', 'Sicilians', 'Poles', 'Bohemians', 'Dravidians', 'Bengalis',
    'Gurjaras', 'Romans', 'Armenians', 'Georgians', 'Achaemenids', 'Athenians',
    'Spartans', 'Shu', 'Wu', 'Wei', 'Jurchens', 'Khitans'
  ];
  
  // Extract from effects that follow pattern "CivName Tech Tree" or "CivName Team Bonus"
  for (const effect of effects) {
    const name = effect.name;
    
    // Check for known civ patterns
    for (const civ of knownCivs) {
      if ((name.includes(`${civ} Tech Tree`) || name.includes(`${civ} Team Bonus`)) && !civSet.has(civ)) {
        civNames.push(civ);
        civSet.add(civ);
        break;
      }
    }
  }
  
  return civNames;
}

// Generate the data
console.log('\nGenerating data...');
const uniqueNames = extractUniqueUnitNames(extractedData.units);
const civBonusStrings = extractCivBonusStrings();
const civNames = extractCivNames(extractedData.effects);

console.log(`Extracted ${uniqueNames.length} unique unit names`);
console.log(`Extracted ${civBonusStrings.length} civ bonus strings`);
console.log(`Extracted ${civNames.length} civilization names`);

// Generate output for each file
const outputs = {
  'uniqueNames': {
    file: 'process_mod/modStrings.js',
    array: uniqueNames,
    format: 'js-string-array'
  },
  'civBonusStrings': {
    file: 'process_mod/modStrings.js',
    array: civBonusStrings,
    format: 'js-string-array'
  },
  'civNames': {
    file: 'public/js/common.js',
    array: civNames,
    format: 'js-string-array'
  }
};

// Display the generated arrays
console.log('\n=== Generated Arrays ===\n');

for (const [name, data] of Object.entries(outputs)) {
  console.log(`\n--- ${name} (${data.array.length} items) ---`);
  console.log(`File: ${data.file}`);
  console.log('Array preview:');
  console.log(JSON.stringify(data.array.slice(0, 10), null, 2));
  console.log('...');
}

// Write summary report
const reportPath = path.join(projectRoot, 'modding/scripts/generation-report.txt');
const reportContent = `
DAT File Magic Files Generation Report
=======================================

Generated on: ${new Date().toISOString()}
Source file: ${extractedDataPath}
Source metadata: ${JSON.stringify(extractedData.metadata, null, 2)}

Summary:
--------
- Unique Unit Names: ${uniqueNames.length} items
- Civ Bonus Strings: ${civBonusStrings.length} items  
- Civilization Names: ${civNames.length} items

Files to update:
----------------
1. process_mod/modStrings.js
   - uniqueNames array (${uniqueNames.length} items)
   - civBonusStrings array (${civBonusStrings.length} items)

2. public/js/common.js
   - civNames array (${civNames.length} items)

3. misc/strings.txt
   - Already up to date (used as source)

Next steps:
-----------
The arrays have been extracted but not automatically updated in the source files.
To complete the update:

1. Review the arrays above to ensure they look correct
2. Manually update the arrays in the respective files, or
3. Run the update script: node modding/scripts/update-magic-files.js

Note: Manual review is recommended to ensure backward compatibility.
`;

fs.writeFileSync(reportPath, reportContent);
console.log(`\n\nReport written to: ${reportPath}`);
console.log('\nTo update the source files, review the generated arrays above.');
console.log('The script has intentionally NOT modified source files automatically');
console.log('to prevent accidental data loss. Please review and update manually.');
