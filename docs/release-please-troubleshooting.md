# Release-Please Troubleshooting

## Error: "Error updating ref heads/release-please--branches--main"

### Problem Description
The release-please GitHub Action fails with an error message like:
```
Error updating ref heads/release-please--branches--main to <commit-sha>
```

This error has been occurring since approximately early January 2026.

### Root Cause
This error occurs when:
1. A release-please PR already exists (e.g., PR #267)
2. The main branch has moved forward with new commits
3. The existing PR branch (`release-please--branches--main`) becomes stale/behind main
4. Release-please attempts to update the stale PR but cannot force-push the reference

The GITHUB_TOKEN used by GitHub Actions does not have permission to force-push to an existing branch that has diverged, even when the workflow has `contents: write` permissions.

### Solution

#### Immediate Fix (Manual)
To resolve the current failure:

1. **Close the existing stale release-please PR**
   - Find the PR with branch name `release-please--branches--main`
   - Navigate to the PR URL (check your repository's Pull Requests page)
   - Close the PR (do not merge it if it's outdated)

2. **Trigger a new workflow run**
   - Push any new commit to main, OR
   - Go to Actions → Release Please workflow → Run workflow

3. **Release-please will create a fresh PR**
   - The new PR will be up-to-date with main
   - Future updates should work smoothly until the PR becomes stale again

#### Preventive Measures
To minimize future occurrences:

1. **Merge release PRs promptly** when they are created
2. **Check release PRs regularly** and merge them before they become stale
3. **If a release PR sits for > 1 week**, consider closing and recreating it

#### Configuration Changes Made
The workflow has been updated with:
- `config-file` and `manifest-file` parameters to explicitly use the existing repository configuration files (`.release-please-config.json` and `.release-please-manifest.json`)
- `skip-labeling: true` to reduce potential label conflicts during PR updates

The configuration files were already present in the repository but were not being explicitly referenced by the workflow.

### Additional Resources
- [Release-Please Documentation](https://github.com/googleapis/release-please)
- [Release-Please Action](https://github.com/googleapis/release-please-action)
- [Release-Please Troubleshooting Guide](https://github.com/googleapis/release-please/blob/main/docs/troubleshooting.md)
