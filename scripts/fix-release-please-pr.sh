#!/bin/bash
# Helper script to manually recreate release-please PR when it becomes stale
# This script should be run by a repository maintainer with appropriate permissions

set -e

echo "Release-Please PR Recreation Helper"
echo "===================================="
echo ""
echo "This script helps fix the 'Error updating ref heads/release-please--branches--main' error"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "Error: Not authenticated with GitHub CLI."
    echo "Please run: gh auth login"
    exit 1
fi

# Find open release-please PR
echo "Looking for open release-please PR..."
PR_NUMBER=$(gh pr list --json number,title,headRefName --jq '.[] | select(.headRefName == "release-please--branches--main") | .number' 2>/dev/null | head -1)

if [ -z "$PR_NUMBER" ]; then
    echo "No release-please PR found. This might already be resolved!"
    exit 0
fi

echo "Found release-please PR #$PR_NUMBER"
echo ""

# Show PR details
gh pr view "$PR_NUMBER" --json number,title,state,isDraft,mergeable,url --jq '"PR #\(.number): \(.title)\nState: \(.state)\nMergeable: \(.mergeable)\nURL: \(.url)"'
echo ""

# Ask for confirmation
read -p "Do you want to close this PR to allow release-please to create a new one? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted. No changes made."
    exit 0
fi

# Close the PR
echo "Closing PR #$PR_NUMBER..."
gh pr close "$PR_NUMBER" --comment "Closing stale release-please PR to allow recreation. Release-please will automatically create a new PR on the next run."

echo ""
echo "✓ PR #$PR_NUMBER has been closed."
echo ""
echo "Next steps:"
echo "1. Push a new commit to main, or manually trigger the Release Please workflow"
echo "2. Release-please will automatically create a new PR with up-to-date changes"
echo "3. Review and merge the new PR promptly to prevent it from becoming stale again"
