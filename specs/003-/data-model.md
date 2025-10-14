# Data Model: Authentication Gate

**Feature**: Authentication Gate for Main Service
**Date**: 2025-10-13
**Status**: Phase 1 Complete

## Overview

This document defines the data entities, types, and state management for the authentication gate feature. Most authentication data is managed by Supabase Auth backend; this model focuses on client-side state representation.

---

## Entities

### 1. Authentication Session

**Purpose**: Represents the user's authenticated state on the client

**Source**: Supabase Auth session object

**Attributes**:
- `access_token`: string - JWT token for API authentication
- `refresh_token`: string - Token for session renewal
- `expires_at`: number - Unix timestamp of session expiration
- `expires_in`: number - Seconds until expiration
- `token_type`: 'bearer' - OAuth2 token type
- `user`: User object - Associated user data

**Lifecycle**:
- Created: On successful login (Google OAuth or email/password)
- Updated: On token refresh (automatic via Supabase SDK)
- Invalidated: On logout, session expiration, or server-side revocation
- Persisted: HTTP-only secure cookie (backend), Zustand store (client memory)

**Validation Rules**:
- Session must have non-expired `expires_at`
- User object must be present and valid
- Tokens are opaque strings, validated server-side only

**State Transitions**:
```
[No Session] → [Login] → [Active Session]
[Active Session] → [Token Refresh] → [Active Session]
[Active Session] → [Expiration/Logout] → [No Session]
[Active Session] → [Server Revocation] → [No Session]
```

---

### 2. User Profile

**Purpose**: User identity and profile information

**Source**: Supabase Auth user object

**Attributes**:
- `id`: string (UUID) - Unique user identifier
- `email`: string - User email address
- `user_metadata`: object - Profile data (name, avatar, etc.)
- `created_at`: string (ISO 8601) - Account creation timestamp
- `last_sign_in_at`: string (ISO 8601) - Most recent login

**Relationships**:
- Belongs to: Authentication Session (1:1)
- Referenced by: Tasks, Metrics (existing entities, not in scope)

**Validation Rules**:
- ID must be valid UUID format
- Email must be present (enforced by Supabase)
- Timestamps must be valid ISO 8601 strings

---

### 3. Route Configuration

**Purpose**: Defines public vs protected routes and their access rules

**Source**: Application code (not persisted)

**Attributes**:
- `path`: string - URL path pattern (e.g., '/dashboard', '/*')
- `accessLevel`: 'public' | 'protected' - Route access requirement
- `redirectTo`: string - Redirect destination for unauthorized access
- `element`: ReactElement - Component to render
- `loader`: function (optional) - Data loading function (React Router)

**Examples**:
```typescript
{
  path: '/',
  accessLevel: 'public',
  element: <Landing />
}

{
  path: '/login',
  accessLevel: 'public',
  element: <Login />
}

{
  path: '/tasks',
  accessLevel: 'protected',
  redirectTo: '/login',
  element: <NewTab />
}
```

**Validation Rules**:
- Public routes: '/', '/login' (from spec clarification)
- Protected routes: All other paths
- Redirect must point to public route

---

### 4. Auth State Sync Message

**Purpose**: Cross-tab communication for auth state changes

**Source**: BroadcastChannel or localStorage event

**Attributes**:
- `type`: 'AUTH_STATE_CHANGE' - Message type identifier
- `sessionId`: string | null - Current session ID (null if logged out)
- `timestamp`: number - Unix timestamp of change
- `action`: 'login' | 'logout' | 'refresh' - Type of auth change

**Lifecycle**:
- Created: On auth state change in any tab
- Broadcast: Via BroadcastChannel (or localStorage)
- Consumed: By all other open tabs
- Ephemeral: Not persisted, exists only during broadcast

**Validation Rules**:
- Type must be 'AUTH_STATE_CHANGE'
- Timestamp must be within 10 seconds of current time (prevent replay attacks)
- Action must be valid enum value

---

## TypeScript Type Definitions

