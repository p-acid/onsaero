# Research: Google OAuth Configuration for Supabase Chrome Extension

**Feature**: Google Social Login (002-google-social-login)
**Research Date**: 2025-10-13
**Status**: Complete

## Executive Summary

This document provides comprehensive step-by-step guidance for configuring Google OAuth provider in Supabase for a Chrome extension. The research covers Supabase dashboard setup, Google Cloud Console configuration, redirect URL patterns specific to Chrome extensions, and common pitfalls.

**Key Finding**: Chrome extensions require a different OAuth flow compared to web applications. While Supabase supports Google OAuth for Chrome extensions, the implementation requires careful attention to redirect URLs, manifest permissions, and the Chrome Identity API.

## 1. Google Cloud Console Setup

### Step 1.1: Create or Select Google Cloud Project

1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID for future reference

### Step 1.2: Configure OAuth Consent Screen

**CRITICAL**: You must configure the consent screen BEFORE creating credentials.

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** user type (for public extensions)
3. Fill in required information:
   - **App name**: Your extension name (e.g., "Onsaero Tasks")
   - **User support email**: Your support email
   - **Developer contact information**: Your email
4. Click **Save and Continue**

### Step 1.3: Add OAuth Scopes

**Required Scopes for Profile and Email**:
- `openid` (manually add if not present)
- `https://www.googleapis.com/auth/userinfo.email` (default)
- `https://www.googleapis.com/auth/userinfo.profile` (default)

**Important**: These basic scopes (email, profile, openid) do NOT require Google's OAuth verification process. If you use only these scopes, your app will not show an "unverified app" warning after initial testing phase.

Steps:
1. In OAuth consent screen configuration, go to **Scopes** section
2. Click **Add or Remove Scopes**
3. Select the three scopes listed above
4. Click **Update** and **Save and Continue**

### Step 1.4: Add Test Users (During Development)

1. In **Test users** section, add Google accounts for testing
2. Click **Add Users** and enter email addresses
3. These users can access your extension before publishing

### Step 1.5: Create OAuth Client ID for Chrome Extension

**IMPORTANT**: For Chrome extensions, you must create a **Web application** OAuth client (NOT Chrome extension type, which is deprecated).

Steps:
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Web application** as the application type
4. Give it a name (e.g., "Onsaero Tasks - Chrome Extension")

**Authorized JavaScript Origins**:
- Add: `chrome-extension://{YOUR_EXTENSION_ID}`
- Replace `{YOUR_EXTENSION_ID}` with your actual extension ID

**Authorized Redirect URIs**:
- Add: `https://{YOUR_PROJECT_ID}.supabase.co/auth/v1/callback`
- Replace `{YOUR_PROJECT_ID}` with your Supabase project ID
- You can find this in your Supabase dashboard URL

5. Click **Create**
6. **SAVE YOUR CLIENT ID AND CLIENT SECRET** - you'll need these for Supabase configuration

### Step 1.6: Finding Your Chrome Extension ID

**Development (unpublished extension)**:
1. Go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Load your unpacked extension
4. Copy the **Extension ID** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

**Production (published extension)**:
- Your extension ID is in the Chrome Web Store URL
- Format: `https://chrome.google.com/webstore/detail/{EXTENSION_ID}`
- The extension ID is the 32-character alphanumeric string

**Best Practice**: Upload your extension to the Chrome Web Store as soon as possible (even as unlisted) to get a stable extension ID. Development IDs change when you reload the extension.

## 2. Supabase Dashboard Configuration

### Step 2.1: Enable Google OAuth Provider

1. Go to your Supabase project dashboard
2. Navigate to **Authentication > Providers**
3. Find **Google** in the provider list
4. Toggle **Enable** to ON

### Step 2.2: Configure Google Provider Settings

In the Google provider configuration screen:

**Client ID (for OAuth)**:
- Paste the Client ID from Google Cloud Console (Step 1.5)
- Format: `{numbers}-{random}.apps.googleusercontent.com`

**Client Secret (for OAuth)**:
- Paste the Client Secret from Google Cloud Console (Step 1.5)

**Authorized Client IDs** (optional):
- Leave empty unless you have additional OAuth clients (Android, iOS)
- If needed, add comma-separated list of client IDs

**Skip nonce check**:
- Leave unchecked (default) for security

**Use PKCE flow**:
- Check this for better security (recommended)

