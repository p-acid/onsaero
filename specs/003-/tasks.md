# Tasks: Authentication Gate for Main Service

**Input**: Design documents from `/specs/003-/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in spec - tests are OPTIONAL and not included in this task list

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions
- Project structure: Single project (`src/`, root-level)
- Paths assume repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure testing framework

- [x] T001 Install React Router v6 dependency: `pnpm add react-router-dom`
- [x] T002 [P] Install testing dependencies: `pnpm add -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom msw`
- [x] T003 [P] Create Vitest configuration file at `/vitest.config.ts` extending vite config
- [x] T004 [P] Create test setup file at `/src/test/setup.ts` with `@testing-library/jest-dom` import
- [x] T005 [P] Add test scripts to `package.json`: `test`, `test:ui`, `test:coverage`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type definitions and cross-tab sync infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Add TypeScript type definitions to `/src/lib/types.ts`: `AuthState`, `AuthActions`, `RouteAccessLevel`, `RouteConfig`, `AuthSyncMessage`, `AuthChangeAction`, `ProtectedRouteProps`, `AuthGuardResult` (from contracts/)
- [x] T007 Extend `/src/stores/authStore.ts` with computed `isAuthenticated` property (returns `user !== null`)
- [x] T008 Implement message validation function `validateAuthSyncMessage()` in `/src/stores/authStore.ts` with timestamp check (<10 seconds) and action validation
- [x] T009 Implement BroadcastChannel initialization in `/src/stores/authStore.ts` with feature detection and localStorage fallback for Safari < 15.4
- [x] T010 Implement `broadcastAuthChange(action: AuthChangeAction)` method in `/src/stores/authStore.ts` to send messages via BroadcastChannel or localStorage
- [x] T011 Setup BroadcastChannel listener in `/src/stores/authStore.ts` to call `initialize()` when receiving validated auth change messages
- [x] T012 Extend `signOut()` method in `/src/stores/authStore.ts` to call `broadcastAuthChange('logout')` BEFORE clearing state
- [x] T013 Extend `setSession()` method in `/src/stores/authStore.ts` to call `broadcastAuthChange('login')` when session is set

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Redirect Unauthenticated Users to Login (Priority: P1) 🎯 MVP

**Goal**: Block access to protected routes and redirect unauthenticated users to login page, preserving destination URL for post-login redirect

**Independent Test**: Clear session/cookies and attempt to access `/tasks` or `/dashboard`. Success means immediate redirect to `/login` without showing protected content. Login page shows in browser, original URL preserved in router state.

### Implementation for User Story 1

- [x] T014 [P] [US1] Create `useAuthGuard` hook in `/src/hooks/useAuthGuard.ts` that returns `AuthGuardResult` with `isAuthenticated`, `isLoading`, `error`, and `redirectPath` from auth store
- [x] T015 [P] [US1] Create directory `/src/components/guards/` for route protection components
- [x] T016 [US1] Implement `ProtectedRoute` component in `/src/components/guards/ProtectedRoute.tsx` using `useAuthGuard` hook, showing LoadingSpinner during auth check, redirecting with `<Navigate>` if unauthenticated, rendering children/<Outlet> if authenticated
- [x] T017 [US1] Create router configuration file `/src/lib/router.tsx` with protected route definitions for `/tasks` and `/dashboard` wrapped in `<ProtectedRoute>`
- [x] T018 [US1] Use `createBrowserRouter` in `/src/lib/router.tsx` to create router instance with data router API
- [x] T019 [US1] Update `/src/App.tsx` to use `<RouterProvider router={router}>` instead of direct component rendering
- [x] T020 [US1] Add `initialize()` call in `useEffect` in `/src/App.tsx` to load auth state on mount

**Checkpoint**: At this point, unauthenticated users cannot access `/tasks` or `/dashboard` and are redirected to `/login` (which doesn't exist yet - will be created in US4)

---

## Phase 4: User Story 2 - Allow Authenticated Users to Access Main Service (Priority: P1)

**Goal**: Authenticated users can seamlessly access protected routes without repeated login prompts, maintaining session across page refreshes and route transitions

**Independent Test**: Login with valid credentials, then access `/tasks` and `/dashboard`. Success means content loads immediately (<500ms) without additional auth prompts. Refresh page - should stay authenticated. Navigate between routes - no re-authentication.

### Implementation for User Story 2

- [x] T021 [US2] Verify existing `/src/pages/NewTab.tsx` works when wrapped in `<ProtectedRoute>` (no changes needed, already has auth-dependent rendering)
- [x] T022 [US2] Verify existing `/src/pages/Dashboard.tsx` works when wrapped in `<ProtectedRoute>` (no changes needed, lazy loaded)
- [x] T023 [US2] Add auth state validation in route loaders (optional enhancement) - create loader function in `/src/lib/router.tsx` that checks `authStore.getState().session` and throws `redirect('/login')` if null
- [x] T024 [US2] Test authenticated flow: login via existing Google OAuth (already implemented in authStore), verify redirect to protected routes works

**Checkpoint**: At this point, authenticated users can access all protected content without interruption. User Stories 1 AND 2 should both work - unauthenticated blocked, authenticated allowed.

---

## Phase 5: User Story 3 - Graceful Handling of Session Expiration (Priority: P2)

**Goal**: When session expires, redirect user to login with clear "session expired" message and redirect back to original page after re-authentication

**Independent Test**: Simulate session expiration by manually clearing cookies or waiting for timeout. Perform any action - should see "session expired" message and redirect to login. Re-authenticate - should return to original page.

### Implementation for User Story 3

- [x] T025 [US3] Add session expiration check in `ProtectedRoute` component in `/src/components/guards/ProtectedRoute.tsx` - check if `session?.expires_at` is in the past
- [x] T026 [US3] Modify `<Navigate>` call in `ProtectedRoute` to include `reason: 'session_expired'` in router state when session is expired vs. simply not authenticated
- [x] T027 [US3] Update login page (will be created in US4) to check `location.state.reason` and display "Your session has expired. Please log in again." message when reason is `'session_expired'`
- [x] T028 [US3] Verify cross-tab session expiration detection works: when session expires in one tab, other tabs detect within 5 seconds via `initialize()` re-check triggered by BroadcastChannel (already implemented in T011)

**Checkpoint**: Session expiration is now gracefully handled with clear messaging and post-login redirect preservation

---

## Phase 6: User Story 4 - Public Page Access Without Authentication (Priority: P3)

**Goal**: Users can access root landing page (/) and login page without authentication, while all other routes remain protected

**Independent Test**: Without authentication, access `/` and `/login` - should load without redirect. Access any other route - should redirect to login. When authenticated, `/` shows authenticated navigation context.

### Implementation for User Story 4

- [ ] T029 [P] [US4] Create Landing page component in `/src/pages/Landing.tsx` with welcome message, link to tasks (if authenticated) or login (if not)
- [ ] T030 [P] [US4] Create Login page component in `/src/pages/Login.tsx` with Google OAuth button (reuse existing `LoginButton` component), session expiration message display based on `location.state.reason`, post-login redirect using `location.state.from`
- [ ] T031 [US4] Add public route configuration in `/src/lib/router.ts` for path `/` with `<Landing />` element (no `<ProtectedRoute>` wrapper)
- [ ] T032 [US4] Add public route configuration in `/src/lib/router.ts` for path `/login` with `<Login />` element (no `<ProtectedRoute>` wrapper)
- [ ] T033 [US4] Update Landing page to conditionally render authenticated navigation context (user email, link to tasks) when `useAuthStore().isAuthenticated` is true
- [ ] T034 [US4] Verify default route behavior: add catch-all route `path: '*'` that redirects to `/tasks` (protected) so unknown routes trigger auth check

**Checkpoint**: All user stories are now complete. Public pages accessible without auth, protected pages require auth, session expiration handled gracefully, cross-tab sync working.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

- [ ] T035 [P] Add loading skeleton variant to `/src/components/ui/LoadingSpinner.tsx` for better perceived performance during auth checks (optional enhancement per research.md)
- [ ] T036 [P] Add browser history cache prevention headers via route configuration - set `Cache-Control: no-store, no-cache, must-revalidate` for protected routes (can be done via meta tags or in ProtectedRoute component)
- [ ] T037 Run linter and formatter: `pnpm run lint:fix && pnpm run format`
- [ ] T038 Build and verify bundle size: `pnpm run build` and check that authentication gate adds <20KB to dist/ bundle
- [ ] T039 Manual testing checklist from `/specs/003-/quickstart.md` Phase 6.2: test all acceptance scenarios from spec.md
- [ ] T040 [P] Update `CLAUDE.md` documentation if any new patterns or gotchas discovered during implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T005) - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase (T006-T013) completion
  - US1 (Phase 3): Can start after Foundational - No dependencies on other stories
  - US2 (Phase 4): Depends on US1 (T014-T020) for router setup, but can integrate independently
  - US3 (Phase 5): Depends on US1 (T014-T020) for ProtectedRoute, US4 (T030) for Login page message display
  - US4 (Phase 6): Can start after Foundational - Integrates with US1 router but independently testable
- **Polish (Phase 7)**: Depends on all user stories (T014-T034) being complete

### User Story Dependencies

```
Foundational (T006-T013)
  ├─> US1 (T014-T020) [P1] - Route guards & protected routes
  │     ├─> US2 (T021-T024) [P1] - Authenticated access validation
  │     │     └─> US3 (T025-T028) [P2] - Session expiration handling
  │     └─> US4 (T029-T034) [P3] - Public pages
  │           └─> US3 message display (T027)
  └─> Polish (T035-T040)
