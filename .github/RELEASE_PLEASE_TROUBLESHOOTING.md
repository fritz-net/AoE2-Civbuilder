# Release Please Troubleshooting

## Stale Branch Error

If you encounter the error:
```
Error updating ref heads/release-please--branches--main to <commit-sha>
```

This means the release-please branch is stale and needs to be deleted. You can delete it using:

### Using GitHub CLI:
```bash
gh api -X DELETE repos/fritz-net/AoE2-Civbuilder/git/refs/heads/release-please--branches--main
```

### Using GitHub Web UI:
1. Go to https://github.com/fritz-net/AoE2-Civbuilder/branches
2. Find the `release-please--branches--main` branch
3. Click the trash icon to delete it

### Using Git:
```bash
git push origin --delete release-please--branches--main
```

After deleting the branch, the release-please workflow will automatically create a new one on the next run.

## Manual Workflow Trigger

The release-please workflow can now be triggered manually from the Actions tab:
1. Go to https://github.com/fritz-net/AoE2-Civbuilder/actions/workflows/release-please.yml
2. Click "Run workflow"
3. Select the branch (usually `main`)
4. Click "Run workflow"