Click **Save** to apply changes.

### Step 2.3: Configure Redirect URLs

This is the MOST CRITICAL step for Chrome extensions.

Navigate to **Authentication > URL Configuration**

**Site URL**:
- Set to your extension's default page
- Format: `chrome-extension://{YOUR_EXTENSION_ID}/index.html`
- Or: `chrome-extension://{YOUR_EXTENSION_ID}/popup.html` (if using popup)
- This is where users land after successful authentication

**Additional Redirect URLs**:
Add the following URLs to the allowlist:

1. **Development Extension ID** (for local testing):
   ```
   chrome-extension://{DEV_EXTENSION_ID}/**
   ```

2. **Production Extension ID** (for published extension):
   ```
   chrome-extension://{PROD_EXTENSION_ID}/**
   ```

3. **Supabase OAuth Callback** (required):
   ```
   https://{YOUR_PROJECT_ID}.supabase.co/auth/v1/callback
   ```

4. **Chrome Identity API Redirect** (if using chrome.identity API):
   ```
   https://{EXTENSION_ID}.chromiumapp.org/
   ```

**Wildcard Support**:
- Use `**` (double asterisk) to match any path: `chrome-extension://{ID}/**`
- Use `*` (single asterisk) to match non-separator characters
- Wildcards are useful for development but use exact URLs in production

**Important Notes**:
- Redirect URLs must match EXACTLY (including trailing slashes)
- Unbundled extensions during development have different IDs than production
- You can add multiple redirect URLs for different environments

## 3. Chrome Extension Manifest Configuration

Your `manifest.json` must include specific permissions for OAuth authentication.

### Required Permissions

```json
{
  "manifest_version": 3,
  "name": "Your Extension Name",
  "version": "1.0.0",
  "permissions": [
    "identity",
    "storage",
    "tabs"
  ],
  "host_permissions": [
    "https://*.supabase.co/*"
  ]
}
```

**Permission Breakdown**:
- `identity`: Required for OAuth flows and Chrome Identity API
- `storage`: For storing auth tokens in `chrome.storage.local`
- `tabs`: For creating new tabs during OAuth flow (optional but recommended)
- `host_permissions`: Allow communication with Supabase backend

### Content Security Policy (Optional)

If you have a strict CSP, ensure it allows connections to Supabase:

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; connect-src https://*.supabase.co"
  }
}
```

## 4. OAuth Redirect URL Patterns for Chrome Extensions

Chrome extensions have unique redirect URL requirements compared to web applications.

### Option A: Chrome Identity API Redirect URL

When using `chrome.identity.getRedirectURL()`:

```javascript
const redirectUrl = chrome.identity.getRedirectURL('supabase-auth');
console.log(redirectUrl);
// Output: https://{EXTENSION_ID}.chromiumapp.org/supabase-auth
```

**Format**: `https://{EXTENSION_ID}.chromiumapp.org/{PATH}`

This is the recommended approach for Chrome extensions as it's specifically designed for extension OAuth flows.

### Option B: Direct Extension URL

For standard OAuth redirect flow:

**Format**: `chrome-extension://{EXTENSION_ID}/{PATH}`

Examples:
- `chrome-extension://abcdefg123456/popup.html`
- `chrome-extension://abcdefg123456/oauth/callback.html`
- `chrome-extension://abcdefg123456/index.html`

### Option C: Supabase Callback URL (Recommended for Supabase)

**Format**: `https://{PROJECT_ID}.supabase.co/auth/v1/callback`

Supabase handles the OAuth flow on their servers and then redirects to your configured Site URL or Additional Redirect URL.

**Best Practice**: Use Supabase's callback URL as the OAuth redirect, then configure your extension URL as the final destination in Supabase's URL Configuration.

## 5. Implementation Approaches

### Approach 1: Supabase signInWithOAuth (Recommended)

Uses Supabase's built-in OAuth handling with redirect flow.

**Pros**:
- Simpler implementation
- Supabase handles token management
- Built-in token refresh
- Session persistence

**Cons**:
- Requires tab-based redirect flow
- User leaves extension popup during auth

**Code Example**:

```typescript
import { supabase } from './api/supabase';

// Initiate OAuth flow
async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: chrome.identity.getRedirectURL('supabase-auth'),
      // Or: redirectTo: `chrome-extension://${chrome.runtime.id}/popup.html`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });

  if (error) {
    console.error('Auth error:', error);
    return;
  }

  // Open OAuth URL in new tab
  if (data?.url) {
    chrome.tabs.create({ url: data.url });
  }
}

