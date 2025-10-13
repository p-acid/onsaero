import type { Session, User } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Authentication types
export type { Session, User } from '@supabase/supabase-js'

/**
 * Stored session data for Chrome extension storage
 * Minimal subset needed for session persistence
 */
export interface StoredSession {
  access_token: string
  refresh_token: string
  expires_at: number
  user: {
    id: string
    email: string
    user_metadata: {
      avatar_url?: string
      full_name?: string
      email_verified?: boolean
    }
  }
}

/**
 * Error types for auth operations
 */
export type AuthErrorType = 'cancellation' | 'network' | 'unknown'

/**
 * Authentication state for Zustand store
 */
export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  errorType?: AuthErrorType

  // Actions
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  clearError: () => void
}

/**
 * Auth message types for Chrome runtime messaging
 */
export interface AuthMessage {
  type: 'AUTH_SUCCESS' | 'AUTH_ERROR' | 'AUTH_STATE_CHANGE' | 'GET_SESSION'
  user?: User
  session?: Session
  error?: string
  event?: string
}

// Core entities - using Supabase generated types
export type Task = Database['public']['Tables']['tasks']['Row'] & {
  sync_status?: 'synced' | 'pending' | 'error'
}

export type DailyMetric = Database['public']['Tables']['daily_metrics']['Row']

export type UserPreferences =
  Database['public']['Tables']['user_preferences']['Row']

// DTOs (Data Transfer Objects) - using Supabase generated types
export type NewTask = Omit<
  Database['public']['Tables']['tasks']['Insert'],
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'completed'
  | 'completed_at'
  | 'display_order'
>

export interface UpdateTask {
  id: string
  title?: string
  completed?: boolean
  completed_at?: string | null
  display_order?: number
}

// Computed/Aggregated types - using Supabase generated types
export type AllTimeMetrics =
  Database['public']['Functions']['get_all_time_metrics']['Returns']

export interface WeeklyMetrics {
  daily_breakdown: DailyMetric[]
  total_created: number
  total_completed: number
  avg_daily_completion: number
}

// Storage types
export interface ChromeStorageData {
  tasks: Task[]
  last_sync: string
  user_id?: string
}

export interface ChromeStoragePreferences {
  preferences: UserPreferences
}

// Re-export Database type from database.types for convenience
export type { Database } from './database.types'
