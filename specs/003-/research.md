# Research: Authentication Gate Technical Decisions

**Feature**: Authentication Gate for Main Service
**Date**: 2025-10-13
**Status**: Complete

## Overview

This document captures technical research and decisions for implementing the authentication gate feature. Two primary areas required clarification: routing library selection and testing framework choice.

---

## Decision 1: Routing Library

### Context

The application currently has no routing library - pages are conditionally rendered based on state (e.g., view mode toggle between tasks and dashboard). To implement URL-based authentication gates with protected routes, we need a routing solution.

### Options Evaluated

**Option A: React Router v6**
- Industry standard, mature ecosystem
- 15MB bundle size (minified)
- Built-in data loading, error boundaries
- Hooks-based API (useNavigate, useLocation, useParams)
- Strong TypeScript support
- Auth guards via wrapper components or layout routes

**Option B: TanStack Router**
- Modern, type-safe alternative
- Smaller bundle (~8MB minified)
- First-class TypeScript support with path parameter inference
- Built-in search param validation
- Integrates natively with TanStack Query (already in use)
- Auth guards via route context and middleware

**Option C: Wouter**
- Minimalist (2KB bundle)
- Hook-based, similar API to React Router
- No built-in data loading or error boundaries
- Limited TypeScript support
- Manual implementation required for auth guards

### Decision

**Selected**: React Router v6

### Rationale

- **Ecosystem maturity**: React Router is the de facto standard with extensive documentation, community support, and battle-tested patterns for authentication flows
- **Developer familiarity**: Most React developers know React Router, reducing onboarding friction
- **Built-in features**: Error boundaries and loading states align with existing LoadingSpinner and ErrorBoundary components
- **Bundle size acceptable**: 15MB is reasonable for a Chrome extension with authentication requirements
- **TypeScript support**: Strong typing for routes, navigation, and params
- **Auth pattern**: Layout routes and `<Outlet />` provide clean patterns for protected route hierarchies

### Alternatives Considered

- **TanStack Router rejected** because: While technically superior for type safety, it's newer with less established patterns for authentication. The learning curve outweighs benefits for this feature.
- **Wouter rejected** because: Too minimal - would require manual implementation of loading states, error handling, and route guards, duplicating React Router features.

### Implementation Notes

- Use `createBrowserRouter` with data router API for better error handling
- Implement `<ProtectedRoute>` wrapper component using `useAuth` hook
- Store redirect URLs in route state for post-login navigation
- Lazy load routes to maintain performance goals (<500ms)

---

## Decision 2: Testing Framework

### Context

No testing framework currently exists in the project. Given the security-critical nature of authentication gates, automated testing is essential to verify:
- Unauthenticated users are blocked from protected routes
- Authenticated users have seamless access
- Cross-tab session sync works correctly
- Fail-closed behavior when auth service unavailable

### Options Evaluated

**Option A: Vitest + React Testing Library**
- Native Vite integration (zero config)
- Fast execution with parallel tests
- Jest-compatible API (familiar to most developers)
- React Testing Library for component testing
- MSW (Mock Service Worker) for API mocking

**Option B: Jest + React Testing Library**
- Industry standard, mature ecosystem
- Requires additional configuration for Vite + TypeScript
- Slower than Vitest (no native ESM support)
- Same testing paradigms as Vitest

**Option C: Playwright (E2E only)**
- Full browser automation
- Tests real authentication flows
- Slower execution (seconds vs milliseconds)
- More complex setup and maintenance
- Overkill for unit/integration testing

### Decision

**Selected**: Vitest + React Testing Library + MSW

### Rationale

- **Native Vite integration**: Zero configuration overhead, works out-of-the-box with existing build setup
- **Performance**: Vitest's parallel execution and HMR support enable fast feedback loop (aligns with Constitution principle IV)
- **Modern tooling**: Aligns with Constitution principle II (modern tooling prioritization)
- **Testing pyramid**: Enables unit tests (auth hooks), integration tests (route guards), and component tests (protected pages)
- **API mocking**: MSW allows testing fail-closed behavior without hitting real Supabase endpoints
- **TypeScript support**: First-class TypeScript support with type inference for mocks

### Alternatives Considered

- **Jest rejected** because: Requires additional configuration for ESM + Vite, slower execution, doesn't leverage existing Vite infrastructure
- **Playwright rejected** for unit/integration testing because: Too slow for fast feedback loop, better suited as complement for E2E smoke tests (future consideration)

### Implementation Notes

- Add Vitest config extending vite.config.ts
- Use `@testing-library/react` for component rendering
- Use `@testing-library/user-event` for interaction simulation
- MSW for mocking Supabase auth API responses
- Test files co-located with components: `ComponentName.test.tsx`
- Coverage thresholds: 80% for auth-related code

