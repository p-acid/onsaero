# Authentication API Contract

**Feature**: Google Social Login (002-google-social-login)
**API Type**: Client-Side (Supabase Auth SDK)
**Date**: 2025-10-13

## Overview

This document defines the authentication API contract for Google OAuth 2.0 authentication in the Onsaero Tasks Chrome extension. The API is provided by the Supabase Auth SDK and includes custom wrapper functions for extension-specific behavior.

---

## Authentication Endpoints

### 1. Sign In with Google

**Function**: `signInWithGoogle()`

**Description**: Initiates Google OAuth 2.0 authentication flow

**Request**:

```typescript
async function signInWithGoogle(): Promise<{
  user: User | null;
  error: AuthError | null
}>
```

**Parameters**: None

**Implementation**:

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: chrome.identity.getRedirectURL(),
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
});

if (error) {
  return { user: null, error };
}

// Open auth URL in new tab
await chrome.tabs.create({ url: data.url });

return { user: null, error: null };
```

**Response**:

```typescript
{
  user: null,  // User will be available after OAuth callback
  error: null | AuthError
}
```

**Success Response** (after OAuth callback):

```typescript
{
  user: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@gmail.com",
    user_metadata: {
      avatar_url: "https://lh3.googleusercontent.com/...",
      full_name: "John Doe",
      email_verified: true
    }
  },
  error: null
}
```

**Error Responses**:

| Error Code | Message | Cause |
|------------|---------|-------|
| `oauth_error` | "OAuth provider error" | Google OAuth rejected request |
| `network_error` | "Network request failed" | No internet connection |
| `popup_closed` | "User closed popup" | User cancelled auth flow |

**Side Effects**:
- Opens new browser tab with Google OAuth consent screen
- Background service worker listens for redirect callback
- Session stored in `chrome.storage.local` on success

**Authorization**: None (public endpoint)

---

### 2. Sign Out

**Function**: `signOut()`

**Description**: Signs out the current user and clears session

**Request**:

```typescript
async function signOut(): Promise<{ error: AuthError | null }>
```

**Parameters**: None

**Implementation**:

```typescript
const { error } = await supabase.auth.signOut();

if (!error) {
  await chrome.storage.local.remove('supabaseSession');
}

return { error };
```

**Success Response**:

```typescript
{
  error: null
}
```

**Error Responses**:

| Error Code | Message | Cause |
|------------|---------|-------|
| `network_error` | "Network request failed" | Cannot reach Supabase server |

**Side Effects**:
- Clears session from Supabase
- Removes session from `chrome.storage.local`
- Triggers `SIGNED_OUT` event in `onAuthStateChange` listeners

**Authorization**: None (any user can sign out)

---

### 3. Get Current User

**Function**: `getCurrentUser()`

**Description**: Retrieves the currently authenticated user

**Request**:

```typescript
async function getCurrentUser(): Promise<User | null>
```

**Parameters**: None

**Implementation**:

```typescript
const { data: { user }, error } = await supabase.auth.getUser();

if (error) {
  console.error('Failed to get user:', error);
  return null;
}

return user;
```

**Success Response**:

```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@gmail.com",
  user_metadata: {
    avatar_url: "https://lh3.googleusercontent.com/...",
    full_name: "John Doe",
    email_verified: true
  }
}
```

**Error Response**: `null` (if not authenticated or error)

**Authorization**: None (returns null if not authenticated)

---

### 4. Get Current Session

**Function**: `getCurrentSession()`

**Description**: Retrieves the current auth session including tokens

**Request**:

```typescript
async function getCurrentSession(): Promise<Session | null>
```

**Parameters**: None

**Implementation**:

```typescript
const { data: { session }, error } = await supabase.auth.getSession();

if (error) {
  console.error('Failed to get session:', error);
  return null;
}

return session;
```

**Success Response**:

```typescript
{
  access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  refresh_token: "v1.MjAtYzQ0...",
  expires_at: 1704067200,
  user: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@gmail.com",
    user_metadata: {
      avatar_url: "https://lh3.googleusercontent.com/...",
      full_name: "John Doe",
      email_verified: true
    }
  }
}
```

**Error Response**: `null` (if not authenticated or error)

**Authorization**: None (returns null if not authenticated)

**Use Cases**:
- Check if user is authenticated
- Get access token for API requests
- Validate session before making protected API calls

---

### 5. Refresh Session

**Function**: `refreshSession()`

**Description**: Manually refreshes the access token using the refresh token

**Request**:

```typescript
async function refreshSession(): Promise<{
  session: Session | null;
  error: AuthError | null
}>
```

**Parameters**: None

**Implementation**:

```typescript
const { data: { session }, error } = await supabase.auth.refreshSession();

