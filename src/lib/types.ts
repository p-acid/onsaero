// Core entities
export interface Task {
  id: string
  user_id: string | null
  title: string
  completed: boolean
  created_at: string
  completed_at: string | null
  updated_at: string
  display_order: number
  sync_status?: 'synced' | 'pending' | 'error'
}

export interface DailyMetric {
  id: string
  user_id: string
  date: string
  tasks_created: number
  tasks_completed: number
  created_at: string
}

export interface UserPreferences {
  user_id: string
  show_completed_by_default: boolean
  theme: 'light' | 'dark' | 'auto'
  default_view: 'list' | 'dashboard'
  updated_at: string
}

// DTOs (Data Transfer Objects)
export interface NewTask {
  title: string
  user_id?: string
}

export interface UpdateTask {
  id: string
  title?: string
  completed?: boolean
  display_order?: number
}

// Computed/Aggregated types
export interface AllTimeMetrics {
  total_tasks: number
  completed_tasks: number
  active_tasks: number
  completion_rate: number
}

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

// Supabase database types
export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'sync_status'>
        Update: Partial<Omit<Task, 'id' | 'created_at' | 'sync_status'>>
      }
      daily_metrics: {
        Row: DailyMetric
        Insert: Omit<DailyMetric, 'id' | 'created_at'>
        Update: Partial<Omit<DailyMetric, 'id' | 'created_at'>>
      }
      user_preferences: {
        Row: UserPreferences
        Insert: Omit<UserPreferences, 'updated_at'>
        Update: Partial<Omit<UserPreferences, 'user_id'>>
      }
    }
    Functions: {
      get_all_time_metrics: {
        Args: Record<string, never>
        Returns: AllTimeMetrics
      }
    }
  }
}
