# API Contract: Supabase Backend

**Feature**: Task Management & Visualization Browser Extension
**Branch**: `001-`
**Date**: 2025-10-11

## Overview

This document defines the API contracts for Supabase backend interactions. The extension uses Supabase client SDK (not REST directly), but these contracts define the expected behavior and data structures.

---

## Authentication

### Method: Supabase Auth (Magic Link / OAuth)

**Providers**:
- Email (magic link, no password)
- Google OAuth (optional for MVP)

**Client Setup**:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)
```

**Auth Flow**:
```typescript
// Sign in with magic link
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: chrome.runtime.getURL('newtab.html')
  }
})

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Sync tasks from Supabase
  }
  if (event === 'SIGNED_OUT') {
    // Clear local storage
  }
})

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

**RLS Enforcement**:
- All queries automatically filter by `auth.uid()`
- No manual user_id filtering needed in application code

---

## Tasks API

### 1. Get All Tasks

**Method**: SELECT
**Table**: `tasks`

```typescript
// TypeScript SDK
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .order('display_order', { ascending: true })

// Response
type Response = Task[] | null
```

**Filters**:
```typescript
// Active tasks only
.select('*')
.eq('completed', false)

// Completed tasks only
.select('*')
.eq('completed', true)

// Tasks created in last 7 days
.select('*')
.gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
```

**Response Example**:
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "user-uuid",
    "title": "Buy groceries",
    "completed": false,
    "created_at": "2025-10-11T10:00:00Z",
    "completed_at": null,
    "updated_at": "2025-10-11T10:00:00Z",
    "display_order": 0
  }
]
```

---

### 2. Create Task

**Method**: INSERT
**Table**: `tasks`

```typescript
const { data, error } = await supabase
  .from('tasks')
  .insert({
    title: 'New task',
    user_id: user.id  // Auto-set by RLS in production
  })
  .select()
  .single()

// Response
type Response = Task | null
```

**Request Body**:
```typescript
interface CreateTaskRequest {
  title: string          // Required, 1-500 chars
  user_id?: string      // Optional (auto-set by RLS)
  display_order?: number // Optional (defaults to max + 1)
}
```

**Validation**:
- Title: non-empty, max 500 chars
- Auto-sets: id (UUID), created_at, updated_at
- display_order: defaults to current max + 1

**Response Example**:
```json
{
  "id": "new-uuid",
  "user_id": "user-uuid",
  "title": "New task",
  "completed": false,
  "created_at": "2025-10-11T11:00:00Z",
  "completed_at": null,
  "updated_at": "2025-10-11T11:00:00Z",
  "display_order": 5
}
```

**Errors**:
- Empty title: `"new row violates check constraint"`
- Title > 500 chars: `"value too long for type character varying(500)"`

---

### 3. Update Task

**Method**: UPDATE
**Table**: `tasks`

```typescript
const { data, error } = await supabase
  .from('tasks')
  .update({
    title: 'Updated title',
    completed: true
  })
  .eq('id', taskId)
  .select()
  .single()

// Response
type Response = Task | null
```

**Request Body**:
```typescript
interface UpdateTaskRequest {
  title?: string
  completed?: boolean
  display_order?: number
}
```

**Business Logic**:
- When `completed` changes to `true`: Set `completed_at` to now() (via trigger)
- When `completed` changes to `false`: Clear `completed_at` (via trigger)
- `updated_at` auto-updates (via trigger)

**Response Example**:
```json
{
  "id": "task-uuid",
  "title": "Updated title",
  "completed": true,
  "completed_at": "2025-10-11T12:00:00Z",
  "updated_at": "2025-10-11T12:00:00Z"
}
```

---

### 4. Delete Task

**Method**: DELETE
**Table**: `tasks`

```typescript
const { error } = await supabase
  .from('tasks')
  .delete()
  .eq('id', taskId)

// Response
type Response = null (success) | { error: PostgrestError }
```

**Notes**:
- Hard delete (no soft delete in MVP)
- RLS ensures users can only delete their own tasks
- Cascades to related metrics (future consideration)

---

### 5. Bulk Update (Reorder Tasks)

**Method**: Multiple UPDATEs (consider using RPC for performance)

```typescript
// Option 1: Multiple updates (simple)
const updates = tasks.map((task, index) =>
  supabase
    .from('tasks')
    .update({ display_order: index })
    .eq('id', task.id)
)
await Promise.all(updates)