if (!error && session) {
  await chrome.storage.local.set({ supabaseSession: session });
}

return { session, error };
```

**Success Response**:

```typescript
{
  session: {
    access_token: "new_token...",
    refresh_token: "same_refresh_token...",
    expires_at: 1704070800,
    user: { /* user object */ }
  },
  error: null
}
```

**Error Responses**:

| Error Code | Message | Cause |
|------------|---------|-------|
| `invalid_grant` | "Invalid refresh token" | Refresh token expired or revoked |
| `network_error` | "Network request failed" | Cannot reach Supabase server |

**Side Effects**:
- Updates session in Supabase
- Updates session in `chrome.storage.local`
- Triggers `TOKEN_REFRESHED` event in `onAuthStateChange` listeners

**Authorization**: Requires valid refresh token

**Note**: Supabase automatically refreshes tokens when they expire. Manual refresh is rarely needed.

---

### 6. Set Session (OAuth Callback)

**Function**: `setSession()`

**Description**: Sets the session after OAuth callback (used by background service worker)

**Request**:

```typescript
async function setSession(params: {
  access_token: string;
  refresh_token: string;
}): Promise<{
  session: Session | null;
  error: AuthError | null
}>
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `access_token` | string | Yes | JWT access token from OAuth callback |
| `refresh_token` | string | Yes | Refresh token from OAuth callback |

**Implementation**:

```typescript
const { data: { session }, error } = await supabase.auth.setSession({
  access_token: params.access_token,
  refresh_token: params.refresh_token,
});

if (!error && session) {
  await chrome.storage.local.set({ supabaseSession: session });
}

return { session, error };
```

**Success Response**:

```typescript
{
  session: {
    access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    refresh_token: "v1.MjAtYzQ0...",
    expires_at: 1704067200,
    user: { /* user object */ }
  },
  error: null
}
```

**Error Responses**:

| Error Code | Message | Cause |
|------------|---------|-------|
| `invalid_token` | "Invalid access token" | Token is malformed or expired |
| `network_error` | "Network request failed" | Cannot reach Supabase server |

**Side Effects**:
- Sets session in Supabase client
- Stores session in `chrome.storage.local`
- Triggers `SIGNED_IN` event in `onAuthStateChange` listeners

**Authorization**: None (public - called by background service worker)

---

## Event Listeners

### Auth State Change

**Function**: `onAuthStateChange()`

**Description**: Subscribes to authentication state changes

**Request**:

```typescript
function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): { data: { subscription: Subscription } }
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `callback` | Function | Yes | Called when auth state changes |

**Implementation**:

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log('Auth event:', event);

    switch (event) {
      case 'SIGNED_IN':
        // Handle sign in
        break;
      case 'SIGNED_OUT':
        // Handle sign out
        break;
      case 'TOKEN_REFRESHED':
        // Handle token refresh
        break;
      case 'USER_UPDATED':
        // Handle user profile update
        break;
    }
  }
);

// Cleanup
subscription.unsubscribe();
```

**Events**:

| Event | Description | Session |
|-------|-------------|---------|
| `SIGNED_IN` | User successfully signed in | Present |
| `SIGNED_OUT` | User signed out | null |
| `TOKEN_REFRESHED` | Access token refreshed | Present |
| `USER_UPDATED` | User profile updated | Present |
| `PASSWORD_RECOVERY` | Password recovery initiated | null |

**Use Cases**:
- Update UI when user signs in/out
- Sync auth state across extension contexts
- Store session in chrome.storage when tokens refresh

---

## Data Transfer Objects (DTOs)

### User

```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // Email address
  user_metadata: {
    avatar_url?: string;         // Google profile picture URL
    full_name?: string;          // User's full name
    email_verified?: boolean;    // Email verification status
  };
}
```

### Session

```typescript
interface Session {
  access_token: string;          // JWT access token (1 hour expiry)
  refresh_token: string;         // Refresh token (30 days expiry)
  expires_at: number;            // Unix timestamp of access token expiry
  user: User;                    // User object
}
```