```

### Within Each User Story

- **US1**: Tasks T014-T015 (hook + directory) can run in parallel, then T016 (component), then T017-T018 (router), then T019-T020 (App update)
- **US2**: All tasks T021-T024 are verification/integration, can run sequentially as validation
- **US3**: Sequential - T025 (expiration check) → T026 (redirect reason) → T027 (message display) → T028 (verification)
- **US4**: Tasks T029-T030 (pages) can run in parallel, then T031-T032 (routes), then T033-T034 (enhancements)

### Parallel Opportunities

**Setup (Phase 1)**:
- T002, T003, T004, T005 can all run in parallel (different files)

**Foundational (Phase 2)**:
- T006 (types) must complete first
- After T006: T007-T013 all modify same file (`authStore.ts`) - MUST be sequential

**User Story 1**:
- T014 (hook) [P] T015 (directory) can run in parallel
- Then T016 (component) sequential
- Then T017 [P] T018 can run together (same file but conceptually separate route definitions)
- Then T019 [P] T020 can run together (both in App.tsx, but could be same commit)

**User Story 4**:
- T029 (Landing) [P] T030 (Login) [P] can run in parallel (different files)
- Then T031 [P] T032 can run together (same file, different routes)

---

## Parallel Example: User Story 1

```bash
# After Foundational phase completes, launch in parallel:
Task T014: "Create useAuthGuard hook in /src/hooks/useAuthGuard.ts"
Task T015: "Create directory /src/components/guards/"