---

## Decision 3: Cross-Tab Sync Mechanism

### Context

Spec requires detecting logout/invalidation within 5 seconds across all browser tabs. HTTP-only cookies automatically sync between tabs, but application state (Zustand store) is isolated per tab.

### Options Evaluated

**Option A: BroadcastChannel API**
- Native browser API, no dependencies
- Direct tab-to-tab communication
- Works only within same origin
- Not supported in Safari < 15.4

**Option B: localStorage events**
- Universal browser support (including older Safari)
- `storage` event fires when localStorage changes in other tabs
- Workaround for same-tab detection (storage events don't fire in originating tab)

**Option C: Polling Supabase session**
- Check `supabase.auth.getSession()` every N seconds
- Guaranteed consistency with backend
- Higher latency, API call overhead

### Decision

**Selected**: Hybrid - BroadcastChannel with localStorage fallback

### Rationale

- **Performance**: BroadcastChannel is instant (<5ms), meets 5-second requirement with margin
- **Compatibility**: localStorage fallback ensures Safari < 15.4 support
- **Reliability**: No dependency on network/API availability for cross-tab sync
- **Implementation**: Simple message protocol: `{type: 'AUTH_STATE_CHANGE', sessionId: string | null}`

### Implementation Notes

- Feature detection: `if ('BroadcastChannel' in window)`
- Fallback to localStorage: write `auth_sync_{timestamp}` key, listen for `storage` event
- Zustand middleware intercepts `signOut` and broadcasts message
- All tabs listen for message, call `initialize()` to re-check session

---

## Additional Technical Notes

### Browser History Protection (FR-008)

**Challenge**: Prevent cached protected content in browser back/forward navigation

**Solution**:
- Set `Cache-Control: no-store, no-cache, must-revalidate` headers on protected routes
- Use React Router's `unstable_usePrompt` to warn on navigation away from protected routes when unauthenticated
- Implement auth check in route loader functions (runs before rendering, even on back/forward navigation)

### Loading State UX (FR-013)

**Decision**: Reuse existing `LoadingSpinner` component from `src/components/ui/`

**Rationale**:
- Consistent UX with existing loading patterns
- Already styled to match application theme
- Lightweight component, no bundle size impact

**Enhancement**: Add skeleton variant to LoadingSpinner for layout preservation during auth check

---

## Dependencies to Add

```bash
pnpm add react-router-dom
pnpm add -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom msw
```

**Bundle Impact Analysis**:
- react-router-dom: +15KB gzipped
- Testing deps: Dev-only, no production impact
- Total production bundle increase: ~15KB (0.5% of typical SPA)

---

## Performance Validation

Based on research and spec requirements:

| Metric | Target | Expected | Validation Method |
|--------|--------|----------|-------------------|
| Auth check latency | <500ms | 50-200ms | Vitest mock timer tests |
| Post-login redirect | <2s | 200-500ms | E2E measurement |
| Cross-tab sync | <5s | <100ms (BC) or 1-2s (localStorage) | Integration test |
| Bundle size impact | Minimal | +15KB | Vite bundle analyzer |

All targets achievable with selected technologies.

---

## Security Considerations

### HTTP-only Cookies (FR-012)

**Backend Requirement**: Supabase Auth already sets HTTP-only cookies by default when using `supabase.auth.signInWithOAuth()` or `signInWithPassword()`. No additional configuration needed.

**Client-side verification**:
- Supabase JS SDK automatically includes cookies in requests
- `supabase.auth.getSession()` validates cookie server-side and returns session
- No manual cookie manipulation required

### XSS Protection

**Mitigation**:
- HTTP-only cookies prevent JavaScript access to session tokens
- React 19 automatic XSS escaping for rendered content
- Supabase SDK handles token refresh securely
- CSP headers recommended (not in scope, but documented for future)

### Fail-Closed Implementation (FR-011)

**Pattern**:
```typescript
// In ProtectedRoute component
if (loading) return <LoadingSpinner />
if (error || !isAuthenticated) return <Navigate to="/login" />
return <Outlet />
```

Default to blocking (redirect to login) on any error state, ensuring fail-closed behavior.

---

## Summary

All technical decisions made with prioritization for:
1. **Security-first**: Fail-closed patterns, HTTP-only cookies, XSS protection
2. **Performance**: Native Vite tooling, minimal bundle impact, <500ms latency
3. **Developer experience**: Standard ecosystem tools, clear testing patterns
4. **Constitution alignment**: Modern tooling, type safety, fast feedback loop

No remaining NEEDS CLARIFICATION items. Ready to proceed to Phase 1 (Design & Contracts).
