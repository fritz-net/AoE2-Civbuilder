# Developer Guide: Hot Reload and Docker Integration

This guide explains how the hot reload and Docker integration works in AoE2-Civbuilder.

## Architecture Overview

The application consists of three main components:

1. **Frontend (Nuxt/Vue)**: Modern Vue3 frontend with hot module replacement
2. **Backend (server.js)**: Express.js server handling API requests and serving static files
3. **C++ Backend**: Binary that modifies game .dat files

## Docker Integration

### How It Works

The Docker integration allows the C++ backend to run inside a container while keeping the development workflow smooth:

1. **Container Lifecycle**: 
   - On startup, if `CPP_IN_DOCKER=1`, server.js checks for a running container
   - If no container exists, it automatically starts one
   - The container remains running and executes C++ commands via `docker exec`
   - On shutdown (Ctrl+C), the container is stopped and removed

2. **Volume Mounting**:
   - The entire project directory is bind-mounted to `/app` in the container
   - This allows:
     - Incremental C++ builds (source changes reflected immediately)
     - Access to all game files and resources
     - Output files written back to host filesystem

3. **Command Routing**:
   - `os_func.execCommand()` in server.js detects if a command is for C++ execution
   - If `CPP_IN_DOCKER=1`, it wraps the command with `docker exec`
   - Otherwise, it executes locally (default behavior)

### Environment Variables

- `CPP_IN_DOCKER`: Set to `1` or `true` to enable Docker execution
- `CIVBUILDER_HOSTNAME`: Sets the hostname for link generation

## Development Workflows

### Workflow 1: Full Hot Reload (Recommended)

**Use case**: Active frontend and backend development

```bash
npm run dev
```

**What happens**:
- Nuxt dev server starts on port 3000 (hot module replacement enabled)
- server.js starts on port 4000 with nodemon (auto-restarts on file changes)
- Docker container starts automatically
- C++ binaries execute inside container

**Access points**:
- Frontend dev: http://localhost:3000/v2
- Backend API: http://localhost:4000
- Legacy frontend: http://localhost:4000/civbuilder

**File watching**:
- Nuxt watches: `src/frontend/**`
- Nodemon watches: `server.js`, `lib/**`, `process_mod/**`
- Docker uses bind mount, so C++ changes can be rebuilt with `./modding/scripts/build.sh`

### Workflow 2: Server + C++ in Docker

**Use case**: Frontend is stable, working on backend

```bash
# Terminal 1
npm run dev:nuxt

# Terminal 2  
npm run dev:cpp-docker
```

### Workflow 3: Local Development (No Docker)

**Use case**: Testing without Docker, or Docker unavailable

```bash
# One-time: Build C++ locally
cd modding && ./scripts/build.sh && cd ..

# Terminal 1
npm run dev:nuxt

# Terminal 2
npm run dev:server:local
```

## Nodemon Configuration

File: `nodemon.json`

```json
{
  "watch": ["server.js", "lib/**/*.js", "process_mod/**/*.js"],
  "ignore": ["modding/requested_mods/**", "node_modules/**"],
  "ext": "js,json",
  "delay": 1000
}
```

**What gets watched**:
- `server.js`: Main server file
- `lib/**/*.js`: Docker helper and other utilities
- `process_mod/**/*.js`: Mod generation logic

**What gets ignored**:
- `modding/requested_mods/**`: Generated mods (frequent file changes)
- `node_modules/**`: Dependencies
- `src/frontend/**`: Handled by Nuxt's own watcher

## Docker Helper API

The `DockerHelper` class (`lib/docker-helper.js`) manages container lifecycle:

### Key Methods

```javascript
const dockerHelper = new DockerHelper(__dirname);

// Check if Docker is available
dockerHelper.checkDockerAvailable()

// Start container (builds image if needed)
await dockerHelper.startContainer()

// Execute command in container
dockerHelper.execInContainer(cmd, (error, stdout, stderr) => {
  // Handle result
})

// Build C++ binaries inside container
await dockerHelper.buildCppInContainer()

// Ensure container is ready (start + build if needed)
await dockerHelper.ensureReady()

// Stop and remove container
dockerHelper.stopContainer()
```

