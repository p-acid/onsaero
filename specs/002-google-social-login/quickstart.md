# Quickstart: Google Social Login

**Feature**: Google Social Login (002-google-social-login)
**Estimated Time**: 45-60 minutes
**Prerequisites**: Supabase project, Chrome browser, pnpm installed
**Date**: 2025-10-13

## Overview

This quickstart guide walks you through implementing Google OAuth 2.0 authentication in the Onsaero Tasks Chrome extension. By the end, users will be able to sign in with their Google account, and tasks will be associated with their user account.

---

## Before You Begin

### Required Tools

- [ ] Chrome browser (latest version)
- [ ] pnpm package manager
- [ ] Supabase CLI (`pnpm add -g supabase`)
- [ ] Google account
- [ ] Supabase project (existing)

### Required Accounts

- [ ] Google Cloud Console account
- [ ] Supabase account with existing project

### Existing Setup

✅ You already have:
- React 19 + TypeScript + Vite project
- Supabase client configured (`src/api/supabase.ts`)
- Tasks database schema with existing data
- Chrome extension manifest (Manifest V3)

---

## Step 1: Google Cloud Console Setup (15 min)

### 1.1 Create OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**

### 1.2 Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** user type
3. Fill in required fields:
   - **App name**: "Onsaero Tasks"
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **Save and Continue**

### 1.3 Add OAuth Scopes

1. In **Scopes** section, click **Add or Remove Scopes**
2. Select these scopes:
   - `openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
3. Click **Update** and **Save and Continue**

### 1.4 Create OAuth Client ID

1. Return to **Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Web application**
4. Name: "Onsaero Chrome Extension"
5. **Authorized redirect URIs**: Add `https://<your-project-id>.supabase.co/auth/v1/callback`
   - Find your project ID in Supabase dashboard URL
