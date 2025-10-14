/**
 * Route Guard Contract
 *
 * This file defines the contract for route protection components and hooks
 * that enforce authentication requirements on protected routes.
 *
 * @module contracts/route-guard-contract
 */

import type React from 'react'

/**
 * Route access levels
 */
export type RouteAccessLevel = 'public' | 'protected'

/**
 * Protected route component props
 */
export interface ProtectedRouteProps {
  /**
   * Child components to render if authenticated
   * Typically React Router <Outlet /> for nested routes
   */
  children?: React.ReactNode

  /**
   * Path to redirect to if not authenticated
   * @default '/login'
   */
  redirectTo?: string

  /**
   * Whether authentication is required for this route
   * @default true
   */
  requireAuth?: boolean

  /**
   * Fallback component to show during auth check
   * @default <LoadingSpinner />
   */
  fallback?: React.ReactElement
}

/**
 * Auth guard hook return type
 */
export interface AuthGuardResult {
  /**
   * Whether user is authenticated
   */
  isAuthenticated: boolean

  /**
   * Whether auth check is in progress
   */
  isLoading: boolean

  /**
   * Error from auth check, if any
   */
  error: Error | null

  /**
   * Path to redirect to if not authenticated, null if authenticated
   */
  redirectPath: string | null
}

/**
 * Route configuration for React Router
 */
export interface RouteConfig {
  /**
   * URL path pattern (e.g., '/dashboard', '/tasks/:id')
   */
  path: string

  /**
   * Access level for this route
   */
  accessLevel: RouteAccessLevel

  /**
   * Redirect destination if access denied
   * Required for protected routes
   */
  redirectTo?: string

  /**
   * Component to render for this route
   */
  element: React.ReactElement

  /**
   * Data loader function (React Router loader API)
   * Called before rendering, can enforce auth check
   */
  loader?: () => Promise<unknown>

  /**
   * Child routes (nested routing)
   */
  children?: RouteConfig[]
}

/**
 * Router state for post-login redirect
 */
export interface RouterLocationState {
  /**
   * Path user was attempting to access before redirect to login
   */
  from?: string

  /**
   * Reason for redirect (e.g., 'session_expired', 'unauthorized')
   */
  reason?: 'unauthorized' | 'session_expired' | 'service_unavailable'
}

/**
 * Expected component behavior
 */
export const RouteGuardContract = {
  /**
   * ProtectedRoute component behavior
   */
  ProtectedRoute: {
    /**
     * Rendering logic
     */
    renderBehavior: [
      'If loading: render fallback component',
      'If error: redirect to login with error message',
      'If !isAuthenticated: redirect to login, preserve current path in state',
      'If isAuthenticated: render children',
    ],

    /**
     * Auth check timing
     */
    authCheckTiming: {
      when: 'On component mount and when auth state changes',
      latency: '<500ms (from spec SC-002)',
      caching: 'Use Zustand store state, no additional API calls',
    },

    /**
     * Redirect behavior
     */
    redirectBehavior: {
      method: 'React Router <Navigate /> component',
      preserveDestination: true,
      stateFormat: '{ from: currentPath, reason: "unauthorized" }',
      example: '<Navigate to="/login" state={{ from: "/tasks" }} replace />',
    },
  },

  /**
   * useAuthGuard hook behavior
   */
  useAuthGuard: {
    /**
     * Return value based on auth state
     */
    returnValue: {
      'User authenticated': {
        isAuthenticated: true,
        isLoading: false,
        error: null,
        redirectPath: null,
      },
      'User not authenticated': {
        isAuthenticated: false,
        isLoading: false,
        error: null,
        redirectPath: '/login',
      },
      'Auth check in progress': {
        isAuthenticated: false,
        isLoading: true,
        error: null,
        redirectPath: null,
      },
      'Auth service unavailable (fail closed)': {
        isAuthenticated: false,
        isLoading: false,
        error: 'Error object',
        redirectPath: '/login',
      },
    },

    /**
     * Reactivity
     */
    reactivity: {
      subscribesTo: 'authStore.user, authStore.loading, authStore.error',
      reEvaluatesWhen: 'Any subscribed value changes',
      granularity: 'Fine-grained (Zustand selector)',
    },
  },

  /**
   * Route loader (React Router) behavior
   */
  routeLoader: {
    /**
     * Auth check in loader
     */
    implementation: `
      async function protectedRouteLoader() {
        const { session } = useAuthStore.getState()
        if (!session) {
          throw redirect('/login')
        }
        return null
      }
    `,

    /**
     * Timing
     */
    timing: 'Before component render (blocks navigation)',

    /**
     * Error handling
     */
    errorHandling: 'Throw redirect() to abort navigation',
  },

  /**
   * Public routes (from spec clarification)
   */
  publicRoutes: ['/', '/login'],

  /**
   * Protected routes (all others)
   */
  protectedRoutes: [
    '/tasks',
    '/dashboard',
    '/popup',
    // All other routes default to protected
  ],

  /**
   * Browser history protection (FR-008)
   */
  historyProtection: {
    method: 'Cache-Control headers + loader check on back/forward',
    headers: 'Cache-Control: no-store, no-cache, must-revalidate',
    loaderCheck: 'Loader runs even on back/forward navigation',
    result: 'Protected content never cached, auth re-checked on history navigation',
  },

  /**
   * Loading state UX (FR-013)
   */
  loadingState: {
    component: '<LoadingSpinner /> (existing component from src/components/ui/)',
    displayCondition: 'authStore.loading === true',
    maxDuration: '500ms (from spec SC-002)',
    skeleton: 'Optional enhancement: skeleton variant for layout preservation',
  },

  /**
   * Error states
   */
  errorStates: {
    'Session expired': {
      action: 'Redirect to /login',
      message: 'Your session has expired. Please log in again.',
      state: '{ from: currentPath, reason: "session_expired" }',
    },
    'Unauthorized access': {
      action: 'Redirect to /login',
      message: 'Please log in to access this page.',
      state: '{ from: currentPath, reason: "unauthorized" }',
    },
    'Service unavailable (fail closed)': {
      action: 'Show error page',
      message: 'Authentication service is temporarily unavailable. Please try again later.',
      fallback: 'Block all protected routes, show service unavailable page',
    },
  },
}

/**
 * Usage example
 *
 * ```typescript
 * // ProtectedRoute component
 * function ProtectedRoute({ children, redirectTo = '/login', fallback }: ProtectedRouteProps) {
 *   const { isAuthenticated, isLoading } = useAuthGuard()
 *
 *   if (isLoading) {
 *     return fallback || <LoadingSpinner />
 *   }
 *
 *   if (!isAuthenticated) {
 *     return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
 *   }
 *
 *   return <>{children}</>
 * }
 *
 * // Route configuration
 * const routes: RouteConfig[] = [
 *   {
 *     path: '/',
 *     accessLevel: 'public',
 *     element: <Landing />,
 *   },
 *   {
 *     path: '/login',
 *     accessLevel: 'public',
 *     element: <Login />,
 *   },
 *   {
 *     path: '/tasks',
 *     accessLevel: 'protected',
 *     redirectTo: '/login',
 *     element: (
 *       <ProtectedRoute>
 *         <NewTab />
 *       </ProtectedRoute>
 *     ),
 *   },
 * ]
 * ```
 */