// Option 2: RPC function (recommended for 100+ tasks)
const { error } = await supabase.rpc('reorder_tasks', {
  task_ids: tasks.map(t => t.id),
  new_orders: tasks.map((_, i) => i)
})
```

**RPC Function** (create in Supabase):
```sql
CREATE OR REPLACE FUNCTION reorder_tasks(task_ids UUID[], new_orders INT[])
RETURNS void AS $$
BEGIN
  FOR i IN 1..array_length(task_ids, 1) LOOP
    UPDATE tasks
    SET display_order = new_orders[i]
    WHERE id = task_ids[i] AND user_id = auth.uid();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Metrics API

### 1. Get Daily Metrics (Last 7 Days)

**Method**: SELECT
**Table**: `daily_metrics`

```typescript
const { data, error } = await supabase
  .from('daily_metrics')
  .select('*')
  .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  .order('date', { ascending: true })

// Response
type Response = DailyMetric[]
```

**Response Example**:
```json
[
  {
    "id": "metric-uuid",
    "user_id": "user-uuid",
    "date": "2025-10-05",
    "tasks_created": 3,
    "tasks_completed": 2,
    "created_at": "2025-10-05T00:00:00Z"
  },
  {
    "id": "metric-uuid-2",
    "user_id": "user-uuid",
    "date": "2025-10-06",
    "tasks_created": 5,
    "tasks_completed": 4,
    "created_at": "2025-10-06T00:00:00Z"
  }
]
```

---

### 2. Get All-Time Metrics (Aggregated)

**Method**: RPC (custom function)
**Function**: `get_all_time_metrics`

```typescript
const { data, error } = await supabase.rpc('get_all_time_metrics')

// Response
interface AllTimeMetricsResponse {
  total_tasks: number
  completed_tasks: number
  active_tasks: number
  completion_rate: number
}
```

**RPC Function**:
```sql
CREATE OR REPLACE FUNCTION get_all_time_metrics()
RETURNS TABLE(
  total_tasks BIGINT,
  completed_tasks BIGINT,
  active_tasks BIGINT,
  completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_tasks,
    COUNT(*) FILTER (WHERE completed = true)::BIGINT as completed_tasks,
    COUNT(*) FILTER (WHERE completed = false)::BIGINT as active_tasks,
    (COUNT(*) FILTER (WHERE completed = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100) as completion_rate
  FROM tasks
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Response Example**:
```json
{
  "total_tasks": 150,
  "completed_tasks": 120,
  "active_tasks": 30,
  "completion_rate": 80.0
}
```

---

### 3. Upsert Daily Metric

**Method**: INSERT ... ON CONFLICT UPDATE
**Table**: `daily_metrics`

```typescript
// Automatically called when task created/completed (via trigger or app logic)
const { error } = await supabase
  .from('daily_metrics')
  .upsert({
    user_id: user.id,
    date: new Date().toISOString().split('T')[0],
    tasks_created: 1,  // Increment
    tasks_completed: 0
  }, {
    onConflict: 'user_id,date',
    ignoreDuplicates: false
  })
```

**Database Trigger (Alternative)**:
```sql
-- Trigger to auto-update daily_metrics on task insert/update
CREATE OR REPLACE FUNCTION update_daily_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- On task creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO daily_metrics (user_id, date, tasks_created)
    VALUES (NEW.user_id, NEW.created_at::DATE, 1)
    ON CONFLICT (user_id, date) DO UPDATE
    SET tasks_created = daily_metrics.tasks_created + 1;
  END IF;

  -- On task completion
  IF TG_OP = 'UPDATE' AND OLD.completed = false AND NEW.completed = true THEN
    INSERT INTO daily_metrics (user_id, date, tasks_completed)
    VALUES (NEW.user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, date) DO UPDATE
    SET tasks_completed = daily_metrics.tasks_completed + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_metrics_trigger
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_daily_metrics();
```

---

## User Preferences API

### 1. Get User Preferences

**Method**: SELECT
**Table**: `user_preferences`

```typescript
const { data, error } = await supabase
  .from('user_preferences')
  .select('*')
  .single()

// Response
type Response = UserPreferences | null
```

**Response Example**:
```json
{
  "user_id": "user-uuid",
  "show_completed_by_default": false,
  "theme": "auto",
  "default_view": "list",
  "updated_at": "2025-10-11T10:00:00Z"
}
```

**Fallback**:
- If no preferences found: Use app defaults
- Auto-create on first preference update

---

### 2. Update User Preferences

**Method**: UPSERT
**Table**: `user_preferences`

```typescript
const { data, error } = await supabase
  .from('user_preferences')
  .upsert({
    user_id: user.id,
    show_completed_by_default: true,
    theme: 'dark'
  })
  .select()
  .single()