### AuthError

```typescript
interface AuthError {
  message: string;               // Human-readable error message
  status?: number;               // HTTP status code
}
```

### AuthChangeEvent

```typescript
type AuthChangeEvent =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';
```

---

## Error Handling

### Error Types

| Error Type | HTTP Status | Retry? | User Action |
|------------|-------------|--------|-------------|
| `network_error` | - | Yes | Check internet connection |
| `oauth_error` | 400 | No | Contact support |
| `popup_closed` | - | Yes | Try again |
| `invalid_token` | 401 | No | Sign in again |
| `invalid_grant` | 401 | No | Sign in again |

### Error Response Format

```typescript
{
  error: {
    message: "Human-readable error message",
    status: 400  // HTTP status code (if applicable)
  }
}
```

---

## Rate Limiting

**Supabase Auth Rate Limits**:
- Sign-in attempts: 100 requests per hour per IP
- Token refresh: 1000 requests per hour per user

**Extension Behavior**:
- Implement exponential backoff on failures
- Don't retry OAuth errors (user must take action)
- Cache session to minimize token refresh calls

---

## Security Considerations

### Token Storage

- ✅ Store tokens in `chrome.storage.local` (encrypted by Chrome)
- ❌ Do NOT store tokens in `localStorage` (accessible to content scripts)
- ✅ Clear tokens immediately on sign-out
- ✅ Validate token expiry before use

### OAuth Flow

- ✅ Use PKCE flow (enabled in Supabase config)
- ✅ Validate redirect URL matches `chrome.identity.getRedirectURL()`
- ✅ Include `state` parameter for CSRF protection (Supabase handles automatically)
- ✅ Request only necessary scopes (`openid`, `email`, `profile`)

### Session Management

- ✅ Automatically refresh tokens before expiry
- ✅ Invalidate session on sign-out
- ✅ Handle token refresh failures gracefully
- ✅ Monitor auth state changes across extension contexts

---

## Usage Examples

### Example 1: Sign In Flow

```typescript
// UI Component
async function handleSignIn() {
  const { error } = await signInWithGoogle();

  if (error) {
    console.error('Sign in failed:', error.message);
    alert('Sign in failed. Please try again.');
  }

  // OAuth flow continues in background service worker
}
```

### Example 2: Check Auth State

```typescript
// On extension load
async function initializeAuth() {
  const user = await getCurrentUser();

  if (user) {
    console.log('User is signed in:', user.email);
    // Load user-specific data
  } else {
    console.log('User is not signed in');
    // Show sign-in UI
  }
}
```

### Example 3: Listen for Auth Changes

```typescript
// Background service worker
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    console.log('User signed in:', session.user.email);
    await chrome.storage.local.set({ supabaseSession: session });
  }

  if (event === 'SIGNED_OUT') {
    console.log('User signed out');
    await chrome.storage.local.remove('supabaseSession');
  }
});
```

### Example 4: Protected API Call

```typescript
// Make API call with auth token
async function createTask(text: string) {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error('User not authenticated');
  }

  // Supabase automatically includes auth token in request
  const { data, error } = await supabase
    .from('tasks')
    .insert({ text, user_id: session.user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

---

## Testing

### Test Cases

1. **Sign In Success**
   - User clicks "Sign in with Google"
   - OAuth consent screen appears
   - User authorizes app
   - Extension receives tokens
   - Session stored in chrome.storage.local
   - User profile displayed

2. **Sign In Cancelled**
   - User clicks "Sign in with Google"
   - OAuth consent screen appears
   - User closes tab
   - Error handled gracefully
   - No session created

3. **Sign Out Success**
   - User clicks "Sign out"
   - Session cleared from Supabase
   - Session cleared from chrome.storage.local
   - UI updates to signed-out state

4. **Token Refresh**
   - Access token expires after 1 hour
   - Supabase automatically refreshes token
   - New session stored in chrome.storage.local
   - No user interruption

5. **Session Persistence**
   - User signs in
   - User closes browser
   - User reopens browser
   - Session restored from chrome.storage.local
   - User remains signed in

---

## Contract Version

**Version**: 1.0.0
**Last Updated**: 2025-10-13
**Breaking Changes**: None (initial version)
