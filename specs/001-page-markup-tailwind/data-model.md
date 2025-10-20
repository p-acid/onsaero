# Data Model: Page Markup with Tailwind CSS and shadcn/ui

**Feature**: 001-page-markup-tailwind
**Date**: 2025-10-20
**Phase**: 1 (Design & Contracts)

## Overview

This feature is **UI/presentation layer only** and does not introduce new data entities or modify existing data models. This document serves to clarify the absence of data modeling requirements and document the existing entities that pages will display.

## Existing Entities (Read-Only)

The enhanced pages will interact with existing entities for display purposes only. No modifications to these entities are part of this feature scope.

### User Entity

**Location**: Managed by Supabase authentication
**Purpose**: Authentication state for protected routes
**Attributes** (read-only for this feature):
- `id`: string (UUID)
- `email`: string
- `user_metadata`: object (profile information)
- `created_at`: timestamp

**Usage in This Feature**:
- Sign-in page: Triggers authentication flow (uses LoginButton component)
- Dashboard page: Displays authenticated user state
- Redirect page: Processes OAuth callback with user session

**No Changes**: This feature does not modify User entity structure or attributes.

### Session Entity

**Location**: Managed by Supabase authentication
**Purpose**: Session state management for authentication
**Attributes** (read-only for this feature):
- `access_token`: string (JWT)
- `refresh_token`: string
- `expires_at`: timestamp
- `user`: User object reference

**Usage in This Feature**:
- Authentication context consumes session state
- Redirect page processes session from OAuth callback
- Dashboard page verifies active session

**No Changes**: This feature does not modify Session entity structure or attributes.

### Task Entity (Future Display Only)

**Location**: To be defined in future features
**Purpose**: Task management data (mentioned in spec but not modified here)
**Status**: OUT OF SCOPE for this feature

**Usage in This Feature**:
- Dashboard page will have placeholder sections for task display
- No actual task data rendering in this phase (markup only)
- Task CRUD operations deferred to future features

**No Changes**: This feature does not define or modify Task entity.

## UI State (Component-Level)

While there are no database entities, some ephemeral UI state exists at the component level:

### Mobile Navigation State

**Type**: Local component state (React useState)
**Scope**: Dashboard page only
**Purpose**: Track mobile nav Sheet open/closed state

**Shape**:
```typescript
type MobileNavState = {
  isOpen: boolean
}
```

**Lifecycle**: Destroyed on component unmount, not persisted

### Theme State (Future)

**Type**: Global app state (future implementation)
**Scope**: All pages
**Purpose**: Track light/dark mode preference
**Status**: OUT OF SCOPE for this feature (mentioned in FR-012 but toggle mechanism deferred)

**Expected Shape** (future):
```typescript
type ThemeState = {
  mode: 'light' | 'dark'
}
```

**Storage**: LocalStorage (future implementation)

## Component Props Interfaces

Since this is a UI feature, the "data model" is primarily TypeScript interfaces for component props:

### LandingPage Props

```typescript
// No props needed - static content page
export const LandingPage = () => { /* ... */ }
```

### SignInPage Props

```typescript
// No props needed - uses AuthContext for state
export const SignInPage = () => { /* ... */ }
```

### DashboardPage Props

```typescript
// No props needed - uses AuthContext for user state
export const DashboardPage = () => { /* ... */ }
```

### RedirectPage Props

```typescript
interface RedirectPageProps {
  // Optional: loading text override (defaults to Korean)
  loadingText?: string
}
```

### Sidebar Props (New Component)

```typescript
interface SidebarProps {
  // Navigation items (future enhancement)
  // For now, hardcoded nav items
}
```

### MobileNav Props (New Component)

```typescript
interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}
```

## Data Flow

Since this is a presentation-only feature, data flow is minimal:

```
Supabase Auth → AuthContext → Pages (read-only display)
```

**Steps**:
1. User authenticates via OAuth (Sign-in page)
2. OAuth provider redirects to Redirect page
3. Redirect page processes session via Supabase SDK
4. Session stored in AuthContext (existing functionality)
5. Dashboard page reads session from AuthContext
6. Dashboard displays user info and placeholder task sections

**No New Data Flows**: All data flow handled by existing auth infrastructure.

## Validation Rules

No validation rules needed—this feature does not accept or process user input beyond existing authentication flows.

## State Transitions

No state machines or complex state transitions. The only state changes are:

**Mobile Navigation**:
- `closed` → `open` (user clicks hamburger menu)
- `open` → `closed` (user clicks X, backdrop, or ESC key)

**Authentication Flow** (existing, not modified):
- `unauthenticated` → `authenticating` → `authenticated` OR `error`

## Summary

This feature is purely presentational and does not require data modeling. All interactions with data entities (User, Session) are read-only through existing authentication infrastructure. The primary "model" consists of TypeScript interfaces for component props, which are minimal due to the static nature of the page markup.

**Key Takeaway**: No database schema changes, no API contracts, no data persistence logic required for this feature.
