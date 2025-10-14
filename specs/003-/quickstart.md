# Quick Start: Authentication Gate Implementation

**Feature**: Authentication Gate for Main Service
**Target Audience**: Developers implementing this feature
**Estimated Time**: 4-6 hours for core functionality

## Prerequisites

Before starting implementation:

- [ ] Read [spec.md](./spec.md) - Understand feature requirements
- [ ] Read [research.md](./research.md) - Understand technical decisions
- [ ] Read [data-model.md](./data-model.md) - Understand data structures
- [ ] Review [contracts/](./contracts/) - Understand interfaces
- [ ] Ensure development environment is set up (pnpm, Node.js, TypeScript)

---

## Phase 1: Setup Dependencies (30 minutes)

### 1.1 Install Required Packages

```bash
# Add routing library
pnpm add react-router-dom

# Add testing dependencies (dev only)
pnpm add -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom msw
```

### 1.2 Configure Vitest

Create `vitest.config.ts` in project root:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.css.ts'],
    },
  },
})
```

Create `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})
```

### 1.3 Update package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## Phase 2: Extend Auth Store (1 hour)

### 2.1 Add Cross-Tab Sync

Edit `src/stores/authStore.ts`:

```typescript
import { create } from 'zustand'
import { supabase } from '../api/supabase'
import type { Session, User } from '@supabase/supabase-js'
import type {
  AuthStore,
  AuthSyncMessage,
  AuthChangeAction,
} from '../contracts/auth-store-contract'

// BroadcastChannel for cross-tab sync
let broadcastChannel: BroadcastChannel | null = null
if ('BroadcastChannel' in window) {
  broadcastChannel = new BroadcastChannel('onsaero_auth_sync')
}

// Message validation
function validateAuthSyncMessage(message: unknown): message is AuthSyncMessage {
  if (!message || typeof message !== 'object') return false
  const msg = message as Partial<AuthSyncMessage>

  if (msg.type !== 'AUTH_STATE_CHANGE') return false

  const now = Date.now()
  if (!msg.timestamp || Math.abs(now - msg.timestamp) > 10000) return false

  const validActions: AuthChangeAction[] = ['login', 'logout', 'refresh', 'server_revoke']
  if (!msg.action || !validActions.includes(msg.action)) return false

  if (msg.sessionId !== null && typeof msg.sessionId !== 'string') return false

  return true
}

export const useAuthStore = create<AuthStore>((set, get) => {
  // Initialize cross-tab listener
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      if (validateAuthSyncMessage(event.data)) {
        get().initialize() // Re-sync state
      }
    }
  } else {
    // localStorage fallback for Safari < 15.4
    window.addEventListener('storage', (event) => {
      if (!event.key?.startsWith('onsaero_auth_sync_')) return
      if (!event.newValue) return

      try {
        const message = JSON.parse(event.newValue)
        if (validateAuthSyncMessage(message)) {
          get().initialize()
        }
      } catch {
        // Ignore parse errors
      }
    })
  }

  return {
    // Existing state
    user: null,
    session: null,
    loading: true,
    error: null,

    // Computed
    get isAuthenticated() {
      return get().user !== null
    },

    // Existing actions (keep as-is)
    signInWithGoogle: async () => {
      // ... existing implementation
    },

    initialize: async () => {
      // ... existing implementation
    },

    // Enhanced signOut with broadcast
    signOut: async () => {
      try {
        set({ loading: true, error: null })

        // Broadcast BEFORE clearing state
        get().broadcastAuthChange('logout')

        const { error } = await supabase.auth.signOut()
        if (error) throw error

        set({ user: null, session: null, loading: false })
      } catch (error) {
        set({ error: error as Error, loading: false })
      }
    },

    setSession: (session) => {
      set({ session, user: session?.user || null })
      if (session) {
        get().broadcastAuthChange('login')
      }
    },

    setError: (error) => set({ error }),

    // New: Broadcast auth changes
    broadcastAuthChange: (action) => {
      const message: AuthSyncMessage = {
        type: 'AUTH_STATE_CHANGE',
        sessionId: get().session?.user?.id || null,
        timestamp: Date.now(),
        action,
      }

      if (broadcastChannel) {
        broadcastChannel.postMessage(message)
      } else {
        // localStorage fallback
        const key = `onsaero_auth_sync_${Date.now()}`
        localStorage.setItem(key, JSON.stringify(message))
        setTimeout(() => localStorage.removeItem(key), 1000)
      }
    },

    subscribeToAuthChanges: (callback) => {
      // Already handled by BroadcastChannel listener above
      // This method is for external consumers if needed
      return () => {} // No-op unsubscribe
    },
  }
})
```

### 2.2 Test Auth Store

Create `src/stores/authStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from './authStore'

