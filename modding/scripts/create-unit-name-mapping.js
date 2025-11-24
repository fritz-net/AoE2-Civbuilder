#!/usr/bin/env node
/**
 * create-unit-name-mapping.js
 * 
 * Creates a mapping between internal unit names from the DAT file
 * and the display names used in the uniqueNames array.
 */

const fs = require('fs');
const path = require('path');

// Mapping of internal names to display names (plural form)
const unitNameMapping = {
  'LNGBW': 'Longbowmen',
  'TAXEM': 'Throwing Axemen',
  'GBRSK': 'Huskarls',
  'TKNIT': 'Teutonic Knights',
  // Note: Samurai not in extracted list - may be Japan civilization-specific
  'CHUKN': 'Chu Ko Nu',
  'CATAP': 'Cataphracts',
  'MPCAV': 'Mamelukes',
  // War Elephants - Persian unique unit
  'JANNI': 'Janissaries',
  'BRSRK': 'Berserks',
  'MOSUN': 'Mangudai',
  'WBRSK': 'Woad Raiders',
  'CONQI': 'Conquistadors',
  'JAGUAR': 'Jaguar Warriors',
  'PLUME': 'Plumed Archers',
  'TARKAN': 'Tarkans',
  'WAGON': 'War Wagons',
  'GENOE': 'Genoese Crossbowmen',
  'UMAGYX': 'Ghulam',
  'KAMAY': 'Kamayuks',
  // Magyar Huszar
  'BOYAR': 'Boyars',
  'ORGAN': 'Organ Guns',
  'SHOTEL': 'Shotel Warriors',
  'GBETO': 'Gbetos',
  'CAMAR': 'Camel Archers',
  'ELEBALI': 'Ballista Elephants',
  'KARAM': 'Karambit Warriors',
  'ARAMBAI': 'Arambai',
  'RATAN': 'Rattan Archers',
  'KONNIK': 'Konniks',
  'KESHIK': 'Keshiks',
  'KIPCHAK': 'Kipchaks',
  'LEITIS': 'Leitis',
  'COUSTILLIER': 'Coustilliers',
  'SERJEANT': 'Serjeants',
  'OBUCH': 'Obuch',
  // Hussite Wagons
  // Crusader Knights
  // Xolotl Warriors
  // Saboteurs
  // Ninjas
  // Flamethrowers
  // And many more...
  'URUMI': 'Urumi Swordsmen',
  'RATHA': 'Rathas',
  'CHAKRAM': 'Chakram Throwers',
  'GHULAM': 'Ghulam',
  'COMPBOW': 'Composite Bowmen',
  'MONASPA': 'Monaspas',
  'WHTFTHRG': 'White Feather Guard',
  'FIREARCHER': 'Fire Archers',
  'TIGERCAV': 'Tiger Cavalry',
  'IRONPAG': 'Iron Pagoda',
  'LIAODAO': 'Liao Dao'
};

// Read extracted data
const extractedDataPath = path.join(__dirname, '../generated/extracted_data.json');
const data = JSON.parse(fs.readFileSync(extractedDataPath, 'utf8'));

// Create reverse mapping
const idToName = new Map();
const idToInternal = new Map();

for (const unit of data.units) {
  idToInternal.set(unit.id, unit.name);
  const displayName = unitNameMapping[unit.name];
  if (displayName) {
    idToName.set(unit.id, displayName);
  }
}

// Output mapping file
let output = '# Unique Unit Name Mapping\n\n';
output += 'Mapping between DAT file internal names and display names used in code.\n\n';
output += '| Unit ID | Internal Name | Display Name (Plural) |\n';
output += '|---------|---------------|----------------------|\n';

const sortedIds = Array.from(idToInternal.keys()).sort((a, b) => a - b);

for (const id of sortedIds) {
  const internal = idToInternal.get(id);
  const display = idToName.get(id) || '(unknown)';
  
  // Only show units that are likely unique units (have names in mapping or class 19)
  const unit = data.units.find(u => u.id === id);
  if (display !== '(unknown)' || unit.class === 19) {
    output += `| ${id} | ${internal} | ${display} |\n`;
  }
}

output += '\n## Notes\n\n';
output += '- Units marked as "(unknown)" need display names added to the mapping\n';
output += '- Elite versions have different IDs and should use "Elite [name]" format\n';
output += '- The uniqueNames array in modStrings.js uses plural forms\n';

const outputPath = path.join(__dirname, '../generated/unit_name_mapping.md');
fs.writeFileSync(outputPath, output);
console.log(`Created unit name mapping: ${outputPath}`);

// Also output as JSON for programmatic use
const jsonMapping = {
  metadata: {
    generated: new Date().toISOString(),
    source: extractedDataPath
  },
  mappings: []
};

for (const id of sortedIds) {
  const unit = data.units.find(u => u.id === id);
  const display = idToName.get(id);
  if (display || unit.class === 19) {
    jsonMapping.mappings.push({
      id: id,
      internal_name: idToInternal.get(id),
      display_name: display || null,
      class: unit.class
    });
  }
}

const jsonPath = path.join(__dirname, '../generated/unit_name_mapping.json');
fs.writeFileSync(jsonPath, JSON.stringify(jsonMapping, null, 2));
console.log(`Created JSON mapping: ${jsonPath}`);
