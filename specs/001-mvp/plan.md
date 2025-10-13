# Implementation Plan: Task Management & Visualization Browser Extension

**Branch**: `001-` | **Date**: 2025-10-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

A Chrome browser extension that replaces the new tab page with a task management interface featuring quick task capture, completion tracking, and visual productivity dashboards. Built with React 19 + Vite + Manifest V3, using Supabase for backend services, vanilla-extract for styling, Zustand for synchronous state, and TanStack Query for async state management. Data syncs across devices via chrome.storage.sync and Supabase. Visualizations powered by Recharts showing weekly and all-time productivity metrics.

## Technical Context

**Language/Version**: TypeScript 5.9+ with strict mode enabled (React 19.1.1)
**Primary Dependencies**:
- Build: Vite 7 + @vitejs/plugin-react-swc + @crxjs/vite-plugin (Manifest V3)
- UI Framework: React 19.1.1
- Styling: vanilla-extract
- State Management: Zustand (sync state), @tanstack/react-query (async state)
- Backend: Supabase (PostgreSQL + Realtime + Auth + Storage)
- Visualization: Recharts
- Storage: chrome.storage.sync + Supabase
- Linting/Formatting: Biome 2.2.5

**Storage**:
- Local: chrome.storage.sync (100KB quota, cross-device sync for Chrome users)
- Backend: Supabase PostgreSQL (tasks, metrics, user preferences)
- Hybrid sync strategy between local storage and Supabase

**Testing**: Vitest (unit/integration), @testing-library/react (component), Playwright (e2e extension testing)

**Target Platform**: Chrome browser extension (Manifest V3, last 2 major versions)

**Project Type**: Browser extension (Chrome new tab replacement)

**Performance Goals**:
- New tab load: <500ms initial render
- Task operations: <100ms UI response
- Dashboard render: <1s with 1000+ tasks
- Real-time sync: <1s cross-tab propagation

**Constraints**:
- chrome.storage.sync 100KB quota limit
- Manifest V3 service worker limitations (no persistent background)
- No inline scripts (CSP compliance)
- Supabase free tier limits (500MB database, 2GB bandwidth/month)

**Scale/Scope**:
- Support 1000+ tasks per user
- 3 main views (task list, completed tasks toggle, dashboard)
- Weekly + all-time metrics visualization
- Single-user focus (no collaboration features in MVP)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Type Safety First ✅ PASS
- TypeScript 5.9+ strict mode enabled (per CLAUDE.md and constitution)
- All strict compiler options active: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noUncheckedSideEffectImports`, `verbatimModuleSyntax`
- vanilla-extract provides type-safe styling
- Zustand and TanStack Query both have excellent TypeScript support

### II. Modern Tooling ✅ PASS
- Vite 7 for build tooling (native ES modules + esbuild)
- SWC for Fast Refresh (via @vitejs/plugin-react-swc)
- Biome 2.2.5 for unified linting/formatting
- No duplicate tooling introduced

### III. Component-Driven Architecture ✅ PASS
- React 19 component-based architecture
- vanilla-extract co-locates styles with components (.css.ts files)
- Clear component structure planned (task list, dashboard, etc.)
- Props will be explicitly typed with TypeScript interfaces

### IV. Fast Feedback Loop ✅ PASS
- Vite HMR for instant updates
- Biome integration for immediate lint/format feedback
- Build errors appear in dev server immediately
- Type checking integrated in build process (`tsc -b && vite build`)

### V. Build Performance ✅ PASS
- Type checking before build (tsc -b)
- Vite tree-shaking for dead code elimination
- Code splitting via React.lazy for dashboard/visualization components
- vanilla-extract generates optimized CSS at build time

**Initial Gate Result: ✅ PASS** - All constitutional principles satisfied. No violations to track.

---

**Post-Design Re-evaluation: ✅ PASS**

After completing Phase 0 (research) and Phase 1 (design), re-checking constitutional compliance:

### I. Type Safety First ✅ MAINTAINED
- All data models defined with strict TypeScript interfaces ([data-model.md](data-model.md))
- Supabase types auto-generated from schema (`supabase gen types typescript`)
- vanilla-extract provides compile-time CSS type safety
- No `any` types in contracts or data layer

### II. Modern Tooling ✅ MAINTAINED
- @crxjs/vite-plugin enables HMR for extension development
- SWC-based Fast Refresh confirmed in research
- Biome configured for unified linting/formatting
- All tooling choices documented in [research.md](research.md)

### III. Component-Driven Architecture ✅ MAINTAINED
- Clear component structure defined: task/, dashboard/, ui/, layout/
- vanilla-extract co-location pattern documented
- Each component will have typed props interfaces
- Separation of concerns: components, stores, api, hooks

### IV. Fast Feedback Loop ✅ MAINTAINED
- HMR via @crxjs/vite-plugin (extension reloads on save)
- TanStack Query devtools for debugging async state
- Zustand devtools middleware available
- Vitest watch mode for instant test feedback

### V. Build Performance ✅ MAINTAINED
- Code splitting strategy documented (React.lazy for dashboard/charts)
- Tree shaking via Vite (removes unused Recharts components)
- vanilla-extract generates static CSS at build time (zero runtime)
- Bundle size optimizations identified in research

**Final Gate Result: ✅ PASS** - All principles upheld through design phase. Architecture aligns with constitution.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
src/
├── components/           # React components
│   ├── task/            # Task-related components (TaskItem, TaskList, TaskInput)
│   ├── dashboard/       # Dashboard components (MetricsCard, Charts)
│   ├── ui/              # Shared UI components (Button, Toggle, EmptyState)
│   └── layout/          # Layout components (NewTabLayout)
├── pages/               # Page-level components
│   └── NewTab.tsx       # Main new tab page
├── stores/              # Zustand stores
│   ├── taskStore.ts     # Task state management
│   └── uiStore.ts       # UI state (toggle visibility, etc.)
├── api/                 # API layer
│   ├── supabase.ts      # Supabase client setup
│   ├── tasks.ts         # Task API functions
│   └── metrics.ts       # Metrics API functions
├── hooks/               # React hooks
│   ├── useTaskQuery.ts  # TanStack Query hooks for tasks
│   ├── useMetrics.ts    # Metrics data hooks
│   └── useSync.ts       # chrome.storage.sync hooks
├── lib/                 # Utilities
│   ├── storage.ts       # chrome.storage.sync utilities
│   ├── types.ts         # Shared TypeScript types
│   └── constants.ts     # Constants
├── styles/              # Global styles and themes
│   ├── theme.css.ts     # vanilla-extract theme
│   └── global.css.ts    # Global styles
├── background/          # Service worker
│   └── service-worker.ts
├── App.tsx              # Root component
├── main.tsx             # Entry point
└── manifest.json        # Manifest V3 configuration

public/                  # Static assets
├── icons/               # Extension icons
└── _locales/            # i18n (if needed)

supabase/                # Supabase configuration
├── migrations/          # SQL migrations
└── seed.sql             # Initial data

tests/
├── unit/                # Unit tests (Vitest)
├── integration/         # Integration tests
└── e2e/                 # E2E tests (Playwright)
```

**Structure Decision**: Chrome extension single-project structure. The `src/` directory contains the extension's new tab page (React SPA), with separate directories for components, state management (Zustand stores), API layer (Supabase + chrome.storage), and styling (vanilla-extract). Background service worker handles extension lifecycle events. Supabase backend defined separately in `supabase/` directory for database schema and migrations.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