// Listen for auth callback (in background script or content script)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url?.startsWith(chrome.identity.getRedirectURL())) {
    // Extract tokens from URL hash
    const hashParams = new URLSearchParams(changeInfo.url.split('#')[1]);
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      // Set session in Supabase
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      // Close auth tab
      chrome.tabs.remove(tabId);
    }
  }
});
```

### Approach 2: Chrome Identity API + Supabase

Uses Chrome's native identity API with manual token handling.

**Pros**:
- Native Chrome extension integration
- No popup window (inline OAuth)
- Better UX for extensions

**Cons**:
- More complex implementation
- Manual token management
- Need to integrate with Supabase manually

**Code Example**:

```typescript
// Use Chrome Identity API
function signInWithChromeIdentity() {
  const manifestData = chrome.runtime.getManifest();
  const clientId = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
  const redirectUrl = chrome.identity.getRedirectURL('oauth2');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('redirect_uri', redirectUrl);
  authUrl.searchParams.set('scope', 'openid profile email');

  chrome.identity.launchWebAuthFlow(
    {
      url: authUrl.toString(),
      interactive: true
    },
    (redirectUrl) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }

      // Extract access token from redirect URL
      const params = new URLSearchParams(redirectUrl.split('#')[1]);
      const accessToken = params.get('access_token');

      // Use token with Supabase or your backend
      // NOTE: This requires additional backend logic to exchange
      // Google token for Supabase session
    }
  );
}
```

### Approach 3: Hybrid (Tab-based OAuth with Session Sync)

Combines Supabase OAuth with Chrome storage synchronization.

**Best for**: Extensions that also have a web app sharing the same Supabase backend.

**Flow**:
1. User clicks "Sign in with Google" in extension
2. Opens new tab with Supabase OAuth flow
3. After authentication, tab closes
4. Extension captures tokens from tab URL
5. Stores tokens in `chrome.storage.local`
6. Syncs session across extension contexts (popup, background, content scripts)

## 6. Required OAuth Scopes

For Google OAuth with profile and email access, you need these scopes:

### Minimum Required Scopes

```javascript
const scopes = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];
```

### Scope Breakdown

| Scope | Purpose | Data Returned |
|-------|---------|---------------|
| `openid` | Enables OpenID Connect | `sub` (user ID) claim in ID token |
| `userinfo.email` | Access user's email | `email`, `email_verified` |
| `userinfo.profile` | Access user's profile | `name`, `picture`, `given_name`, `family_name` |

### OAuth Consent Screen Prompts

With these basic scopes, users will see:
- "View your email address"
- "View your basic profile info"

**No verification required**: These scopes are considered non-sensitive and don't require Google's OAuth app verification process.

## 7. Common Issues and Gotchas

### Issue 1: Extension ID Changes During Development

**Problem**: Your extension ID changes every time you reload an unpacked extension, breaking OAuth configuration.

**Solutions**:
- Generate a consistent key pair and add to `manifest.json`:
  ```json
  {
    "key": "YOUR_GENERATED_KEY_HERE"
  }
  ```
- Use [Itero KeyPair Tool](https://github.com/lusito/web-ext-translator/tree/master/tools/key-generator) to generate a key
- Or publish to Chrome Web Store early (even as unlisted) for a stable ID

### Issue 2: Redirect URL Mismatch

**Problem**: `redirect_uri_mismatch` error from Google OAuth.

**Solutions**:
- Ensure EXACT match between:
  - Google Cloud Console Authorized Redirect URIs
  - Supabase redirect URL configuration
  - URL used in `signInWithOAuth` call
- Check for trailing slashes (must match exactly)
- Verify extension ID is correct

### Issue 3: Supabase Session Not Persisting

**Problem**: User has to log in every time they open the extension.

**Solutions**:
- Store refresh token in `chrome.storage.local`:
  ```typescript
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      chrome.storage.local.set({
        supabaseSession: session
      });
    }
  });
  ```
- Restore session on extension load:
  ```typescript
  chrome.storage.local.get(['supabaseSession'], async (result) => {
    if (result.supabaseSession) {
      await supabase.auth.setSession(result.supabaseSession);
    }
  });
  ```

### Issue 4: CORS Errors in Extension

**Problem**: CORS errors when calling Supabase from content scripts.

**Solutions**:
- Use background service worker as a proxy
- Make Supabase calls from background script, not content scripts
- Ensure `host_permissions` includes Supabase domain in manifest

### Issue 5: OAuth Flow Opens Multiple Tabs

**Problem**: Each login attempt opens a new tab that doesn't close.

**Solutions**:
- Listen for redirect URL in `chrome.tabs.onUpdated`
- Close tab programmatically after capturing tokens:
  ```typescript
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url?.includes('access_token')) {
      // Extract tokens
      // ...
      chrome.tabs.remove(tabId); // Close tab
    }
  });
  ```

### Issue 6: Token Refresh Failures

**Problem**: Access tokens expire and aren't automatically refreshed.

**Solutions**:
- Supabase handles token refresh automatically IF you have a valid refresh token
- Ensure refresh token is stored persistently in `chrome.storage.local`
- Monitor auth state changes:
  ```typescript
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('Token refreshed:', session);
    }
    if (event === 'SIGNED_OUT') {
      console.log('Session expired or user signed out');
    }
  });
  ```

### Issue 7: Incognito Mode Doesn't Work

**Problem**: Extension doesn't work in Chrome incognito mode.

**Solution**:
- Enable "Allow in incognito" in `chrome://extensions/`
- Or detect incognito mode and show a message:
  ```typescript
  if (chrome.extension.inIncognitoContext) {
    // Show message about incognito limitations
  }
  ```

