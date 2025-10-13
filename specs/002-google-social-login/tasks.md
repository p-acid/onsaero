# Implementation Tasks: Google Social Login

**Feature**: Google Social Login (002-google-social-login)
**Branch**: `002-google-social-login`
**Created**: 2025-10-13
**Total Tasks**: 35
**Estimated Duration**: 6-8 hours

## Overview

This document provides a phased, dependency-ordered implementation plan for Google OAuth 2.0 authentication in the Onsaero Tasks Chrome extension. Tasks are organized by user story to enable independent implementation and testing.

**User Stories**:
- **US1 (P1)**: Google Account Sign In - Foundation for authentication
- **US2 (P2)**: User Profile Display - Visual confirmation of signed-in status
- **US3 (P3)**: Task Data User Association - Per-user task lists and synchronization

**Implementation Strategy**: Incremental delivery by user story. Each phase represents a complete, independently testable increment.

---

## Phase 1: Setup & Prerequisites (Infrastructure)

**Goal**: Configure external services and project dependencies required for all user stories.

**Tasks**:

### **T001** [Setup] Configure Google Cloud Console OAuth Client
**Story**: Setup
**File**: External (Google Cloud Console)
**Description**: Create OAuth 2.0 client ID in Google Cloud Console for Chrome extension authentication.
- Go to Google Cloud Console → APIs & Services → Credentials
- Configure OAuth consent screen (External type, app name, support email)
- Add OAuth scopes: `openid`, `userinfo.email`, `userinfo.profile`
- Create OAuth client ID (Web application type)
- Add authorized redirect URI: `https://<project-id>.supabase.co/auth/v1/callback`
- Save Client ID and Client Secret for next task
**Dependencies**: None
**Parallel**: N/A

### **T002** [Setup] Configure Supabase Google OAuth Provider
**Story**: Setup
**File**: External (Supabase Dashboard)
**Description**: Enable and configure Google OAuth provider in Supabase Authentication settings.
- Go to Supabase Dashboard → Authentication → Providers
- Enable Google provider
- Paste Client ID from T001
- Paste Client Secret from T001
- Enable PKCE flow (recommended)
- Navigate to Authentication → URL Configuration
- Set Site URL: `chrome-extension://<extension-id>/popup.html`
- Add redirect URLs: `chrome-extension://<extension-id>/**`, `https://<extension-id>.chromiumapp.org/`
- Save configuration
**Dependencies**: T001
**Parallel**: N/A

### **T003** [Setup] ✅ Create Supabase Database Migration for User Authentication
**Story**: Setup
**File**: `supabase/migrations/<timestamp>_add_user_authentication.sql`
**Description**: Create SQL migration to add user_id columns and RLS policies for authentication.
- Add `user_id UUID` column to `tasks` table (nullable, references `auth.users(id) ON DELETE CASCADE`)
- Add `user_id UUID` column to `daily_metrics` table
- Create indexes: `idx_tasks_user_id`, `idx_daily_metrics_user_date`
- Enable RLS on `tasks` and `daily_metrics` tables
- Create RLS policies for authenticated users (SELECT, INSERT, UPDATE, DELETE)
- Create RLS policies for anonymous users (user_id IS NULL)
- Create `migrate_local_tasks_to_user(p_user_id UUID)` function
- Create `has_local_tasks()` function
- Grant execute permissions to authenticated users
**Dependencies**: T002
**Parallel**: N/A

### **T004** [Setup] ✅ Apply Database Migration to Supabase
**Story**: Setup
**File**: Terminal (Supabase CLI)
**Description**: Push the database migration to Supabase and verify it applied successfully.
- Run `npx supabase db push` from repo root
- Verify migration succeeded with `npx supabase db remote commit`
- Check Supabase Dashboard → Database → Tables to confirm `user_id` columns exist
- Check Database → Policies to confirm RLS policies created
**Dependencies**: T003
**Parallel**: N/A

