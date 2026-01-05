# Custom UU Socket Events Documentation

This document describes the socket events used for the Custom Unique Unit (UU) Designer mode in draft games.

## Overview

When a draft is created with `custom_uu_mode: true`, the draft workflow includes an additional phase where each player designs their own unique unit before proceeding to bonus selection.

## Phase Flow

1. **Phase 0**: Lobby - Players join and ready up
2. **Phase 1**: Customization - Players set civ name, flag, architecture, etc.
3. **Phase 2 (Custom UU)**: Custom UU Design - Each player creates their unit (if custom mode enabled)
4. **Phase 2 (Bonus Selection)**: Players draft bonuses (normal draft flow continues)
5. **Phase 3**: Tech Tree - Players customize their tech trees
6. **Phase 5**: Mod Creation
7. **Phase 6**: Download

## Socket Events

### Client → Server

#### `submit custom uu`
Emitted when a player submits their custom unique unit.

**Parameters:**
```javascript
socket.emit('submit custom uu', roomID, playerNumber, customUU)
```

- `roomID` (string): The draft room ID
- `playerNumber` (number): The player's index (0-based)
- `customUU` (object): The custom UU data object

**Custom UU Object Structure:**
```javascript
{
  type: 'custom',
  unitType: 'infantry' | 'cavalry' | 'archer' | 'siege',
  baseUnit: number,      // Base unit ID
  name: string,          // Unit name (1-30 chars)
  health: number,        // HP (15-250)
  attack: number,        // Attack damage (2-35)
  meleeArmor: number,    // Melee armor (-3 to 10)
  pierceArmor: number,   // Pierce armor (-3 to 10)
  attackSpeed: number,   // Attack speed (0.8-6.0)
  speed: number,         // Movement speed (0.5-1.65)
  range: number,         // Attack range (0-12)
  cost: {
    food: number,
    wood: number,
    stone: number,
    gold: number
  },
  trainTime: number,     // Train time (6-90)
  lineOfSight: number,   // Line of sight (3-12)
  heroMode: boolean,     // Hero mode flag
  attackBonuses: [       // Attack bonuses vs armor classes
    { class: number, amount: number }
  ]
}
```

**Server Response:**
- Emits `custom uu submitted` on success
- Emits `custom uu error` with error message on failure
- Broadcasts `set gamestate` to all clients with updated state

**Server Validation:**
- Custom UU mode must be enabled
- Player number must be valid
- Custom UU object must have `type: 'custom'`
- All required fields must be present

**Phase Transition:**
When all players have submitted their custom UUs, the server automatically:
1. Sets `gamestate.custom_uu_phase = false`
2. Initializes cards for bonus selection
3. Sets draft order
4. Emits `set gamestate` to advance to bonus selection

---

#### `update custom uu`
Emitted when a player updates their custom UU (optional real-time updates).

**Parameters:**
```javascript
socket.emit('update custom uu', roomID, playerNumber, customUU)
```

- `roomID` (string): The draft room ID
- `playerNumber` (number): The player's index
- `customUU` (object): The work-in-progress custom UU data

**Behavior:**
- Saves work-in-progress without marking player as ready
- Does NOT trigger phase transition
- If blind picks is disabled, broadcasts `custom uu update` to other players

**Use Case:**
This is optional and can be used for:
- Autosaving player's progress
- Showing real-time updates to spectators
- Collaborative design features (future)

---

### Server → Client

#### `custom uu submitted`
Confirmation that the custom UU was successfully saved.

**Emitted To:** The player who submitted

**Parameters:** None

**Client Action:**
- Show success message
- Display waiting screen
- Show status of other players

---

#### `custom uu error`
Error message if custom UU submission failed.

**Emitted To:** The player who submitted

**Parameters:**
```javascript
socket.on('custom uu error', (errorMessage) => {
  // Handle error
})
```

- `errorMessage` (string): Description of the error