describe('authStore cross-tab sync', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, session: null, loading: false, error: null })
  })

  it('broadcasts logout message', () => {
    const postMessageSpy = vi.fn()
    global.BroadcastChannel = vi.fn(() => ({
      postMessage: postMessageSpy,
      close: vi.fn(),
      onmessage: null,
    })) as any

    useAuthStore.getState().broadcastAuthChange('logout')

    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'AUTH_STATE_CHANGE',
        action: 'logout',
      })
    )
  })
})
```

---

## Phase 3: Create Route Guards (1.5 hours)

### 3.1 Create useAuthGuard Hook

Create `src/hooks/useAuthGuard.ts`:

```typescript
import { useAuthStore } from '../stores/authStore'
import type { AuthGuardResult } from '../contracts/route-guard-contract'

export function useAuthGuard(): AuthGuardResult {
  const { isAuthenticated, loading, error } = useAuthStore()

  return {
    isAuthenticated,
    isLoading: loading,
    error,
    redirectPath: !isAuthenticated && !loading ? '/login' : null,
  }
}
```

### 3.2 Create ProtectedRoute Component

Create `src/components/guards/ProtectedRoute.tsx`:

```typescript
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuthGuard } from '../../hooks/useAuthGuard'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import type { ProtectedRouteProps } from '../../contracts/route-guard-contract'

export function ProtectedRoute({
  children,
  redirectTo = '/login',
  requireAuth = true,
  fallback,
}: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, isLoading, error } = useAuthGuard()

  // Show loading state during auth check
  if (isLoading) {
    return fallback || <LoadingSpinner />
  }

  // Fail closed: redirect on error or not authenticated
  if (error || (!isAuthenticated && requireAuth)) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname, reason: error ? 'service_unavailable' : 'unauthorized' }}
        replace
      />
    )
  }

  // Render children or <Outlet /> for nested routes
  return <>{children || <Outlet />}</>
}
```

### 3.3 Test ProtectedRoute

Create `src/components/guards/ProtectedRoute.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuthStore } from '../../stores/authStore'

vi.mock('../../stores/authStore')

describe('ProtectedRoute', () => {
  it('shows loading spinner when auth is loading', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      loading: true,
      error: null,
    } as any)

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      loading: false,
      error: null,
    } as any)

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders content when authenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      loading: false,
      error: null,
      user: { id: '123' },
    } as any)

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
```

---

## Phase 4: Setup Routing (1 hour)

### 4.1 Create Router Configuration

Create `src/lib/router.ts`:

```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Landing } from '../pages/Landing'
import { Login } from '../pages/Login'
import { NewTab } from '../pages/NewTab'
import { Dashboard } from '../pages/Dashboard'
import { ProtectedRoute } from '../components/guards/ProtectedRoute'
import type { RouteConfig } from '../contracts/route-guard-contract'

export const routes: RouteConfig[] = [
  {
    path: '/',
    accessLevel: 'public',
    element: <Landing />,
  },
  {
    path: '/login',
    accessLevel: 'public',
    element: <Login />,
  },
  {
    path: '/tasks',
    accessLevel: 'protected',
    redirectTo: '/login',
    element: (
      <ProtectedRoute>
        <NewTab />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    accessLevel: 'protected',
    redirectTo: '/login',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    accessLevel: 'protected',
    redirectTo: '/login',
    element: <Navigate to="/tasks" replace />,
  },
]

export const router = createBrowserRouter(routes as any)
```

### 4.2 Update App.tsx

Edit `src/App.tsx`:

```typescript
import { RouterProvider } from 'react-router-dom'
import { router } from './lib/router'
import { themeClass } from './styles/theme.css'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'

function App() {
  const initialize = useAuthStore((state) => state.initialize)

  // Initialize auth on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <div className={themeClass}>
      <RouterProvider router={router} />
    </div>
  )
}

