# Docker Deployment Scripts

This directory contains scripts for automated Docker deployment of AoE2-Civbuilder.

## Quick Start

```bash
# Check for updates without making changes (dry run)
./update-docker.sh staging --dry-run

# Update staging environment (auto-updates to latest release)
./update-docker.sh staging

# Promote a version to production
./promote-to-production.sh v1.10.2

# Check production update (dry run)
./update-docker.sh production --dry-run

# Update production environment (uses promoted version only)
./update-docker.sh production
```

## Scripts

- **`update-docker.sh`** - Main update script that checks for new releases and updates containers
  - Supports `--dry-run` flag to preview changes without applying them
  - First argument: `staging` or `production` (defaults to staging)
- **`promote-to-production.sh`** - Promotes a specific release version to production
- **`test-deployment-scripts.sh`** - Test suite to verify scripts work correctly

## Testing

Run the test suite to verify everything is set up correctly:

```bash
./test-deployment-scripts.sh
```

## Documentation

For complete documentation, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Features

- ✅ No Personal Access Tokens (PATs) required
- ✅ Separate staging and production environments
- ✅ Staging auto-updates to latest release
- ✅ Production requires manual promotion
- ✅ Can run as cron jobs for automation
- ✅ Dry-run mode for safe testing
- ✅ Zero-downtime updates
- ✅ Automatic cleanup of old Docker images
- ✅ Comprehensive test suite
