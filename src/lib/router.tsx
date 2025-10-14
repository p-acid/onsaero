/**
 * Router Configuration
 *
 * Centralized routing configuration using React Router v6
 * Defines protected and public routes with authentication guards
 *
 * @module lib/router
 */

import { createBrowserRouter, redirect } from 'react-router-dom'
import { ProtectedRoute } from '../components/guards/ProtectedRoute'
import { Dashboard } from '../pages/Dashboard'
import { Landing } from '../pages/Landing'
import { Login } from '../pages/Login'
import { NewTab } from '../pages/NewTab'
import { useAuthStore } from '../stores/authStore'

/**
 * Route loader for protected routes
 *
 * Validates authentication state before rendering route
 * Runs before component render and on browser back/forward navigation
 * Provides server-side style auth check that blocks navigation
 *
 * @returns {null} - Returns null if authenticated, throws redirect if not
 * @throws {Response} - Throws redirect response to /login if not authenticated
 *
 * @example
 * ```tsx
 * {
 *   path: '/tasks',
 *   loader: protectedRouteLoader,
 *   element: <ProtectedRoute><NewTab /></ProtectedRoute>
 * }
 * ```
 */
async function protectedRouteLoader() {
  const { session } = useAuthStore.getState()

  // If no session, redirect to login
  // This provides an additional layer of protection before component render
  if (!session) {
    throw redirect('/login')
  }

  return null
}

/**
 * Router instance with protected and public route configuration
 *
 * Route structure:
 * - / (public) - Landing page with welcome message
 * - /login (public) - Login page with OAuth authentication
 * - /tasks (protected) - Main task management page
 * - /dashboard (protected) - Dashboard page
 *
 * Protected routes:
 * - Require authentication
 * - Redirect to /login if unauthenticated
 * - Preserve destination URL for post-login redirect
 * - Include loader for server-side style auth validation
 *
 * Public routes:
 * - Accessible without authentication
 * - Show authenticated context when user is logged in
 *
 * @constant {Router} router - React Router instance
 */
export const router = createBrowserRouter([
  {
    // Public route: Landing page
    path: '/',
    element: <Landing />,
  },
  {
    // Public route: Login page
    path: '/login',
    element: <Login />,
  },
  {
    path: '/tasks',
    loader: protectedRouteLoader,
    element: (
      <ProtectedRoute>
        <NewTab />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    loader: protectedRouteLoader,
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    // Catch-all route redirects to /tasks
    // This triggers auth check for unknown routes
    path: '*',
    loader: protectedRouteLoader,
    element: (
      <ProtectedRoute>
        <NewTab />
      </ProtectedRoute>
    ),
  },
])