# Once T014-T015 done, do sequential:
Task T016: "Implement ProtectedRoute component"

# Once T016 done, launch in parallel:
Task T017: "Create router configuration"
Task T018: "Use createBrowserRouter"

# Once T017-T018 done:
Task T019: "Update App.tsx with RouterProvider"
Task T020: "Add initialize() call"
```

---

## Parallel Example: User Story 4

```bash
# Launch public page components in parallel:
Task T029: "Create Landing page"
Task T030: "Create Login page"

# Once T029-T030 done, add routes (same file but can be one commit):
Task T031: "Add route for /"
Task T032: "Add route for /login"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

**Why US1 + US2 as MVP**: Both are P1 priority and together form the minimum viable authentication gate - US1 blocks unauthorized access, US2 allows authorized access. This is the core security requirement.

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T013) - CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T014-T020) - Route guards functional
4. Complete Phase 4: User Story 2 (T021-T024) - Authenticated flow validated
5. **STOP and VALIDATE**: Test auth gate works for both scenarios
6. **Problem**: Login page doesn't exist yet - Quick workaround: create minimal `/login` route with just Google OAuth button before MVP validation
7. Deploy/demo MVP

**Note**: For truly minimal MVP, you could implement T030 (Login page) between US1 and US2 to enable end-to-end testing.

