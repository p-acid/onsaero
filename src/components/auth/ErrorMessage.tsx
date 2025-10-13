import { useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import * as styles from './ErrorMessage.css'

/**
 * ErrorMessage Component
 * Displays authentication error messages with appropriate handling
 * - Cancellation errors: auto-dismiss after 3 seconds
 * - Network errors: persistent with retry button
 */
export function ErrorMessage() {
  const { error, errorType, loading, signInWithGoogle, clearError } =
    useAuthStore()

  // Auto-dismiss cancellation errors after 3 seconds
  useEffect(() => {
    if (error && errorType === 'cancellation') {
      const timer = setTimeout(() => {
        clearError()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [error, errorType, clearError])

  if (!error) {
    return null
  }

  return (
    <div
      className={
        errorType === 'cancellation'
          ? styles.errorContainerCancellation
          : errorType === 'network'
            ? styles.errorContainerNetwork
            : styles.errorContainerUnknown
      }
    >
      <div className={styles.errorContent}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.errorIcon}
          role="img"
          aria-label="Error icon"
        >
          <path
            d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM8.75 11.25H7.25V9.75H8.75V11.25ZM8.75 8.25H7.25V4.75H8.75V8.25Z"
            fill="currentColor"
          />
        </svg>

        <span className={styles.errorMessage}>{error}</span>

        {/* Show retry button for network errors */}
        {errorType === 'network' && (
          <button
            type="button"
            className={styles.retryButton}
            onClick={signInWithGoogle}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className={styles.spinnerIcon}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="Loading spinner"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.25"
                  />
                  <path
                    d="M12 2a10 10 0 0 1 10 10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
                Retrying...
              </>
            ) : (
              'Retry'
            )}
          </button>
        )}

        {/* Show close button for unknown errors */}
        {errorType === 'unknown' && (
          <button
            type="button"
            className={styles.closeButton}
            onClick={clearError}
            aria-label="Close error message"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
