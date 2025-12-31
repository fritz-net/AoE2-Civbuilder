#!/bin/bash
# Script to promote a staging release to production
# This creates/updates a file that the update-docker.sh script reads for production updates

set -e

VERSION="$1"
PROD_VERSION_FILE="${PROD_VERSION_FILE:-/var/lib/aoe2-civbuilder/production-version.txt}"

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version-tag>"
    echo "Example: $0 v1.10.2"
    echo ""
    echo "This will mark the specified version as the production version."
    echo "The update-docker.sh script will then update the production container to this version."
    exit 1
fi

# Verify the version exists in GitHub releases
GITHUB_REPO="fritz-net/AoE2-Civbuilder"
GITHUB_API="https://api.github.com"

echo "Checking if version $VERSION exists..."
RELEASE_INFO=$(curl -s -f "${GITHUB_API}/repos/${GITHUB_REPO}/releases/tags/${VERSION}" 2>/dev/null || echo '{"message": "Not Found"}')

if echo "$RELEASE_INFO" | grep -q '"message".*"Not Found"'; then
    echo "Error: Version $VERSION not found in GitHub releases"
    echo "Please check https://github.com/${GITHUB_REPO}/releases for available versions"
    exit 1
fi

echo "✓ Version $VERSION found"

# Create directory if it doesn't exist (try with sudo if needed)
PROD_DIR=$(dirname "$PROD_VERSION_FILE")
if [ ! -d "$PROD_DIR" ]; then
    if mkdir -p "$PROD_DIR" 2>/dev/null; then
        echo "✓ Created directory $PROD_DIR"
    elif [ "$EUID" -ne 0 ]; then
        echo "Directory $PROD_DIR doesn't exist and couldn't be created."
        echo "You may need to run with sudo or create it manually:"
        echo "  sudo mkdir -p $PROD_DIR"
        echo "  sudo chmod 755 $PROD_DIR"
        exit 1
    fi
fi

# Write the version to the file
if echo "$VERSION" > "$PROD_VERSION_FILE" 2>/dev/null; then
    echo "✓ Production version set to $VERSION"
else
    echo "Error: Could not write to $PROD_VERSION_FILE"
    echo "You may need to run with sudo or adjust permissions:"
    echo "  sudo chown $(whoami) $PROD_VERSION_FILE"
    exit 1
fi

echo ""
echo "The next time update-docker.sh runs in production mode, it will update to $VERSION"
echo "You can also run it manually: ./update-docker.sh production"
