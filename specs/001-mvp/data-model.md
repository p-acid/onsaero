# Data Model: Task Management Browser Extension

**Feature**: Task Management & Visualization Browser Extension
**Branch**: `001-`
**Date**: 2025-10-11

## Overview

This document defines the data models, relationships, validation rules, and state transitions for the task management extension. Models are designed for both Supabase (PostgreSQL) and chrome.storage.sync compatibility.

---

## Core Entities

### 1. Task

Represents a single to-do item with completion tracking.

**TypeScript Type**:
```typescript
interface Task {
  id: string                    // UUID v4
  user_id: string              // Supabase user ID (for auth, nullable for local-only)
  title: string                // Task description (max 500 chars)
  completed: boolean           // Completion status
  created_at: string           // ISO 8601 timestamp
  completed_at: string | null  // ISO 8601 timestamp (null if not completed)
  updated_at: string           // ISO 8601 timestamp (for sync conflict resolution)
  display_order: number        // Integer for manual sorting (0-based)
  sync_status: 'synced' | 'pending' | 'error'  // Local sync state (not in Supabase)
}

// For creating new tasks
interface NewTask {
  title: string
  user_id?: string
}
```

**Supabase Schema (PostgreSQL)**:
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 500),
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Index for fast queries
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_completed ON tasks(completed);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

**chrome.storage.sync Schema**:
```typescript
// Stored as single object to minimize sync operations
interface ChromeStorageData {
  tasks: Task[]  // All tasks (active + completed)
  last_sync: string  // ISO 8601 timestamp of last Supabase sync
  user_id?: string  // Current user ID (for multi-device sync)
}
```

**Validation Rules**:
- `title`: Required, 1-500 characters, non-empty after trim
- `id`: Auto-generated UUID v4
- `created_at`: Auto-set on creation, immutable
- `completed_at`: Set when `completed` changes to true, null when false
- `updated_at`: Auto-updated on any change (for conflict resolution)
- `display_order`: Non-negative integer, unique per user (for drag-drop sorting)

**State Transitions**:
```
[New] --create--> [Active]
[Active] --complete--> [Completed]
[Completed] --uncomplete--> [Active]
[Active/Completed] --delete--> [Deleted] (soft delete via RLS)
```

**Business Rules**:
- Task title cannot be empty or whitespace-only
- Completed tasks set `completed_at` timestamp
- Uncompleting a task clears `completed_at`
- Tasks are soft-deleted (user can implement hard delete later)
- Maximum 10,000 tasks per user (enforced at app level, not DB)

---

### 2. DailyMetric

Aggregated daily task completion statistics for dashboard visualizations.

**TypeScript Type**:
```typescript
interface DailyMetric {
  id: string              // UUID v4
  user_id: string        // Supabase user ID
  date: string           // ISO 8601 date (YYYY-MM-DD)
  tasks_created: number  // Count of tasks created this day
  tasks_completed: number // Count of tasks completed this day
  created_at: string     // ISO 8601 timestamp
}
```

**Supabase Schema (PostgreSQL)**:
```sql
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tasks_created INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Index for date range queries (weekly/monthly)
CREATE INDEX idx_daily_metrics_user_date ON daily_metrics(user_id, date DESC);

-- RLS
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own metrics"
  ON daily_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
  ON daily_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metrics"
  ON daily_metrics FOR UPDATE
  USING (auth.uid() = user_id);
```

**Derivation Logic**:
- `tasks_created`: Incremented when task created (trigger on tasks table)
- `tasks_completed`: Incremented when task marked complete (trigger on tasks table)
- Metrics calculated via database triggers or application-level aggregation

**Storage**:
- Supabase only (not in chrome.storage.sync due to size)
- Dashboard fetches last 7 days + all-time aggregates on demand
- TanStack Query caches for 5 minutes

---

### 3. UserPreferences

User-specific settings and UI state.

**TypeScript Type**:
```typescript
interface UserPreferences {
  user_id: string
  show_completed_by_default: boolean  // Toggle state for completed tasks visibility
  theme: 'light' | 'dark' | 'auto'   // Theme preference (future feature)
  default_view: 'list' | 'dashboard' // Landing view when opening new tab
  updated_at: string
}
```

**Supabase Schema (PostgreSQL)**:
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  show_completed_by_default BOOLEAN NOT NULL DEFAULT false,
  theme TEXT NOT NULL DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
  default_view TEXT NOT NULL DEFAULT 'list' CHECK (default_view IN ('list', 'dashboard')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);
```

**chrome.storage.sync Schema**:
```typescript
interface ChromeStoragePreferences {
  preferences: UserPreferences
}
```

**Storage Strategy**:
- Stored in both Supabase (source of truth) and chrome.storage.sync (fast access)
- Synced on change via Supabase Realtime
- Zustand store provides in-memory cache

---

## Relationships

```
User (Supabase Auth)
  └── 1:N → Tasks
  └── 1:N → DailyMetrics
  └── 1:1 → UserPreferences
```

**Notes**:
- No explicit User table (managed by Supabase Auth)
- All tables reference `auth.users(id)` with CASCADE delete
- Tasks and metrics are isolated per user via RLS

---

## Aggregated Data (Computed)

### AllTimeMetrics

Computed on-the-fly from tasks table (not stored).

**TypeScript Type**:
```typescript
interface AllTimeMetrics {
  total_tasks: number
  completed_tasks: number
  active_tasks: number
  completion_rate: number  // Percentage (0-100)
}
```

**Query (Supabase)**:
```sql
-- All-time metrics
SELECT
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE completed = true) as completed_tasks,
  COUNT(*) FILTER (WHERE completed = false) as active_tasks,
  (COUNT(*) FILTER (WHERE completed = true)::float / NULLIF(COUNT(*), 0) * 100) as completion_rate