### **T005** [Setup] ✅ Regenerate TypeScript Database Types
**Story**: Setup
**File**: `src/lib/database.types.ts`
**Description**: Regenerate TypeScript types from updated Supabase schema including new user_id columns.
- Run `npx supabase gen types typescript --local > src/lib/database.types.ts`
- Verify `tasks.Row` includes `user_id: string | null`
- Verify `daily_metrics.Row` includes `user_id: string | null`
- Verify `Functions` includes `migrate_local_tasks_to_user` and `has_local_tasks`
- Run `pnpm run lint` to check for type errors
**Dependencies**: T004
**Parallel**: N/A

### **T006** [Setup] ✅ Update Chrome Extension Manifest Permissions
**Story**: Setup
**File**: `src/manifest.json`
**Description**: Add required permissions for OAuth authentication and session storage.
- Add `"identity"` to permissions array (for `chrome.identity.getRedirectURL()`)
- Add `"tabs"` to permissions array (for tab management during OAuth)
- Verify `"storage"` permission already exists
- Add `"https://*.supabase.co/*"` to host_permissions array
- Verify manifest_version is 3
- Run `pnpm run build` to validate manifest
**Dependencies**: None
**Parallel**: [P] Can run in parallel with T003-T005

---

## Phase 2: Foundational Tasks (Blocking Prerequisites)

**Goal**: Implement core authentication infrastructure that all user stories depend on.

**Checkpoint**: After this phase, authentication foundation is in place. No user stories can be completed without these tasks.

### **T007** [Foundation] ✅ Add Auth Types to TypeScript Definitions
**Story**: Foundation
**File**: `src/lib/types.ts`
**Description**: Add TypeScript interfaces for authentication entities.
- Import `User`, `Session` from `@supabase/supabase-js`
- Create `StoredSession` interface (access_token, refresh_token, expires_at, user subset)
- Create `AuthState` interface for Zustand store (user, session, loading, error, actions)
- Create `AuthMessage` interface for Chrome runtime messages (type, user, session, error)
- Export all new types
- Run `pnpm run build` to verify no type errors
**Dependencies**: T005
**Parallel**: N/A

### **T008** [Foundation] ✅ Create Auth Store with Zustand
**Story**: Foundation
**File**: `src/stores/authStore.ts`
**Description**: Implement authentication state management using Zustand.
- Import Zustand, Supabase client, types from T007
- Create `useAuthStore` with initial state (user: null, session: null, loading: true, error: null)
- Implement `signInWithGoogle()` action: call `supabase.auth.signInWithOAuth()`, open tab with auth URL
- Implement `signOut()` action: call `supabase.auth.signOut()`, clear chrome.storage.local
- Implement `initialize()` action: request session from background script, restore in Supabase
- Add Chrome runtime message listener for auth state changes (AUTH_SUCCESS, AUTH_ERROR, AUTH_STATE_CHANGE)
- Export `useAuthStore`
- Add JSDoc comments for all actions
**Dependencies**: T007
**Parallel**: N/A

### **T009** [Foundation] ✅ Create useAuth Hook
**Story**: Foundation
**File**: `src/hooks/useAuth.ts`
**Description**: Create React hook that wraps auth store and provides convenient auth access.
- Import `useEffect` from React, `useAuthStore` from T008
- Extract all auth state and actions from store
- Call `initialize()` on mount with useEffect
- Return object with: user, session, loading, error, isAuthenticated (computed), signInWithGoogle, signOut
- Add TypeScript return type annotation
- Export `useAuth` as default export
**Dependencies**: T008
**Parallel**: N/A

### **T010** [Foundation] ✅ Implement Background Service Worker OAuth Handler
**Story**: Foundation
**File**: `src/background/service-worker.ts`
**Description**: Create background service worker to handle OAuth callbacks and session persistence.
- Create new file if not exists, or update existing service worker
- Import Supabase client, database types
- Get redirect URL with `chrome.identity.getRedirectURL()`
- Add `chrome.tabs.onUpdated` listener to detect OAuth callback URL
- Parse tokens from URL hash (access_token, refresh_token)
- Call `supabase.auth.setSession()` with tokens
- Store session in `chrome.storage.local.supabaseSession`
- Send `AUTH_SUCCESS` message via `chrome.runtime.sendMessage()`
- Close auth tab with `chrome.tabs.remove()`
- Add `chrome.runtime.onStartup` listener to restore session from storage
- Add `supabase.auth.onAuthStateChange()` listener for SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED events
- Add `chrome.runtime.onMessage` listener to handle `GET_SESSION` requests from popup
- Add error handling for all async operations
**Dependencies**: T008
**Parallel**: N/A

