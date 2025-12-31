# Docker Deployment Scripts

This directory contains scripts for automated Docker deployment of AoE2-Civbuilder.

## Quick Start

```bash
# Update staging environment (auto-updates to latest release)
./update-docker.sh staging

# Promote a version to production
./promote-to-production.sh v1.10.2

# Update production environment (uses promoted version only)
./update-docker.sh production
```

## Scripts

- **`update-docker.sh`** - Main update script that checks for new releases and updates containers
- **`promote-to-production.sh`** - Promotes a specific release version to production

## Documentation

For complete documentation, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Features

- ✅ No Personal Access Tokens (PATs) required
- ✅ Separate staging and production environments
- ✅ Staging auto-updates to latest release
- ✅ Production requires manual promotion
- ✅ Can run as cron jobs for automation
- ✅ Zero-downtime updates
- ✅ Automatic cleanup of old Docker images
