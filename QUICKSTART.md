# Quick Start Guide: Docker and Hot Reload

This guide helps you get started with the new hot reload development workflow.

## Prerequisites

- Node.js 20+ installed
- Docker installed (optional, for Docker mode)
- Git with submodules initialized

**Note for Windows users**: All npm scripts are cross-platform compatible using `cross-env`. They work in PowerShell, Command Prompt, and Git Bash.

## Quick Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/fritz-net/AoE2-Civbuilder.git
cd AoE2-Civbuilder

# Initialize submodules (for C++ source)
git submodule update --init --recursive

# Install dependencies
npm install

# Build Nuxt frontend (one-time)
npm run build:nuxt
```

### 2. Choose Your Development Mode

#### Option A: Full Hot Reload (Recommended) 🚀

**Best for**: Active development on both frontend and backend

```bash
npm run dev
```

**What you get**:
- ✅ Nuxt dev server with hot module replacement (port 3000)
- ✅ Server.js auto-restart on changes (port 4000)
- ✅ C++ execution in Docker (no local C++ build needed)

**Access**:
- Frontend: http://localhost:3000/v2
- Backend API: http://localhost:4000
- Legacy UI: http://localhost:4000/civbuilder

#### Option B: Local C++ Development 🔧

**Best for**: Working on C++ backend or when Docker is unavailable

```bash
# One-time: Build C++ locally
cd modding && ./scripts/build.sh && cd ..

# Start development
npm run dev:server:local    # Terminal 1
npm run dev:nuxt            # Terminal 2 (optional)
```

#### Option C: Backend Only 🔨

**Best for**: API development without frontend changes

```bash
npm run dev:cpp-docker
```

## Common Tasks

### Making Frontend Changes

1. Start dev mode: `npm run dev`
2. Edit files in `src/frontend/`
3. Changes appear instantly at http://localhost:3000/v2

### Making Backend Changes

1. Start dev mode: `npm run dev` or `npm run dev:server`
2. Edit files in `server.js`, `lib/`, or `process_mod/`
3. Server auto-restarts (takes ~2 seconds)

### Making C++ Changes

**With Docker**:
```bash
# Edit files in modding/
# Rebuild inside container
docker exec aoe2-civbuilder-dev sh -c "cd /app/modding && ./scripts/build.sh"
# Restart server to pick up changes
```

**Without Docker**:
```bash
# Edit files in modding/
cd modding && ./scripts/build.sh && cd ..
# Server picks up changes automatically
```

### Testing Your Changes

```bash
# Run all tests
npm test

# Run specific test
npm test -- yourTest.test.js

# Watch mode
npm run test:watch

# E2E tests (requires built Nuxt)
npm run test:e2e
```

## Configuration

Create a `.env` file (see `.env.example`):

```bash
# Local development
CIVBUILDER_HOSTNAME=http://localhost:4000

# Enable Docker mode (1) or use local C++ (0)
CPP_IN_DOCKER=0
```

**Note**: The `dev` scripts automatically set `CPP_IN_DOCKER=1`

## Troubleshooting

### "Canvas module not found" or "Cannot find native binding" on Windows

**Errors**: 
- `Error: Cannot find module '../build/Release/canvas.node'`
- `Cannot find native binding` (oxc-parser, etc.)

**Solution**: Native modules need to build during installation. Make sure you:
1. Run `npm install` (not `npm ci`) 
2. Do NOT use `--ignore-scripts` flag when installing
3. Allow scripts to run so native binaries can be built

**For the frontend:**
```bash
cd src/frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**For the backend:**
```bash
# From root directory
rm -rf node_modules
npm install
npm run dev
```

### "Docker not available"

**Solution**: Either install Docker or use local C++ mode:
```bash
npm run dev:server:local
```

### "Container failed to start"

**Solutions**:
1. Check Docker is running: `docker ps`
2. Remove stale container: `docker rm -f aoe2-civbuilder-dev`
3. Rebuild image: `docker build -f Dockerfile.build-cpp -t aoe2-civbuilder:build-cpp .`

### "Port 4000 already in use"

**Solutions**:
1. Stop other instances: `pkill -f "node server.js"`
2. Find and kill process: `lsof -i :4000`

### Server restarts too often

**Solution**: Adjust nodemon delay in `nodemon.json`:
```json
{
  "delay": 2000
}
```

### Changes not appearing

**Frontend**: Check Nuxt dev server is running on port 3000
**Backend**: Check nodemon is watching your file (see `nodemon.json`)

## Tips

1. **Use two terminals** for frontend + backend development
2. **Check console output** for helpful error messages
3. **Clear Nuxt cache** if strange issues: `rm -rf src/frontend/.nuxt`
4. **Restart nodemon manually** by typing `rs` in its terminal
5. **Check Docker logs** if container issues: `docker logs aoe2-civbuilder-dev`

## Next Steps

- Read [DEVELOPER.md](DEVELOPER.md) for detailed architecture info
- Check [README.md](README.md) for project overview
- See [src/frontend/README.md](src/frontend/README.md) for Vue/Nuxt details

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review existing GitHub issues
3. Create a new issue with:
   - What you were trying to do
   - What command you ran
   - Full error message
   - Your environment (OS, Node version, Docker version)

Happy developing! 🎮