FROM tasks
WHERE user_id = $1;
```

### WeeklyMetrics

Last 7 days aggregated from daily_metrics table.

**TypeScript Type**:
```typescript
interface WeeklyMetrics {
  daily_breakdown: DailyMetric[]  // 7 days of data
  total_created: number
  total_completed: number
  avg_daily_completion: number
}
```

**Query (Supabase)**:
```sql
-- Last 7 days metrics
SELECT
  date,
  tasks_created,
  tasks_completed
FROM daily_metrics
WHERE user_id = $1
  AND date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date ASC;
```

---

## Data Sync Strategy

### Hybrid Storage Architecture

**chrome.storage.sync** (Local Cache):
- Fast read/write for UI responsiveness
- 100KB quota (monitor usage)
- Syncs across Chrome instances when user signed in
- Stores: tasks, preferences, last_sync timestamp

**Supabase** (Source of Truth):
- Persistent storage, no quota limits (free tier: 500MB)
- Cross-device sync via Realtime
- Stores: tasks, daily_metrics, user_preferences

### Sync Flow

**1. Initial Load**:
```
1. Read from chrome.storage.sync (instant UI)
2. Fetch from Supabase in background
3. Merge tasks (server wins on conflict based on updated_at)
4. Update chrome.storage.sync + Zustand store
```

**2. User Action (Add/Edit/Delete Task)**:
```
1. Update Zustand store (optimistic UI)
2. Write to chrome.storage.sync
3. Mutate via TanStack Query (POST/PATCH/DELETE to Supabase)
4. On success: Update chrome.storage.sync with server response
5. On error: Rollback Zustand + chrome.storage.sync, show error
```

**3. Cross-Tab Sync (Same Device)**:
```
chrome.storage.onChanged listener →
  Update Zustand store →
  Re-render UI
```

**4. Cross-Device Sync**:
```
Supabase Realtime subscription (WebSocket) →
  Fetch updated tasks →
  Merge with chrome.storage.sync →
  Update Zustand store
```

### Conflict Resolution

**Rules**:
- Server (Supabase) is source of truth
- Last-write-wins based on `updated_at` timestamp
- If local `updated_at` > server `updated_at`: Push local to server
- If server `updated_at` > local `updated_at`: Pull server to local
- If timestamps equal: Server wins (tie-breaker)

**Implementation**:
```typescript
function mergeTasks(local: Task[], server: Task[]): Task[] {
  const merged = new Map<string, Task>()

  // Add all server tasks (server is source of truth)
  server.forEach(task => merged.set(task.id, task))

  // Merge local tasks (only if newer)
  local.forEach(localTask => {
    const serverTask = merged.get(localTask.id)
    if (!serverTask || new Date(localTask.updated_at) > new Date(serverTask.updated_at)) {
      merged.set(localTask.id, localTask)
    }
  })

  return Array.from(merged.values()).sort((a, b) => a.display_order - b.display_order)
}
```

---

## Storage Quota Management

### chrome.storage.sync Limits

**Constraints**:
- Total: 100KB (102,400 bytes)
- Per item: 8KB
- Max items: 512

**Monitoring**:
```typescript
async function checkStorageUsage() {
  const bytes = await chrome.storage.sync.getBytesInUse()
  const limit = chrome.storage.sync.QUOTA_BYTES // 102400
  const usage = (bytes / limit) * 100

  if (usage > 80) {
    console.warn(`Storage usage at ${usage.toFixed(1)}%`)
    // Suggest cleanup: remove old completed tasks from local storage
  }

  return { bytes, limit, usage }
}
```

**Mitigation Strategy**:
- Only store active tasks + recent completed tasks (last 30 days) in chrome.storage.sync
- Older completed tasks stay in Supabase only
- Load historical tasks on-demand when user views "All Completed"

---

## TypeScript Type Definitions

**Central Types File** (`src/lib/types.ts`):

```typescript
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

// Supabase generated types (from `supabase gen types typescript`)
export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Task, 'id' | 'created_at'>>
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
  }
}
```

---

## Validation & Constraints Summary

| Field | Rules |
|-------|-------|
| Task.title | Required, 1-500 chars, non-empty after trim |
| Task.id | UUID v4, auto-generated |
| Task.completed_at | Set when completed=true, null otherwise |
| Task.display_order | Non-negative integer, unique per user |
| DailyMetric.date | ISO date (YYYY-MM-DD), unique per user |
| UserPreferences.theme | Enum: 'light' \| 'dark' \| 'auto' |
| UserPreferences.default_view | Enum: 'list' \| 'dashboard' |

**Storage Constraints**:
- chrome.storage.sync: 100KB total
- Supabase free tier: 500MB database
- Max tasks per user: 10,000 (app-level limit)

---

## Next Steps

1. Generate API contracts (REST endpoints for Supabase interaction)
2. Implement Supabase migrations in `supabase/migrations/`
3. Generate TypeScript types with `supabase gen types typescript`
4. Implement data access layer in `src/api/`
5. Wire up Zustand stores + TanStack Query hooks
