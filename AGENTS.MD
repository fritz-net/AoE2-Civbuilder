## Project Overview

This project is an Age of Empires 2 civilization builder and drafting tool that allows users to create custom civilizations and mods.

### Architecture

**Git Submodules**
- `modding/genieutils` - Library for reading/writing AoE2 .dat files (forked from SiegeEngineers)
- `modding/jsoncpp` - JSON parsing library for C++

**Backend Architecture**
The backend is split into two main components:
1. **Node.js Server** (`server.js`) - Main application server
   - Handles HTTP requests and WebSocket connections
   - Coordinates mod creation workflow
   - Manages draft sessions via Socket.io
   - Serves both legacy and new Vue frontends
   
2. **C++ Backend** (`modding/create-data-mod`) - DAT file editor
   - Uses genieutils library to modify game files
   - Compiled C++ binary that processes JSON specs into .dat mods
   - Located in `./modding/` directory

**Frontend Architecture**
The project has two parallel frontends:
1. **Legacy UI** (`public/`) - Original implementation
   - Served at `/` or `/civbuilder/`
   - Built with vanilla JavaScript
   - Pages: `public/client.js` (home), `public/builder.js` (builder), `public/draft.js` (draft)
   
2. **New Vue3/Nuxt4 UI** (`src/frontend/`) - Modern reimplementation
   - Served at `/v2`
   - Built with Vue 3, Nuxt 4, Pinia, TypeScript
   - Pages in `src/frontend/app/pages/`
   - See `src/frontend/README.md` for details

**Tech Tree Visualization**
- `public/aoe2techtree/` - Modified version of https://github.com/SiegeEngineers/aoe2techtree
- Used for displaying and editing tech trees in both UIs

### Testing

**Unit Tests** (`__tests__/`)
- Test framework: Jest
- Run with: `npm test`
- Key test files:
  - `vanillaCivs.test.js` - Tests all 51 vanilla civs through the C++ backend
  - `datFileCreation.test.js` - Tests DAT file creation with different versions
  - `serverStartup.test.js` - Tests server initialization
  - `thumbnailInZip.test.js` - Tests mod ZIP file generation
- Test fixtures: `__tests__/fixtures/`
- Test helpers: `__tests__/helpers/`

**E2E Tests for Vue/Nuxt UI**
- Not yet implemented
- Future location: likely `src/frontend/tests/` or `__tests__/e2e/`

### Tools and Utilities

**Enum Auto-Generation from DAT Files**
- Tool: `modding/extract-dat-info` (C++ program)
- Generates enums in `modding/enums/`:
  - `unit_ids.h` - Unit ID enums
  - `tech_ids.h` - Technology ID enums
  - `effect_ids.h` - Effect ID enums
  - `uu_ids.h` - Unique unit ID enums
- Documentation: `modding/scripts/README_extract-dat-info.md`
- Build with: `cd modding && ./scripts/build.sh`

### Main Use Cases

The modding tool has two primary workflows:

**1. `/create` Endpoint - Solo Civ Builder**
- Use case: Individual users designing their own custom civilization
- User creates a single civ with:
  - Custom name, flag, architecture
  - Selected bonuses, tech tree, unique units, unique techs
- Server generates a complete mod ZIP file
- Workflow: `server.js` → `createModFolder` → generate files → C++ `create-data-mod` → ZIP

**2. `/draft` Endpoint - Multiplayer Draft**
- Use case: Multiple players collaboratively creating a draft mod
- Real-time multiplayer session via Socket.io
- Players sequentially select cards to build civilizations together
- All selections combined into a single mod for all participants
- Draft state stored in `database.json`
- Once complete, generates one mod containing all player civs
- Workflow: Socket.io room → draft phases → selections → final mod generation

Both use cases share the final mod creation pipeline but differ in how civilization data is gathered (solo design vs. collaborative draft).

---

## Coding Guidelines
keep changes minimal

use enums where available
use scoped enums like `TechID::` or `UnitID::`

## PR instructions
Title format: <type>(<scope>): <description>
while scope is optional

branch name should start with "agent/123-description-of-task" where 123 is the current PR id

# Agent Workflow

## PR Handling
- if UI was changed/related add screenshots after each session as PR comment; if importend or final add to main PR content too
  - evaluate if url pattern is correct:
    - wrong: https://github.com/user-attachments/assets/ribbon1-classic.png
    - good: https://github.com/user-attachments/assets/7091a86c-8cbf-4970-bccd-1c3fee4780fe
    - good: https://private-user-images.githubusercontent.com/122795841/518943158-75803498-1b92-4fce-9b8e-75e68400169c.png?jwt=...token... # gets replaced from former link
- PR title should follow convetional commit style

## git usage
- create commits after each step/task
- commit msg should follow conventional commit style

## Ending a Task/Conversation/Session
- at the end scan similar files and evaluate if there is similar/duplicated code;
  - refactor those BUT only if it is safe and minimal
  - AND inform the user about it
  - AND create a own commit for each refactor (so review is easy)
