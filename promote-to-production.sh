#!/bin/bash
# Script to promote a staging release to production
# This creates/updates a file that the update-docker.sh script reads for production updates

set -e

VERSION="$1"
PROD_VERSION_FILE="/var/lib/aoe2-civbuilder/production-version.txt"

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
RELEASE_INFO=$(curl -s "${GITHUB_API}/repos/${GITHUB_REPO}/releases/tags/${VERSION}")

if echo "$RELEASE_INFO" | grep -q '"message": "Not Found"'; then
    echo "Error: Version $VERSION not found in GitHub releases"
    exit 1
fi

echo "✓ Version $VERSION found"

# Create directory if it doesn't exist
mkdir -p "$(dirname "$PROD_VERSION_FILE")"

# Write the version to the file
echo "$VERSION" > "$PROD_VERSION_FILE"

echo "✓ Production version set to $VERSION"
echo ""
echo "The next time update-docker.sh runs in production mode, it will update to $VERSION"
echo "You can also run it manually: ./update-docker.sh production"
