# Custom UU API Specification

## Overview

This document defines the API contract for passing custom unique unit data between the frontend and backend in AoE2-Civbuilder. The design is **backwards compatible** with the existing legacy system.

## Data Format

### Legacy Format (Existing)

The current system uses a simple integer ID to reference pre-defined unique units:

```javascript
{
  "techtree": [
    [45, 1, 0, 1, ...],  // Civ 1: UU ID 45 (Photonman), then tech availability
    [12, 1, 1, 0, ...],  // Civ 2: UU ID 12 (Woad Raider), then tech availability
    // ...
  ]
}
```

**Structure:**
- `techtree[i][0]` = Unique Unit ID (0-87)
- `techtree[i][1..N]` = Technology availability flags

### New Format (Custom UU)

The new format allows both legacy integer IDs and custom unit objects:

```javascript
{
  "techtree": [
    // Option 1: Legacy format (pre-defined unit)
    [45, 1, 0, 1, ...],
    
    // Option 2: Custom unit object
    [{
      "type": "custom",
      "unitType": "infantry",
      "baseUnit": 1723,
      "name": "Iron Guard",
      "health": 100,
      "attack": 12,
      "meleeArmor": 3,
      "pierceArmor": 2,
      "attackSpeed": 2.0,
      "speed": 1.0,
      "range": 0,
      "cost": {
        "food": 65,
        "wood": 0,
        "stone": 0,
        "gold": 40
      },
      "trainTime": 18,
      "lineOfSight": 5,
      "heroMode": false,
      "attackBonuses": [
        {"class": 5, "amount": 4}
      ]
    }, 1, 0, 1, ...]
  ]
}
```

## Type Detection

The backend detects the format by checking the type of `techtree[i][0]`:

```javascript
if (typeof techtree[i][0] === 'number') {
  // Legacy format: use pre-defined unit
  const unitID = techtree[i][0];
  // ... existing logic
} else if (typeof techtree[i][0] === 'object' && techtree[i][0].type === 'custom') {
  // New format: custom unit
  const customUnit = techtree[i][0];
  // ... new logic
} else {
  throw new Error('Invalid unit format');
}
```

## Custom Unit Object Schema

### TypeScript Interface

```typescript
interface CustomUniqueUnit {
  // Required fields
  type: 'custom';
  unitType: 'infantry' | 'cavalry' | 'archer' | 'siege';
  baseUnit: number;
  name: string;
  health: number;
  attack: number;
  meleeArmor: number;
  pierceArmor: number;
  speed: number;
  cost: ResourceCost;
  trainTime: number;
  
  // Optional fields
  attackSpeed?: number;
  range?: number;
  lineOfSight?: number;
  heroMode?: boolean;
  attackBonuses?: AttackBonus[];
  
  // Future fields (not yet implemented)
  eliteUpgrade?: EliteUpgrade;
  specialAbilities?: SpecialAbility[];
}

interface ResourceCost {
  food: number;
  wood: number;
  stone: number;
  gold: number;
}

interface AttackBonus {
  class: number;  // Armor class ID
  amount: number; // Bonus damage amount
}

interface EliteUpgrade {
  cost: ResourceCost;
  researchTime: number;
  healthBonus: number;
  attackBonus: number;
  armorBonus: number;
}

interface SpecialAbility {
  type: 'charge' | 'regeneration' | 'aoe' | 'transformation';
  parameters: Record<string, any>;
}
```

### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": [
    "type",
    "unitType",
    "baseUnit",
    "name",
    "health",
    "attack",
    "meleeArmor",
    "pierceArmor",
    "speed",
    "cost",
    "trainTime"
  ],
  "properties": {
    "type": {
      "type": "string",
      "enum": ["custom"]
    },
    "unitType": {
      "type": "string",
      "enum": ["infantry", "cavalry", "archer", "siege"]
    },
    "baseUnit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 2000
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 30
    },
    "health": {
      "type": "integer",
      "minimum": 15,
      "maximum": 250
    },
    "attack": {
      "type": "integer",
      "minimum": 2,
      "maximum": 35
    },
    "meleeArmor": {
      "type": "integer",
      "minimum": -3,
      "maximum": 10
    },
    "pierceArmor": {
      "type": "integer",
      "minimum": -3,
      "maximum": 10
    },
    "attackSpeed": {
      "type": "number",
      "minimum": 0.8,
      "maximum": 6.0
    },
    "speed": {
      "type": "number",
      "minimum": 0.5,
      "maximum": 1.65
    },
    "range": {
      "type": "integer",
      "minimum": 0,
      "maximum": 12
    },
    "cost": {
      "type": "object",
      "required": ["food", "wood", "stone", "gold"],
      "properties": {
        "food": {"type": "integer", "minimum": 0},
        "wood": {"type": "integer", "minimum": 0},
        "stone": {"type": "integer", "minimum": 0},
        "gold": {"type": "integer", "minimum": 0}
      }
    },
    "trainTime": {
      "type": "integer",
      "minimum": 6,
      "maximum": 90
    },
    "lineOfSight": {
      "type": "integer",
      "minimum": 3,
      "maximum": 12
    },
    "heroMode": {
      "type": "boolean"
    },
    "attackBonuses": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["class", "amount"],
        "properties": {
          "class": {"type": "integer"},
          "amount": {"type": "integer"}
        }
      }
    }
  }
}
```

## Backend Processing

### Node.js Server Handling

In `server.js`, add detection logic:

```javascript
// Extract unit information
function extractUnitInfo(techtreeEntry) {
  const unitData = techtreeEntry[0];
  
  if (typeof unitData === 'number') {
    // Legacy format
    return {
      format: 'legacy',
      unitId: unitData,
      isCustom: false
    };
  } else if (typeof unitData === 'object' && unitData.type === 'custom') {
    // New custom format
    return {
      format: 'custom',
      unitData: unitData,
      isCustom: true
    };
  } else {
    throw new Error('Invalid unit data format');
  }
}

// Usage in mod creation
const civ = JSON.parse(data);
for (let i = 0; i < civ.techtree.length; i++) {
  const unitInfo = extractUnitInfo(civ.techtree[i]);
  
  if (unitInfo.isCustom) {
    // Pass custom unit data to C++
    // This requires extending the data.json format
    if (!civ.customUnits) {
      civ.customUnits = [];
    }
    civ.customUnits[i] = unitInfo.unitData;
    
    // Keep a placeholder in techtree for compatibility
    // Use a special ID (e.g., 999) to indicate custom unit
    civ.techtree[i][0] = 999; // Custom unit marker
  }
}
```

### C++ Backend Processing

In `modding/civbuilder.cpp`, extend the parsing to handle custom units:

```cpp
// In Civbuilder::assignUniqueUnits()
void Civbuilder::assignUniqueUnits() {
    for (int i = 0; i < this->numPlayerCivs; i++) {
        int uniqueUnit = this->config["techtree"][i][0].asInt();
        
        if (uniqueUnit == 999) {
            // Custom unit marker - read from customUnits array
            if (this->config.isMember("customUnits") && 
                this->config["customUnits"].size() > i &&
                !this->config["customUnits"][i].isNull()) {
                
                // Create custom unit
                this->createCustomUU(i, this->config["customUnits"][i]);
            } else {
                cerr << "[C++]: Custom unit marker found but no custom data!" << endl;
            }
        } else {
            // Existing logic for pre-defined units
            allocateTech(this->df, this->uuTechIDs[uniqueUnit].first, i + 1);
            allocateTech(this->df, this->uuTechIDs[uniqueUnit].second, i + 1);
        }
    }
}

