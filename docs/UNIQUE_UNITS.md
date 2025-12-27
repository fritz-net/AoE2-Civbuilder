# Unique Units (UU) - Technical Documentation

## Overview

Unique Units (UU) are civilization-specific military units in Age of Empires 2. In AoE2-Civbuilder, unique units are created and managed through the C++ modding backend, specifically in `modding/civbuilder.cpp`.

## How Unique Units Are Created

### 1. Base Unit Selection

Each unique unit is created by duplicating an existing vanilla unit as a template. The base unit determines:
- Unit type (infantry, cavalry, archer, siege)
- Basic animations and graphics
- Attack type and projectile behavior
- Base movement mechanics

### 2. Unit Creation Process (from civbuilder.cpp)

The `createUU()` function in `civbuilder.cpp` handles unique unit creation:

```cpp
void Civbuilder::createUU(int civbuilderID, int baseID, string name, 
                          vector<int> techCosts, int techTime, int techDLL)
```

**Parameters:**
- `civbuilderID`: Index in the unique unit registry (0-87)
- `baseID`: ID of the vanilla unit to use as template
- `name`: Display name of the unique unit
- `techCosts`: Array of [food, wood, stone, gold] costs for elite upgrade
- `techTime`: Research time for elite upgrade
- `techDLL`: Language DLL string ID for descriptions

**Process:**
1. Duplicates the base unit from the data file
2. Creates both base and elite versions of the unit
3. Creates a tech to make the unit available in Castle Age
4. Creates an elite upgrade tech
5. Registers the unit in the `uuTechIDs` mapping
6. Adds the unit to the `"unique"` unit class

### 3. Unit Properties

After creation, units can be customized with these properties:

#### Combat Stats
- **Health (HP)**: Hit points of the unit
- **Attack**: Base attack damage
- **Attack Speed**: Reload time between attacks
- **Attack Bonuses**: Damage bonuses vs specific unit classes (e.g., +5 vs cavalry)
- **Range**: Attack range (only for ranged units, Kamayuk limited to max 1)
- **Blast Radius**: Area damage for siege/explosive units

#### Defense Stats
- **Melee Armor**: Protection against melee attacks
- **Pierce Armor**: Protection against ranged attacks
- **Armor Bonuses**: Special armor vs specific damage classes

#### Mobility
- **Movement Speed**: Units per second (typical range: 0.8-1.6)
- **Line of Sight**: Vision range

#### Economics
- **Resource Costs**: Combination of food, wood, stone, and gold
  - Common: food+gold or wood+gold
  - Possible: any resource combination
- **Train Time**: Seconds to create one unit
- **Train Location**: Building where unit is trained (castle, barracks, stable, etc.)

#### Special Properties
- **Hero Mode**: Makes unit only trainable once, more expensive, grants extra points
- **Charge Mechanics**: Special charge attacks (like Teulu)
- **Power-Up Tasks**: Special abilities or transformations
- **Break-Off Combat**: Behavior when damaged

### 4. Unit Types and Base Units

The system recognizes these unit type categories:

#### Infantry (Barracks)
- Base units: Militia line, Spearman line, Eagle Warriors, etc.
- Characteristics: Melee, medium speed, balanced armor
- Examples: Teutonic Knight (baseID: 1723), Jaguar Warrior (baseID: 1067)

#### Cavalry (Stable)
- Base units: Scout line, Knight line, Camel line, Battle Elephants
- Characteristics: High HP, fast movement, melee
- Examples: Cataphract (baseID: 1281), Szlachcic (baseID: 1721)

#### Archers (Archery Range)
- Base units: Archer line, Cavalry Archer, Skirmisher, Hand Cannoneer
- Characteristics: Ranged, lower HP, pierce damage
- Examples: Longbowman (baseID: 850), Seljuk Archer (baseID: 943)

#### Siege (Workshop)
- Base units: Rams, Mangonels, Scorpions, Bombard Cannons
- Characteristics: High attack vs buildings, slow, expensive
- Examples: Saboteur (baseID: 706)

### 5. Tech Tree Integration

Unique units are registered in the tech tree system:

```javascript
// In data.json format
"techtree": [
  [uniqueUnitID, tech1, tech2, ..., techN],
  // Index 0 is always the unique unit ID
]
```

**Available Unique Units:**
- Total of 88 pre-defined unique units (IDs 0-87)
- Each civilization gets exactly one unique unit
- Units are assigned via `assignUniqueUnits()` function

### 6. Duplication and Special Buildings

Some unique units can be trained in multiple buildings:

**Barracks Duplication:**
- Units can be copied to train from barracks (for certain civs)
- Creates duplicate with modified train location

**Krepost/Donjon Support:**
- Civs with special buildings (Krepost, Donjon) can train UU there
- Automatic duplication when civ has the building

**Stable Duplication:**
- Cavalry units can have stable versions