### **T011** [Foundation] ✅ Update Vite Config for Background Script
**Story**: Foundation
**File**: `vite.config.ts`
**Description**: Configure Vite to build background service worker separately.
- Update `build.rollupOptions.input` to include `serviceWorker: 'src/background/service-worker.ts'`
- Verify `@crxjs/vite-plugin` is configured with manifest
- Run `pnpm run build` to verify service worker compiles
- Check `dist/` folder for `service-worker.js` output
**Dependencies**: T010
**Parallel**: N/A

---

## Phase 3: User Story 1 - Google Account Sign In (P1)

**Goal**: Users can sign in with Google account and see authentication state persist across browser sessions.

**Independent Test**: Click "Sign in with Google" button, complete OAuth flow, verify profile displayed, close browser, reopen, verify still signed in, click "Sign out", verify returned to unauthenticated state.

**Acceptance Criteria**:
- ✅ Unauthenticated users see "Sign in with Google" button
- ✅ OAuth flow completes and user profile (name, picture) displays
- ✅ Session persists across browser restarts
- ✅ Sign out button clears session and returns to unauthenticated state

### **T012** [US1] ✅ Create LoginButton Component (Not Authenticated State)
**Story**: US1
**File**: `src/components/auth/LoginButton.tsx`
**Description**: Create login button component for unauthenticated users.
- Import `useAuth` hook from T009
- Destructure `isAuthenticated`, `loading`, `user`, `signInWithGoogle`, `signOut`
- Show loading state while `loading === true`
- When `isAuthenticated === false`: render "Sign in with Google" button
- Button onClick calls `signInWithGoogle()`
- Add proper TypeScript types for component
- Export as default export
**Dependencies**: T009
**Parallel**: N/A

### **T013** [US1] ✅ Add LoginButton Styles with Vanilla Extract
**Story**: US1
**File**: `src/components/auth/LoginButton.css.ts`
**Description**: Style the LoginButton component using Vanilla Extract.
- Import `style` from `@vanilla-extract/css`
- Create button style: primary color, padding, border-radius, hover state
- Create loading state style: opacity, cursor not-allowed
- Create container style for layout
- Export all styles
- Import styles in LoginButton.tsx and apply to elements
**Dependencies**: T012
**Parallel**: [P] Can run in parallel with T014 (different file)

### **T014** [US1] ✅ Extend LoginButton Component (Authenticated State)
**Story**: US1
**File**: `src/components/auth/LoginButton.tsx`
**Description**: Add authenticated state rendering to LoginButton component.
- When `isAuthenticated === true` and `user` exists: render user profile section
- Display user avatar: `<img src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} />`
- Display user name: `<span>{user.user_metadata.full_name}</span>`
- Display "Sign out" button with onClick calling `signOut()`
- Add TypeScript null checks for user_metadata fields
- Handle missing avatar with fallback (initials or default icon)
**Dependencies**: T012
**Parallel**: N/A

### **T015** [US1] ✅ Integrate LoginButton into Main Layout
**Story**: US1
**File**: `src/components/layout/NewTabLayout.tsx` (or main App component)
**Description**: Add LoginButton to the main extension UI.
- Import LoginButton from T014
- Add LoginButton to header/top section of layout
- Position prominently (top-right corner typical for auth buttons)
- Ensure LoginButton is visible on all pages/tabs
- Run `pnpm run dev` and verify button renders
**Dependencies**: T014
**Parallel**: N/A