// New function to create custom UU
void Civbuilder::createCustomUU(int civIndex, Value customData) {
    string name = customData["name"].asString();
    int baseUnit = customData["baseUnit"].asInt();
    int health = customData["health"].asInt();
    int attack = customData["attack"].asInt();
    // ... extract all properties
    
    // Create the unit using existing createUU infrastructure
    // but with custom properties
    int newUUID = this->nextCustomUUID++;
    
    // Call createUU with appropriate parameters
    // Then customize the unit's stats based on customData
    // ... implementation details
}
```

## Frontend API

### Vue Composable

Create a composable for managing custom UU data:

```typescript
// composables/useCustomUU.ts
import { ref, computed } from 'vue';

export interface CustomUUData {
  type: 'custom';
  unitType: 'infantry' | 'cavalry' | 'archer' | 'siege';
  baseUnit: number;
  name: string;
  health: number;
  attack: number;
  meleeArmor: number;
  pierceArmor: number;
  attackSpeed: number;
  speed: number;
  range: number;
  cost: {
    food: number;
    wood: number;
    stone: number;
    gold: number;
  };
  trainTime: number;
  lineOfSight: number;
  heroMode: boolean;
  attackBonuses: Array<{class: number; amount: number}>;
}

export function useCustomUU() {
  const customUnit = ref<CustomUUData | null>(null);
  const isCustomMode = ref(false);
  
  const createCustomUnit = (unitType: string): CustomUUData => {
    return {
      type: 'custom',
      unitType: unitType as any,
      baseUnit: getDefaultBaseUnit(unitType),
      name: 'Custom Unit',
      health: getDefaultHealth(unitType),
      attack: getDefaultAttack(unitType),
      meleeArmor: 0,
      pierceArmor: 0,
      attackSpeed: 2.0,
      speed: getDefaultSpeed(unitType),
      range: unitType === 'archer' ? 4 : 0,
      cost: {
        food: 50,
        wood: 0,
        stone: 0,
        gold: 40
      },
      trainTime: 20,
      lineOfSight: 5,
      heroMode: false,
      attackBonuses: []
    };
  };
  
  const validateUnit = (unit: CustomUUData): string[] => {
    const errors: string[] = [];
    
    // Validation logic based on ruleset
    if (unit.health < 15 || unit.health > 250) {
      errors.push('Health must be between 15 and 250');
    }
    
    if (unit.name.length === 0 || unit.name.length > 30) {
      errors.push('Name must be 1-30 characters');
    }
    
    // ... more validation
    
    return errors;
  };
  
  const exportToTechtree = (unit: CustomUUData | number): any => {
    if (typeof unit === 'number') {
      // Legacy format
      return unit;
    } else {
      // Custom format
      return unit;
    }
  };
  
  return {
    customUnit,
    isCustomMode,
    createCustomUnit,
    validateUnit,
    exportToTechtree
  };
}

function getDefaultBaseUnit(type: string): number {
  const defaults = {
    infantry: 1067, // Jaguar Warrior
    cavalry: 1721,  // Knight-like
    archer: 850,    // Plumed Archer
    siege: 706      // Ram-like
  };
  return defaults[type] || 1067;
}

function getDefaultHealth(type: string): number {
  const defaults = {
    infantry: 60,
    cavalry: 100,
    archer: 40,
    siege: 150
  };
  return defaults[type] || 50;
}

function getDefaultAttack(type: string): number {
  const defaults = {
    infantry: 8,
    cavalry: 10,
    archer: 6,
    siege: 12
  };
  return defaults[type] || 8;
}

function getDefaultSpeed(type: string): number {
  const defaults = {
    infantry: 1.0,
    cavalry: 1.35,
    archer: 0.96,
    siege: 0.7
  };
  return defaults[type] || 1.0;
}
```

### API Endpoints

No new endpoints are required. Existing endpoints handle the extended format:

**POST /create** - Create mod with custom civilizations
- Accepts both legacy and custom UU formats
- Validates custom units before processing
- Returns mod ID

**POST /draft/create** - Create draft game
- Supports custom UU in draft mode
- Enforces stricter balancing rules

**GET /download/:id** - Download generated mod
- Works identically for custom or legacy units

## Migration Guide

### For Existing Code

1. **No changes required** for code using legacy format
2. Custom units are opt-in via UI
3. Backend auto-detects format

### For New Features

1. Import `useCustomUU` composable
2. Check `isCustomMode` to determine UI
3. Call `validateUnit` before submission
4. Use `exportToTechtree` for API calls

## Example Usage

### Creating a Custom Unit in Vue

```vue
<script setup lang="ts">
import { useCustomUU } from '~/composables/useCustomUU';