**Common Errors:**
- "Custom UU mode is not enabled for this draft"
- "Invalid player number"
- "Invalid custom UU data"

---

#### `set gamestate`
Broadcasts the current draft state to all clients.

**Emitted To:** All clients in the room

**Parameters:**
```javascript
socket.on('set gamestate', (draft) => {
  // Update local state
})
```

**Draft Object (relevant fields):**
```javascript
{
  preset: {
    custom_uu_mode: boolean,  // Is custom UU mode enabled?
    // ... other preset fields
  },
  gamestate: {
    phase: number,            // Current phase (0-6)
    custom_uu_phase: boolean, // True during custom UU design
    // ... other gamestate fields
  },
  players: [
    {
      ready: number,          // 0 = designing, 1 = submitted
      custom_uu: object|null, // Custom UU data or null
      // ... other player fields
    }
  ]
}
```

**When Emitted:**
- After player submits custom UU
- When all players complete (phase transition)
- On any gamestate change

---

#### `custom uu update`
Real-time update when a player modifies their custom UU.

**Emitted To:** All clients in the room (if blind picks disabled)

**Parameters:**
```javascript
socket.on('custom uu update', (playerNumber, customUU) => {
  // Update UI for this player
})
```

- `playerNumber` (number): Which player updated
- `customUU` (object): The updated custom UU data

**Privacy:**
- Only emitted if `preset.blind_picks === false`
- Allows spectators to see live editing
- Other players can see progress (if blind picks disabled)

---

## Example Flow

### Complete Custom UU Draft Workflow

1. **Draft Creation**
```javascript
// Client creates draft with custom UU mode
POST /draft
{
  custom_uu_mode: 'true',
  // ... other settings
}
```

2. **Players Join**
```javascript
// Each player joins the room
socket.emit('join room', roomID)
socket.emit('get gamestate', roomID, playerNumber)
// Receives: set gamestate with phase=0 (lobby)
```

3. **Phase 1: Customization**
```javascript
// After all players ready, phase advances to 1
// Players set civ info
socket.emit('update civ info', roomID, playerNumber, civName, flag, arch, lang)
// Receives: set gamestate with phase=2, custom_uu_phase=true
```

4. **Phase 2a: Custom UU Design**
```javascript
// Check if in custom UU phase
if (draft.gamestate.phase === 2 && draft.gamestate.custom_uu_phase) {
  // Show CustomUUEditor
  
  // Optional: Send updates
  socket.emit('update custom uu', roomID, playerNumber, customUU)
  
  // Submit when done
  socket.emit('submit custom uu', roomID, playerNumber, customUU)
  
  // Wait for confirmation
  socket.on('custom uu submitted', () => {
    // Show waiting screen
  })
  
  socket.on('custom uu error', (error) => {
    // Show error, let user fix and resubmit
  })
  
  // When all submit, receives: set gamestate with custom_uu_phase=false
}
```

5. **Phase 2b: Bonus Selection**
```javascript
// After all custom UUs submitted
if (draft.gamestate.phase === 2 && !draft.gamestate.custom_uu_phase) {
  // Normal draft board for bonus selection
  socket.emit('end turn', roomID, cardID, turn)
}
```

6. **Remaining Phases**
- Phase 3: Tech Tree customization
- Phase 5: Mod creation (includes custom UUs)
- Phase 6: Download

---

## Implementation Notes

### Frontend

**Player Page:**
```vue
<template>
  <div v-if="currentPhase === 2 && draft">
    <!-- Custom UU Design Phase -->
    <div v-if="draft.gamestate.custom_uu_phase">
      <CustomUUEditor
        :initial-mode="'draft'"
        @update="handleCustomUUUpdate"
      />
      <button @click="handleSubmitCustomUU">Submit</button>
    </div>
    
    <!-- Bonus Selection Phase -->
    <DraftBoard v-else ... />
  </div>
</template>

<script setup>
const handleSubmitCustomUU = () => {
  socket.emit('submit custom uu', draftId, playerNumber, customUU.value)
}

socket.on('custom uu submitted', () => {
  // Show success/waiting state
})

socket.on('custom uu error', (error) => {
  alert(error)
})
</script>
```

