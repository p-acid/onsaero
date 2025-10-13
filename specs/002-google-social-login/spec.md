# Feature Specification: Google Social Login

**Feature Branch**: `002-google-social-login`
**Created**: 2025-10-13
**Status**: Draft
**Input**: User description: "구글 소셜로그인 기능을 추가해줘"

## Clarifications

### Session 2025-10-13

- Q: Should user authentication integrate with Supabase (existing backend) or use standalone Google OAuth? → A: NEEDS CLARIFICATION
- Q: Should tasks be synced per user account (requiring backend) or remain local with chrome.storage? → A: NEEDS CLARIFICATION
- Q: Should login be required to use the extension, or optional with enhanced features for logged-in users? → A: NEEDS CLARIFICATION
- Q: Which Google OAuth flow - Chrome Identity API (chrome.identity) or standard OAuth 2.0 flow? → A: NEEDS CLARIFICATION
- Q: When a user has existing local tasks and signs in for the first time, how should the migration prompt be presented? → A: Automatic migration with confirmation dialog (show dialog asking "Migrate your X local tasks to your account?" with Yes/No options)
- Q: What should happen when a user cancels the OAuth flow (closes the consent screen without authorizing)? → A: Return to extension with informational message (show brief "Sign-in cancelled" message that auto-dismisses after 3 seconds)
- Q: How should the extension behave when used in Chrome incognito mode? → A: Allow usage with session-only authentication (no persistence) - users can sign in but session clears when incognito window closes
- Q: What should happen when a network error occurs during sign-in (e.g., no internet connection)? → A: Show retry-capable error message - display "Network error. Check connection and try again." with a "Retry" button that re-attempts sign-in
- Q: What should happen when a user switches Google accounts (signs out of one Google account and signs in with a different one)? → A: Automatic task isolation with warning - show "Switching to [new email]. Previous account's tasks will no longer be visible." confirmation before completing sign-in

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Google Account Sign In (Priority: P1)

Users can sign in to the extension using their Google account, enabling personalized features and data synchronization across devices.

**Why this priority**: Foundation for user-specific features. Without authentication, per-user data persistence and sync are impossible.

**Independent Test**: Can be tested by clicking a "Sign in with Google" button, completing the OAuth flow, and verifying that the user's profile information is displayed in the extension.

**Acceptance Scenarios**:

1. **Given** the user is not signed in, **When** they open the extension, **Then** they see a "Sign in with Google" button prominently displayed
2. **Given** the user clicks "Sign in with Google", **When** they authorize the extension in the Google OAuth consent screen, **Then** they are redirected back to the extension and see their Google profile picture and name
3. **Given** the user is signed in, **When** they close and reopen the browser, **Then** they remain signed in without needing to authenticate again
4. **Given** the user is signed in, **When** they click a "Sign out" button, **Then** they are signed out and return to the unauthenticated state

---

### User Story 2 - User Profile Display (Priority: P2)

Users can see their Google account information (profile picture, name, email) within the extension, providing visual confirmation of their signed-in status.

**Why this priority**: Essential UX feedback but builds on P1. Users need authentication working first.

**Independent Test**: Can be tested by signing in and verifying that the user's Google profile data is correctly displayed in the extension UI.

**Acceptance Scenarios**:

1. **Given** the user is signed in, **When** they view the extension, **Then** they see their Google profile picture displayed
2. **Given** the user is signed in, **When** they hover over or click their profile picture, **Then** they see their name and email address
3. **Given** the user has a default Google avatar, **When** they are signed in, **Then** the extension displays the Google default avatar correctly
4. **Given** the user's profile picture fails to load, **When** the image request errors, **Then** a fallback initial-based avatar is shown

---

### User Story 3 - Task Data User Association (Priority: P3)

Tasks are associated with the signed-in user's account, enabling per-user task lists and future cross-device synchronization.

**Why this priority**: Adds value by personalizing data but not required for basic authentication. Can be delivered after auth is working.

**Independent Test**: Can be tested by signing in with different Google accounts and verifying that each user sees only their own tasks.

**Acceptance Scenarios**:

