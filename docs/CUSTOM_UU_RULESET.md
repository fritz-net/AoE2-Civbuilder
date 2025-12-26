# Custom Unique Unit Design Ruleset

## Overview

This document defines the rules, constraints, and balancing guidelines for designing custom unique units in AoE2-Civbuilder. These rules ensure that custom units are balanced, functional, and maintain the spirit of Age of Empires 2 gameplay.

## Unit Type Categories

Custom unique units must belong to one of four primary categories. Each category has different rules, limits, and available options.

### 1. Infantry (Barracks)

**Available Base Units:**
- Militia line (Militia, Man-at-Arms, Longswordsman, Two-Handed Swordsman, Champion)
- Spearman line (Spearman, Pikeman, Halberdier)
- Eagle Warrior line
- Other infantry unique units (Huskarl, Jaguar Warrior, Teutonic Knight, etc.)

**Typical Ranges:**
- Health: 40-150 HP
- Attack: 5-20 damage
- Melee Armor: 0-6
- Pierce Armor: 0-4
- Movement Speed: 0.85-1.25
- Range: 0 (melee only, exception: Kamayuk with range 1)
- Train Time: 8-25 seconds

**Cost Guidelines:**
- Primary: Food (35-90) + Gold (10-70)
- Alternative: Food + Wood, or Wood + Gold
- Total cost range: 55-140 resources

### 2. Cavalry (Stable)

**Available Base Units:**
- Scout Cavalry line
- Knight line (Knight, Cavalier, Paladin)
- Camel Rider line
- Battle Elephant line
- Other cavalry unique units (Cataphract, Boyar, etc.)

**Typical Ranges:**
- Health: 70-200 HP
- Attack: 7-18 damage
- Melee Armor: 0-5
- Pierce Armor: 0-4
- Movement Speed: 1.25-1.60
- Range: 0 (melee only, exception: some mounted ranged units)
- Train Time: 12-30 seconds

**Cost Guidelines:**
- Primary: Food (60-100) + Gold (60-120)
- Total cost range: 120-220 resources
- Cavalry is generally more expensive than infantry

### 3. Archer (Archery Range)

**Available Base Units:**
- Archer line (Archer, Crossbowman, Arbalester)
- Cavalry Archer line
- Skirmisher line
- Hand Cannoneer
- Other archer unique units (Longbowman, Plumed Archer, etc.)

**Typical Ranges:**
- Health: 25-70 HP
- Attack: 4-12 damage (base, before bonuses)
- Melee Armor: 0-3
- Pierce Armor: 0-5
- Movement Speed: 0.90-1.45
- Range: 3-9 (foot archers: 4-7, cavalry archers: 3-6)
- Train Time: 10-30 seconds

**Cost Guidelines:**
- Foot Archers: Wood (25-60) + Gold (25-65)
- Cavalry Archers: Wood (40-70) + Gold (50-85)
- Total cost range: 50-140 resources

### 4. Siege (Workshop)

**Available Base Units:**
- Ram line
- Mangonel line
- Scorpion line
- Bombard Cannon
- Other siege unique units

**Typical Ranges:**
- Health: 40-300 HP
- Attack: 8-100 damage (high vs buildings)
- Melee Armor: -3-3
- Pierce Armor: 2-10
- Movement Speed: 0.50-0.90
- Range: 2-12
- Train Time: 25-60 seconds

**Cost Guidelines:**
- Typical: Wood (0-200) + Gold (50-200)
- Some use Food instead
- Total cost range: 100-350 resources
- Siege units are expensive and slow

## Property Constraints

### Minimum and Maximum Values