```typescript
// src/lib/types.ts additions

import type { Session, User } from '@supabase/supabase-js'

/**
 * Authentication state for Zustand store
 */
export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: Error | null
  isAuthenticated: boolean
}

/**
 * Authentication actions for Zustand store
 */
export interface AuthActions {
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  setSession: (session: Session | null) => void
  setError: (error: Error | null) => void
  broadcastAuthChange: (action: AuthChangeAction) => void
}

/**
 * Route access level
 */
export type RouteAccessLevel = 'public' | 'protected'

/**
 * Route configuration
 */
export interface RouteConfig {
  path: string
  accessLevel: RouteAccessLevel
  redirectTo?: string
  element: React.ReactElement
  loader?: () => Promise<unknown>
  children?: RouteConfig[]
}

/**
 * Auth sync message for cross-tab communication
 */
export interface AuthSyncMessage {
  type: 'AUTH_STATE_CHANGE'
  sessionId: string | null
  timestamp: number
  action: AuthChangeAction
}

/**
 * Auth change action types
 */
export type AuthChangeAction = 'login' | 'logout' | 'refresh' | 'server_revoke'

/**
 * Protected route props
 */
export interface ProtectedRouteProps {
  children?: React.ReactNode
  redirectTo?: string
  requireAuth?: boolean
  fallback?: React.ReactElement
}

/**
 * Auth guard hook return type
 */
export interface AuthGuardResult {
  isAuthenticated: boolean
  isLoading: boolean
  error: Error | null
  redirectPath: string | null
}
```

---

## State Management

### Zustand Store Extensions

**Current `authStore.ts` structure** (existing):
- `user`: User | null
- `session`: Session | null
- `loading`: boolean
- `error`: Error | null
- `signInWithGoogle()`: OAuth login
- `signOut()`: Logout
- `initialize()`: Load session from Supabase

**Additions for authentication gate**:

```typescript
// New state
isAuthenticated: computed from user !== null

// New actions
broadcastAuthChange(action: AuthChangeAction): void
  - Broadcasts auth state change to other tabs
  - Uses BroadcastChannel or localStorage fallback

subscribeToAuthChanges(callback: (message: AuthSyncMessage) => void): () => void
  - Listens for auth changes from other tabs
  - Returns unsubscribe function
  - Automatically re-initializes on receiving message

// Enhanced actions
signOut() - extended to broadcast logout message
setSession() - extended to broadcast login/refresh message
```

### Persistence Strategy

| Data | Storage Location | Sync Mechanism | TTL |
|------|------------------|----------------|-----|
| Session tokens | HTTP-only cookie | Automatic (browser) | 24 hours (Supabase default) |
| User object | Zustand store (memory) | BroadcastChannel + localStorage | Session lifetime |
| Auth loading state | Zustand store (memory) | Local only | N/A |
| Redirect URL | React Router state | React Router navigation | Navigation lifetime |

**Rationale**:
- Tokens in HTTP-only cookies for XSS protection (FR-012)
- User/session in memory for fast access, synced across tabs (FR-009)
- Loading state local-only (no sync needed, each tab independent)
- Redirect URL in router state for post-login navigation (FR-003)

---

## Data Flow Diagrams

### Login Flow

```
User clicks "Sign in with Google"
  ↓
signInWithGoogle() called in authStore
  ↓
Supabase SDK initiates OAuth flow
  ↓
Redirect to Google OAuth consent
  ↓
Redirect back with auth code
  ↓
Supabase SDK exchanges code for session
  ↓
Session stored in HTTP-only cookie (backend)
Session stored in Zustand store (client)
  ↓
broadcastAuthChange('login') called
  ↓
Other tabs receive AUTH_STATE_CHANGE
  ↓
Other tabs call initialize() to refresh state
  ↓
All tabs now have authenticated user
```

### Logout Flow

```
User clicks "Sign out"
  ↓
signOut() called in authStore
  ↓
broadcastAuthChange('logout') called BEFORE signOut completes
  ↓
Other tabs receive AUTH_STATE_CHANGE message
  ↓
Supabase SDK revokes session (backend)
  ↓
HTTP-only cookie cleared
Zustand store cleared (user = null, session = null)
  ↓
Other tabs call initialize() → session invalid → redirect to login
  ↓
All tabs within 5 seconds redirected to login
```

### Route Guard Flow

