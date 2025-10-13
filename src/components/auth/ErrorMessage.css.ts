import { keyframes, style } from '@vanilla-extract/css'

/**
 * Base error container styles
 */
const errorContainerBase = style({
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid',
  marginTop: '12px',
  animation: 'slideIn 0.3s ease-out',
})

/**
 * Cancellation error container (auto-dismiss, lighter style)
 */
export const errorContainerCancellation = style([
  errorContainerBase,
  {
    backgroundColor: '#fef3c7',
    borderColor: '#fbbf24',
    color: '#92400e',
  },
])

/**
 * Network error container (persistent, more prominent)
 */
export const errorContainerNetwork = style([
  errorContainerBase,
  {
    backgroundColor: '#fee2e2',
    borderColor: '#f87171',
    color: '#991b1b',
  },
])

/**
 * Unknown error container
 */
export const errorContainerUnknown = style([
  errorContainerBase,
  {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    color: '#7f1d1d',
  },
])

/**
 * Error content layout
 */
export const errorContent = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
})

/**
 * Error icon styles
 */
export const errorIcon = style({
  flexShrink: 0,
})

/**
 * Error message text
 */
export const errorMessage = style({
  flex: 1,
  fontSize: '14px',
  fontWeight: 500,
})

/**
 * Retry button styles (for network errors)
 */
export const retryButton = style({
  padding: '4px 12px',
  backgroundColor: '#fff',
  color: '#991b1b',
  border: '1px solid #f87171',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',

  ':hover': {
    backgroundColor: '#fef2f2',
  },

  ':active': {
    transform: 'scale(0.98)',
  },

  ':disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
})

/**
 * Close button styles
 */
export const closeButton = style({
  padding: '0 6px',
  backgroundColor: 'transparent',
  color: 'currentColor',
  border: 'none',
  fontSize: '20px',
  lineHeight: 1,
  cursor: 'pointer',
  opacity: 0.7,
  transition: 'opacity 0.2s ease',

  ':hover': {
    opacity: 1,
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