6. Click **Create**
7. **SAVE YOUR CLIENT ID AND CLIENT SECRET** (you'll need these in Step 2)

---

## Step 2: Supabase Configuration (10 min)

### 2.1 Enable Google OAuth Provider

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication > Providers**
4. Find **Google** in the provider list
5. Toggle **Enable** to ON

### 2.2 Configure Google Provider

1. Paste **Client ID** from Google Cloud Console (Step 1.4)
2. Paste **Client Secret** from Google Cloud Console (Step 1.4)
3. Enable **Use PKCE flow** (recommended for security)
4. Click **Save**

### 2.3 Configure Redirect URLs

1. Navigate to **Authentication > URL Configuration**
2. **Site URL**: `chrome-extension://<extension-id>/popup.html`
   - Get extension ID: Load your extension in Chrome, go to `chrome://extensions/`, enable Developer mode, copy ID
3. **Additional Redirect URLs**: Add these lines:
   ```
   chrome-extension://<extension-id>/**
   https://<extension-id>.chromiumapp.org/
   ```
4. Click **Save**

---

## Step 3: Database Migration (5 min)

### 3.1 Create Migration File

```bash
cd /Users/acid/development/onsaero
npx supabase migration new add_user_authentication
```

### 3.2 Add Migration SQL

Edit the generated migration file in `supabase/migrations/`:

```sql
-- Add user_id to tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for query performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Add user_id to daily_metrics
ALTER TABLE public.daily_metrics
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update unique constraint on daily_metrics
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_metrics_user_date
ON daily_metrics(user_id, date);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own tasks" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Anonymous users can access local tasks" ON tasks
  FOR ALL TO anon
  USING (user_id IS NULL);

-- RLS Policies for daily_metrics
CREATE POLICY "Users can view their own metrics" ON daily_metrics
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Anonymous users can access local metrics" ON daily_metrics
  FOR ALL TO anon
  USING (user_id IS NULL);

-- Migration function
CREATE OR REPLACE FUNCTION public.migrate_local_tasks_to_user(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  migrated_count INTEGER;
BEGIN
  UPDATE public.tasks
  SET user_id = p_user_id
  WHERE user_id IS NULL;

  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.migrate_local_tasks_to_user TO authenticated;
```

### 3.3 Apply Migration

```bash
npx supabase db push
```

Verify migration succeeded:
```bash
npx supabase db remote commit
```

---

## Step 4: Update Extension Manifest (2 min)

### 4.1 Add Permissions

Edit `/Users/acid/development/onsaero/src/manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "Onsaero Tasks",
  "version": "0.1.0",
  "permissions": [
    "storage",
    "identity",
    "tabs"
  ],
  "host_permissions": [
    "https://*.supabase.co/*"
  ]
}
```

---

## Step 5: Implement Auth Store (5 min)

### 5.1 Create Auth Store

Create `/Users/acid/development/onsaero/src/stores/authStore.ts`:

```typescript
import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../api/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  signInWithGoogle: async () => {
    try {
      set({ loading: true, error: null });

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

      if (error) throw error;

      await chrome.tabs.create({ url: data.url });
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Sign in failed',
        loading: false,
      });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      await chrome.storage.local.remove('supabaseSession');
      set({ user: null, session: null, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Sign out failed',
        loading: false,
      });
    }
  },

  initialize: async () => {
    try {
      set({ loading: true });

      const response = await chrome.runtime.sendMessage({ type: 'GET_SESSION' });

      if (response?.session) {
        await supabase.auth.setSession({
          access_token: response.session.access_token,
          refresh_token: response.session.refresh_token,
        });

        set({
          user: response.session.user,
          session: response.session,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({ loading: false });
    }
  },
}));

// Listen for auth state changes from background script
chrome.runtime.onMessage.addListener((message) => {
  const { type, user, session, error } = message;

  if (type === 'AUTH_SUCCESS' || type === 'AUTH_STATE_CHANGE') {
    useAuthStore.setState({ user, session, loading: false, error: null });
  }

  if (type === 'AUTH_ERROR') {
    useAuthStore.setState({ error, loading: false });
  }
});
```

---

## Step 6: Create Auth Hook (3 min)

### 6.1 Create useAuth Hook

Create `/Users/acid/development/onsaero/src/hooks/useAuth.ts`:

```typescript
import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const { user, session, loading, error, signInWithGoogle, signOut, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user,
    signInWithGoogle,
    signOut,
  };
}
```

---

## Step 7: Implement Background Service Worker (10 min)

### 7.1 Create Auth Handler

Create `/Users/acid/development/onsaero/src/background/service-worker.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: undefined,
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

const REDIRECT_URL = chrome.identity.getRedirectURL();

// Handle OAuth callback
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (!changeInfo.url || !changeInfo.url.startsWith(REDIRECT_URL)) {
    return;
  }

  try {
    const url = new URL(changeInfo.url);
    const params = new URLSearchParams(url.hash.replace('#', ''));

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (!error && data.session) {
        await chrome.storage.local.set({ supabaseSession: data.session });
        chrome.runtime.sendMessage({ type: 'AUTH_SUCCESS', user: data.user, session: data.session });
      }

      await chrome.tabs.remove(tabId);
    }
  } catch (err) {
    console.error('[Auth] Error processing OAuth callback:', err);
  }
});

// Restore session on startup
chrome.runtime.onStartup.addListener(async () => {
  const { supabaseSession } = await chrome.storage.local.get('supabaseSession');

  if (supabaseSession) {
    await supabase.auth.setSession({
      access_token: supabaseSession.access_token,
      refresh_token: supabaseSession.refresh_token,
    });
  }
});

// Listen for auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    if (session) {
      await chrome.storage.local.set({ supabaseSession: session });
    }
  }

  if (event === 'SIGNED_OUT') {
    await chrome.storage.local.remove('supabaseSession');
  }

  chrome.runtime.sendMessage({ type: 'AUTH_STATE_CHANGE', event, session });
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SESSION') {
    chrome.storage.local.get('supabaseSession').then(({ supabaseSession }) => {
      sendResponse({ session: supabaseSession || null });
    });
    return true;
  }
});
```

### 7.2 Update vite.config.ts

Edit `/Users/acid/development/onsaero/vite.config.ts` to include background script:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { crxPlugin } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';

export default defineConfig({
  plugins: [
    react(),
    crxPlugin({ manifest }),
  ],
  build: {
    rollupOptions: {
      input: {
        serviceWorker: 'src/background/service-worker.ts',
      },
    },
  },
});
```

---

## Step 8: Create Auth UI Components (5 min)

### 8.1 Create LoginButton Component

Create `/Users/acid/development/onsaero/src/components/auth/LoginButton.tsx`:

```typescript
import { useAuth } from '../../hooks/useAuth';

export function LoginButton() {
  const { isAuthenticated, loading, user, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated && user) {
    return (
      <div>
        <img src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} width="32" height="32" />
        <span>{user.user_metadata.full_name}</span>
        <button type="button" onClick={signOut}>
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={signInWithGoogle}>
      Sign in with Google
    </button>
  );
}
```

---

## Step 9: Update Task Operations (5 min)

### 9.1 Modify Task Creation

Edit `/Users/acid/development/onsaero/src/api/tasks.ts`:

```typescript
export const createTask = async (newTask: NewTask): Promise<Task> => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1);

  const maxOrder = existingTasks?.[0]?.display_order ?? -1;

  const insertData: Database['public']['Tables']['tasks']['Insert'] = {
    ...newTask,
    user_id: user?.id || null,  // Associate with user if authenticated
    display_order: maxOrder + 1,
    completed: false,
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  return data;
};