### 7. Graphics and Optics

Unique unit graphics are determined by:
- Base unit ID provides animations and sprite
- Language DLL IDs for name and description
- Icon files in UI resources
- Color palettes based on player color

## Custom Unique Unit Properties

### Standard Properties

| Property | Type | Range/Options | Notes |
|----------|------|---------------|-------|
| Base Unit | ID | 1-1800+ | Determines unit type and animations |
| Name | String | Max 30 chars | Displayed in game |
| Health | Integer | 20-200 | Typical range, can be higher |
| Attack | Integer | 3-30 | Base damage before bonuses |
| Melee Armor | Integer | 0-10 | Defense against melee |
| Pierce Armor | Integer | -3-10 | Defense against ranged |
| Attack Speed | Float | 0.9-5.0 | Seconds between attacks |
| Movement Speed | Float | 0.7-1.6 | Units per second |
| Range | Integer | 0-12 | 0 for melee, 1 for Kamayuk |
| Line of Sight | Integer | 4-12 | Vision range |
| Train Time | Integer | 8-120 | Seconds to create |

### Cost Properties

Units typically cost resources following these patterns:

**Common Combinations:**
- Infantry: 50-90 food, 10-50 gold
- Cavalry: 60-100 food, 75+ gold
- Archers: 25-70 wood, 30-70 gold
- Siege: 0-200 wood, 50-200 gold

**Hero Mode:**
- Multiplies costs by 1.5-3x
- Unit can only be trained once
- Provides additional customization points

### Attack Bonuses

Attack bonuses are defined by armor class:

```cpp
// Common armor classes
1 = Infantry
3 = Archer  
4 = Base Melee
5 = Cavalry
8 = Siege
11 = Unique Unit
19 = Unique Tech
20 = Monk
21 = Building
30 = War Elephant
```

Example:
```cpp
// +5 attack vs cavalry, +10 vs siege
{5, 5}, {8, 10}
```

## Examples from civbuilder.cpp

### Example 1: Crusader Knight (Cavalry)
```cpp
createUU(UU_CRUSADER_KNIGHT, 1723, "Crusader Knight", 
         {600, 0, 0, 1200}, 45, 7604);
// Base: Teutonic Knight (1723)
// Health: 90 HP
// Attack: 16 melee
// Armor: 2/2 (melee/pierce)
// Speed: Standard knight speed
// Cost: Balanced food/gold
```

### Example 2: Amazon Archer (Foot Archer)
```cpp
createUU(UU_AMAZON_ARCHER, 850, "Amazon Archer", 
         {600, 0, 0, 400}, 60, 7614);
// Base: Plumed Archer (850)
// Health: 35 HP
// Attack: 4 pierce
// Armor: 0/0
// Speed: 1.1
// Bonuses: +5 vs infantry, +5 vs cavalry
// Cost: 25 wood, 35 gold
```

### Example 3: Ninja (Special Infantry)
```cpp
createUU(UU_NINJA, 1145, "Ninja", {0, 500, 0, 600}, 100, 7607);
// Base: Huskarl-like (1145)
// Special: +5 attack vs unique units, +11 vs archers
// Speed: 1.15 (fast infantry)
// Break-off combat enabled (hit and run)
```

### Example 4: Warrior Monk (Hero Mode)
```cpp
createUU(UU_WARRIOR_MONK, 1178, "Warrior Monk", 
         {800, 0, 0, 750}, 80, 7640);
// Health: 30 HP (very low)
// Speed: 0.9 (slow)
// Train time: 45 seconds (very long)
// Charge mechanic: 100 charge, 3 recharge rate
// Cost: 100 gold only
// Hero-like limitations
```

## Integration with Data Structures

### Current Format (Legacy)

```javascript
{
  "techtree": [
    [uniqueUnitID, ...techs],  // Index 0 is UU ID (0-87)
    ...
  ]
}
```

### Proposed Custom UU Format

```javascript
{
  "techtree": [
    [{
      "type": "custom",
      "baseUnit": 1723,
      "name": "My Custom Knight",
      "health": 100,
      "attack": 12,
      "meleeArmor": 2,
      "pierceArmor": 1,
      "attackSpeed": 2.0,
      "speed": 1.35,
      "range": 0,
      "cost": {"food": 60, "gold": 75},
      "trainTime": 20,
      "heroMode": false,
      "attackBonuses": [
        {"class": 5, "amount": 4}, // +4 vs cavalry
      ]
    }, ...techs],
    // OR use legacy format:
    [45, ...techs]  // Pre-defined UU ID
  ]
}
```

## See Also

- `modding/civbuilder.cpp` - Main UU creation logic
- `modding/civbuilder.h` - Header with UU enums
- `process_mod/constants.js` - UU count and IDs
- `process_mod/random/random_json.js` - Random UU assignment