```
User navigates to /tasks
  ↓
React Router loader runs
  ↓
Check authStore.isAuthenticated
  ↓
[If false]
  ↓
  Store current path in router state
  ↓
  Return redirect({ to: '/login', state: { from: '/tasks' } })
  ↓
  Router redirects to /login

[If true]
  ↓
  Return null (allow navigation)
  ↓
  Render protected component with <Outlet />
```

### Cross-Tab Sync Flow

```
Tab A: User logs out
  ↓
authStore.signOut() called
  ↓
broadcastChannel.postMessage({
  type: 'AUTH_STATE_CHANGE',
  sessionId: null,
  action: 'logout',
  timestamp: Date.now()
})
  ↓
Tab B: BroadcastChannel listener fires
  ↓
Validate message timestamp (< 10s old)
  ↓
authStore.initialize() called
  ↓
Supabase session check fails (cookie cleared)
  ↓
authStore.user = null
  ↓
Route guard re-evaluates → redirects to /login
  ↓
Tab B: User sees login page
```

---

## Validation & Error Handling

### Session Validation

**Client-side checks**:
1. Session object exists in store
2. User object is not null
3. `expires_at` is in the future

**Server-side checks** (handled by Supabase):
1. JWT signature valid
2. Token not revoked
3. Token not expired server-side

**Error states**:
- `SessionExpiredError`: expires_at in past → redirect to login with "Session expired" message
- `SessionInvalidError`: Supabase API returns 401 → redirect to login, clear store
- `ServiceUnavailableError`: Supabase API unreachable → fail closed, show error page (FR-011)

### Cross-Tab Message Validation

```typescript
function validateAuthSyncMessage(message: unknown): message is AuthSyncMessage {
  if (!message || typeof message !== 'object') return false

  const msg = message as Partial<AuthSyncMessage>

  // Type check
  if (msg.type !== 'AUTH_STATE_CHANGE') return false

  // Timestamp check (prevent replay)
  const now = Date.now()
  if (!msg.timestamp || Math.abs(now - msg.timestamp) > 10000) return false

  // Action check
  const validActions: AuthChangeAction[] = ['login', 'logout', 'refresh', 'server_revoke']
  if (!msg.action || !validActions.includes(msg.action)) return false

  // SessionId check
  if (msg.sessionId !== null && typeof msg.sessionId !== 'string') return false

  return true
}
```

---

## Performance Considerations

### State Access Patterns

- **Read-heavy**: isAuthenticated checked on every route navigation
- **Write-light**: Only on login/logout/refresh (infrequent)
- **Optimization**: Computed `isAuthenticated` property derived from `user !== null` (O(1) check)

### Memory Footprint

- Session object: ~500 bytes (JWT + user metadata)
- User object: ~200 bytes (ID + email + timestamps)
- Total per-tab: <1 KB
- Acceptable for in-memory storage

### Cross-Tab Sync Latency

- BroadcastChannel: <5ms (instant)
- localStorage fallback: 100-500ms (depends on browser event loop)
- Both well under 5-second requirement (FR-009)

---

## Security Notes

### Data Exposure

**Sensitive data**:
- Access token: HTTP-only cookie (not accessible to JavaScript)
- Refresh token: HTTP-only cookie (not accessible to JavaScript)
- User email: Stored in Zustand (acceptable - already displayed in UI)
- User ID: Stored in Zustand (non-sensitive, required for API calls)

**Protection**:
- No tokens in localStorage or sessionStorage
- No tokens in URL params or query strings
- Zustand store cleared on logout
- React DevTools access to store in dev only (production build strips)

### CSRF Protection

Supabase Auth includes CSRF protection via:
- SameSite=Lax cookie attribute (prevents cross-site cookie sending)
- State parameter in OAuth flow (prevents authorization code interception)

No additional CSRF implementation needed.

---

## Summary

Data model covers:
- ✅ Authentication session representation (client + server)
- ✅ User profile structure
- ✅ Route access configuration
- ✅ Cross-tab sync messaging
- ✅ TypeScript type definitions
- ✅ State management extensions
- ✅ Validation rules and error states
- ✅ Security considerations

Ready for Phase 1 contracts generation.