### Recommended Full Implementation Order

1. Complete Setup (Phase 1: T001-T005)
2. Complete Foundational (Phase 2: T006-T013) → Foundation ready
3. Implement US4 Login page first (T030 only) → Enables testing
4. Complete US1 (T014-T020) → Auth blocking works
5. Complete US2 (T021-T024) → Auth allowing works
6. **VALIDATE MVP**: Test US1 + US2 work independently
7. Complete US4 remaining (T029, T031-T034) → Public pages complete
8. Complete US3 (T025-T028) → Session expiration handling
9. **VALIDATE ALL**: Test all 4 user stories independently
10. Complete Polish (Phase 7: T035-T040) → Production ready

### Incremental Delivery

1. **Sprint 1**: Setup + Foundational + US4 Login → Can test login flow
2. **Sprint 2**: US1 + US2 → MVP functional (redirect + access)
3. **Sprint 3**: US3 + remaining US4 → Complete feature
4. **Sprint 4**: Polish → Production ready

Each increment is testable and adds value without breaking previous work.

### Parallel Team Strategy

With 2-3 developers after Foundational phase completes:

1. **Team completes Setup + Foundational together** (T001-T013)
2. Once T013 done, split:
   - **Developer A**: US1 (T014-T020) + US2 (T021-T024)
   - **Developer B**: US4 (T029-T034) in parallel
   - **Developer C**: Prepare US3 (T025-T028) after A finishes US1
3. Stories integrate via shared router config and auth store (already built in Foundational)
4. Each developer validates their story independently before merge

---

## Task Count Summary

- **Total Tasks**: 40
- **Setup**: 5 tasks (T001-T005)
- **Foundational**: 8 tasks (T006-T013) - BLOCKING
- **User Story 1 (P1)**: 7 tasks (T014-T020)
- **User Story 2 (P1)**: 4 tasks (T021-T024)
- **User Story 3 (P2)**: 4 tasks (T025-T028)
- **User Story 4 (P3)**: 6 tasks (T029-T034)
- **Polish**: 6 tasks (T035-T040)

**Parallelizable Tasks**: 10 tasks marked [P]

**MVP Scope (US1 + US2)**: 24 tasks (Setup + Foundational + US1 + US2 + T030 for login page)

**Estimated Time**:
- Setup: 30 minutes (from quickstart.md)
- Foundational: 1 hour (cross-tab sync implementation)
- US1: 1.5 hours (route guards)
- US2: 30 minutes (validation)
- US3: 1 hour (session expiration)
- US4: 1 hour (public pages)
- Polish: 1 hour
- **Total**: ~6.5 hours

---

## Notes

- All tasks include exact file paths for clarity
- [P] tasks marked for parallel execution (different files, no dependencies)
- [Story] labels (US1-US4) map tasks to user stories for traceability
- Each user story has clear "Independent Test" criteria for validation
- Foundational phase is CRITICAL - must complete before any user story work
- Tests are NOT included (not explicitly requested in spec, optional per guidelines)
- Manual testing checklist available in `/specs/003-/quickstart.md` Phase 6.2
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow Constitution principles: Type safety, modern tooling, component-driven, fast feedback, build performance
