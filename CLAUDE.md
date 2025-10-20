# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Turborepo monorepo for the Onsaero project, containing a web application and browser extension that share common code through a shared package. The project uses Supabase for backend services and authentication.

## Commands

### Development
```bash
# Start all apps in development mode
pnpm dev

# Start specific app
pnpm dev --filter=web
pnpm dev --filter=@onsaero/shared

# Develop shared package (run both modules and styles in parallel)
cd packages/shared
pnpm dev:modules  # TypeScript compilation in watch mode
pnpm dev:styles   # Tailwind CSS compilation in watch mode
```

### Building
```bash
# Build all apps and packages
pnpm build

# Build specific workspace
pnpm build --filter=web
pnpm build --filter=@onsaero/shared

# The shared package has separate build steps:
cd packages/shared
pnpm build:modules  # Compile TypeScript to dist/
pnpm build:styles   # Compile Tailwind CSS to dist/index.css
```

### Code Quality
```bash
# Run linter (Biome)
pnpm lint

# Format code with Biome (via lint-staged)
biome check --write <files>

# Type checking
pnpm check-types

# Format with Prettier (alternative)
pnpm format
```

### Supabase Type Generation
```bash
# Generate TypeScript types from Supabase schema
pnpm generate-types:supabase

# Or directly in shared package
cd packages/shared
pnpm generate-types
```

This generates types in `packages/shared/types/supabase.d.ts` from the Supabase project (ID: ygpibnhtogoxroejgatr).

## Architecture

### Monorepo Structure

**Workspaces:**
- `apps/web` - Vite-based React web application
- `apps/extension` - Browser extension with background and new-tab components
- `packages/shared` - Shared library containing components, types, utilities, and pages

**Key Dependencies:**
- Package manager: `pnpm` (v9.0.0 required)
- Build system: Turborepo with task orchestration
- React: v19.1.1 (latest)
- State: Zustand for client state
- Data fetching: TanStack Query (React Query)
- Backend: Supabase (auth + database)
- Routing: React Router v7
- Styling: Tailwind CSS v4 + Radix UI components

### Shared Package (`@onsaero/shared`)

The shared package follows Feature-Sliced Design (FSD) architecture with the following layers:

```
packages/shared/src/
├── entities/       # Business entities
├── pages/          # Full page components (Dashboard, Landing, SignIn)
├── widgets/        # Composite UI blocks
└── shared/         # Shared utilities and infrastructure
    ├── config/     # Configuration constants
    ├── context/    # React contexts (AuthContext)
    ├── hooks/      # Custom React hooks
    ├── lib/        # External library integrations (Supabase client)
    ├── store/      # Zustand stores
    ├── style/      # Global CSS and Tailwind config
    ├── types/      # TypeScript types and Supabase schema
    └── ui/         # Base UI components (shadcn/ui style)
```

**Exports:**
- Default export: `./dist/index.js` (all components, hooks, stores, types)
- Styles: `./dist/index.css` (global styles + Tailwind)

### Web Application (`apps/web`)

Built with Vite + React Router v7. Uses protected/unauthenticated loaders for route-level authentication:

- `protectedLoader` - Ensures user is authenticated before accessing routes
- `unauthenticatedLoader` - Redirects authenticated users away from public pages

**Path Aliases:**
- `@/*` maps to `apps/web/src/*`

### Code Style & Linting

**Biome Configuration:**
- Single quotes for strings (`'string'`)
- Semicolons: ASI mode (semicolons avoided where possible)
- Indentation: 2 spaces
- Tailwind class sorting enabled (via `useSortedClasses` rule)
  - Functions: `clsx`, `cva`, `cn`
  - Attributes: `className`

**Accessibility:**
- SVG title requirement disabled (`noSvgWithoutTitle: off`)

### Git Workflow

**Commit Convention:**
- Conventional Commits enforced via commitlint
- Pre-commit: Runs lint-staged → Biome check with auto-fix
- Commit-msg: Validates commit message format

**Commit Message Format:**
```
type(scope): subject

Examples:
feat: add user authentication
fix(dashboard): resolve data loading issue
chore: update dependencies
```

## Key Integration Points

### Supabase
- Client initialized in `packages/shared/src/shared/lib/`
- Auth context in `packages/shared/src/shared/context/auth-context.tsx`
- Type generation pulls from project ID: `ygpibnhtogoxroejgatr`

### Shared Components
Pages and components from `@onsaero/shared` are imported directly into the web app:
```typescript
import { DashboardPage, SignInPage, LandingPage } from '@onsaero/shared'
```

### State Management
- Global state: Zustand stores in `packages/shared/src/shared/store/`
- Server state: TanStack Query for data fetching
- Auth state: React Context from shared package

### Routing
React Router v7 with loader-based authentication:
- Protected routes use `protectedLoader`
- Public routes use `unauthenticatedLoader`
- Routes defined in `PAGE_ROUTES` constants (shared) and `WEB_PAGE_ROUTES` (web-specific)

## Development Notes

### TypeScript
- Strict mode enabled across all workspaces
- Project references used in `apps/web/tsconfig.json`
- Shared package outputs declarations to `dist/`

### Building Shared Package
The shared package must be built before other apps can consume it in production:
1. `pnpm build:modules` compiles TS → JS with declarations
2. `pnpm build:styles` compiles Tailwind → CSS
3. Web app imports from `./dist/index.js` and `./dist/index.css`

In development, Turbo handles this dependency automatically via `dependsOn: ["^build"]`.

### Workspace Dependencies
Use `workspace:*` protocol for internal dependencies:
```json
{
  "dependencies": {
    "@onsaero/shared": "workspace:*"
  }
}
```