### **T016** [US1] ✅ Add OAuth Error Handling with Toast Notifications
**Story**: US1
**File**: `src/stores/authStore.ts`
**Description**: Implement error handling for OAuth flow cancellation and network errors.
- In `signInWithGoogle()`: wrap in try-catch, set error state on failure
- In `signOut()`: wrap in try-catch, set error state on failure
- Add error message mapping:
  - `popup_closed` or cancellation → "Sign-in cancelled" (auto-dismiss after 3s)
  - Network errors → "Network error. Check connection and try again." (with retry button)
- Store error type (cancellation vs network) to determine UI treatment
- Update `AuthState` interface to include `errorType?: 'cancellation' | 'network' | 'unknown'`
**Dependencies**: T008
**Parallel**: N/A

### **T017** [US1] ✅ Create ErrorMessage Component for Auth Errors
**Story**: US1
**File**: `src/components/auth/ErrorMessage.tsx`
**Description**: Create component to display authentication error messages.
- Import `useAuth` hook
- Destructure `error`, `errorType`, `signInWithGoogle` from auth store
- If `error && errorType === 'cancellation'`: show auto-dismissing message (3s timeout)
- If `error && errorType === 'network'`: show persistent message with "Retry" button
- Retry button onClick calls `signInWithGoogle()`
- Use `useEffect` with timeout for auto-dismiss
- Clear error on unmount
- Export as default export
**Dependencies**: T016
**Parallel**: [P] Can run in parallel with T018 (different file)

### **T018** [US1] ✅ Add ErrorMessage Styles
**Story**: US1
**File**: `src/components/auth/ErrorMessage.css.ts`
**Description**: Style the ErrorMessage component.
- Create error container style: red/error color, padding, border
- Create cancellation style: lighter background, auto-dismiss visual cue
- Create network error style: prominent with retry button
- Create retry button style: secondary button style
- Export all styles and apply in ErrorMessage.tsx
**Dependencies**: T017
**Parallel**: [P] Can run in parallel with T017 (same story, styling task)

### **T019** [US1] ✅ Integrate ErrorMessage into UI
**Story**: US1
**File**: `src/components/layout/NewTabLayout.tsx`
**Description**: Add ErrorMessage component to layout near LoginButton.
- Import ErrorMessage from T017
- Place below or near LoginButton for contextual error display
- Ensure error message visible but doesn't obstruct main content
- Run `pnpm run dev` and test error scenarios
**Dependencies**: T017, T018
**Parallel**: N/A