| Property | Minimum | Maximum | Notes |
|----------|---------|---------|-------|
| Health | 15 | 250 | Below 20 is fragile, above 180 is very tanky |
| Attack | 2 | 35 | Higher for siege with bonuses |
| Melee Armor | -3 | 10 | Negative is rare, 6+ is very high |
| Pierce Armor | -3 | 10 | Negative makes unit vulnerable to arrows |
| Attack Speed | 0.8 | 6.0 | Lower is faster, 2.0 is typical |
| Movement Speed | 0.50 | 1.65 | Below 0.8 is slow, above 1.5 is very fast |
| Range | 0 | 12 | 0 = melee, 1 = Kamayuk, 4-7 typical for archers |
| Train Time | 6 | 90 | Under 10 is fast, over 30 is slow |
| Line of Sight | 3 | 12 | Typical is 5-8 |

### Special Constraints

**Range Limitations:**
- Infantry: Range 0 only (exception: Kamayuk can have range 1)
- Foot Archers: Range 3-9
- Cavalry Archers: Range 3-7
- Siege: Range 2-12

**Attack Type Consistency:**
- Infantry: Must use melee attack (attack type is implied by base unit)
- Archers: Must use pierce/projectile attack
- Cannot change attack type from base unit

**Movement Speed by Type:**
- Infantry: 0.80-1.25 (faster than 1.15 is considered very fast infantry)
- Cavalry: 1.25-1.65
- Archers: 0.90-1.45
- Siege: 0.50-0.90

## Cost Balancing System

### Point-Based System

Each unit has a "power budget" based on its statistics. Higher stats require higher costs.

**Base Points by Type:**
- Infantry: 50 points
- Cavalry: 65 points
- Archers: 45 points
- Siege: 70 points

**Points Required for Stats:**

| Attribute Increase | Point Cost |
|-------------------|------------|
| +10 Health | 2 points |
| +1 Attack | 3 points |
| +1 Melee Armor | 4 points |
| +1 Pierce Armor | 4 points |
| +0.1 Movement Speed | 5 points |
| -0.2 Attack Speed | 3 points |
| +1 Range (archers) | 6 points |
| Attack Bonus (+5 vs class) | 8 points |

**Example Calculation:**
```
Base Infantry (50 points)
+ 20 HP (4 points)
+ 3 Attack (9 points)
+ 1 Melee Armor (4 points)
+ 0.1 Speed (5 points)
= 72 total points

Recommended cost: 72 * 1.2 = ~86 resources
Distribution: 55 food + 31 gold
```

### Resource Distribution Guidelines

**Primary Resource Combinations:**
1. Food + Gold (most common for all types)
2. Wood + Gold (archers, some infantry)
3. Food + Wood (rare, reduces gold cost)
4. Wood only (very cheap units)

**Ratio Guidelines:**
- Infantry: 60-70% food, 30-40% gold
- Cavalry: 45-55% food, 45-55% gold
- Archers: 40-50% wood, 50-60% gold
- Siege: Variable, often 50-50 or wood-heavy

### Hero Mode Adjustments

When **Hero Mode** is enabled:
- Unit can only be trained once per game
- Costs multiplied by 1.5-2.5x
- Player gains +20-40 bonus points for other customizations
- Recommended for very powerful or specialized units

**Hero Mode Example:**
```
Normal Unit: 60 food + 45 gold
Hero Mode: 120 food + 90 gold + 30 bonus points
```

## Optic/Sprite Selection

### Available Sprites

**Reusable Sprites:**
1. All 88 pre-defined unique unit sprites
2. Standard unit sprites from tech tree:
   - Militia line, Knight line, Archer line, etc.
   - Monk, Villager, Scout
   - Siege units

**Selection Rules:**
- Sprite must match unit type (infantry, cavalry, archer, siege)
- Attack animations must match attack type (melee/ranged)
- Mounted units require cavalry sprites
- Cannot mix incompatible animations

### Custom Sprite Guidelines

**First Edition Custom UU Sprites:**
- Available for new unique units
- Must fit 50x50 icon size
- Must have all required animations (walk, attack, death)

## Balancing Rules

### Power Level Restrictions

**Forbidden Combinations:**
1. High HP + High Speed + High Attack (too powerful)
   - Example: 150 HP + 1.5 speed + 18 attack = FORBIDDEN
   