### Container Lifecycle

1. **Initialization** (on server startup):
   ```javascript
   if (CPP_IN_DOCKER && dockerHelper) {
     await dockerHelper.ensureReady();
   }
   ```

2. **Execution** (during request handling):
   ```javascript
   if (shouldUseDocker && cmd.includes('create-data-mod')) {
     dockerHelper.execInContainer(cmd, callback);
   }
   ```

3. **Cleanup** (on SIGINT):
   ```javascript
   if (CPP_IN_DOCKER && dockerHelper) {
     dockerHelper.stopContainer();
   }
   ```

## Testing Docker Integration

### Manual Testing

1. **Test Docker mode**:
   ```bash
   CPP_IN_DOCKER=1 node server.js
   ```
   Watch for: "Initializing Docker container...", "Container ready"

2. **Test local mode**:
   ```bash
   node server.js
   ```
   Should not mention Docker at all

3. **Create a test mod**:
   - Navigate to http://localhost:4000/civbuilder
   - Create a random civilization
   - Verify mod downloads successfully

### Automated Testing

Run existing test suite:
```bash
npm test
```

Tests should pass in both Docker and local modes. The test suite automatically detects if C++ binaries are available and skips tests that require them.

## Troubleshooting

### Container not starting

**Symptom**: "Failed to start container" error

**Solutions**:
1. Check Docker is running: `docker ps`
2. Check image exists: `docker images | grep aoe2-civbuilder`
3. Build image manually: `docker build -f Dockerfile.build-cpp -t aoe2-civbuilder:build-cpp .`

### C++ execution fails in Docker

**Symptom**: "create-data-mod not found" or similar errors

**Solutions**:
1. Rebuild binaries: `docker exec aoe2-civbuilder-dev sh -c "cd /app/modding && ./scripts/build.sh"`
2. Check container is running: `docker ps | grep aoe2-civbuilder-dev`
3. Check mount: `docker exec aoe2-civbuilder-dev ls -la /app/modding`

### Port already in use

**Symptom**: "EADDRINUSE" error

**Solutions**:
1. Stop other instances: `pkill -f "node server.js"`
2. Find process using port: `lsof -i :4000` or `netstat -tlnp | grep 4000`
3. Use different port: `PORT=4001 npm run dev`

### Nodemon not detecting changes

**Symptom**: File changes don't trigger restart

**Solutions**:
1. Check nodemon.json includes your file paths
2. Increase delay: `"delay": 2000` in nodemon.json
3. Force restart: `rs` in terminal where nodemon is running

### Nuxt hot reload not working

**Symptom**: Frontend changes don't appear

**Solutions**:
1. Check Nuxt dev server is running on port 3000
2. Clear Nuxt cache: `rm -rf src/frontend/.nuxt`
3. Restart Nuxt: Ctrl+C and `npm run dev:nuxt`

## Performance Considerations

### Docker Execution Overhead

Using `docker exec` adds ~10-50ms per C++ invocation compared to local execution. This is acceptable for mod generation (which takes seconds), but might be noticeable for very frequent operations.

**Optimization tip**: The container stays running between requests, minimizing startup overhead.

### Build Times

- **Local C++ build**: ~30-60 seconds (one-time)
- **Docker image build**: ~2-5 minutes (includes C++ build + image layers)
- **Container start**: ~1-2 seconds
- **Mod generation**: Same in both modes (~5-15 seconds depending on complexity)

## Best Practices

1. **Development**: Use `npm run dev` for the best experience
2. **Testing**: Test both Docker and local modes before committing
3. **CI/CD**: Use local execution (Docker not needed in CI)
4. **Production**: Use pre-built Docker images from ghcr.io

## Future Improvements

Potential enhancements for the Docker integration:

1. **Persistent container**: Keep container running between server restarts
2. **Health checks**: Monitor container health and auto-restart if needed
3. **Multi-container**: Separate containers for different services
4. **Build caching**: Cache C++ builds between container restarts
5. **Hot C++ reload**: Rebuild C++ automatically on source changes