### Issue 8: "Unverified App" Warning

**Problem**: Google shows "This app isn't verified" warning during OAuth.

**Solutions**:
- If using only `email`, `profile`, `openid` scopes: Warning disappears after initial testing phase
- For other scopes: Submit OAuth app for verification (takes 1-2 weeks)
- During development: Add test users in Google Cloud Console to bypass warning

## 8. Step-by-Step Configuration Checklist

Use this checklist to ensure you've configured everything correctly.

### Google Cloud Console Checklist

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured (External type)
- [ ] App name, support email, and developer contact added
- [ ] OAuth scopes added: `openid`, `userinfo.email`, `userinfo.profile`
- [ ] Test users added (for development)
- [ ] OAuth client ID created (Web application type)
- [ ] Authorized JavaScript origins: `chrome-extension://{EXTENSION_ID}`
- [ ] Authorized redirect URIs: `https://{PROJECT_ID}.supabase.co/auth/v1/callback`
- [ ] Client ID and Client Secret saved securely

### Supabase Dashboard Checklist

- [ ] Google OAuth provider enabled
- [ ] Client ID pasted from Google Cloud Console
- [ ] Client Secret pasted from Google Cloud Console
- [ ] PKCE flow enabled (optional but recommended)
- [ ] Site URL set to `chrome-extension://{EXTENSION_ID}/popup.html` (or your main page)
- [ ] Additional redirect URLs added:
  - [ ] `chrome-extension://{DEV_EXTENSION_ID}/**`
  - [ ] `chrome-extension://{PROD_EXTENSION_ID}/**`
  - [ ] `https://{EXTENSION_ID}.chromiumapp.org/` (if using chrome.identity API)
- [ ] Configuration saved

### Chrome Extension Checklist

- [ ] `manifest.json` includes `identity` permission
- [ ] `manifest.json` includes `storage` permission
- [ ] `manifest.json` includes `tabs` permission (if using tab-based OAuth)
- [ ] `manifest.json` includes `host_permissions` for `https://*.supabase.co/*`
- [ ] Extension loaded in Chrome and extension ID noted
- [ ] Extension ID matches Google Cloud Console configuration
- [ ] Supabase client initialized with correct project URL and anon key

### Testing Checklist

- [ ] Can click "Sign in with Google" button
- [ ] OAuth consent screen appears with correct app name
- [ ] Can authorize app and see requested scopes
- [ ] Redirected back to extension after authorization
- [ ] User profile (name, picture, email) displays correctly
- [ ] Can sign out successfully
- [ ] Session persists after closing and reopening extension
- [ ] Session persists after browser restart
- [ ] Token refresh happens automatically (test by waiting 1 hour)

## 9. Security Best Practices

### Token Storage