2. High Armor + High HP + Low Cost (too cost-efficient)
   - Example: 5/5 armor + 120 HP + 70 total cost = FORBIDDEN

3. High Range + High Attack + Fast Attack Speed (too oppressive)
   - Example: 9 range + 12 attack + 1.5 reload = FORBIDDEN

### Mandatory Trade-offs

Units must have weaknesses:

**High HP (>120) requires:**
- Slower movement (≤1.2) OR
- Lower attack (≤10) OR
- Higher cost (≥120 resources)

**High Attack (>15) requires:**
- Lower HP (≤80) OR
- Slower attack speed (≥2.5) OR
- Lower armor (≤2/2)

**High Speed (>1.4) requires:**
- Lower HP (≤60) OR
- Lower attack (≤10) OR
- Lower armor (≤1/1)

**High Armor (≥4/4) requires:**
- Slower speed (≤1.0) OR
- Lower attack (≤10) OR
- Higher cost (≥100 resources)

### Type-Specific Restrictions

**Infantry:**
- Cannot have ranged attack (exception: Kamayuk with range 1)
- If HP > 100, speed must be ≤ 1.0
- If speed > 1.15, armor must be ≤ 2/2

**Cavalry:**
- If HP > 150, speed must be ≤ 1.35
- Cannot have pierce armor > melee armor by more than 1
- If speed > 1.5, HP must be ≤ 100

**Archers:**
- If range > 6, HP must be ≤ 50
- If HP > 50, armor must be ≤ 2/3
- Cannot have melee armor > pierce armor

**Siege:**
- Must have speed ≤ 1.0
- If attack > 50, accuracy must be reduced
- Cannot have HP > 300

## Attack Bonuses

### Available Bonus Classes

| Class ID | Class Name | Description |
|----------|------------|-------------|
| 1 | Infantry | All infantry units |
| 3 | Archers | Archer-line units |
| 4 | Base Melee | Base melee attack type |
| 5 | Cavalry | All cavalry units |
| 8 | Cavalry Archer | Mounted ranged units |
| 11 | Buildings | All buildings except walls |
| 13 | Stone Buildings | Castles, towers, walls |
| 15 | Archers | Archers class (duplicate) |
| 16 | Ships | All naval units |
| 19 | Unique Units | All unique units |
| 20 | Siege Weapons | Rams, mangonels, etc. |
| 21 | Buildings | Fortified buildings |
| 30 | War Elephants | Elephant units |

### Bonus Limitations

**Maximum Bonuses:**
- Infantry units: Maximum 3 different bonus classes
- Cavalry units: Maximum 3 different bonus classes
- Archers: Maximum 4 different bonus classes
- Siege: Maximum 5 different bonus classes

**Bonus Amount Limits:**
- Standard bonus: +2 to +8
- Strong bonus: +9 to +15
- Extreme bonus: +16 to +30 (only for siege vs buildings)

**Bonus Restrictions:**
- Cannot have bonus against own type class (e.g., infantry with +attack vs infantry must have trade-off)
- Total bonus damage across all classes: ≤ +40 for regular units
- Bonuses must make thematic sense for the unit type

## Validation Rules

### Required Fields

All custom unique units must specify:
- ✅ Name (1-30 characters)
- ✅ Unit Type (infantry/cavalry/archer/siege)
- ✅ Base Unit ID (valid existing unit)
- ✅ Health (within type ranges)
- ✅ Attack (within type ranges)
- ✅ Armor (melee and pierce)
- ✅ Cost (at least one resource type)
- ✅ Train Time
- ✅ Movement Speed

### Optional Fields

- Attack Speed (uses base unit default if not specified)
- Range (0 for melee)
- Line of Sight (uses base unit default)
- Attack Bonuses (empty array if none)
- Hero Mode (false by default)

### Automatic Validation

The system will validate:
1. All values are within min/max ranges
2. Costs match power budget
3. Type-specific restrictions are met
4. No forbidden combinations exist
5. Trade-offs are properly balanced
6. Base unit ID is valid and exists

### Warning vs Error