const { 
  customUnit, 
  isCustomMode, 
  createCustomUnit, 
  validateUnit 
} = useCustomUU();

function enableCustomMode() {
  isCustomMode.value = true;
  customUnit.value = createCustomUnit('infantry');
}

function saveUnit() {
  if (!customUnit.value) return;
  
  const errors = validateUnit(customUnit.value);
  if (errors.length > 0) {
    alert('Validation errors: ' + errors.join(', '));
    return;
  }
  
  // Add to techtree
  const techtreeEntry = [customUnit.value, ...techFlags];
  // ... save logic
}
</script>
```

### Sending to Backend

```typescript
async function createMod(civData: any) {
  const payload = {
    name: civData.name,
    techtree: civData.techtree, // Includes custom units
    // ... other fields
  };
  
  const response = await fetch('/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  return response.json();
}
```

## Backwards Compatibility

### Guarantees

1. **Existing mods work unchanged** - No modifications to legacy format handling
2. **Existing UIs work unchanged** - Custom UI is opt-in
3. **Existing data files are valid** - No schema breaking changes
4. **Gradual migration** - Can mix legacy and custom in same mod

### Detection Strategy

```javascript
// The backend can handle both formats in the same request
{
  "techtree": [
    [10, 1, 1, 0, ...],           // Civ 1: Legacy
    [{...customUnit}, 1, 1, ...], // Civ 2: Custom
    [25, 0, 1, 1, ...],           // Civ 3: Legacy
  ]
}
```

## Error Handling

### Validation Errors

```json
{
  "error": "Invalid custom unit",
  "details": [
    {
      "field": "health",
      "message": "Health must be between 15 and 250",
      "value": 300
    },
    {
      "field": "attackBonuses",
      "message": "Too many attack bonuses (max 4 for archers)",
      "value": 5
    }
  ]
}
```

### Processing Errors

```json
{
  "error": "Failed to create custom unit",
  "message": "Base unit ID 9999 does not exist",
  "civIndex": 2
}
```

## Testing

### Unit Tests

```typescript
describe('CustomUU API', () => {
  it('should accept legacy format', () => {
    const unit = 45;
    expect(isValidUnitFormat(unit)).toBe(true);
  });
  
  it('should accept custom format', () => {
    const unit = {
      type: 'custom',
      unitType: 'infantry',
      // ... full object
    };
    expect(isValidUnitFormat(unit)).toBe(true);
  });
  
  it('should validate custom unit constraints', () => {
    const unit = createCustomUnit('infantry');
    unit.health = 300; // Invalid
    const errors = validateUnit(unit);
    expect(errors.length).toBeGreaterThan(0);
  });
});
```

## Future Enhancements

### Planned Extensions

1. **Elite Upgrade Customization**
   ```typescript
   interface CustomUUData {
     // ... existing fields
     eliteUpgrade?: {
       cost: ResourceCost;
       researchTime: number;
       statBonuses: {
         health: number;
         attack: number;
         armor: number;
       };
     };
   }
   ```

2. **Visual Customization**
   ```typescript
   interface CustomUUData {
     // ... existing fields
     visuals?: {
       colorTint: string;
       scale: number;
       effects: string[];
     };
   }
   ```

3. **Training Location**
   ```typescript
   interface CustomUUData {
     // ... existing fields
     trainLocation?: {
       buildings: number[]; // Building IDs
       buttonId: number;
     };
   }
   ```

## Version History

- v1.0 (2025-01-26): Initial API specification
- Future versions will be documented here
