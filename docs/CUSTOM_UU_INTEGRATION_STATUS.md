# Custom UU Integration Status

## Completed Work

### ✅ Phase 1: /build Page Integration (Complete)
The `/build` page now supports custom unique unit creation:

1. **Toggle Switch**: Added a checkbox in Step 3 (Unique Unit selection) to switch between:
   - Existing UUs (default behavior)
   - Custom UU Designer (new functionality)

2. **CustomUUEditor Integration**:
   - Integrated with `initialMode="build"` for 150-point budget
   - Emits `update` event when unit changes
   - Data stored in `customUUData` ref
   - Saved to `civConfig.bonuses[1]` as custom UU object

3. **Data Handling**:
   - Modified `updateBonusesInConfig()` to handle both legacy (number) and custom (object) formats
   - Review step shows custom UU name when in custom mode
   - Reset function clears custom UU state

4. **UI/UX**:
   - Added styled toggle with clear labels
   - Custom UU section has distinct visual treatment
   - Mode selector hidden (always in build mode)

### ✅ Phase 3: /demo Validation Dashboard (Complete)
Created comprehensive validation rules dashboard at `/demo/validation-rules`:

1. **Rule Categories**:
   - Required Fields (name, type, base unit)
   - Stat Ranges (HP, attack, armor, speed, range, train time)
   - Cost Constraints (minimum total cost)
   - Attack Bonuses (max per type, armor classes)
   - Balance Warnings (HP+speed, attack+HP)
   - Power Budget System (base points, point costs, mode limits)
   - Elite Upgrades (per unit type)

2. **Visual Examples**:
   - Pass/fail examples with colored badges
   - Code snippets showing valid/invalid values
   - Armor class reference table
   - Point cost calculations
   - Elite upgrade formulas

3. **Navigation**:
   - Added to `/demo` index page
   - Back link for easy navigation
   - Fully responsive design

### 🟡 Phase 2: /draft Page Integration (Partially Complete)

#### Completed:
1. **Draft Creation Form**:
   - Added "Enable Custom UU Designer Mode" checkbox
   - Help text explains parallel customization
   - Flag passed through `custom_uu_mode` parameter in API call
   - Styled section matching existing design

#### Remaining Work:

##### Backend Changes Needed:
1. **Server-Side** (`server.js` or draft handler):
   - Accept and store `custom_uu_mode` parameter
   - Pass flag to draft state/gamestate
   - Handle custom UU data in player configs

2. **Draft State**:
   - Add `customUUMode: boolean` to draft settings
   - Store custom UU data per player instead of single selection
   - Handle serialization/deserialization of custom UU objects

##### Frontend Changes Needed:

1. **Draft Host/Player Pages** (`/pages/draft/host/[id].vue`, `/pages/draft/player/[id].vue`):
   
   a. **Unique Unit Phase**:
   ```typescript
   // In Phase 2 (UU selection), check customUUMode flag
   if (draft.settings.customUUMode) {
     // Show CustomUUEditor instead of card selection
     // Each player designs their own UU in parallel
   } else {
     // Existing behavior: pick from UU cards
   }
   ```

   b. **Integration Points**:
   - Import CustomUUEditor component
   - Add conditional rendering in UU selection phase
   - Set `initialMode="draft"` for 100-point budget
   - Handle save/submit of custom UU data
   - Update player's UU in draft state via socket

   c. **Socket Events**:
   - Add event for submitting custom UU data
   - Broadcast custom UU to other players (if not blind picks)
   - Store custom UU in player config

2. **Base Unit Draft (Optional Future Enhancement)**:
   - Currently, issue mentions "random base units draft"
   - This would require additional draft phase:
     1. Draft random base unit options per player
     2. Players select from their assigned base units
     3. Then use CustomUUEditor with selected base unit locked
   - Can be added in future iteration

3. **DraftBoard Component**:
   - May need to handle displaying custom UU data
   - Show custom unit stats in player view
   - Spectator view should show all custom UUs

4. **Validation**:
   - Client-side validation using `useCustomUU().validateUnit()`
   - Prevent submission if validation errors exist
   - Show validation errors to user

## Implementation Guide for Remaining Work

### Step 1: Backend Support

File: `server.js` (or relevant draft handler)

```javascript
// In draft creation handler
app.post('/draft', (req, res) => {
  const settings = {
    // ... existing settings
    customUUMode: req.body.custom_uu_mode === 'true',
  };
  
  // Store in draft state
  drafts[draftId] = {
    settings,
    players: [],
    // ... rest of draft state
  };
});
```

### Step 2: Frontend Draft Phase Integration

File: `src/frontend/app/pages/draft/host/[id].vue` (and player version)

