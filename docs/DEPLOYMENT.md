# Automated Docker Deployment Guide

This guide explains how to set up automated Docker container updates for AoE2-Civbuilder with separate staging and production environments.

## Overview

The deployment system supports:
- **Staging environment**: Automatically updates to the latest release
- **Production environment**: Updates only to manually approved/promoted versions
- **Automated updates**: Can run via cron jobs without requiring Personal Access Tokens (PATs)
- **Zero-downtime updates**: Old containers are stopped and removed before new ones start

## Architecture

### Staging Environment
- Automatically pulls and deploys the latest GitHub release
- Can run on a different port (default: 4001)
- Updates immediately when new releases are published
- Ideal for testing before production deployment

### Production Environment
- Only updates to explicitly promoted versions
- Runs on the main port (default: 4000)
- Requires manual promotion using `promote-to-production.sh`
- Ensures stability by preventing automatic updates

## Installation

### Prerequisites

1. Docker installed on your host system
2. Access to pull from `ghcr.io/fritz-net/aoe2-civbuilder`
3. Bash shell (Linux/macOS or WSL on Windows)
4. `curl` for making HTTP requests
5. (Optional but recommended) `jq` for robust JSON parsing

To install jq on common platforms:
```bash
# Ubuntu/Debian
sudo apt-get install jq

# CentOS/RHEL
sudo yum install jq

# macOS
brew install jq
```

Note: The scripts will work without `jq` using fallback parsing, but `jq` provides more reliable JSON handling.

### Setup Scripts

1. Copy the deployment scripts to your Docker host:

```bash
# Copy scripts to a suitable location
sudo mkdir -p /opt/aoe2-civbuilder
sudo cp update-docker.sh /opt/aoe2-civbuilder/
sudo cp promote-to-production.sh /opt/aoe2-civbuilder/
sudo chmod +x /opt/aoe2-civbuilder/*.sh
```

2. Create the production version tracking directory:

```bash
sudo mkdir -p /var/lib/aoe2-civbuilder
```

## Usage

### Manual Deployment

#### Check for Updates (Dry Run)

Before making changes, you can check what would be updated:

```bash
# Check staging for updates without making changes
/opt/aoe2-civbuilder/update-docker.sh staging --dry-run

# Check production for updates without making changes
/opt/aoe2-civbuilder/update-docker.sh production --dry-run
```

#### Deploy Staging

```bash
# Deploy or update staging to the latest release
/opt/aoe2-civbuilder/update-docker.sh staging
```

The staging environment will:
- Check for the latest release on GitHub
- Pull the new Docker image if available
- Stop and remove the old container
- Start a new container on port 4001

#### Deploy Production

First, promote a version to production:

```bash
# Promote a specific version to production
/opt/aoe2-civbuilder/promote-to-production.sh v1.10.2
```

Then deploy it:

```bash
# Deploy or update production to the promoted version
/opt/aoe2-civbuilder/update-docker.sh production
```

### Automated Deployment with Cron

Set up cron jobs to automatically check for updates:

```bash
# Edit crontab
sudo crontab -e
```

Add the following entries:

```cron
# Check for staging updates every 10 minutes
*/10 * * * * /opt/aoe2-civbuilder/update-docker.sh staging >> /var/log/aoe2-civbuilder-staging-update.log 2>&1

# Check for production updates every 30 minutes
*/30 * * * * /opt/aoe2-civbuilder/update-docker.sh production >> /var/log/aoe2-civbuilder-prod-update.log 2>&1
```

### Configuration

#### Environment Variables

You can customize the deployment by setting environment variables before running the scripts:

```bash
# Staging environment
export STAGING_PORT=4001
export CIVBUILDER_HOSTNAME_STAGING="https://staging.civbuilder.velarix.space"

# Production environment
export CIVBUILDER_HOSTNAME_PROD="https://civbuilder.velarix.space"

# Then run the update script
/opt/aoe2-civbuilder/update-docker.sh staging
```

#### Persistent Configuration

Create a configuration file for persistent settings:

```bash
# Create config file
sudo tee /etc/aoe2-civbuilder.conf << 'EOF'
# Staging configuration
STAGING_PORT=4001
CIVBUILDER_HOSTNAME_STAGING="https://staging.civbuilder.velarix.space"

# Production configuration
CIVBUILDER_HOSTNAME_PROD="https://civbuilder.velarix.space"
EOF
```

Then source it in your cron jobs or before running scripts:

```bash
source /etc/aoe2-civbuilder.conf
/opt/aoe2-civbuilder/update-docker.sh staging
```

## Workflow Examples

### Example 1: Standard Release Workflow