// Response
type Response = UserPreferences
```

**Request Body**:
```typescript
interface UpdatePreferencesRequest {
  show_completed_by_default?: boolean
  theme?: 'light' | 'dark' | 'auto'
  default_view?: 'list' | 'dashboard'
}
```

---

## Realtime Subscriptions

### 1. Subscribe to Task Changes

**Method**: Realtime channel subscription

```typescript
const channel = supabase
  .channel('tasks-channel')
  .on(
    'postgres_changes',
    {
      event: '*',  // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'tasks',
      filter: `user_id=eq.${user.id}`
    },
    (payload) => {
      console.log('Task change:', payload)
      // Update local state
      if (payload.eventType === 'INSERT') {
        addTaskToStore(payload.new)
      } else if (payload.eventType === 'UPDATE') {
        updateTaskInStore(payload.new)
      } else if (payload.eventType === 'DELETE') {
        removeTaskFromStore(payload.old.id)
      }
    }
  )
  .subscribe()

// Cleanup
channel.unsubscribe()
```

**Payload Example**:
```json
{
  "eventType": "INSERT",
  "new": {
    "id": "new-task-uuid",
    "title": "Task from another device",
    "completed": false,
    "created_at": "2025-10-11T12:00:00Z"
  },
  "old": {},
  "schema": "public",
  "table": "tasks"
}
```

---

### 2. Subscribe to Preferences Changes

```typescript
const prefChannel = supabase
  .channel('preferences-channel')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'user_preferences',
      filter: `user_id=eq.${user.id}`
    },
    (payload) => {
      // Update local preferences
      updatePreferencesInStore(payload.new)
      updateChromeStorage(payload.new)
    }
  )
  .subscribe()
```

---

## Error Handling

### Common Errors

| Error Code | Scenario | Handling |
|------------|----------|----------|
| `PGRST116` | Row not found | Return null, show "not found" message |
| `23505` | Unique violation | Show "already exists" error |
| `23503` | Foreign key violation | Show "invalid reference" error |
| `42501` | Permission denied (RLS) | Redirect to login |
| Network error | No internet | Use cached data, show offline banner |

**Error Response Format**:
```typescript
interface SupabaseError {
  message: string
  details: string
  hint: string
  code: string
}
```

**Example Handling**:
```typescript
const { data, error } = await supabase.from('tasks').insert(newTask)

if (error) {
  if (error.code === '23505') {
    toast.error('Task already exists')
  } else if (error.code === '42501') {
    router.push('/login')
  } else {
    toast.error('Failed to create task')
    console.error(error)
  }
}
```

---

## Rate Limiting & Quotas

**Supabase Free Tier Limits**:
- 500 MB database storage
- 2 GB bandwidth/month
- 50,000 monthly active users
- 500 MB file storage

**Extension-Specific Limits**:
- Max 10,000 tasks per user (enforced at app level)
- Max 100 daily metric records (auto-cleanup old data)
- Realtime: 200 concurrent connections

**Mitigation**:
- Use TanStack Query caching (reduce API calls)
- Batch operations where possible (bulk reorder)
- Implement optimistic updates (instant UI, eventual consistency)

---

## TypeScript Client Integration

**Generated Types** (from `supabase gen types typescript`):
```typescript
// src/lib/supabase-types.ts (auto-generated)
export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Task, 'id'>>
      }
      // ... other tables
    }
    Functions: {
      get_all_time_metrics: {
        Args: {}
        Returns: AllTimeMetricsResponse
      }
      reorder_tasks: {
        Args: { task_ids: string[], new_orders: number[] }
        Returns: void
      }
    }
  }
}

// Typed client
import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase-types'

export const supabase = createClient<Database>(url, key)
```

---

## Summary

**Endpoints Used**:
- `tasks` table: CRUD operations
- `daily_metrics` table: Read-only (auto-populated by triggers)
- `user_preferences` table: Read + Upsert
- RPC functions: `get_all_time_metrics`, `reorder_tasks`
- Realtime: Subscriptions for cross-device sync

**Best Practices**:
- Always use RLS (automatic via Supabase Auth)
- Leverage TanStack Query for caching/optimistic updates
- Use Realtime subscriptions for cross-device sync
- Generate TypeScript types from schema
- Handle offline scenarios with chrome.storage.sync fallback
