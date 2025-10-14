/**
 * Login Page Component
 *
 * Public login page with Google OAuth authentication
 * Displays session expiration messages based on router state
 * Handles post-login redirect to original destination
 *
 * @module pages/Login
 */

import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LoginButton } from '../components/auth/LoginButton'
import type { RouterLocationState } from '../lib/types'
import { useAuthStore } from '../stores/authStore'

/**
 * Login page with OAuth authentication
 *
 * Features:
 * - Google OAuth login button
 * - Session expiration message display
 * - Post-login redirect to original destination
 * - Automatic redirect if already authenticated
 *
 * @returns {JSX.Element} Login page element
 */
export function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  // Get router state for redirect and reason
  const state = location.state as RouterLocationState | null
  const from = state?.from || '/tasks'
  const reason = state?.reason

  // Redirect to original destination if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, from, navigate])

  // Determine message based on redirect reason
  const getMessage = () => {
    switch (reason) {
      case 'session_expired':
        return 'Your session has expired. Please log in again.'
      case 'unauthorized':
        return 'Please log in to access this page.'
      case 'service_unavailable':
        return 'Authentication service is temporarily unavailable. Please try again later.'
      default:
        return 'Sign in to continue'
    }
  }

  const message = getMessage()
  const isError =
    reason === 'session_expired' || reason === 'service_unavailable'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: 'var(--color-background, #f5f5f5)',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          backgroundColor: 'var(--color-surface, white)',
          borderRadius: '8px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* App Logo/Title */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 600,
              color: 'var(--color-text-primary, #1a1a1a)',
              margin: '0 0 8px 0',
            }}
          >
            Onsaero
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary, #666)',
              margin: 0,
            }}
          >
            Task management for productivity
          </p>
        </div>

        {/* Message Display (T027) */}
        {reason && (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: '20px',
              borderRadius: '6px',
              backgroundColor: isError
                ? 'var(--color-error-background, #fef2f2)'
                : 'var(--color-info-background, #eff6ff)',
              border: `1px solid ${
                isError
                  ? 'var(--color-error-border, #fecaca)'
                  : 'var(--color-info-border, #bfdbfe)'
              }`,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: isError
                  ? 'var(--color-error-text, #991b1b)'
                  : 'var(--color-info-text, #1e40af)',
                lineHeight: 1.5,
              }}
            >
              {message}
            </p>
          </div>
        )}

        {!reason && (
          <p
            style={{
              textAlign: 'center',
              color: 'var(--color-text-secondary, #666)',
              fontSize: '14px',
              marginBottom: '20px',
            }}
          >
            {message}
          </p>
        )}

        {/* Login Button */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <LoginButton />
        </div>

        {/* Post-login redirect info */}
        {from !== '/tasks' && (
          <p
            style={{
              textAlign: 'center',
              fontSize: '12px',
              color: 'var(--color-text-tertiary, #999)',
              marginTop: '16px',
              marginBottom: 0,
            }}
          >
            You'll be redirected to {from} after signing in
          </p>
        )}
      </div>
    </div>
  )
}
