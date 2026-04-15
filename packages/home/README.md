# Home Module

Landing page micro-frontend for the Module Federation demo.

## Port

- **Development**: `http://localhost:3004`

## Exposed Modules

| Alias | File | Description |
|-------|------|-------------|
| `./Home` | `src/Home.tsx` | Standalone landing page component |
| `./StreamingHome` | `src/StreamingHome.tsx` | Suspense-wrapped streaming variant |

## Scripts

```bash
npm run dev        # Start dev server on :3004
npm run build      # Production build
npm run typecheck  # TypeScript check
npm run test       # Run tests via root vitest
```
