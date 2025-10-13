import { keyframes, style } from '@vanilla-extract/css'

/**
 * Auth container styles
 */
export const authContainer = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
})

/**
 * Loading spinner styles
 */
export const loadingSpinner = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 16px',
  fontSize: '14px',
  color: '#6b7280',
  fontWeight: 500,
})

/**
 * Sign in button styles
 */
export const signInButton = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 20px',
  backgroundColor: '#fff',
  color: '#1f2937',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',

  ':hover': {
    backgroundColor: '#f9fafb',
    borderColor: '#9ca3af',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },

  ':active': {
    backgroundColor: '#f3f4f6',
    transform: 'scale(0.98)',
  },

  ':disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
})

/**
 * User profile container (authenticated state)
 */
export const profileContainer = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
})

/**
 * User avatar styles
 */
export const userAvatar = style({
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  border: '2px solid #e5e7eb',
  objectFit: 'cover',
})

/**
 * Fallback avatar styles (when image fails to load)
 */
export const fallbackAvatar = style({
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: '#3b82f6',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  fontWeight: 600,
  textTransform: 'uppercase',
})

/**
 * User info container
 */
export const userInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
})

/**
 * User name styles
 */
export const userName = style({
  fontSize: '14px',
  fontWeight: 600,
  color: '#1f2937',
})

/**
 * User email styles
 */
export const userEmail = style({
  fontSize: '12px',
  color: '#6b7280',
})

/**
 * Sign out button styles
 */
export const signOutButton = style({
  padding: '6px 12px',
  backgroundColor: '#fff',
  color: '#ef4444',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',

  ':hover': {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },

  ':active': {
    backgroundColor: '#fee2e2',
    transform: 'scale(0.98)',
  },

  ':disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
})

/**
 * Spinner icon animation
 */
const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
})

export const spinnerIcon = style({
  animation: `${spin} 1s linear infinite`,
})
