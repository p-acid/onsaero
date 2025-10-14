# Implementation Plan: Authentication Gate for Main Service

**Branch**: `003-` | **Date**: 2025-10-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement client-side authentication gate that prevents unauthenticated users from accessing protected routes in the main service. The system will redirect unauthenticated users to the login page, preserve destination URLs for post-login navigation, maintain consistent authentication state across browser tabs (5-second sync), and fail closed when authentication service is unavailable. HTTP-only secure cookies will be used for session storage with XSS protection.

## Technical Context

**Language/Version**: TypeScript 5.9 with strict mode enabled
**Primary Dependencies**: React 19.1, Zustand 5.0 (state management), Supabase JS 2.75 (authentication), TanStack Query 5.90 (data fetching), React Router v6 (routing)
**Storage**: Supabase (PostgreSQL backend), HTTP-only secure cookies for session tokens
**Testing**: Vitest + React Testing Library + MSW (Mock Service Worker)
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge) with cookie and localStorage support
**Project Type**: Web application (frontend single-page application)
**Performance Goals**: <500ms authentication check latency, <2s post-login redirect, 5-second cross-tab sync
**Constraints**: Must work offline-first (existing constraint), XSS protection via HTTP-only cookies, fail-closed security model
**Scale/Scope**: Single-user productivity Chrome extension, ~10-15 routes (existing + new protected routes)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Type Safety First ✅ PASS
- TypeScript strict mode already enabled in project
- All authentication code will use explicit types
- Zustand store types will be strictly typed
- Route guard types will be defined explicitly

### II. Modern Tooling ✅ PASS
- Vite build tool already in use
- SWC for Fast Refresh already configured
- Biome for linting/formatting already configured
- pnpm as package manager already in use
- No new tools required

### III. Component-Driven Architecture ✅ PASS
- Authentication components will follow existing component structure
- Route guards as higher-order components or hooks
- Loading skeletons as reusable components
- Clear prop interfaces for all components

### IV. Fast Feedback Loop ✅ PASS
- HMR will work for all route guard changes
- TypeScript errors will surface immediately
- Biome checks run on save
- No CI/CD changes needed

### V. Build Performance ✅ PASS
- Route guards are lightweight (minimal bundle impact)
- Lazy loading already in use for Dashboard
- Authentication state check optimized for <500ms
- No heavy dependencies added

**Overall Status**: ✅ ALL GATES PASSED - No constitution violations

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
├── components/
│   ├── auth/              # Existing: LoginButton, ErrorMessage
│   ├── guards/            # NEW: ProtectedRoute, AuthGate components
│   └── ui/                # Existing: LoadingSpinner (will reuse)
├── hooks/
│   ├── useAuth.ts         # Existing: Will extend for route guards
│   └── useAuthGuard.ts    # NEW: Route protection hook
├── stores/
│   └── authStore.ts       # Existing: Will extend for cross-tab sync
├── pages/
│   ├── NewTab.tsx         # Existing: Will make protected
│   ├── Dashboard.tsx      # Existing: Will make protected
│   ├── Login.tsx          # NEW: Login page
│   └── Landing.tsx        # NEW: Public landing page
├── lib/
│   ├── types.ts           # Existing: Will add auth types
│   └── router.ts          # NEW: Routing configuration
└── api/
    └── supabase.ts        # Existing: Already has auth methods

tests/                     # TBD: Will be set up in Phase 1
└── [testing structure]
```

**Structure Decision**: This is a web application using the existing single-project structure. The app currently has no routing library - all pages are conditionally rendered within components. This feature will introduce a routing library (React Router v6 recommended) to enable URL-based navigation with authentication guards. New directories: `src/components/guards/` for route protection components, `src/lib/router.ts` for routing configuration.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

N/A - No constitution violations. All gates passed.

---

## Planning Phase Complete

**Status**: ✅ Phase 0 & Phase 1 Complete

### Generated Artifacts

1. **[plan.md](./plan.md)** (this file) - Implementation plan
2. **[research.md](./research.md)** - Technical research and decisions
   - Routing library: React Router v6
   - Testing framework: Vitest + React Testing Library + MSW
   - Cross-tab sync: BroadcastChannel with localStorage fallback
3. **[data-model.md](./data-model.md)** - Data entities and TypeScript types
   - Authentication Session
   - User Profile
   - Route Configuration
   - Auth State Sync Message
4. **[contracts/](./contracts/)** - API contracts (TypeScript interfaces)
   - `auth-store-contract.ts` - Zustand store interface
   - `route-guard-contract.ts` - Route protection interfaces
   - `cross-tab-sync-contract.ts` - Cross-tab sync mechanism
   - `README.md` - Contract documentation
5. **[quickstart.md](./quickstart.md)** - Developer implementation guide
   - 6-hour estimated timeline
   - Step-by-step instructions
   - Code examples and tests

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Routing Library | React Router v6 | Industry standard, mature ecosystem, auth-friendly patterns |
| Testing Framework | Vitest + RTL | Native Vite integration, fast execution, zero config |
| Cross-Tab Sync | BroadcastChannel + localStorage | <5ms latency, universal browser support with fallback |
| Session Storage | HTTP-only cookies | XSS protection, automatic cross-tab sync, Supabase default |
| Loading UX | LoadingSpinner (reuse) | Consistent with existing UI, lightweight |

### Constitution Compliance

✅ All 5 principles validated:
- Type Safety First: Strict TypeScript, explicit types
- Modern Tooling: Vite, SWC, Biome, pnpm (no new tools)
- Component-Driven: Route guards as HOCs, reusable components
- Fast Feedback: HMR works, immediate TS errors
- Build Performance: +15KB bundle (minimal impact)

### Next Steps

Run `/speckit.tasks` to generate implementation tasks from this plan.

**Estimated Implementation Time**: 6 hours (core functionality)

**Ready for Implementation**: ✅ Yes - all unknowns resolved, contracts defined, quickstart ready