1. **Given** the user signs in for the first time, **When** they view their task list, **Then** they see an empty task list (no tasks from other users or local storage)
2. **Given** user A has created tasks while signed in, **When** they sign out and user B signs in, **Then** user B sees an empty task list (not user A's tasks)
3. **Given** a user has tasks in local chrome.storage, **When** they sign in for the first time, **Then** they see a confirmation dialog showing the count of local tasks with "Migrate to your account?" and Yes/No buttons
3a. **Given** the user accepts the migration prompt, **When** migration completes, **Then** all local tasks become associated with their user account and the dialog closes
3b. **Given** the user declines the migration prompt, **When** they click "No", **Then** local tasks remain unassociated and the dialog closes without migrating
4. **Given** a user is signed in and creates tasks, **When** they sign out, **Then** their tasks are no longer visible (remain in backend, not displayed locally)

---

### Edge Cases

- **OAuth flow cancellation**: When user closes OAuth consent screen without authorizing, extension returns to unauthenticated state and displays "Sign-in cancelled" message that auto-dismisses after 3 seconds
- **Permission denial**: When user denies required permissions in OAuth consent screen, treated same as cancellation with "Sign-in cancelled" message
- **Network errors during sign-in**: When network error occurs (no internet, timeout, server unreachable), extension displays "Network error. Check connection and try again." message with a "Retry" button that re-attempts the OAuth flow
- **Token expiry errors**: When access token expires, extension automatically refreshes using refresh token. If refresh fails due to network error, show same retry-capable error message
- What happens when the user's Google account is deleted or suspended?
- What happens when the user has local tasks before signing in for the first time? (Migration flow)
- **Account switching**: When user attempts to sign in with a different Google account while already signed in, extension displays confirmation: "Switching to [new email]. Previous account's tasks will no longer be visible." User must confirm to proceed. After confirmation, previous session is cleared and new account's tasks are loaded.
- How does the extension handle token refresh when access tokens expire?
- **Incognito mode**: Extension allows authentication in incognito mode but does not persist session to storage. When incognito window closes, user is signed out. Tasks created in incognito with authentication are stored in backend but session is not restored on next incognito session.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to sign in to the extension using their Google account via OAuth 2.0
- **FR-002**: Extension MUST securely store authentication tokens (access token, refresh token) using chrome.storage.local
- **FR-003**: Extension MUST display the user's Google profile picture and name when signed in
- **FR-004**: Extension MUST provide a "Sign out" button that clears authentication tokens and returns to unauthenticated state
- **FR-005**: Extension MUST persist authentication state across browser sessions (users remain signed in after closing browser)
- **FR-006**: Extension MUST handle OAuth flow cancellation by returning to unauthenticated state and displaying a "Sign-in cancelled" informational message that auto-dismisses after 3 seconds
- **FR-007**: Extension MUST handle network errors during OAuth by displaying "Network error. Check connection and try again." with a "Retry" button
- **FR-007a**: Extension MUST provide retry capability that re-attempts the OAuth flow when user clicks "Retry" button
- **FR-008**: Extension MUST refresh expired access tokens automatically using refresh tokens
- **FR-009**: Tasks MUST be associated with the signed-in user's account (user_id) when a user is authenticated
- **FR-010**: Extension MUST display a confirmation dialog on first sign-in if local tasks exist, showing task count and Yes/No migration options
- **FR-010a**: Extension MUST migrate all local tasks to user account when user confirms migration dialog
- **FR-010b**: Extension MUST preserve local tasks without migration when user declines migration dialog
- **FR-011**: Extension MUST hide user-specific tasks when no user is signed in
- **FR-012**: Extension MUST use Supabase Authentication (auth.signInWithOAuth) for Google authentication if backend integration is required
- **FR-013**: Extension MUST request only necessary OAuth scopes (profile, email) from Google
- **FR-014**: Extension MUST support authentication in incognito mode but MUST NOT persist session to storage
- **FR-014a**: Extension MUST detect incognito context and skip session persistence operations when in incognito mode
- **FR-014b**: Extension MUST clear in-memory session when incognito window closes
- **FR-015**: Extension MUST detect account switching attempts (signing in with different Google account while already signed in)
- **FR-015a**: Extension MUST display confirmation message showing new account email and warning that previous account's tasks will no longer be visible
- **FR-015b**: Extension MUST clear previous session and load new account's tasks only after user confirms account switch

### Key Entities

- **User**: Represents an authenticated user. Attributes include Google user ID (sub claim from JWT), email address, full name, profile picture URL, authentication tokens (access token, refresh token), token expiry timestamp, and sign-in timestamp.
- **AuthSession**: Represents the current authentication session. Attributes include session state (authenticated/unauthenticated), current user reference, token refresh status, and last authentication check timestamp.
- **Task (Updated)**: Existing Task entity now includes user_id attribute (foreign key to User) to associate tasks with specific users. Tasks without user_id remain local (for backward compatibility during migration).

### Assumptions

- Authentication uses standard OAuth 2.0 flow with Google Identity Platform
- Chrome Identity API (chrome.identity) may be used for simplified OAuth in Chrome extensions (NEEDS RESEARCH)
- Supabase is already configured and available for backend integration (existing .env.example shows Supabase configuration)
- Tasks will be migrated from chrome.storage.sync to Supabase database for per-user persistence (NEEDS RESEARCH)
- Extension requires "identity" permission in manifest.json for OAuth
- Users must have a Google account to use authenticated features
- Extension will support offline mode with task queueing for signed-in users (future enhancement)
- No multi-account support in MVP (single signed-in account at a time)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the Google sign-in flow within 10 seconds
- **SC-002**: Authentication state persists across 100% of browser restarts
- **SC-003**: User profile information (name, picture) displays within 500ms of sign-in completion
- **SC-004**: Token refresh happens automatically without user intervention with 99.9% success rate
- **SC-005**: OAuth errors are handled gracefully with user-friendly error messages (no raw error codes shown)
- **SC-006**: 95% of users successfully sign in on their first attempt
- **SC-007**: Task data isolation is 100% reliable (user A never sees user B's tasks)
- **SC-008**: Local task migration to user account completes within 3 seconds for up to 1000 tasks
