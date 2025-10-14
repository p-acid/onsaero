/**
 * useAuthGuard Hook
 *
 * Hook that provides authentication state for route protection
 * Returns auth status, loading state, errors, and redirect path
 *
 * @module hooks/useAuthGuard
 */

import type { AuthGuardResult } from '../lib/types'
import { useAuthStore } from '../stores/authStore'

/**
 * Hook that checks authentication state for route protection
 *
 * Returns:
 * - isAuthenticated: true if user is authenticated
 * - isLoading: true during auth check
 * - error: Error object if auth check failed
 * - redirectPath: '/login' if not authenticated, null otherwise
 *
 * @returns {AuthGuardResult} Authentication guard result
 *
 * @example
 * ```tsx
 * function ProtectedRoute({ children }: { children: React.ReactNode }) {
 *   const { isAuthenticated, isLoading, redirectPath } = useAuthGuard()
 *
 *   if (isLoading) return <LoadingSpinner />
 *   if (redirectPath) return <Navigate to={redirectPath} />
 *   return <>{children}</>
 * }
 * ```
 */
export function useAuthGuard(): AuthGuardResult {
  // Subscribe to auth store state with fine-grained selectors
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.loading)
  const authError = useAuthStore((state) => state.error)

  // Convert auth error string to Error object if present
  const error = authError ? new Error(authError) : null

  // Determine redirect path
  // Redirect to login if:
  // 1. Not authenticated AND not loading (fail closed)
  // 2. Auth service error (fail closed)
  const redirectPath = !isAuthenticated && !isLoading ? '/login' : null

  return {
    isAuthenticated,
    isLoading,
    error,
    redirectPath,
  }
}
