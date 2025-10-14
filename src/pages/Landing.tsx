/**
 * Landing Page Component
 *
 * Public landing page accessible without authentication
 * Shows welcome message and navigation options
 * Conditionally renders authenticated context when user is logged in
 * Automatically redirects authenticated users to /tasks
 *
 * @module pages/Landing
 */

import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

/**
 * Landing page component
 *
 * Features:
 * - Welcome message and app description
 * - Link to tasks (if authenticated) or login (if not)
 * - Authenticated navigation context (user email, link to tasks)
 * - Responsive layout
 * - Auto-redirect authenticated users to /tasks
 *
 * @returns {JSX.Element} Landing page element
 */
export function Landing() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  // Redirect authenticated users to /tasks
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/tasks', { replace: true })
    }
  }, [isAuthenticated, navigate])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'var(--color-background, #f5f5f5)',
      }}
    >
      {/* Header with authentication context (T033) */}
      {isAuthenticated && user && (
        <header
          style={{
            backgroundColor: 'var(--color-surface, white)',
            borderBottom: '1px solid var(--color-border, #e5e5e5)',
            padding: '16px 24px',
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--color-text-primary, #1a1a1a)',
              }}
            >
              Onsaero
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  color: 'var(--color-text-secondary, #666)',
                }}
              >
                {user.email}
              </span>
              <Link
                to="/tasks"
                style={{
                  fontSize: '14px',
                  color: 'var(--color-primary, #3b82f6)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Go to Tasks →
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            maxWidth: '600px',
            textAlign: 'center',
          }}
        >
          {/* App Logo/Title */}
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 700,
              color: 'var(--color-text-primary, #1a1a1a)',
              margin: '0 0 16px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Onsaero
          </h1>

          {/* Tagline */}
          <p
            style={{
              fontSize: '20px',
              color: 'var(--color-text-secondary, #666)',
              margin: '0 0 32px 0',
              lineHeight: 1.6,
            }}
          >
            Stay productive with effortless task management
          </p>

          {/* Description */}
          <p
            style={{
              fontSize: '16px',
              color: 'var(--color-text-secondary, #666)',
              margin: '0 0 40px 0',
              lineHeight: 1.6,
            }}
          >
            Capture your to-dos instantly every time you open a new tab. Track
            your progress, visualize your productivity, and stay focused on what
            matters most.
          </p>

          {/* CTA Button */}
          {isAuthenticated ? (
            <Link
              to="/tasks"
              style={{
                display: 'inline-block',
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: 600,
                color: 'white',
                backgroundColor: 'var(--color-primary, #3b82f6)',
                border: 'none',
                borderRadius: '8px',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              View My Tasks
            </Link>
          ) : (
            <Link
              to="/login"
              style={{
                display: 'inline-block',
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: 600,
                color: 'white',
                backgroundColor: 'var(--color-primary, #3b82f6)',
                border: 'none',
                borderRadius: '8px',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              Get Started
            </Link>
          )}

          {/* Features list */}
          <div
            style={{
              marginTop: '64px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px',
              textAlign: 'left',
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary, #1a1a1a)',
                  margin: '0 0 8px 0',
                }}
              >
                ⚡ Instant Capture
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--color-text-secondary, #666)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Add tasks quickly every time you open a new tab
              </p>
            </div>

            <div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary, #1a1a1a)',
                  margin: '0 0 8px 0',
                }}
              >
                📊 Track Progress
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--color-text-secondary, #666)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Visualize your productivity with beautiful charts
              </p>
            </div>

            <div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary, #1a1a1a)',
                  margin: '0 0 8px 0',
                }}
              >
                🔄 Always Synced
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--color-text-secondary, #666)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Access your tasks across all your devices
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: '24px',
          textAlign: 'center',
          borderTop: '1px solid var(--color-border, #e5e5e5)',
          backgroundColor: 'var(--color-surface, white)',
        }}
      >
        <p
          style={{
            fontSize: '14px',
            color: 'var(--color-text-tertiary, #999)',
            margin: 0,
          }}
        >
          © 2025 Onsaero. Built with React and Supabase.
        </p>
      </footer>
    </div>
  )
}
