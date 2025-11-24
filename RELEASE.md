# Release Process

This project uses [Release Please](https://github.com/googleapis/release-please) to automate releases and maintain the changelog.

## How it Works

1. **Commit Messages**: Use [Conventional Commits](https://www.conventionalcommits.org/) format for your commit messages:
   - `feat:` for new features (triggers minor version bump)
   - `fix:` for bug fixes (triggers patch version bump)
   - `feat!:` or `fix!:` or `BREAKING CHANGE:` in footer for breaking changes (triggers major version bump)
   - `chore:`, `docs:`, `style:`, `refactor:`, `test:`, `build:`, `ci:` for other changes

2. **Automatic Release PRs**: When commits are pushed to `main`, Release Please will:
   - Create or update a release PR with:
     - Updated CHANGELOG.md with all changes since last release
     - Updated version number in package.json (if exists)
     - Updated .release-please-manifest.json

3. **Creating a Release**: When the release PR is merged:
   - Release Please automatically creates a GitHub release
   - The release includes the changelog entries
   - Docker images are built and pushed to GHCR (only on releases)

## Docker Build Changes

- **Before**: Docker images were built and pushed on every commit to `main`
- **After**: Docker images are only built and pushed when a release is published
- Pull requests still build Docker images for testing, but don't push them

## Changelog

The changelog is now:
- Maintained in `CHANGELOG.md` at the root of the repository
- Uses ISO date format (YYYY-MM-DD) instead of US format (MM-DD-YYYY)
- Automatically updated by Release Please
- Dynamically loaded on the website's "Updates" page

## Manual Release (if needed)

If you need to create a release manually:

1. Update `CHANGELOG.md` following the Keep a Changelog format
2. Update `.release-please-manifest.json` with the new version
3. Create a Git tag: `git tag v0.2.0`
4. Push the tag: `git push origin v0.2.0`
5. Create a GitHub release from the tag

## Examples

### Good Commit Messages
```
feat: add new bonus card type for cavalry units
fix: correct bug in technology tree rendering
chore: update dependencies
docs: improve README installation instructions
```

### Commit Message with Breaking Change
```
feat!: redesign mod generation API

BREAKING CHANGE: The mod generation endpoint now requires authentication
```
