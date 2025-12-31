#!/bin/bash
# Automated Docker container update script for AoE2-Civbuilder
# This script checks for new releases and updates the running container if needed
# Can be run as a cron job without requiring Personal Access Tokens

set -e

# Configuration
GITHUB_REPO="fritz-net/AoE2-Civbuilder"
GITHUB_API="https://api.github.com"
IMAGE_NAME="ghcr.io/fritz-net/aoe2-civbuilder"
CONTAINER_NAME_PREFIX="aoe2-civbuilder"

# Environment (staging or production)
ENVIRONMENT="${1:-staging}"

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
echo ""

# Function to get the latest release tag for the environment
get_latest_release_tag() {
    local env=$1
    
    if [ "$env" = "production" ]; then
        # For production, check for a file that specifies the production version
        # This file should be updated manually or via a promotion workflow
        prod_file="/var/lib/aoe2-civbuilder/production-version.txt"
        if [ -f "$prod_file" ]; then
            tag=$(cat "$prod_file")
            echo "$tag"
        else
            # If no production file exists, don't update
            echo ""
        fi
    else
        # For staging, get the absolute latest release
        tag=$(curl -s "${GITHUB_API}/repos/${GITHUB_REPO}/releases/latest" | \
            grep '"tag_name":' | \
            sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')
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
docker images "${IMAGE_NAME}" --format "{{.Tag}}" | grep -v "^latest$" | grep "^v" | tail -n +4 | xargs -r -I {} docker rmi "${IMAGE_NAME}:{}" || true

echo ""
echo "Update complete!"
