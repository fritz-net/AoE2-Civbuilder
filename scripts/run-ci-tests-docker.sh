#!/usr/bin/env bash
# ./scripts/run-ci-tests-docker.sh
#
# Idempotent Docker-first CI test runner.
# Creates logs under ./logs/ci-local-tests/, manages civ-net network and civbuilder container,
# runs build, starts backend, waits for service, runs tests in ephemeral node container,
# and cleans up on exit/failure.

set -u
set -o pipefail

LOGDIR="./logs/ci-local-tests"
mkdir -p "$LOGDIR"

CREATED_NETWORK=false
BACKEND_STARTED=false
LOG_DOCKER_RUN_PID=""

function log { echo "[$(date --iso-8601=seconds)] $*" ; }

function fail {
  local msg="$1"
  echo "$(date --iso-8601=seconds) [ERROR] $msg" | tee -a "$LOGDIR/service-wait.log" >&2
  exit 1
}

function cleanup {
  log "Cleaning up..."

  if docker ps -a --format '{{.Names}}' | grep -qw civbuilder; then
    log "Stopping civbuilder container..."
    docker stop civbuilder >/dev/null 2>&1 || true
    log "Removing civbuilder container..."
    docker rm civbuilder >/dev/null 2>&1 || true
  fi

  if [ "$CREATED_NETWORK" = true ]; then
    if docker network ls --format '{{.Name}}' | grep -qw civ-net; then
      log "Removing network civ-net..."
      docker network rm civ-net >/dev/null 2>&1 || true
    fi
  fi

  if [ -n "$LOG_DOCKER_RUN_PID" ]; then
    if ps -p "$LOG_DOCKER_RUN_PID" >/dev/null 2>&1; then
      kill "$LOG_DOCKER_RUN_PID" >/dev/null 2>&1 || true
    fi
  fi

  log "Cleanup complete."
}

function exit_handler {
  local code="$1"
  cleanup
  exit "$code"
}

trap 'exit_handler $?' EXIT

log "Ensuring docker network civ-net exists..."
if docker network ls --format '{{.Name}}' | grep -qw civ-net; then
  log "Network civ-net already exists."
else
  log "Creating network civ-net..."
  if docker network create civ-net >>"$LOGDIR/docker-build.log" 2>&1; then
    CREATED_NETWORK=true
    log "Created network civ-net."
  else
    fail "Failed to create docker network civ-net. See $LOGDIR/docker-build.log"
  fi
fi

# Ensure old civbuilder container removed
if docker ps -a --format '{{.Names}}' | grep -qw civbuilder; then
  log "Found existing civbuilder container; stopping and removing..."
  docker stop civbuilder >>"$LOGDIR/docker-run-backend.log" 2>&1 || true
  docker rm civbuilder >>"$LOGDIR/docker-run-backend.log" 2>&1 || true
fi

# Build the C++ backend image
log "Building C++ backend image..."
BUILD_LOG="$LOGDIR/docker-build.log"
: > "$BUILD_LOG"
if docker build -t aoe2-civbuilder:local -f Dockerfile.build-cpp . >>"$BUILD_LOG" 2>&1; then
  log "Docker build completed successfully."
else
  log "Docker build failed. See $BUILD_LOG"
  exit 1
fi

# Start backend container named civbuilder
RUN_LOG="$LOGDIR/docker-run-backend.log"
: > "$RUN_LOG"
log "Starting civbuilder container..."
if docker run -d --name civbuilder --network civ-net -p 4000:4000 aoe2-civbuilder:local >>"$RUN_LOG" 2>&1; then
  BACKEND_STARTED=true
  CONTAINER_ID="$(tail -n 1 "$RUN_LOG" | tr -d ' \n')"
  log "Started civbuilder container (id: $CONTAINER_ID)"
  # Capture container logs in background
  docker logs -f civbuilder >>"$RUN_LOG" 2>&1 &
  LOG_DOCKER_RUN_PID=$!
else
  log "Failed to start civbuilder. See $RUN_LOG"
  exit 1
fi

# Wait up to 60 seconds for backend to respond
WAIT_LOG="$LOGDIR/service-wait.log"
: > "$WAIT_LOG"
log "Waiting for backend to respond at http://civbuilder:4000/ ..."
MAX_WAIT=60
INTERVAL=2
elapsed=0
success=false
while [ $elapsed -lt $MAX_WAIT ]; do
  TIMESTAMP="$(date --iso-8601=seconds)"
  echo "$TIMESTAMP Trying to curl http://civbuilder:4000/ (elapsed ${elapsed}s)" >>"$WAIT_LOG"
  # Use curl inside a temporary container on the civ-net
  if docker run --rm --network civ-net curlimages/curl:8.4.0 -sS -I http://civbuilder:4000/ >>"$WAIT_LOG" 2>&1; then
    echo "$(date --iso-8601=seconds) Service responded." >>"$WAIT_LOG"
    success=true
    break
  fi
  sleep $INTERVAL
  elapsed=$((elapsed+INTERVAL))
done

if [ "$success" != true ]; then
  echo "$(date --iso-8601=seconds) Service did not respond within ${MAX_WAIT}s." >>"$WAIT_LOG"
  exit 1
fi

# Run test steps inside ephemeral node container
NPM_LOG="$LOGDIR/npm-install.log"
PLAYWRIGHT_LOG="$LOGDIR/playwright-install.log"
TEST_SIMPLE_LOG="$LOGDIR/test-simple.log"
TEST_COMPLEX_LOG="$LOGDIR/test-complex.log"

: > "$NPM_LOG"
: > "$PLAYWRIGHT_LOG"
: > "$TEST_SIMPLE_LOG"
: > "$TEST_COMPLEX_LOG"

log "Running npm install inside node:18-bullseye..."
if docker run --rm -v "$(pwd)":/workspace -w /workspace --network civ-net node:18-bullseye bash -lc "npm install" >>"$NPM_LOG" 2>&1; then
  log "npm install completed."
else
  log "npm install failed. See $NPM_LOG"
  exit 1
fi

log "Running npx playwright install --with-deps chromium inside node:18-bullseye..."
if docker run --rm -v "$(pwd)":/workspace -w /workspace --network civ-net node:18-bullseye bash -lc "npx playwright install --with-deps chromium" >>"$PLAYWRIGHT_LOG" 2>&1; then
  log "Playwright install completed."
else
  log "Playwright install failed. See $PLAYWRIGHT_LOG"
  exit 1
fi

log "Running CI=true npm run test:simple inside node:18-bullseye..."
if docker run --rm -v "$(pwd)":/workspace -w /workspace --network civ-net node:18-bullseye bash -lc "CI=true npm run test:simple" >>"$TEST_SIMPLE_LOG" 2>&1; then
  log "test:simple passed."
else
  log "test:simple failed. See $TEST_SIMPLE_LOG"
  exit 1
fi

log "Running CI=true CIVBUILDER_HOSTNAME=http://civbuilder:4000 npm run test:complex inside node:18-bullseye..."
if docker run --rm -v "$(pwd)":/workspace -w /workspace --network civ-net node:18-bullseye bash -lc "CI=true CIVBUILDER_HOSTNAME=http://civbuilder:4000 npm run test:complex" >>"$TEST_COMPLEX_LOG" 2>&1; then
  log "test:complex passed."
else
  log "test:complex failed. See $TEST_COMPLEX_LOG"
  exit 1
fi

log "All steps completed successfully."
exit 0