1. **Development**: Code changes are merged to main branch
2. **Release**: Release Please creates a new release (e.g., v1.11.0)
3. **Staging**: Staging environment automatically updates within 10 minutes
4. **Testing**: Team tests the new version on staging
5. **Promotion**: If tests pass, promote to production:
   ```bash
   /opt/aoe2-civbuilder/promote-to-production.sh v1.11.0
   ```
6. **Production**: Production updates within 30 minutes (or immediately with manual trigger)

### Example 2: Hotfix Workflow

1. **Urgent Fix**: Critical bug fix is released as v1.11.1
2. **Staging**: Staging auto-updates and you verify the fix
3. **Fast Promotion**: Immediately promote and deploy to production:
   ```bash
   /opt/aoe2-civbuilder/promote-to-production.sh v1.11.1
   /opt/aoe2-civbuilder/update-docker.sh production
   ```

### Example 3: Rollback

If a production deployment has issues:

```bash
# Rollback to previous version
/opt/aoe2-civbuilder/promote-to-production.sh v1.10.2
/opt/aoe2-civbuilder/update-docker.sh production
```

## Container Management

### View Running Containers

```bash
docker ps --filter name=aoe2-civbuilder
```

### View Logs

```bash
# Staging logs
docker logs aoe2-civbuilder-staging -f

# Production logs
docker logs aoe2-civbuilder-prod -f
```

### Stop Containers Manually

```bash
# Stop staging
docker stop aoe2-civbuilder-staging

# Stop production
docker stop aoe2-civbuilder-prod
```

### View Update Logs

```bash
# View staging update logs
sudo tail -f /var/log/aoe2-civbuilder-staging-update.log

# View production update logs
sudo tail -f /var/log/aoe2-civbuilder-prod-update.log
```

## Troubleshooting

### Script Can't Find Latest Release

**Problem**: Error message "Could not determine latest release"

**Solution**: Check your internet connection and GitHub API availability:
```bash
curl -s https://api.github.com/repos/fritz-net/AoE2-Civbuilder/releases/latest
```

### Container Fails to Start

**Problem**: Update completes but container isn't running

**Solution**: Check Docker logs for errors:
```bash
docker logs aoe2-civbuilder-staging
# or
docker logs aoe2-civbuilder-prod
```

### Port Already in Use

**Problem**: Error about port binding

**Solution**: Check what's using the port and stop it:
```bash
# Find what's using port 4000
sudo lsof -i :4000

# Stop the conflicting container
docker stop <container-name>
```

### Production Won't Update

**Problem**: Production update script says "No production version specified"

**Solution**: You need to promote a version first:
```bash
/opt/aoe2-civbuilder/promote-to-production.sh v1.10.2
```

## Security Considerations

- **No PATs Required**: The scripts use the public GitHub API which doesn't require authentication for public repositories
- **Rate Limits**: GitHub API has rate limits (60 requests/hour for unauthenticated requests). The cron schedule should stay within these limits
- **Container Security**: Containers run with `--restart unless-stopped` to ensure they restart after host reboots
- **Image Cleanup**: Old Docker images are automatically cleaned up, keeping only the last 3 versions

## Advanced Configuration

### Using a Different Registry

If you're hosting images in a different registry:

```bash
# Edit update-docker.sh and change IMAGE_NAME
IMAGE_NAME="your-registry.com/aoe2-civbuilder"
```

### Custom Port Mappings

To run multiple instances or use different ports:

```bash
# Set custom ports
export STAGING_PORT=8080
/opt/aoe2-civbuilder/update-docker.sh staging
```

### Volume Mounts for Persistence

To persist user-generated data:

```bash
# Edit update-docker.sh and add volume mounts to the docker run command
-v /var/lib/aoe2-civbuilder/staging/mods:/app/modding/requested_mods \
-v /var/lib/aoe2-civbuilder/staging/data:/app/database.json
```

## Integration with CI/CD

The deployment system is designed to work seamlessly with the existing GitHub Actions workflows:

1. **Release Please**: Creates releases automatically from conventional commits
2. **Docker Build**: Builds and pushes Docker images to GHCR
3. **Staging Auto-Deploy**: Cron job picks up new releases automatically
4. **Production Manual-Deploy**: Operators promote tested versions to production

## Support

For issues or questions:
- GitHub Issues: https://github.com/fritz-net/AoE2-Civbuilder/issues
- Check logs: `/var/log/aoe2-civbuilder-*-update.log`
- Review container logs: `docker logs aoe2-civbuilder-staging` or `docker logs aoe2-civbuilder-prod`

## Testing

A test script is provided to verify the deployment scripts work correctly:

```bash
./test-deployment-scripts.sh
```

This will test:
- Script syntax validation
- Help message display
- Dry-run mode execution
- Documentation file presence
- Script executability

The test script does not require Docker or network access and is safe to run in any environment.