```vue
<template>
  <!-- In Phase 2 (UU Selection) -->
  <div v-if="currentPhase === 2 && draft">
    <!-- Custom UU Mode -->
    <div v-if="draft.settings.customUUMode" class="custom-uu-phase">
      <h1 class="phase-title">Design Your Custom Unique Unit</h1>
      <p class="subtitle">Create your unique unit (100 point budget)</p>
      
      <CustomUUEditor
        :initial-mode="'draft'"
        :show-mode-selector="false"
        @update="handleCustomUUUpdate"
      />
      
      <button
        class="submit-button"
        :disabled="!isValidCustomUU"
        @click="submitCustomUU"
      >
        Submit Custom UU
      </button>
    </div>
    
    <!-- Standard UU Selection (existing behavior) -->
    <DraftBoard
      v-else
      :phase-title="roundTypeName"
      <!-- ... existing props -->
    />
  </div>
</template>

<script setup lang="ts">
import CustomUUEditor from '~/components/CustomUUEditor.vue';
import { useCustomUU, type CustomUUData } from '~/composables/useCustomUU';

const { validateUnit } = useCustomUU('draft');
const customUU = ref<CustomUUData | null>(null);

const isValidCustomUU = computed(() => {
  if (!customUU.value) return false;
  const errors = validateUnit(customUU.value);
  return !errors.some(e => e.severity === 'error');
});

function handleCustomUUUpdate(unit: CustomUUData) {
  customUU.value = unit;
}

function submitCustomUU() {
  if (!customUU.value || !isValidCustomUU.value) return;
  
  // Emit socket event to save custom UU
  socket.emit('submit_custom_uu', {
    draftId: draftId,
    playerIndex: playerNumber,
    customUU: customUU.value
  });
  
  // Move to next phase
  // ... handle phase transition
}
</script>
```

### Step 3: Socket Event Handling

Backend needs to handle:
```javascript
socket.on('submit_custom_uu', (data) => {
  const { draftId, playerIndex, customUU } = data;
  const draft = drafts[draftId];
  
  // Store custom UU in player's config
  draft.players[playerIndex].customUU = customUU;
  
  // Broadcast to other players (if not blind picks)
  if (!draft.settings.blindPicks) {
    io.to(draftId).emit('player_custom_uu_submitted', {
      playerIndex,
      customUU
    });
  }
  
  // Check if all players have submitted
  const allSubmitted = draft.players.every(p => p.customUU);
  if (allSubmitted) {
    // Move to next phase
    advancePhase(draftId);
  }
});
```

## Testing Checklist

### /build Page
- [ ] Toggle switch appears in Step 3
- [ ] Switching to custom mode clears existing UU selection
- [ ] Switching to existing mode clears custom UU data
- [ ] Custom UU editor appears with 150 point budget
- [ ] Unit validation works correctly
- [ ] Review step shows custom UU name
- [ ] Custom UU data saved to civConfig.bonuses[1]
- [ ] Mod creation works with custom UU
- [ ] Reset clears custom UU state

### /draft Creation
- [ ] Custom UU mode checkbox appears
- [ ] Flag sent through API on draft creation
- [ ] Draft created successfully with flag

### /draft Runtime (Requires backend implementation)
- [ ] Custom UU editor appears in UU phase when flag enabled
- [ ] Editor has 100 point budget
- [ ] Validation works correctly
- [ ] Cannot submit invalid units
- [ ] Can submit valid units
- [ ] Other players notified of submission
- [ ] Phase advances after all players submit
- [ ] Custom UU data saved to final civ config

### Validation Dashboard
- [ ] Page loads at /demo/validation-rules
- [ ] All rule categories display
- [ ] Examples render correctly
- [ ] Pass/fail badges styled correctly
- [ ] Responsive on mobile
- [ ] Back link works

## Known Limitations

1. **Backend Not Implemented**: The draft runtime (Phase 2 execution) requires backend changes to:
   - Store customUUMode flag
   - Handle custom UU submissions
   - Manage phase transitions with custom UU data

2. **Base Unit Draft**: The "random base units draft" mentioned in the issue is not implemented. This would be a future enhancement requiring:
   - Additional draft phase for base unit selection
   - Random assignment logic
   - UI for base unit picking

3. **Spectator View**: Custom UU display in spectator view needs consideration for:
   - How to show multiple custom UUs
   - Real-time updates as players design
   - Comparison view

## Future Enhancements

1. **Preset Templates**: Add example custom UUs players can start from
2. **Copy Feature**: Allow players to copy custom UUs between games
3. **Balance History**: Track which custom UU combinations work well
4. **Visual Customization**: Add color/effect customization
5. **Save/Load**: Save custom UU designs for reuse
6. **Base Unit Draft Mode**: Full implementation of base unit random draft

## Files Modified

### Phase 1 (✅ Complete):
- `src/frontend/app/components/CivBuilder.vue`
- `src/frontend/app/components/CustomUUEditor.vue`

### Phase 2 (🟡 Partial):
- `src/frontend/app/pages/draft/create.vue` ✅

### Phase 3 (✅ Complete):
- `src/frontend/app/pages/demo/validation-rules.vue` ✅
- `src/frontend/app/pages/demo/index.vue` ✅

### Still Needed:
- `server.js` or draft backend handler
- `src/frontend/app/pages/draft/host/[id].vue`
- `src/frontend/app/pages/draft/player/[id].vue`
- Socket event handlers
