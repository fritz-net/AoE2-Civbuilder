# Custom UU Disable Flags

This document describes environment variable flags that can be used to disable custom unique units (UU) in the AoE2 Civbuilder.

## Environment Variables

### Backend (server.js)

- **`DISABLE_CUSTOM_UU_BUILD`**: When set to `'true'`, disables custom unique units in the build/create mod endpoint.
  - Applies to: `/create` endpoint
  - Effect: Rejects any mod creation requests that include custom UU data with HTTP 403 status
  - Default: Not set (custom UU allowed)

- **`DISABLE_CUSTOM_UU_DRAFT`**: When set to `'true'`, disables custom unique unit designer mode in draft sessions.
  - Applies to: `/draft` endpoint
  - Effect: Forces `custom_uu_mode` to `false` regardless of client request
  - Default: Not set (custom UU mode allowed)

### Frontend (Nuxt)

- **`NUXT_PUBLIC_DISABLE_CUSTOM_UU_BUILD`**: When set to `'true'`, hides the custom UU toggle in the build page.
  - Applies to: `/v2/build` page (CivBuilder component)
  - Effect: Hides the "Use Custom Unique Unit Designer" checkbox
  - Default: Not set (toggle visible)

- **`NUXT_PUBLIC_DISABLE_CUSTOM_UU_DRAFT`**: When set to `'true'`, hides the custom UU mode option in draft creation.
  - Applies to: `/v2/draft/create` page
  - Effect: Hides the "Enable Custom UU Designer Mode" checkbox
  - Default: Not set (checkbox visible)

## Usage Examples

### Development (local)

```bash
# Disable custom UU in build mode only
DISABLE_CUSTOM_UU_BUILD=true NUXT_PUBLIC_DISABLE_CUSTOM_UU_BUILD=true npm start

# Disable custom UU in draft mode only
DISABLE_CUSTOM_UU_DRAFT=true NUXT_PUBLIC_DISABLE_CUSTOM_UU_DRAFT=true npm start

# Disable custom UU in both modes
DISABLE_CUSTOM_UU_BUILD=true DISABLE_CUSTOM_UU_DRAFT=true \
NUXT_PUBLIC_DISABLE_CUSTOM_UU_BUILD=true NUXT_PUBLIC_DISABLE_CUSTOM_UU_DRAFT=true \
npm start
```

### Production (Docker)

Add to your Docker environment or docker-compose.yml:

```yaml
environment:
  - DISABLE_CUSTOM_UU_BUILD=true
  - DISABLE_CUSTOM_UU_DRAFT=true
  - NUXT_PUBLIC_DISABLE_CUSTOM_UU_BUILD=true
  - NUXT_PUBLIC_DISABLE_CUSTOM_UU_DRAFT=true
```

### Production (systemd)

Add to your systemd service file:

```ini
[Service]
Environment="DISABLE_CUSTOM_UU_BUILD=true"
Environment="DISABLE_CUSTOM_UU_DRAFT=true"
Environment="NUXT_PUBLIC_DISABLE_CUSTOM_UU_BUILD=true"
Environment="NUXT_PUBLIC_DISABLE_CUSTOM_UU_DRAFT=true"
```

## Security Considerations

- **Backend validation is mandatory**: The backend always validates and enforces these flags regardless of frontend state
- Frontend flags provide better UX by hiding disabled features, but security is enforced server-side
- Attempting to bypass frontend restrictions (e.g., via API calls) will result in 403 errors when flags are enabled

## Testing

Run the test suite to verify the flags work correctly:

```bash
npm test -- __tests__/customUUDisableFlags.test.js
```

The test suite verifies:
- Environment variables are properly defined in configuration files
- Frontend components check and respect the flags
- Backend middleware validates and rejects custom UU when disabled
- Draft creation respects the flag and forces custom_uu_mode to false