**DO**:
- Store tokens in `chrome.storage.local` (encrypted by Chrome)
- Use Supabase's built-in session management
- Implement token refresh logic

**DON'T**:
- Store tokens in `localStorage` (accessible to content scripts)
- Store tokens in extension sync storage (synced across devices, less secure)
- Store tokens in plain text in code

### OAuth Scopes

**DO**:
- Request only the minimum scopes needed (`openid`, `email`, `profile`)
- Explain why you need each scope in your privacy policy

**DON'T**:
- Request additional Google API scopes unless absolutely necessary
- Request scopes "just in case" you might need them later

### Redirect URLs

**DO**:
- Use HTTPS URLs for all redirect URIs
- Validate redirect URLs on your backend
- Use exact URL matching in production (avoid wildcards)

**DON'T**:
- Allow wildcards in production redirect URLs (`**`)
- Use HTTP (non-secure) redirect URLs

### Content Security Policy

**DO**:
- Restrict `connect-src` to only necessary domains
- Use CSP in `manifest.json` to prevent XSS

**DON'T**:
- Use `unsafe-inline` or `unsafe-eval` in CSP
- Allow connections to arbitrary domains

## 10. Additional Resources

### Official Documentation

- [Supabase Google OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Chrome Extension OAuth Guide](https://developer.chrome.com/docs/extensions/how-to/integrate/oauth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Redirect URLs Guide](https://supabase.com/docs/guides/auth/redirect-urls)

### Community Resources

- [Supabase Auth in Browser Extensions](https://pustelto.com/blog/supabase-auth/) - Comprehensive tutorial
- [Chrome Extension + Supabase Auth](https://gourav.io/blog/supabase-auth-chrome-extension) - Practical implementation guide
- [Supabase Discussion: Social Login in Web Extensions](https://github.com/orgs/supabase/discussions/5787) - Community solutions

### Tools

- [Chrome Extension ID Generator](https://github.com/lusito/web-ext-translator/tree/master/tools/key-generator)
- [Supabase CLI](https://supabase.com/docs/guides/cli) - For local development and migrations

## 11. Recommended Implementation Path

Based on the research, here's the recommended implementation approach for the Onsaero Tasks extension:

### Recommended: Supabase signInWithOAuth with Tab-based Flow

**Why**:
- Simplest integration with existing Supabase setup
- Built-in token management and refresh
- Minimal code changes needed
- Well-documented and supported

**Implementation Steps**:

1. **Phase 1: Supabase Configuration**
   - Configure Google OAuth provider in Supabase dashboard
   - Set up redirect URLs for extension

2. **Phase 2: Google Cloud Console Setup**
   - Create OAuth client with correct redirect URIs
   - Configure consent screen with minimal scopes

3. **Phase 3: Extension Manifest**
   - Add `identity`, `storage`, `tabs` permissions
   - Add `host_permissions` for Supabase

4. **Phase 4: Auth UI Components**
   - Create `LoginButton` component
   - Create `UserProfile` component
   - Create `AuthGuard` component (protect routes)

5. **Phase 5: Auth Service Layer**
   - Implement `signInWithGoogle()` function
   - Implement session persistence in `chrome.storage.local`
   - Implement auth state listener

6. **Phase 6: Background Script Integration**
   - Listen for auth redirect in background service worker
   - Extract and store tokens
   - Close auth tabs automatically

7. **Phase 7: State Management**
   - Create Zustand auth store
   - Sync auth state across extension contexts
   - Integrate with existing task store

8. **Phase 8: Database Migration**
   - Add `user_id` column to tasks table
   - Implement task migration for existing local tasks
   - Update task queries to filter by `user_id`

## Conclusion

Configuring Google OAuth for a Supabase Chrome extension requires careful coordination between three systems: Google Cloud Console, Supabase Dashboard, and Chrome Extension manifest. The most critical aspect is ensuring redirect URLs match exactly across all three platforms.

The recommended approach is to use Supabase's `signInWithOAuth` method with a tab-based redirect flow, as it provides the best balance of simplicity, security, and maintainability while leveraging Supabase's built-in token management.

Key success factors:
1. Obtain stable extension ID early (publish to Chrome Web Store)
2. Use only basic OAuth scopes (openid, email, profile) to avoid verification delays
3. Implement proper token storage and session persistence
4. Test authentication flow thoroughly in both development and production contexts
5. Handle edge cases (token expiry, network errors, user cancellation)