**Host Page:**
```vue
<template>
  <div v-if="currentPhase === 2 && draft">
    <!-- Custom UU Status Display -->
    <div v-if="draft.gamestate.custom_uu_phase">
      <h2>Players Designing Custom Units</h2>
      <div v-for="player in draft.players">
        {{ player.alias }}: 
        {{ player.ready === 1 ? '✓ Ready' : 'Designing...' }}
        <span v-if="player.custom_uu">{{ player.custom_uu.name }}</span>
      </div>
    </div>
    
    <!-- Normal Draft Board -->
    <DraftBoard v-else ... />
  </div>
</template>
```

### Backend

**Server-side validation:**
```javascript
socket.on('submit custom uu', (roomID, playerNumber, customUU) => {
  const draft = getDraft(roomID);
  
  // Validate mode enabled
  if (!draft.preset.custom_uu_mode) {
    socket.emit('custom uu error', 'Custom UU mode not enabled');
    return;
  }
  
  // Validate player
  if (playerNumber < 0 || playerNumber >= draft.preset.slots) {
    socket.emit('custom uu error', 'Invalid player number');
    return;
  }
  
  // Validate UU data
  if (!customUU || customUU.type !== 'custom') {
    socket.emit('custom uu error', 'Invalid custom UU data');
    return;
  }
  
  // Save and mark ready
  draft.players[playerNumber].custom_uu = customUU;
  draft.players[playerNumber].ready = 1;
  
  // Confirm to player
  socket.emit('custom uu submitted');
  
  // Broadcast state
  io.in(roomID).emit('set gamestate', draft);
  
  // Check if all ready -> advance phase
  if (allPlayersReady(draft)) {
    advanceToBonus Selection(draft);
  }
});
```

---

## Security Considerations

1. **Input Validation**: Server MUST validate all custom UU fields
2. **Player Verification**: Verify playerNumber matches socket session
3. **Mode Check**: Only accept custom UU submissions if mode enabled
4. **Rate Limiting**: Limit update frequency to prevent spam
5. **Data Sanitization**: Sanitize string fields (name, etc.)

---

## Future Enhancements

Potential additions to the custom UU socket workflow:

1. **Base Unit Draft**:
   - Add `draft:custom_uu:base_units` event
   - Random assignment of base unit options per player
   - Player selection before UU design

2. **Templates**:
   - `get custom uu templates` - Fetch preset UUs
   - `save custom uu template` - Save for reuse

3. **Validation**:
   - `validate custom uu` - Pre-validate before submit
   - Return detailed validation errors

4. **Collaboration**:
   - `request custom uu feedback` - Ask for input
   - `vote custom uu` - Voting/rating system

---

## Troubleshooting

### Player can't submit custom UU
1. Check `draft.preset.custom_uu_mode === true`
2. Verify `draft.gamestate.custom_uu_phase === true`
3. Ensure validation passes (no errors)
4. Check socket connection

### Phase doesn't advance
1. Verify all players have `ready === 1`
2. Check all players have non-null `custom_uu`
3. Look for server-side errors in logs

### Custom UU data lost
1. Check `custom_uu` stored in player state
2. Verify draft saved to file system
3. Ensure `set gamestate` broadcasts include UU data

---

## Related Documentation

- [CUSTOM_UU_API.md](./CUSTOM_UU_API.md) - Custom UU data format
- [CUSTOM_UU_RULESET.md](./CUSTOM_UU_RULESET.md) - Validation rules
- [CUSTOM_UU_INTEGRATION_STATUS.md](./CUSTOM_UU_INTEGRATION_STATUS.md) - Implementation status
