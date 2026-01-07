# Quick Start: Hot Reload Development

## Setup

```bash
npm install
cd src/frontend && npm install && cd ../..
npm run dev
```

Access at:
- Frontend: http://localhost:3000/v2
- Backend: http://localhost:4000

## Development Scripts

- `npm run dev` - Full hot reload (Nuxt + server.js + C++ in Docker)
- `npm run dev:server` - Server auto-restart with C++ in Docker
- `npm run dev:server:local` - Server auto-restart with local C++ binaries
- `npm run dev:nuxt` - Nuxt dev server only

## Common Issues

**Canvas/oxc-parser errors**: Run `npm install` without `--ignore-scripts` to build native modules.

**Docker not available**: Use `npm run dev:server:local` for local C++ execution.
