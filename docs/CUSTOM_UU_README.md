# Custom Unique Unit (UU) Design Editor

This feature allows users to design custom unique units with full control over stats, costs, and abilities, while maintaining game balance through a point-based system.

## Overview

The Custom UU Design Editor is a comprehensive system that includes:

1. **Documentation** - Technical specifications and rulesets
2. **Vue/Nuxt UI** - Interactive editor component
3. **API Contract** - Backwards-compatible data format
4. **Validation System** - Balance checking and constraints

## Documentation

### Core Documents

All documentation is located in the `/docs` directory:

- **[UNIQUE_UNITS.md](./UNIQUE_UNITS.md)** - Technical documentation on how UU are created in the C++ backend
- **[CUSTOM_UU_RULESET.md](./CUSTOM_UU_RULESET.md)** - Complete ruleset with balancing constraints and validation rules
- **[CUSTOM_UU_API.md](./CUSTOM_UU_API.md)** - API specification for backwards-compatible data format

### Key Concepts

**Unit Types:**
- Infantry (Barracks) - Melee fighters
- Cavalry (Stable) - Fast mounted units
- Archer (Archery Range) - Ranged units
- Siege (Workshop) - Heavy weapons

**Balancing System:**
- Point-based power budget calculation
- Automatic cost recommendations
- Type-specific constraints
- Trade-off requirements

**Hero Mode:**
- Powerful units trainable only once
- Higher costs
- Bonus points for other customizations

## UI Components

### Location

- **Composable:** `/src/frontend/app/composables/useCustomUU.ts`
- **Component:** `/src/frontend/app/components/CustomUUEditor.vue`
- **Demo Page:** `/src/frontend/app/pages/demo/custom-uu.vue`

### Features

The Custom UU Editor includes:

✅ **Unit Type Selection** - Choose from 4 unit categories
✅ **Property Editors** - Sliders and inputs for all stats
✅ **Cost Calculator** - Automatic cost recommendations based on power
✅ **Attack Bonuses** - Add bonuses vs specific unit classes
✅ **Hero Mode Toggle** - Enable powerful single-use units
✅ **Real-time Validation** - Error and warning messages
✅ **Power Budget Display** - See unit's balance rating
✅ **Export Functionality** - Copy unit JSON to clipboard

### Usage

#### In Demo Page

Visit `/demo/custom-uu` to try the editor interactively.

#### In Build/Draft Pages

```vue
<template>
  <CustomUUEditor @save="handleSave" />
</template>

<script setup>
import CustomUUEditor from '~/components/CustomUUEditor.vue';
import { useCustomUU } from '~/composables/useCustomUU';

const { exportToTechtree } = useCustomUU();

function handleSave(customUnit) {
  // Add to techtree
  const techtreeEntry = [
    exportToTechtree(customUnit),
    ...techFlags
  ];
  // Save logic...
}
</script>
```

## Data Format

### Legacy Format (Existing)

```javascript
{
  "techtree": [
    [45, 1, 0, 1, ...],  // Pre-defined UU ID
  ]
}
```

### Custom Format (New)

```javascript
{
  "techtree": [
    [{
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
      "cost": {"food": 55, "gold": 30, "wood": 0, "stone": 0},
      "trainTime": 14,
      "lineOfSight": 5,
      "heroMode": false,
      "attackBonuses": [
        {"class": 5, "amount": 4}  // +4 vs cavalry
      ]
    }, 1, 0, 1, ...]
  ]
}
```

### Backwards Compatibility

The system automatically detects format:
- `number` = Legacy pre-defined unit
- `object` with `type: "custom"` = Custom unit

Both formats can be mixed in the same mod.

## Validation Rules

### Required Fields

- Name (1-30 characters)
- Unit Type
- Base Unit ID
- Health, Attack, Armor
- Movement Speed
- Cost (minimum 30 total resources)
- Train Time

### Constraints

**Health:** 15-250 HP
**Attack:** 2-35 damage
**Armor:** -3 to 10 (melee and pierce)
**Speed:** 0.5-1.65
**Range:** 0-12 (type-dependent)
**Attack Speed:** 0.8-6.0 seconds

### Balance Requirements

Units must have trade-offs:
- High HP requires lower speed or attack
- High attack requires lower HP or armor
- High speed requires lower HP or attack
- High armor requires slower speed or lower attack

## Examples

### Balanced Infantry

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
  "speed": 1.05,
  "cost": {"food": 55, "gold": 30},
  "attackBonuses": [{"class": 5, "amount": 4}]
}
```

### Hero Mode Cavalry

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
  "speed": 1.20,
  "cost": {"food": 200, "gold": 200},
  "heroMode": true
}
```

## Integration Guide

### For Frontend Developers

1. Import the composable:
   ```typescript
   import { useCustomUU } from '~/composables/useCustomUU';
   ```

2. Use the editor component:
   ```vue
   <CustomUUEditor />
   ```

3. Validate before saving:
   ```typescript
   const { validateUnit, isValid } = useCustomUU();
   const errors = validateUnit(customUnit);
   if (isValid.value) {
     // Save...
   }
   ```

### For Backend Developers

The backend needs to:

1. Detect custom units in `techtree[i][0]`
2. Extract custom unit data
3. Pass to C++ for creation
4. Handle both legacy and custom formats

See `docs/CUSTOM_UU_API.md` for implementation details.

## Future Enhancements

Planned features:

- [ ] Elite upgrade customization
- [ ] Visual customization (colors, effects)
- [ ] Advanced abilities (charge, regeneration, AoE)
- [ ] Custom training locations
- [ ] Unit testing suite
- [ ] Integration with /build page
- [ ] Integration with /draft page

## Testing

### Manual Testing

1. Navigate to `/v2/demo/custom-uu`
2. Select a unit type
3. Adjust properties
4. Observe validation messages
5. Try to create overpowered combinations (should be blocked)
6. Export and inspect JSON

### Validation Testing

The editor validates:
- ✅ Min/max ranges for all properties
- ✅ Type-specific constraints (e.g., infantry can't have range > 1)
- ✅ Balance requirements (no forbidden combinations)
- ✅ Cost vs power budget
- ✅ Attack bonus limits

## Contributing

When adding features:

1. Update documentation in `/docs`
2. Add validation rules to composable
3. Update TypeScript interfaces
4. Add examples to demo page
5. Test backwards compatibility

## License

Part of AoE2-Civbuilder project.

## Support

For issues or questions:
- Check documentation in `/docs`
- See examples in demo page
- Review TypeScript interfaces for types
