# Release Please Troubleshooting

## Problem

The release-please GitHub Action was failing with the error:
```
Error updating ref heads/release-please--branches--main to 504383bece13b7db97fa1d98aef915708896ea4a
```

This occurred because:
1. A stale `release-please--branches--main` branch exists in the repository
2. Release-please tries to update this branch but fails due to branch state conflicts
3. The PR was closed but the branch was not automatically deleted

## Solution

This fix includes three improvements:

### 1. Enable Manual Workflow Runs

Added `workflow_dispatch` trigger to `.github/workflows/release-please.yml`:
```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:
```

This allows you to manually trigger the release-please workflow from the GitHub Actions UI.

### 2. Branch Cleanup Workflow

Created `.github/workflows/delete-stale-release-branch.yml` - a manual workflow to delete stale release-please branches:
- Can be triggered from the Actions tab
- Has a configurable input for branch name (defaults to `release-please--branches--main`)
- Safely checks if the branch exists before attempting deletion

### 3. Documentation

Created this troubleshooting guide with multiple methods to delete the stale branch.

## How to Fix the Current Error

### Option 1: Use the Cleanup Workflow (Recommended)

1. Go to [Actions → Delete Stale Release Please Branch](https://github.com/fritz-net/AoE2-Civbuilder/actions/workflows/delete-stale-release-branch.yml)
2. Click "Run workflow"
3. Leave the default branch name or specify a different one
4. Click "Run workflow"

### Option 2: Using GitHub CLI

```bash
gh api -X DELETE repos/fritz-net/AoE2-Civbuilder/git/refs/heads/release-please--branches--main
```

### Option 3: Using GitHub Web UI

1. Go to https://github.com/fritz-net/AoE2-Civbuilder/branches
2. Find the `release-please--branches--main` branch
3. Click the trash icon to delete it

### Option 4: Using Git

```bash
git push origin --delete release-please--branches--main
```

## After Cleanup

Once the stale branch is deleted, the release-please workflow will:
1. Automatically create a new branch on the next push to `main`
2. Generate a new release PR with proper changelog
3. Work correctly for future releases

## Manual Workflow Trigger

The release-please workflow can now be triggered manually:
1. Go to https://github.com/fritz-net/AoE2-Civbuilder/actions/workflows/release-please.yml
2. Click "Run workflow"
3. Select the branch (usually `main`)
4. Click "Run workflow"

This is useful for:
- Testing the workflow after fixes
- Creating releases on-demand
- Recovery from workflow failures

