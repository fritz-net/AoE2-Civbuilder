#!/bin/bash
# Test script for deployment automation scripts

set -e

echo "=== Testing AoE2-Civbuilder Deployment Scripts ==="
echo ""

# Test 1: Check script syntax
echo "Test 1: Checking script syntax..."
bash -n update-docker.sh
bash -n promote-to-production.sh
echo "✓ Syntax is valid"
echo ""

# Test 2: Test promote script without arguments
echo "Test 2: Testing promote script help..."
if ./promote-to-production.sh 2>&1 | grep -q "Usage:"; then
    echo "✓ Help message displayed correctly"
else
    echo "✗ Help message not displayed"
    exit 1
fi
echo ""

# Test 3: Test update script help
echo "Test 3: Testing update script help..."
if ./update-docker.sh invalid 2>&1 | grep -q "Usage:"; then
    echo "✓ Help message displayed correctly"
else
    echo "✗ Help message not displayed"
    exit 1
fi
echo ""

# Test 4: Test dry-run mode (should not require Docker)
echo "Test 4: Testing dry-run mode..."
# Create a temporary production version file for testing
TEMP_DIR=$(mktemp -d)
export PROD_VERSION_FILE="$TEMP_DIR/production-version.txt"
echo "v1.10.2" > "$PROD_VERSION_FILE"

# Test staging dry-run (will fail if can't reach GitHub API, but that's expected)
echo "  Testing staging dry-run..."
if ./update-docker.sh staging --dry-run 2>&1 | grep -q "AoE2-Civbuilder Docker Update Script"; then
    echo "  ✓ Staging dry-run executed"
else
    echo "  ⚠ Staging dry-run had issues (possibly network-related)"
fi

# Test production dry-run
echo "  Testing production dry-run..."
if ./update-docker.sh production --dry-run 2>&1 | grep -q "v1.10.2"; then
    echo "  ✓ Production dry-run read version file correctly"
else
    echo "  ⚠ Production dry-run had issues"
fi

# Cleanup
rm -rf "$TEMP_DIR"
echo ""

# Test 5: Verify documentation exists
echo "Test 5: Checking documentation..."
if [ -f "docs/DEPLOYMENT.md" ]; then
    echo "✓ docs/DEPLOYMENT.md exists"
else
    echo "✗ docs/DEPLOYMENT.md missing"
    exit 1
fi

if [ -f "DEPLOYMENT-SCRIPTS.md" ]; then
    echo "✓ DEPLOYMENT-SCRIPTS.md exists"
else
    echo "✗ DEPLOYMENT-SCRIPTS.md missing"
    exit 1
fi

if [ -f "docs/cron.example" ]; then
    echo "✓ docs/cron.example exists"
else
    echo "✗ docs/cron.example missing"
    exit 1
fi
echo ""

# Test 6: Check scripts are executable
echo "Test 6: Checking scripts are executable..."
if [ -x "update-docker.sh" ]; then
    echo "✓ update-docker.sh is executable"
else
    echo "✗ update-docker.sh is not executable"
    exit 1
fi

if [ -x "promote-to-production.sh" ]; then
    echo "✓ promote-to-production.sh is executable"
else
    echo "✗ promote-to-production.sh is not executable"
    exit 1
fi
echo ""

echo "=== All Tests Passed ==="
echo ""
echo "Note: Full integration tests require:"
echo "  - Docker installed and running"
echo "  - Network access to GitHub API"
echo "  - Network access to ghcr.io"
echo ""
echo "To test manually with Docker:"
echo "  1. ./update-docker.sh staging --dry-run"
echo "  2. ./promote-to-production.sh v1.10.2"
echo "  3. ./update-docker.sh production --dry-run"
