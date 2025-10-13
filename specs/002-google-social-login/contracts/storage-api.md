# Chrome Storage API Contract

**Feature**: Google Social Login (002-google-social-login)
**API Type**: Chrome Extension Storage API
**Date**: 2025-10-13

## Overview

This document defines the Chrome Storage API contract for storing authentication sessions and related data in the Onsaero Tasks Chrome extension. The extension uses `chrome.storage.local` for secure, persistent storage of auth tokens and session data.

---

## Storage Keys

### Session Storage

**Key**: `supabaseSession`

**Description**: Stores the current Supabase authentication session

**Data Structure**:

```typescript
interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
    user_metadata: {
      avatar_url?: string;
      full_name?: string;
      email_verified?: boolean;
    };
  };
}
```

**Example**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "v1.MjAtYzQ0...",
  "expires_at": 1704067200,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@gmail.com",
    "user_metadata": {
      "avatar_url": "https://lh3.googleusercontent.com/...",
      "full_name": "John Doe",
      "email_verified": true
    }
  }
}
```

**Lifecycle**:
- **Created**: On successful OAuth sign-in
- **Updated**: On token refresh
- **Deleted**: On sign-out or session expiry

---

## Storage Operations

### 1. Store Session

**Function**: `storeSession()`

**Description**: Saves the current session to chrome.storage.local

**Request**:

```typescript
async function storeSession(session: Session): Promise<void>
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session` | Session | Yes | Supabase session object |

**Implementation**:

```typescript
await chrome.storage.local.set({
  supabaseSession: {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user: {
      id: session.user.id,
      email: session.user.email,
      user_metadata: session.user.user_metadata,
    },
  },
});
```

**Error Handling**:

```typescript
try {
  await storeSession(session);
} catch (error) {
  console.error('Failed to store session:', error);
  // Session will not persist across browser restarts
}
```

**Storage Quota**: Chrome extension local storage has a quota of ~5MB per extension (more than sufficient for session data)

---

### 2. Retrieve Session

**Function**: `getStoredSession()`

**Description**: Retrieves the stored session from chrome.storage.local

**Request**:

```typescript
async function getStoredSession(): Promise<StoredSession | null>
```

**Parameters**: None

**Implementation**:

```typescript
const result = await chrome.storage.local.get('supabaseSession');

if (!result.supabaseSession) {
  return null;
}

// Validate session is not expired
const session = result.supabaseSession as StoredSession;

