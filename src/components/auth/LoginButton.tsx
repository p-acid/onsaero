import { useAuth } from '../../hooks/useAuth'
import * as styles from './LoginButton.css'

/**
 * LoginButton Component
 * Displays sign in button when user is not authenticated
 * Will be extended to show user profile and sign out when authenticated
 */
export function LoginButton() {
  const { isAuthenticated, loading, user, signInWithGoogle, signOut } =
    useAuth()

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.loadingSpinner}>
          <svg
            className={styles.spinnerIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Loading"
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
          Loading...
        </div>
      </div>
    )
  }

  // Show sign in button when not authenticated
  if (!isAuthenticated) {
    return (
      <div className={styles.authContainer}>
        <button
          type="button"
          className={styles.signInButton}
          onClick={signInWithGoogle}
          disabled={loading}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.59.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
    )
  }

  // Show user profile and sign out button when authenticated
  if (isAuthenticated && user) {
    // Get user metadata
    const fullName =
      user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
    const avatarUrl = user.user_metadata?.avatar_url
    const email = user.email

    // Get initials for fallback avatar
    const getInitials = (name: string) => {
      const parts = name.split(' ')
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`
      }
      return name.substring(0, 2)
    }

    return (
      <div className={styles.authContainer}>
        <div className={styles.profileContainer}>
          {/* User Avatar */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className={styles.userAvatar}
              onError={(e) => {
                // Hide image and show fallback on error
                e.currentTarget.style.display = 'none'
                if (e.currentTarget.nextElementSibling) {
                  ;(
                    e.currentTarget.nextElementSibling as HTMLElement
                  ).style.display = 'flex'
                }
              }}
            />
          ) : null}

          {/* Fallback Avatar (initials) */}
          <div
            className={styles.fallbackAvatar}
            style={{ display: avatarUrl ? 'none' : 'flex' }}
          >
            {getInitials(fullName)}
          </div>

          {/* User Info */}
          <div className={styles.userInfo}>
            <span className={styles.userName}>{fullName}</span>
            {email && <span className={styles.userEmail}>{email}</span>}
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          className={styles.signOutButton}
          onClick={signOut}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg
                className={styles.spinnerIcon}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Loading"
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
              Signing out...
            </>
          ) : (
            'Sign out'
          )}
        </button>
      </div>
    )
  }

  return null
}
