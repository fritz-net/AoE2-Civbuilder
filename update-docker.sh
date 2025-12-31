#!/bin/bash
# Automated Docker container update script for AoE2-Civbuilder
# This script checks for new releases and updates the running container if needed
# Can be run as a cron job without requiring Personal Access Tokens

set -e

# Parse command line arguments
DRY_RUN=false
ENVIRONMENT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            echo "Usage: $0 [staging|production] [--dry-run]"
            echo ""
            echo "Examples:"
            echo "  $0 staging              # Update staging to latest release"
            echo "  $0 production           # Update production to promoted version"
            echo "  $0 staging --dry-run    # Check for updates without applying"
            exit 1
            ;;
    esac
done

# Default to staging if not specified
ENVIRONMENT="${ENVIRONMENT:-staging}"

# Configuration
GITHUB_REPO="fritz-net/AoE2-Civbuilder"
GITHUB_API="https://api.github.com"
IMAGE_NAME="ghcr.io/fritz-net/aoe2-civbuilder"
CONTAINER_NAME_PREFIX="aoe2-civbuilder"

# Get configuration based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    CONTAINER_NAME="${CONTAINER_NAME_PREFIX}-prod"
    PORT="4000"
    HOSTNAME="${CIVBUILDER_HOSTNAME_PROD:-https://civbuilder.velarix.space}"
    # Production uses tags that are marked as production (e.g., v1.10.2-prod or releases marked in body)
    RELEASE_TYPE="production"
elif [ "$ENVIRONMENT" = "staging" ]; then
    CONTAINER_NAME="${CONTAINER_NAME_PREFIX}-staging"
    PORT="${STAGING_PORT:-4001}"
    HOSTNAME="${CIVBUILDER_HOSTNAME_STAGING:-https://staging.civbuilder.velarix.space}"
    # Staging uses the latest release automatically
    RELEASE_TYPE="latest"
else
    echo "Error: Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

echo "=== AoE2-Civbuilder Docker Update Script ==="
echo "Environment: $ENVIRONMENT"
echo "Container: $CONTAINER_NAME"
echo "Port: $PORT"
echo "Hostname: $HOSTNAME"
if [ "$DRY_RUN" = true ]; then
    echo "Mode: DRY RUN (no changes will be made)"
fi
echo ""

# Function to get the latest release tag for the environment
get_latest_release_tag() {
    local env=$1
    
    if [ "$env" = "production" ]; then
        # For production, check for a file that specifies the production version
        # This file should be updated manually or via a promotion workflow
        prod_file="${PROD_VERSION_FILE:-/var/lib/aoe2-civbuilder/production-version.txt}"
        if [ -f "$prod_file" ]; then
            tag=$(cat "$prod_file" 2>/dev/null)
            echo "$tag"
        else
            # If no production file exists, don't update
            echo ""
        fi
    else
        # For staging, get the absolute latest release
        # Try jq first for robust JSON parsing, fall back to grep/sed if not available
        if command -v jq &> /dev/null; then
            tag=$(curl -s -f "${GITHUB_API}/repos/${GITHUB_REPO}/releases/latest" 2>/dev/null | \
                jq -r '.tag_name // empty' || echo "")
        else
            # Fallback to grep/sed with improved error handling
            tag=$(curl -s -f "${GITHUB_API}/repos/${GITHUB_REPO}/releases/latest" 2>/dev/null | \
                grep '"tag_name":' | head -1 | \
                sed -E 's/.*"tag_name"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/' || echo "")
        fi
        echo "$tag"
    fi
}

# Get the latest release tag for this environment
echo "Checking for latest $ENVIRONMENT release..."
LATEST_TAG=$(get_latest_release_tag "$ENVIRONMENT")

if [ -z "$LATEST_TAG" ]; then
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "No production version specified. Use promote-to-production.sh to set a version."
        exit 0
    else
        echo "Error: Could not determine latest release"
        exit 1
    fi
fi

echo "Latest $ENVIRONMENT release: $LATEST_TAG"

# Get currently running version
CURRENT_VERSION=""
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    CURRENT_VERSION=$(docker inspect "$CONTAINER_NAME" --format '{{.Config.Image}}' | cut -d':' -f2)
    echo "Current version: $CURRENT_VERSION"
else
    echo "No container currently running with name: $CONTAINER_NAME"
fi

# Compare versions
if [ "$CURRENT_VERSION" = "$LATEST_TAG" ]; then
    echo "Already running the latest version ($LATEST_TAG)"
    exit 0
fi

echo ""
echo "Update available: $CURRENT_VERSION -> $LATEST_TAG"

if [ "$DRY_RUN" = true ]; then
    echo ""
    echo "[DRY RUN] Would perform the following actions:"
    echo "  1. Pull image: ${IMAGE_NAME}:${LATEST_TAG}"
    echo "  2. Stop container: $CONTAINER_NAME"
    echo "  3. Remove container: $CONTAINER_NAME"
    echo "  4. Start new container with:"
    echo "     - Name: $CONTAINER_NAME"
    echo "     - Port: ${PORT}:4000"
    echo "     - Env: CIVBUILDER_HOSTNAME=$HOSTNAME"
    echo "     - Image: ${IMAGE_NAME}:${LATEST_TAG}"
    echo ""
    echo "Run without --dry-run to apply changes"
    exit 0
fi

echo "Pulling new image..."

# Pull the new image
docker pull "${IMAGE_NAME}:${LATEST_TAG}"

# Stop and remove old container if it exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Stopping old container..."
    docker stop "$CONTAINER_NAME" || true
    echo "Removing old container..."
    docker rm "$CONTAINER_NAME" || true
fi

# Start new container
echo "Starting new container..."
docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -e CIVBUILDER_HOSTNAME="$HOSTNAME" \
    -p "${PORT}:4000" \
    "${IMAGE_NAME}:${LATEST_TAG}"

# Verify the container is running
sleep 3
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo ""
    echo "✓ Successfully updated to version $LATEST_TAG"
    echo "✓ Container is running on port $PORT"
else
    echo ""
    echo "✗ Error: Container failed to start"
    exit 1
fi

# Clean up old images (keep last 3 versions)
echo ""
echo "Cleaning up old images..."
# Get list of image tags, filter for version tags, and remove old ones
IMAGE_TAGS=$(docker images "${IMAGE_NAME}" --format "{{.Tag}}" | grep -v "^latest$" | grep "^v" || true)
IMAGE_COUNT=$(echo "$IMAGE_TAGS" | grep -v '^$' | wc -l)

if [ "$IMAGE_COUNT" -gt 3 ]; then
    echo "$IMAGE_TAGS" | tail -n +4 | while read -r tag; do
        if [ -n "$tag" ]; then
            docker rmi "${IMAGE_NAME}:${tag}" 2>/dev/null || true
        fi
    done
    echo "Cleaned up old images (kept last 3 versions)"
else
    echo "No old images to clean up (keeping all $IMAGE_COUNT version(s))"
fi

echo ""
echo "Update complete!"