if (Date.now() / 1000 > session.expires_at) {
  console.log('Session expired, clearing storage');
  await chrome.storage.local.remove('supabaseSession');
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

**Error Response**: `null` (if no session stored or session expired)

---

### 3. Clear Session

**Function**: `clearStoredSession()`

**Description**: Removes the session from chrome.storage.local

**Request**:

```typescript
async function clearStoredSession(): Promise<void>
```

**Parameters**: None

**Implementation**:

```typescript
await chrome.storage.local.remove('supabaseSession');
```

**Use Cases**:
- User signs out
- Session expired
- User deletes account

---

### 4. Update Session (Token Refresh)

**Function**: `updateStoredSession()`

**Description**: Updates the stored session with new tokens after refresh

**Request**:

```typescript
async function updateStoredSession(session: Session): Promise<void>
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session` | Session | Yes | Updated Supabase session |

**Implementation**:

```typescript
await chrome.storage.local.set({
  supabaseSession: {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user: session.user,
  },
});
```

**Trigger**: `TOKEN_REFRESHED` event from `supabase.auth.onAuthStateChange`

---

## Storage Listeners

### Listen for Session Changes

**Function**: `onSessionStorageChange()`

**Description**: Listens for changes to the stored session (useful for syncing auth state across extension contexts)

**Request**:

```typescript
function onSessionStorageChange(
  callback: (session: StoredSession | null) => void
): void
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `callback` | Function | Yes | Called when session storage changes |

**Implementation**:

```typescript
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.supabaseSession) {
    const newSession = changes.supabaseSession.newValue;
    callback(newSession || null);
  }
});
```

**Use Cases**:
- Sync auth state between popup and background script
- Update UI when user signs in from another extension context
- Detect sign-out from background script

---

## Security Considerations

### Encryption

- ✅ `chrome.storage.local` is encrypted by Chrome browser
- ✅ Data is stored on disk but not accessible to other extensions
- ✅ Data is not synced to Google account (unlike `chrome.storage.sync`)

### Access Control

- ✅ Only accessible by the extension (same extension ID)
- ✅ Not accessible by content scripts (unless explicitly passed)
- ✅ Not accessible by web pages
- ❌ Do NOT use `chrome.storage.sync` for sensitive data (synced across devices)

### Token Validation

Always validate session before use:

```typescript
async function getValidSession(): Promise<StoredSession | null> {
  const session = await getStoredSession();

  if (!session) {
    return null;
  }

  // Check if access token is expired
  const now = Math.floor(Date.now() / 1000);
  if (now >= session.expires_at) {
    console.log('Access token expired, attempting refresh...');
    // Trigger token refresh via Supabase
    return null;
  }

  return session;
}
```

---

## Storage Migration

### Migrating from Old Storage Format

If the extension previously used a different storage format, implement migration logic:

```typescript
async function migrateStorage() {
  const oldData = await chrome.storage.local.get('old_session_key');

  if (oldData.old_session_key) {
    // Transform old format to new format
    const newSession: StoredSession = {
      access_token: oldData.old_session_key.token,
      refresh_token: oldData.old_session_key.refresh,
      expires_at: oldData.old_session_key.expiry,
      user: {
        id: oldData.old_session_key.userId,
        email: oldData.old_session_key.email,
        user_metadata: {},
      },
    };

    // Store in new format
    await storeSession(newSession);

    // Remove old data
    await chrome.storage.local.remove('old_session_key');

    console.log('Storage migrated to new format');
  }
}
```

---

## Storage Quota Management

### Check Storage Usage

```typescript
async function checkStorageUsage(): Promise<{
  bytesInUse: number;
  quota: number;
  percentUsed: number;
}> {
  const bytesInUse = await chrome.storage.local.getBytesInUse();
  const quota = chrome.storage.local.QUOTA_BYTES; // 10MB for local storage

  return {
    bytesInUse,
    quota,
    percentUsed: (bytesInUse / quota) * 100,
  };
}
```

**Expected Usage**:
- Session data: ~1-2 KB
- Well within 10MB quota

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `QUOTA_BYTES quota exceeded` | Storage full | Clear old data, reduce storage usage |
| `Storage access denied` | Extension permissions missing | Add "storage" permission to manifest |
| `Storage corrupted` | Data format invalid | Clear storage, re-authenticate |

### Error Handling Pattern

```typescript
try {
  await storeSession(session);
} catch (error) {
  if (error.message?.includes('quota exceeded')) {
    console.error('Storage quota exceeded');
    // Clear old data or notify user
  } else {
    console.error('Storage error:', error);
  }
}
```

---

## Testing

### Test Cases

1. **Store Session Success**
   - Call `storeSession()` with valid session
   - Verify session stored in `chrome.storage.local`
   - Verify session can be retrieved with `getStoredSession()`

2. **Retrieve Session Success**
   - Store session
   - Call `getStoredSession()`
   - Verify returned session matches stored session

3. **Clear Session Success**
   - Store session
   - Call `clearStoredSession()`
   - Verify `getStoredSession()` returns null

4. **Session Expiry Handling**
   - Store session with `expires_at` in the past
   - Call `getStoredSession()`
   - Verify returns null (expired session cleared)

5. **Token Refresh Updates Storage**
   - Store session
   - Trigger token refresh
   - Call `updateStoredSession()` with new tokens
   - Verify new tokens stored correctly

6. **Cross-Context Sync**
   - Store session in background script
   - Listen for changes in popup
   - Verify popup receives session update

---

## Usage Examples

### Example 1: Persist Session on Sign-In

```typescript
// Background service worker
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    await storeSession(session);
    console.log('Session stored');
  }
});
```

### Example 2: Restore Session on Extension Load

```typescript
// Popup or background script initialization
async function initializeAuth() {
  const storedSession = await getStoredSession();

  if (storedSession) {
    // Set session in Supabase client
    const { error } = await supabase.auth.setSession({
      access_token: storedSession.access_token,
      refresh_token: storedSession.refresh_token,
    });

    if (error) {
      console.error('Failed to restore session:', error);
      await clearStoredSession();
    } else {
      console.log('Session restored for user:', storedSession.user.email);
    }
  }
}
```

### Example 3: Clear Session on Sign-Out

```typescript
// Sign-out handler
async function handleSignOut() {
  await supabase.auth.signOut();
  await clearStoredSession();
  console.log('Session cleared');
}
```

### Example 4: Listen for Auth State Changes

```typescript
// Sync auth state across popup and background script
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.supabaseSession) {
    const newSession = changes.supabaseSession.newValue;

    if (newSession) {
      console.log('User signed in:', newSession.user.email);
      // Update UI
    } else {
      console.log('User signed out');
      // Update UI
    }
  }
});
```

---

## Contract Version

**Version**: 1.0.0
**Last Updated**: 2025-10-13
**Breaking Changes**: None (initial version)