export default App
```

---

## Phase 5: Create Public Pages (1 hour)

### 5.1 Create Landing Page

Create `src/pages/Landing.tsx`:

```typescript
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export function Landing() {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Welcome to Onsaero</h1>
      <p>Productivity task management for focused individuals</p>

      {isAuthenticated ? (
        <div>
          <p>Logged in as {user?.email}</p>
          <Link to="/tasks">Go to Tasks</Link>
        </div>
      ) : (
        <div>
          <Link to="/login">Sign In</Link>
        </div>
      )}
    </div>
  )
}
```

### 5.2 Create Login Page

Create `src/pages/Login.tsx`:

```typescript
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { LoginButton } from '../components/auth/LoginButton'
import { ErrorMessage } from '../components/auth/ErrorMessage'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading, error } = useAuthStore()

  // Redirect to intended destination after login
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from || '/tasks'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Sign In</h1>
      <p>Sign in to access your tasks</p>

      {error && <ErrorMessage error={error} />}

      <LoginButton />

      {location.state?.reason === 'session_expired' && (
        <p style={{ color: 'orange' }}>Your session has expired. Please log in again.</p>
      )}
    </div>
  )
}
```

---

## Phase 6: Testing & Validation (1 hour)

### 6.1 Run Unit Tests

```bash
pnpm test
```

Expected: All tests pass

### 6.2 Manual Testing Checklist

- [ ] Navigate to `/tasks` without login → redirects to `/login`
- [ ] Login → redirected back to `/tasks`
- [ ] Open 2 tabs, logout in one → other redirects within 5 seconds
- [ ] Refresh page while logged in → stays logged in
- [ ] Browser back button after logout → cannot access protected content
- [ ] Direct URL access to `/dashboard` without auth → redirects to `/login`

### 6.3 Performance Validation

```bash
# Build and measure bundle size
pnpm run build
```

Check `dist/` folder - authentication gate code should add <20KB to bundle.

---

## Phase 7: Cleanup & Documentation

### 7.1 Update Types

Ensure all new types are exported from `src/lib/types.ts`:

```typescript
export type {
  AuthState,
  AuthActions,
  AuthStore,
  AuthSyncMessage,
  AuthChangeAction,
} from '../contracts/auth-store-contract'

export type {
  ProtectedRouteProps,
  AuthGuardResult,
  RouteConfig,
  RouterLocationState,
} from '../contracts/route-guard-contract'
```

### 7.2 Run Linter

```bash
pnpm run lint:fix
pnpm run format
```

### 7.3 Build & Verify

```bash
pnpm run build
```

Expected: No TypeScript errors, build succeeds

---

## Troubleshooting

### Issue: BroadcastChannel not working in Safari

**Solution**: Ensure localStorage fallback is implemented. Check browser version (Safari 15.4+ required for BroadcastChannel).

### Issue: Infinite redirect loop

**Cause**: ProtectedRoute redirecting to itself or circular redirect

**Solution**: Ensure `/login` is public and not wrapped in `<ProtectedRoute>`

### Issue: Auth state not persisting after refresh

**Cause**: Supabase session not stored in HTTP-only cookie

**Solution**: Check Supabase project settings - ensure cookie-based auth is enabled

### Issue: Tests failing with "window is not defined"

**Cause**: Vitest environment not set to 'jsdom'

**Solution**: Ensure `vitest.config.ts` has `environment: 'jsdom'`

---

## Next Steps

After completing this quickstart:

1. Run `/speckit.tasks` to generate implementation tasks
2. Implement tasks in priority order
3. Add E2E tests with Playwright (optional)
4. Set up monitoring/analytics for auth flows
5. Consider adding "Remember me" functionality (future enhancement)

---

## Estimated Timeline

| Phase | Time | Description |
|-------|------|-------------|
| Phase 1 | 30 min | Setup dependencies |
| Phase 2 | 1 hour | Extend auth store |
| Phase 3 | 1.5 hours | Create route guards |
| Phase 4 | 1 hour | Setup routing |
| Phase 5 | 1 hour | Create public pages |
| Phase 6 | 1 hour | Testing & validation |
| **Total** | **6 hours** | Core functionality complete |

---

## Support

If you encounter issues:
1. Review [spec.md](./spec.md) for requirements
2. Check [research.md](./research.md) for technical decisions
3. Validate against [contracts/](./contracts/) interfaces
4. Run `pnpm run lint` and `pnpm test` for diagnostics
