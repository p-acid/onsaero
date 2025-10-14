/**
 * ProtectedRoute Component
 *
 * Route guard component that enforces authentication requirements
 * Redirects unauthenticated users to login page with destination URL preserved
 *
 * @module components/guards/ProtectedRoute
 */

import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthGuard } from '../../hooks/useAuthGuard'
import type { ProtectedRouteProps } from '../../lib/types'
import { useAuthStore } from '../../stores/authStore'
import { LoadingSpinner } from '../ui/LoadingSpinner'

/**
 * Protected route wrapper component
 *
 * Behavior:
 * 1. Shows loading fallback during auth check
 * 2. Checks session expiration and redirects with appropriate reason
 * 3. Redirects to login if not authenticated (preserves destination URL)
 * 4. Renders children/<Outlet> if authenticated and session valid
 * 5. Prevents browser history cache to ensure auth checks on back/forward
 *
 * @param {ProtectedRouteProps} props - Component props
 * @returns {JSX.Element} Protected route element
 *
 * @example
 * ```tsx
 * // In router configuration
 * {
 *   path: '/tasks',
 *   element: (
 *     <ProtectedRoute>
 *       <NewTab />
 *     </ProtectedRoute>
 *   )
 * }
 * ```
 */
export function ProtectedRoute({
  children,
  redirectTo = '/login',
  requireAuth = true,
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, redirectPath } = useAuthGuard()
  const session = useAuthStore((state) => state.session)
  const location = useLocation()

  // Prevent browser history cache for protected routes (T036)
  // This ensures auth checks run even when navigating via back/forward buttons
  useEffect(() => {
    if (requireAuth) {
      // Add cache control meta tags dynamically
      const metaNoCache = document.createElement('meta')
      metaNoCache.httpEquiv = 'Cache-Control'
      metaNoCache.content = 'no-store, no-cache, must-revalidate'
      document.head.appendChild(metaNoCache)

      const metaPragma = document.createElement('meta')
      metaPragma.httpEquiv = 'Pragma'
      metaPragma.content = 'no-cache'
      document.head.appendChild(metaPragma)

      const metaExpires = document.createElement('meta')
      metaExpires.httpEquiv = 'Expires'
      metaExpires.content = '0'
      document.head.appendChild(metaExpires)

      // Cleanup on unmount
      return () => {
        document.head.removeChild(metaNoCache)
        document.head.removeChild(metaPragma)
        document.head.removeChild(metaExpires)
      }
    }
  }, [requireAuth])

  // If auth check not required, render children immediately
  if (!requireAuth) {
    return <>{children || <Outlet />}</>
  }

  // Show loading state during auth check
  if (isLoading) {
    return fallback || <LoadingSpinner text="Checking authentication..." />
  }

  // Check session expiration (T025)
  // Session expires_at is a Unix timestamp in seconds
  // If session exists and is expired, redirect with 'session_expired' reason
  const isSessionExpired =
    session?.expires_at && Date.now() / 1000 > session.expires_at

  // Redirect to login if not authenticated
  // Preserve current path in router state for post-login redirect
  if (!isAuthenticated || redirectPath) {
    return (
      <Navigate
        to={redirectTo}
        state={{
          from: location.pathname,
          reason: isSessionExpired ? 'session_expired' : 'unauthorized',
        }}
        replace
      />
    )
  }

  // Render protected content
  // Use children if provided, otherwise render <Outlet> for nested routes
  return <>{children || <Outlet />}</>
}
