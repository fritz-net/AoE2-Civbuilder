# Draft Mode Testing Notes

## Overview
Draft mode has been implemented in the Vue3/Nuxt4 frontend with pages and components that follow the legacy UI flow.

## Implemented Components

### Draft-Specific Components
1. **DraftLobby** - Player lobby with ready status
2. **DraftBoard** - Main drafting interface with card selection
3. **DraftCard** - Individual card display component
4. **DraftSidebar** - Shows previously selected bonuses during draft
5. **TimerCountdown** - Timer/countdown component (prepared for future use)

### Reused Components
- **FlagCreator** - From build page
- **TechTree** - From build page
- **ArchitectureSelector** - From build page
- **LanguageSelector** - From build page
- **BonusSelector components** - From build page

## Draft Pages

### Routes
1. `/v2/draft/host/[id]` - Host draft page
2. `/v2/draft/player/[id]` - Player draft page
3. `/v2/draft/[id]` - Spectator draft page

### Flow Phases (matching legacy UI)
- **Phase 0**: Lobby - Players join and ready up
- **Phase 1**: Setup - Flag, tech tree, and basic info customization
- **Phase 2**: Drafting - Card selection in rounds (Civ Bonuses → UU → Castle Tech → Imperial Tech → Team Bonus)
- **Phase 3**: Complete - Download mod

## What's Working
- ✅ All page structures created
- ✅ Component hierarchy established
- ✅ Draft flow logic implemented in useDraft composable
- ✅ Socket.io integration prepared
- ✅ Sidebar shows previously selected bonuses
- ✅ Timer/countdown component ready for use
- ✅ Reuses existing build components
- ✅ Responsive design
- ✅ Builds without errors

## Integration Requirements

### Backend Integration Needed
1. **API Endpoints**: The frontend expects these endpoints:
   - `GET /api/draft/:id` - Load draft data
   - Socket.io events for real-time updates

2. **Socket.io Events** (already implemented in composable):
   - `join` - Join draft room
   - `ready` - Update player ready status
   - `start` - Start draft
   - `updateCivInfo` - Update player civilization info
   - `endTurn` - Select card and end turn
   - `updateLobby` - Receive lobby updates
   - `updateGame` - Receive game state updates

3. **Draft Data Structure**: The composable expects draft data in this format:
   ```typescript
   {
     id: string
     timestamp: number
     preset: { slots, rounds, points, rarities, cards }
     players: [{ name, alias, flag_palette, architecture, language, tree, bonuses, ready, ... }]
     gamestate: { phase, turn, order, cards, deck }
   }
   ```

### Testing Without Backend
The pages are built and render correctly, but actual draft functionality requires:
1. Server-side draft creation and management (existing in legacy code)
2. Socket.io server integration (existing in server.js)
3. Card data and bonus descriptions loading

### Next Steps for Full Functionality
1. Connect the "Create Draft" button on homepage to backend draft creation
2. Ensure server.js socket.io handlers are compatible with the new composable events
3. Add card image assets and bonus description data
4. Test full draft flow with multiple players
5. Add flag drawing logic to canvas elements
6. Implement tech tree viewer with selected bonuses overlay

## Notes
- The draft pages use dynamic routes `[id].vue` so they won't be pre-rendered
- SSR is disabled (`ssr: false`) so pages are client-side only
- Socket.io client library should be loaded from CDN or installed
- All components follow the existing design system and styling