// Add migration function
export const migrateLocalTasks = async (): Promise<number> => {
  const { data, error } = await supabase.rpc('migrate_local_tasks_to_user');

  if (error) {
    throw new Error(`Failed to migrate tasks: ${error.message}`);
  }

  return data || 0;
};
```

---

## Step 10: Test the Implementation (5 min)

### 10.1 Build Extension

```bash
pnpm run build
```

### 10.2 Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder from your project

### 10.3 Test Auth Flow

1. Click extension icon to open popup
2. Click "Sign in with Google" button
3. OAuth consent screen should appear in new tab
4. Authorize the app
5. Tab should close automatically
6. User profile should appear in popup
7. Create a task - it should be associated with your user account

### 10.4 Test Session Persistence

1. Close Chrome completely
2. Reopen Chrome
3. Open extension popup
4. Verify you're still signed in (no need to re-authenticate)

### 10.5 Test Sign Out

1. Click "Sign out" button
2. Verify UI returns to unauthenticated state
3. Verify session cleared from chrome.storage.local

---

## Troubleshooting

### Issue: "Redirect URI mismatch" error

**Solution**: Ensure exact match between:
- Google Cloud Console redirect URI
- Supabase redirect URL configuration
- Extension ID (get from `chrome://extensions/`)

### Issue: Extension ID changes on reload

**Solution**: Publish extension to Chrome Web Store (even as unlisted) for stable ID, or add a stable key to manifest.json

### Issue: Session not persisting

**Solution**:
1. Check background service worker is running (`chrome://extensions/` → Inspect service worker)
2. Verify session stored in chrome.storage.local (Inspect → Application → Storage)
3. Check `supabase.auth.onAuthStateChange` listener is active

### Issue: Tasks not showing after sign-in

**Solution**:
1. Check RLS policies are correctly applied (Supabase Dashboard → Database → Policies)
2. Verify user_id is set on tasks (Supabase Dashboard → Table Editor → tasks)
3. Run migration function to associate existing tasks

---

## Next Steps

✅ You now have a working Google OAuth implementation!

**Optional Enhancements**:

1. **Add migration prompt**: Show dialog on first sign-in to migrate local tasks
2. **Error handling UI**: Display user-friendly error messages for auth failures
3. **Loading states**: Add spinners during OAuth flow
4. **Profile settings**: Allow users to view/edit their profile
5. **Multi-device sync**: Tasks automatically sync across devices (already works with Supabase!)

---

## Summary

**What you built**:

- ✅ Google OAuth 2.0 authentication via Supabase
- ✅ Session persistence across browser restarts
- ✅ User-scoped task storage with RLS
- ✅ Background service worker for OAuth callback handling
- ✅ Auth state management with Zustand
- ✅ Chrome extension integration with proper permissions

**Time spent**: ~45-60 minutes

**Files created/modified**:
- `src/stores/authStore.ts` (new)
- `src/hooks/useAuth.ts` (new)
- `src/background/service-worker.ts` (new)
- `src/components/auth/LoginButton.tsx` (new)
- `src/api/tasks.ts` (modified)
- `src/manifest.json` (modified)
- `supabase/migrations/XXX_add_user_authentication.sql` (new)

**Ready for production**: Almost! Add error handling, loading states, and user testing before launch.
