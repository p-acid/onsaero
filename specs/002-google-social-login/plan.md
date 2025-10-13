# Implementation Plan: Google Social Login

**Branch**: `002-google-social-login` | **Date**: 2025-10-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-google-social-login/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement Google OAuth 2.0 authentication for the Onsaero Tasks Chrome extension, enabling users to sign in with their Google account. Tasks will be associated with authenticated users and stored in Supabase database, replacing the current local chrome.storage-only persistence. The implementation will use Supabase Auth's Google OAuth provider integration, providing session management, token refresh, and user profile access.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode with noUnusedLocals, noUnusedParameters, verbatimModuleSyntax)
**Primary Dependencies**: React 19.1.1, @supabase/supabase-js 2.75.0, @tanstack/react-query 5.90.2, Zustand 5.0.8, @crxjs/vite-plugin 2.2.0
**Storage**: Supabase PostgreSQL database + chrome.storage.local (for offline/migration support)
**Testing**: NEEDS CLARIFICATION (no testing framework currently configured)
**Target Platform**: Chrome Extension (Manifest V3), modern Chrome browsers
**Project Type**: Single project (Chrome extension with React frontend)
**Performance Goals**: OAuth sign-in completion <10s, profile data load <500ms, token refresh <2s, task migration <3s for 1000 tasks
**Constraints**: Extension-specific security (CSP policies), no backend server (Supabase BaaS only), offline-capable with sync queue, <200ms UI responsiveness
**Scale/Scope**: Chrome extension with ~15 existing components, ~40 TypeScript files, adding 5-8 new auth-related components and services

**Authentication Architecture**:
- **OAuth Provider**: Google OAuth 2.0 via Supabase Auth (auth.signInWithOAuth)
- **OAuth Flow**: NEEDS CLARIFICATION - Chrome extension OAuth patterns (chrome.identity API vs web OAuth redirect flow in extension context)
- **Session Storage**: Supabase handles tokens in localStorage (extension context), chrome.storage.local for backup/offline
- **User Profile**: Stored in Supabase auth.users table with metadata (profile picture, name, email)
- **Database Schema**: NEEDS CLARIFICATION - New user_id column on tasks table, migration strategy for existing tasks
- **Supabase Configuration**: NEEDS CLARIFICATION - Google OAuth provider setup in Supabase dashboard, redirect URLs for extensions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| **Type Safety First** | ✅ PASS | All auth types will use explicit TypeScript interfaces. Supabase client already typed with Database schema. New entities (User, AuthSession) will have strict types. |
| **Modern Tooling** | ✅ PASS | Using existing stack: React 19, Vite, SWC, Biome, pnpm. Supabase SDK is modern BaaS tooling. No new build tools needed. |
| **Component-Driven Architecture** | ✅ PASS | Auth UI will follow existing component structure: LoginButton, UserProfile, AuthGuard components with typed props. Fits existing src/components/ pattern. |
| **Fast Feedback Loop** | ✅ PASS | HMR works with auth components. Local Supabase emulator available for dev testing. Biome linting on auth code. |
| **Build Performance** | ✅ PASS | Supabase SDK tree-shakeable. Auth components lazy-loadable. No impact on existing build process (tsc -b && vite build). |
| **Dependency Management** | ✅ PASS | @supabase/supabase-js already installed (2.75.0). No additional dependencies needed. Using pnpm as required. |

**Result**: ALL GATES PASSED - Proceeding to Phase 0 research.

---

## Post-Design Constitution Check

*Re-evaluated after Phase 1 (Design & Contracts)*

| Principle | Compliance | Post-Design Notes |
|-----------|------------|-------------------|
| **Type Safety First** | ✅ PASS | All designs include explicit TypeScript interfaces. Auth API uses Supabase typed client. Data model includes generated `database.types.ts`. Storage API uses `StoredSession` interface. No `any` types used. |
| **Modern Tooling** | ✅ PASS | Design leverages existing React 19 + Vite + SWC stack. Supabase SDK is modern, tree-shakeable. No new build tools added. All dependencies already installed. |
| **Component-Driven Architecture** | ✅ PASS | Auth components designed with clear separation: `LoginButton`, `UserProfile`, `AuthGuard`. Each has single responsibility. Auth store (Zustand) manages state independently. Fits existing `src/components/` structure. |
| **Fast Feedback Loop** | ✅ PASS | Background service worker enables HMR for auth components. Local Supabase emulator available for testing. Auth hooks integrate with React devtools. Biome linting applies to all auth code. |
| **Build Performance** | ✅ PASS | Supabase SDK tree-shakes unused auth providers. Auth components lazy-loadable. No impact on existing build pipeline. Background service worker compiled separately. |
| **Dependency Management** | ✅ PASS | Zero new dependencies required. `@supabase/supabase-js` already installed (2.75.0). Chrome APIs are native (no package needed). All using pnpm as required. |

**Result**: ALL GATES PASSED - Design is compliant with constitution.

**Complexity Tracking**: No violations identified. All design decisions align with existing architecture and constitutional principles.

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
│   ├── auth/                 # NEW: Authentication components
│   │   ├── LoginButton.tsx
│   │   ├── UserProfile.tsx
│   │   ├── AuthGuard.tsx
│   │   └── *.css.ts
│   ├── task/                 # EXISTING: Task components (modified for user_id)
│   ├── dashboard/            # EXISTING: Dashboard components
│   ├── layout/               # EXISTING: Layout components
│   └── ui/                   # EXISTING: UI primitives
├── api/
│   ├── supabase.ts           # EXISTING: Supabase client (already has auth helpers)
│   ├── tasks.ts              # MODIFIED: Add user_id to task operations
│   ├── auth.ts               # NEW: Auth service layer
│   └── metrics.ts            # EXISTING: Metrics API
├── stores/
│   ├── taskStore.ts          # MODIFIED: Add auth state awareness
│   └── authStore.ts          # NEW: Authentication state management (Zustand)
├── hooks/
│   ├── useAuth.ts            # NEW: Auth hook for components
│   ├── useTaskQuery.ts       # MODIFIED: Filter by user_id
│   └── ...                   # EXISTING: Other hooks
├── lib/
│   ├── types.ts              # MODIFIED: Add User, AuthSession types
│   ├── database.types.ts     # MODIFIED: Regenerate from Supabase schema
│   └── storage.ts            # MODIFIED: Migration logic for local tasks
└── background/
    └── service-worker.ts     # MODIFIED: Handle auth state changes

supabase/
└── migrations/               # NEW: Database migration for user_id column
    └── YYYYMMDDHHMMSS_add_user_auth.sql

public/
└── manifest.json             # MODIFIED: Add identity permission
```

**Structure Decision**: Single-project Chrome extension. Auth code follows existing component-driven pattern with dedicated `src/components/auth/` directory. Supabase migration in `supabase/migrations/` for database schema changes. No new top-level directories needed.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
