# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite project using React 19 with SWC for Fast Refresh. The project uses a minimal setup with strict TypeScript configuration and Biome for linting and formatting.

## Development Commands

**Note**: This project uses **pnpm** as the package manager. All commands should use `pnpm` instead of `npm`.

- `pnpm run dev` - Start development server with HMR
- `pnpm run build` - Type check and build for production
- `pnpm run lint` - Check code with Biome (linting and formatting)
- `pnpm run lint:fix` - Fix auto-fixable issues with Biome
- `pnpm run format` - Format code with Biome
- `pnpm run preview` - Preview production build locally

## Tech Stack

- **Build Tool**: Vite 7 with `@vitejs/plugin-react-swc`
- **Framework**: React 19.1.1
- **Language**: TypeScript 5.9 with strict mode enabled
- **Linting & Formatting**: Biome 2.2.5
- **Routing**: React Router v6 (with data router API)
- **State Management**: Zustand 5.0
- **Backend**: Supabase (PostgreSQL + Auth)
- **Data Fetching**: TanStack Query 5.90

## TypeScript Configuration

The project uses a composite TypeScript setup:
- `tsconfig.json` - Root config that references app and node configs
- `tsconfig.app.json` - Application code config with strict settings including:
  - `noUnusedLocals` and `noUnusedParameters` enabled
  - `erasableSyntaxOnly` and `noUncheckedSideEffectImports` enabled
  - `verbatimModuleSyntax` for precise import/export handling
- `tsconfig.node.json` - Build tooling configuration

When running `pnpm run build`, TypeScript compiles using the `-b` (build mode) flag which respects the composite project structure.

## Biome Configuration

The project uses Biome (`biome.json`) with:
- Recommended linting rules enabled
- Formatter configured with 2-space indentation, single quotes, and minimal semicolons
- Import organization on save
- Git integration with ignore file support
- `dist` and `node_modules` folders ignored

## Architecture

This is a Chrome extension for task management with the following structure:

### Core Components
- **Entry point**: `src/main.tsx` - Renders the App component with React Router
- **Main component**: `src/App.tsx` - Sets up RouterProvider and initializes auth
- **Pages**: `src/pages/` - Landing, Login, NewTab (tasks), Dashboard
- **Components**: `src/components/` - Reusable UI components and guards
- **Hooks**: `src/hooks/` - Custom hooks for auth, tasks, metrics
- **Stores**: `src/stores/` - Zustand stores (authStore)
- **Global styles**: `src/index.css` and component-specific CSS modules

### Authentication Architecture

The project implements a client-side authentication gate with the following patterns:

1. **Route Protection** (`src/components/guards/ProtectedRoute.tsx`)
   - Wraps protected routes to enforce authentication
   - Shows loading state during auth check (<500ms requirement)
   - Redirects unauthenticated users to `/login` with destination preserved
   - Checks session expiration and provides appropriate error messages
   - Prevents browser history cache for security

2. **Auth Guard Hook** (`src/hooks/useAuthGuard.ts`)
   - Returns `isAuthenticated`, `isLoading`, `error`, `redirectPath`
   - Uses fine-grained Zustand selectors for optimal re-render performance
   - Implements fail-closed security (redirect when uncertain)

3. **Cross-Tab Synchronization** (`src/stores/authStore.ts`)
   - Uses BroadcastChannel API for modern browsers
   - Falls back to localStorage events for Safari < 15.4
   - Syncs auth state changes across tabs within 5 seconds
   - Validates messages to prevent replay attacks (10-second window)

4. **Router Configuration** (`src/lib/router.tsx`)
   - Uses React Router v6 data router API
   - Public routes: `/` (Landing), `/login`
   - Protected routes: `/tasks`, `/dashboard`, `*` (catch-all)
   - Route loaders provide server-side style auth validation

### Key Patterns and Gotchas

- **Authentication initialization**: `useEffect` in App.tsx calls `authStore.initialize()` on mount to load session from Chrome storage
- **Session expiration**: ProtectedRoute checks `session?.expires_at` (Unix timestamp in seconds) and redirects with `reason: 'session_expired'`
- **Post-login redirect**: Router state preserves original destination (`location.state.from`)
- **Broadcast before clear**: Logout broadcasts to other tabs BEFORE clearing state to ensure detection
- **Type safety**: All auth types defined in `src/lib/types.ts` with strict TypeScript
- **Cache prevention**: Protected routes add meta tags to prevent browser history caching

### Performance Considerations

- Auth gate adds ~4-5 KB to bundle (well under <20 KB requirement)
- Auth check completes in <500ms (per spec)
- Fine-grained Zustand selectors prevent unnecessary re-renders
- Lazy loading for Dashboard component

The project uses React 19's createRoot API with StrictMode enabled for development checks.