**Errors (cannot save):**
- Values outside absolute min/max
- Invalid base unit ID
- Invalid unit type
- Missing required fields
- Costs below minimum threshold

**Warnings (can save, but not recommended):**
- Power level exceeds cost by >20%
- Lacks clear weakness
- Unusual stat distribution
- Very similar to existing unit

## Editor Usage in Different Contexts

### In /build Page

- Full access to all customization options
- Can create and save multiple unit designs
- Can switch between pre-defined and custom units
- Preview available

### In /draft Page

- Custom UU editor during civilization building phase
- Limited to one custom unit per player
- Balancing constraints more strict
- Must fit within draft point budget

### In Demo Page

- Showcase all available options
- Interactive exploration of rulesets
- Examples of balanced units
- Test different combinations

## Example Balanced Units

### Example 1: Balanced Infantry
```json
{
  "type": "custom",
  "unitType": "infantry",
  "baseUnit": 1067,
  "name": "Forest Guardian",
  "health": 70,
  "attack": 10,
  "meleeArmor": 1,
  "pierceArmor": 1,
  "attackSpeed": 2.0,
  "speed": 1.05,
  "range": 0,
  "cost": {"food": 55, "gold": 30},
  "trainTime": 14,
  "heroMode": false,
  "attackBonuses": [
    {"class": 5, "amount": 4}
  ]
}
```
**Analysis:** Good balance, anti-cavalry bonus, moderate cost, reasonable stats.

### Example 2: Balanced Cavalry
```json
{
  "type": "custom",
  "unitType": "cavalry",
  "baseUnit": 1721,
  "name": "Royal Lancer",
  "health": 110,
  "attack": 11,
  "meleeArmor": 2,
  "pierceArmor": 1,
  "attackSpeed": 2.2,
  "speed": 1.40,
  "range": 0,
  "cost": {"food": 70, "gold": 75},
  "trainTime": 22,
  "heroMode": false,
  "attackBonuses": [
    {"class": 3, "amount": 3},
    {"class": 15, "amount": 3}
  ]
}
```
**Analysis:** Fast cavalry with anti-archer bonus, higher cost, fair trade-offs.

### Example 3: Balanced Archer
```json
{
  "type": "custom",
  "unitType": "archer",
  "baseUnit": 850,
  "name": "Swift Bowman",
  "health": 40,
  "attack": 6,
  "meleeArmor": 0,
  "pierceArmor": 1,
  "attackSpeed": 1.8,
  "speed": 1.10,
  "range": 5,
  "cost": {"wood": 35, "gold": 40},
  "trainTime": 18,
  "heroMode": false,
  "attackBonuses": [
    {"class": 1, "amount": 2}
  ]
}
```
**Analysis:** Fragile but fast archer, medium range, low cost, specific bonus.

### Example 4: Hero Mode Unit
```json
{
  "type": "custom",
  "unitType": "cavalry",
  "baseUnit": 1723,
  "name": "Champion of Light",
  "health": 160,
  "attack": 20,
  "meleeArmor": 4,
  "pierceArmor": 3,
  "attackSpeed": 2.0,
  "speed": 1.20,
  "range": 0,
  "cost": {"food": 200, "gold": 200},
  "trainTime": 60,
  "heroMode": true,
  "attackBonuses": [
    {"class": 19, "amount": 10}
  ]
}
```
**Analysis:** Extremely powerful but very expensive, only one allowed, hero mode enabled.

## Future Extensions

### Planned Features

1. **Advanced Abilities:**
   - Charge attacks
   - Area of effect damage
   - Special unit transformations
   - Regeneration

2. **Visual Customization:**
   - Color tinting
   - Size scaling
   - Effect particles

3. **Elite Upgrade Customization:**
   - Custom elite stat improvements
   - Custom elite costs
   - Different elite name

4. **Training Location:**
   - Allow training from multiple buildings
   - Custom training locations

## Revision History

- v1.0 (2025-01-26): Initial ruleset specification
- Future versions will be tracked here as rules are refined based on playtesting