### **T020** [US1] ✅ Add Incognito Mode Detection and Handling
**Story**: US1
**File**: `src/background/service-worker.ts`
**Description**: Implement incognito mode detection to skip session persistence.
- Detect incognito context with `chrome.extension.inIncognitoContext`
- In OAuth callback handler: skip `chrome.storage.local.set()` if incognito
- Store session only in memory (Supabase SDK state) for incognito sessions
- Add comment explaining incognito behavior
- No changes needed in UI (incognito users can still sign in, session just doesn't persist)
**Dependencies**: T010
**Parallel**: [P] Can run in parallel with T017-T019 (different file)

**Checkpoint US1**: Users can sign in, see profile, session persists (except incognito), errors handled gracefully. ✅

---

## Phase 4: User Story 2 - User Profile Display (P2)

**Goal**: Display comprehensive user profile information (avatar, name, email) with proper fallback handling.

**Independent Test**: Sign in and verify profile picture, name, and email display correctly. Test with account that has default avatar. Test with network failure on avatar load.

**Acceptance Criteria**:
- ✅ Profile picture displays when user signed in
- ✅ Name and email display on hover or click
- ✅ Default avatars display correctly
- ✅ Fallback avatar shows when image fails to load

### **T021** [US2] Create UserProfile Component
**Story**: US2
**File**: `src/components/auth/UserProfile.tsx`
**Description**: Create dedicated component for displaying full user profile information.
- Import `useAuth` hook
- Destructure `user`, `isAuthenticated` from auth store
- Return null if not authenticated or no user
- Display profile picture in larger size (e.g., 48x48 or 64x64)
- Display full name below/beside avatar
- Display email address below name (smaller, lighter text)
- Add TypeScript types for component props (if accepting display options)
- Export as default export
**Dependencies**: T009
**Parallel**: N/A

### **T022** [US2] Add Avatar Fallback Handling
**Story**: US2
**File**: `src/components/auth/UserProfile.tsx`
**Description**: Implement fallback logic for missing or failed avatar images.
- Add `onError` handler to `<img>` element for avatar
- On error: set local state to show fallback
- Fallback option 1: Display initials from full_name (first letter of first and last name)
- Fallback option 2: Display default avatar icon (user icon SVG)
- Handle case where full_name is missing (use email first letter)
- Add CSS for fallback avatar container (circle, background color, centered text)
**Dependencies**: T021
**Parallel**: N/A

### **T023** [US2] Add UserProfile Styles with Vanilla Extract
**Story**: US2
**File**: `src/components/auth/UserProfile.css.ts`
**Description**: Style the UserProfile component.
- Create profile container style: layout, spacing
- Create avatar style: circular, border, size (48px or 64px)
- Create fallback avatar style: background color, centered text
- Create name style: font size, weight, color
- Create email style: smaller font, lighter color
- Export all styles and apply in UserProfile.tsx
**Dependencies**: T021
**Parallel**: [P] Can run in parallel with T022 (same story, styling task)

### **T024** [US2] Add Hover/Click Interaction for Profile Details
**Story**: US2
**File**: `src/components/auth/UserProfile.tsx`
**Description**: Implement interaction to show full profile details on hover or click.
- Add hover state with `onMouseEnter`/`onMouseLeave` or click with `onClick`
- Show expanded profile card/tooltip with full name, email, and additional metadata
- Position expanded card relative to avatar (dropdown or tooltip)
- Add close button or click-outside handler to dismiss
- Add CSS transitions for smooth show/hide
**Dependencies**: T022, T023
**Parallel**: N/A

### **T025** [US2] Replace LoginButton Avatar with UserProfile Component
**Story**: US2
**File**: `src/components/auth/LoginButton.tsx`
**Description**: Refactor LoginButton to use UserProfile component for richer display.
- Import UserProfile from T024
- In authenticated state: render `<UserProfile />` instead of inline avatar/name
- Keep "Sign out" button separate or integrate into UserProfile dropdown
- Remove inline avatar rendering code (moved to UserProfile)
- Verify TypeScript types are consistent
**Dependencies**: T024
**Parallel**: N/A

**Checkpoint US2**: Profile displays with avatar, name, email. Fallbacks work for failed images. Interactive profile details on hover/click. ✅

---

## Phase 5: User Story 3 - Task Data User Association (P3)

**Goal**: Associate tasks with authenticated users, enable per-user task lists, and provide migration for existing local tasks.

**Independent Test**: Sign in with Account A, create tasks, sign out. Sign in with Account B, verify empty task list (Account A's tasks not visible). Sign in with account that has local tasks, verify migration prompt appears.

**Acceptance Criteria**:
- ✅ First-time sign-in shows empty task list
- ✅ User A's tasks invisible to User B
- ✅ Local tasks trigger migration dialog on first sign-in
- ✅ Migration completes when user confirms
- ✅ Tasks hidden when user signs out

### **T026** [US3] Update Task API to Include user_id
**Story**: US3
**File**: `src/api/tasks.ts`
**Description**: Modify task creation and queries to associate tasks with authenticated users.
- In `createTask()`: get current user with `supabase.auth.getUser()`
- Add `user_id: user?.id || null` to insertData
- Update TypeScript types for task operations (use updated Database types from T005)
- Verify RLS policies automatically filter tasks by user_id (no manual WHERE clause needed)
- Run `pnpm run build` to check for type errors
**Dependencies**: T005, T008
**Parallel**: N/A

### **T027** [US3] Add Migration Functions to Task API
**Story**: US3
**File**: `src/api/tasks.ts`
**Description**: Add functions to check for and migrate local tasks to user account.
- Create `hasLocalTasks()` function: call `supabase.rpc('has_local_tasks')`
- Create `migrateLocalTasksToUser()` function: call `supabase.rpc('migrate_local_tasks_to_user')`
- Return count of migrated tasks from migration function
- Add proper error handling and TypeScript types
- Export both functions
**Dependencies**: T026
**Parallel**: [P] Can run in parallel with T028 (different concern)

### **T028** [US3] Update Task Store to Filter by Auth State
**Story**: US3
**File**: `src/stores/taskStore.ts`
**Description**: Ensure task store respects authentication state and only shows user's tasks.
- Import `useAuthStore` to access auth state
- When fetching tasks: RLS policies automatically filter by user_id (no code change needed)
- When user signs out: clear local task state (listen to auth state changes)
- Add auth state listener to refetch tasks on sign-in/sign-out
- Verify tasks hidden when `isAuthenticated === false` and `user === null`
**Dependencies**: T008, T026
**Parallel**: [P] Can run in parallel with T027 (different file)

### **T029** [US3] Create MigrationDialog Component
**Story**: US3
**File**: `src/components/auth/MigrationDialog.tsx`
**Description**: Create dialog component to prompt user for task migration.
- Import `useState`, `useEffect` from React
- Accept props: `taskCount: number`, `onConfirm: () => void`, `onCancel: () => void`, `isOpen: boolean`
- Render modal/dialog with message: "Migrate your {taskCount} local tasks to your account?"
- Show "Yes" button (calls `onConfirm`) and "No" button (calls `onCancel`)
- Handle loading state during migration
- Show success/error messages after migration attempt
- Add TypeScript props interface
- Export as default export
**Dependencies**: None (UI component)
**Parallel**: [P] Can run in parallel with T027-T028 (different file)

### **T030** [US3] Add MigrationDialog Styles
**Story**: US3
**File**: `src/components/auth/MigrationDialog.css.ts`
**Description**: Style the MigrationDialog component.
- Create modal overlay style: semi-transparent backdrop
- Create dialog container style: centered, white background, rounded corners, shadow
- Create button styles: primary (Yes) and secondary (No)
- Create message style: clear, readable text
- Create loading spinner style
- Export all styles and apply in MigrationDialog.tsx
**Dependencies**: T029
**Parallel**: [P] Can run in parallel with T029 (same story, styling task)

### **T031** [US3] Implement Migration Logic in Auth Store
**Story**: US3
**File**: `src/stores/authStore.ts`
**Description**: Add migration check and trigger logic to auth flow.
- After successful sign-in (in `AUTH_SUCCESS` handler): call `hasLocalTasks()`
- If local tasks exist: set state to show migration dialog (add `showMigrationDialog: boolean` to store)
- Add `confirmMigration()` action: calls `migrateLocalTasksToUser()`, updates state
- Add `cancelMigration()` action: closes dialog without migrating
- Add `migrationInProgress: boolean` state for loading
- Add `migrationError: string | null` state for errors
**Dependencies**: T027, T029
**Parallel**: N/A

### **T032** [US3] Integrate MigrationDialog into Main UI
**Story**: US3
**File**: `src/App.tsx` or main layout component
**Description**: Add MigrationDialog to app and wire up to auth store.
- Import MigrationDialog from T030
- Import auth store, destructure `showMigrationDialog`, `confirmMigration`, `cancelMigration`
- Get local task count (from auth store or pass as prop)
- Render MigrationDialog with `isOpen={showMigrationDialog}`
- Pass `onConfirm={confirmMigration}` and `onCancel={cancelMigration}`
- Run `pnpm run dev` and test migration flow
**Dependencies**: T030, T031
**Parallel**: N/A

### **T033** [US3] Add Account Switching Detection and Warning
**Story**: US3
**File**: `src/stores/authStore.ts`
**Description**: Detect when user attempts to sign in with different account and show warning.
- In `signInWithGoogle()`: check if user is already signed in (`user !== null`)
- If already signed in: show confirmation dialog before proceeding
- Dialog message: "Switching to [new email]. Previous account's tasks will no longer be visible."
- User must confirm to proceed with account switch
- On confirm: clear previous session and continue OAuth flow
- On cancel: abort sign-in attempt
- Add `showAccountSwitchWarning: boolean` and `pendingAccountEmail: string` to state
**Dependencies**: T008
**Parallel**: [P] Can run in parallel with T032 (different concern)

### **T034** [US3] Create AccountSwitchDialog Component
**Story**: US3
**File**: `src/components/auth/AccountSwitchDialog.tsx`
**Description**: Create confirmation dialog for account switching.
- Similar structure to MigrationDialog (T029)
- Accept props: `newEmail: string`, `onConfirm: () => void`, `onCancel: () => void`, `isOpen: boolean`
- Display warning message with new email address
- Show "Continue" and "Cancel" buttons
- Add styles inline or create separate .css.ts file
- Export as default export
**Dependencies**: T033
**Parallel**: N/A

### **T035** [US3] Integrate AccountSwitchDialog into UI
**Story**: US3
**File**: `src/App.tsx` or main layout component
**Description**: Add AccountSwitchDialog and wire up to auth store.
- Import AccountSwitchDialog from T034
- Destructure `showAccountSwitchWarning`, `pendingAccountEmail` from auth store
- Render AccountSwitchDialog with appropriate props
- Wire up confirmation/cancellation handlers to auth store actions
- Test account switching flow: sign in, try to sign in with different account, verify warning appears
**Dependencies**: T034
**Parallel**: N/A

**Checkpoint US3**: Tasks associated with users, migration dialog works, account switching requires confirmation, task data isolation verified. ✅

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Final polish, performance optimizations, and cross-cutting error handling.

### **T036** [Polish] ✅ Add Loading States to All Auth Components
**Story**: Polish
**Files**: `src/components/auth/*.tsx`
**Description**: Ensure all auth components show proper loading states.
- Review LoginButton, UserProfile, MigrationDialog, ErrorMessage
- Add skeleton loaders or spinners during async operations
- Disable buttons during loading to prevent double-clicks
- Add TypeScript loading prop types
- Test loading states by adding artificial delays
**Dependencies**: All auth components (T012-T035)
**Parallel**: N/A

### **T037** [Polish] ✅ Add Analytics/Logging for Auth Events
**Story**: Polish
**File**: `src/background/service-worker.ts`
**Description**: Add logging for authentication events for debugging and analytics.
- Log successful sign-ins with timestamp
- Log sign-outs with timestamp
- Log OAuth errors with error type
- Log token refresh events
- Log migration events (started, completed, cancelled)
- Use `console.log` with `[Auth]` prefix for filtering
- Consider adding to Supabase analytics or external service
**Dependencies**: T010
**Parallel**: [P] Can run in parallel with T036 (different file)

### **T038** [Polish] ✅ Add Biome Linting to All New Files
**Story**: Polish
**Files**: All newly created files
**Description**: Run Biome linter and fix any issues in new auth code.
- Run `pnpm run lint` from repo root
- Fix any linting errors in auth components, stores, hooks
- Run `pnpm run format` to auto-format code
- Commit linting fixes separately if needed
**Dependencies**: All tasks (T001-T037)
**Parallel**: N/A

### **T039** [Polish] Manual End-to-End Testing
**Story**: Polish
**File**: Manual testing
**Description**: Perform comprehensive manual testing of all user stories.
- **US1 Testing**: Sign in, verify OAuth flow, check session persistence, sign out, test error scenarios
- **US2 Testing**: Verify profile display, test avatar fallback, test hover interactions
- **US3 Testing**: Test with multiple accounts, verify task isolation, test migration dialog, test account switching
- **Cross-Browser**: Test in Chrome stable, Chrome Beta
- **Incognito**: Test auth in incognito mode, verify no persistence
- Document any bugs found and file issues
**Dependencies**: All implementation tasks (T001-T037)
**Parallel**: N/A

---

## Dependencies & Execution Order

### Critical Path (Must Complete Sequentially)
1. **Setup Phase** (T001-T006): External configuration and project setup
2. **Foundation Phase** (T007-T011): Core auth infrastructure
3. **US1 Phase** (T012-T020): Basic sign-in functionality
4. **US2 Phase** (T021-T025): Profile display (builds on US1)
5. **US3 Phase** (T026-T035): Task association (builds on US1)
6. **Polish Phase** (T036-T039): Final refinements

### Parallel Execution Opportunities

**Within Setup Phase**:
- T006 can run in parallel with T003-T005 (different contexts)

**Within US1 Phase**:
- T013 (styles) can run in parallel with T014 (logic)
- T017 (ErrorMessage component) can run in parallel with T018 (styles)
- T020 (incognito) can run in parallel with T017-T019 (different concern)

**Within US2 Phase**:
- T023 (styles) can run in parallel with T022 (logic)

**Within US3 Phase**:
- T027 (migration API) can run in parallel with T028 (store update)
- T029 (MigrationDialog) can run in parallel with T027-T028
- T030 (styles) can run in parallel with T029
- T033 (account switch detection) can run in parallel with T032
- T034 (AccountSwitchDialog) can build on T029 pattern

**Within Polish Phase**:
- T036 and T037 can run in parallel (different files/concerns)

### User Story Completion Flow

```
Setup (T001-T006) → Foundation (T007-T011) →
  US1: Sign In (T012-T020) [Testable Increment] →
    US2: Profile Display (T021-T025) [Testable Increment] →
      US3: Task Association (T026-T035) [Testable Increment] →
        Polish (T036-T039) [Final Deliverable]
```

---

## MVP Scope Recommendation

**Minimum Viable Product (MVP)**: Complete through **Phase 3 (US1)** only.

**Rationale**: US1 provides core value (Google authentication) and can be shipped independently. US2 and US3 are enhancements that can follow in subsequent releases.

**MVP Includes**:
- T001-T011 (Setup + Foundation)
- T012-T020 (US1: Sign-in functionality)
- Basic manual testing

**Post-MVP**:
- Phase 4 (US2): Enhanced profile display
- Phase 5 (US3): Task association and migration
- Phase 6 (Polish): Final polish and comprehensive testing

---

## Task Estimates

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Setup | T001-T006 | 45-60 minutes |
| Phase 2: Foundation | T007-T011 | 60-90 minutes |
| Phase 3: US1 | T012-T020 | 90-120 minutes |
| Phase 4: US2 | T021-T025 | 45-60 minutes |
| Phase 5: US3 | T026-T035 | 120-150 minutes |
| Phase 6: Polish | T036-T039 | 30-45 minutes |
| **Total** | **39 tasks** | **6.5-8.5 hours** |

**MVP Total** (Setup + Foundation + US1): **3.25-4.5 hours**

---

## Success Criteria Validation

Each task maps to one or more success criteria from the spec:

- **SC-001** (Sign-in <10s): T012-T020 (US1 OAuth flow)
- **SC-002** (Session persistence 100%): T010, T020 (Background worker, storage)
- **SC-003** (Profile <500ms): T021-T025 (US2 profile display)
- **SC-004** (Token refresh 99.9%): T010 (Background worker auto-refresh)
- **SC-005** (Graceful errors): T016-T019 (Error handling)
- **SC-006** (95% first-attempt success): T001-T006 (Proper setup)
- **SC-007** (100% task isolation): T026-T028, T033-T035 (RLS, account switching)
- **SC-008** (Migration <3s for 1000 tasks): T027, T029-T032 (Migration implementation)

---

## Notes

- **No Tests**: Testing framework not configured. Tasks focus on implementation only. Manual testing in T039.
- **Incremental Delivery**: Each user story phase is independently testable and can be shipped.
- **Type Safety**: All tasks enforce strict TypeScript types per constitution.
- **Parallel Execution**: Look for [P] markers to identify tasks that can run concurrently.
- **File Paths**: All file paths are absolute from repo root for clarity.

**Generated**: 2025-10-13
**Spec Version**: 002-google-social-login
**Ready for**: `/speckit.implement` or manual implementation
