# Data Model: Google Social Login

**Feature**: Google Social Login (002-google-social-login)
**Date**: 2025-10-13
**Status**: Design Complete

## Overview

This document defines the data entities, relationships, and database schema for Google OAuth authentication in the Onsaero Tasks Chrome extension. The data model extends the existing schema to support user authentication, session management, and user-scoped task association.

---

## Entity Definitions

### 1. User (auth.users)

**Description**: Represents an authenticated user. Automatically managed by Supabase Auth.

**Source**: Supabase Auth (auto-generated table in `auth` schema)

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique user identifier |
| `email` | TEXT | UNIQUE, NOT NULL | User's Google email address |
| `email_confirmed_at` | TIMESTAMPTZ | NULLABLE | Timestamp of email verification |
| `last_sign_in_at` | TIMESTAMPTZ | NULLABLE | Last successful sign-in timestamp |
| `raw_user_meta_data` | JSONB | NOT NULL, DEFAULT '{}' | User profile from Google OAuth |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

**User Metadata Structure** (from Google OAuth):

```json
{
  "avatar_url": "https://lh3.googleusercontent.com/...",
  "email": "user@gmail.com",
  "email_verified": true,
  "full_name": "John Doe",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/...",
  "provider_id": "123456789",
  "sub": "123456789"
}
```

**Notes**:
- Cannot be directly queried from client-side (security restriction)
- Cannot add custom columns (managed by Supabase)
- Access via `supabase.auth.getUser()` or `auth.uid()` in RLS policies

---

### 2. AuthSession (Client-Side State)

**Description**: Represents the current authentication session. Stored in chrome.storage.local and managed by Supabase SDK.

**Source**: Chrome extension storage + Supabase session management

**Attributes**:

| Field | Type | Description |
|-------|------|-------------|
| `access_token` | STRING | JWT access token for API requests |
| `refresh_token` | STRING | Token for refreshing expired access tokens |
| `expires_at` | NUMBER | Unix timestamp when access token expires |
| `user` | Object | User profile object (subset of auth.users) |

**User Object Structure** (in session):

```typescript
interface SessionUser {
  id: string;
  email: string;
  user_metadata: {
    avatar_url?: string;
    full_name?: string;
    email_verified?: boolean;
  };
}
```

**Storage Location**: `chrome.storage.local.supabaseSession`

**Lifecycle**:
- Created: On successful OAuth sign-in
- Updated: On token refresh
- Deleted: On sign-out or session expiry

---

### 3. Task (Extended)

**Description**: Represents a user task. Extended to support user association.

**Source**: Supabase database (`public.tasks` table)

**Schema Changes**:

| Field | Type | Constraints | Change | Description |
|-------|------|-------------|--------|-------------|
| `user_id` | UUID | NULLABLE, FOREIGN KEY | **ADDED** | References auth.users(id) ON DELETE CASCADE |

**Full Schema** (updated):

```sql
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NEW
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for user_id queries
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
```

**Validation Rules**:
- `text`: Must not be empty (minimum 1 character)
- `user_id`: Must be NULL (anonymous) OR valid auth.users.id (authenticated)
- `display_order`: Must be unique per user (enforced by application logic)
- `completed_at`: Must be set when `completed = true`, NULL when `completed = false`

**State Transitions**:

```
[Anonymous Task]
  user_id = NULL
  ↓ (User signs in + migrates)
[User Task]
  user_id = <user.id>
  ↓ (User deletes account)
[Deleted] (CASCADE)
```

**Row Level Security (RLS)**:

```sql
-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Authenticated users can only access their own tasks
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own tasks" ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Anonymous users can access tasks without user_id (local tasks)
CREATE POLICY "Anonymous users can access local tasks" ON tasks
  FOR ALL
  TO anon
  USING (user_id IS NULL);
```

---

### 4. DailyMetrics (Extended)

**Description**: Daily task completion metrics. Extended to support per-user metrics.

**Source**: Supabase database (`public.daily_metrics` table)

**Schema Changes**:

| Field | Type | Constraints | Change | Description |
|-------|------|-------------|--------|-------------|
| `user_id` | UUID | NULLABLE, FOREIGN KEY | **ADDED** | References auth.users(id) ON DELETE CASCADE |

**Full Schema** (updated):

```sql
CREATE TABLE public.daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NEW
  date DATE NOT NULL,
  total_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  completion_rate NUMERIC(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)  -- One record per user per day
);

-- Add index for user_id + date queries
CREATE INDEX idx_daily_metrics_user_date ON daily_metrics(user_id, date);
```

**RLS Policies**:

```sql
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own metrics" ON daily_metrics
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own metrics" ON daily_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Anonymous users can access local metrics" ON daily_metrics
  FOR ALL
  TO anon
  USING (user_id IS NULL);
```

---

### 5. UserPreferences (Extended)

**Description**: User-specific preferences. Extended to support authenticated users.

**Source**: Supabase database (`public.user_preferences` table)

**Schema Changes**:

| Field | Type | Constraints | Change | Description |
|-------|------|-------------|--------|-------------|
| `user_id` | UUID | NULLABLE, FOREIGN KEY | **MODIFIED** | Now references auth.users(id) instead of being a generic UUID |

**Full Schema** (updated):

```sql
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- MODIFIED FK
  show_completed_tasks BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraint: one preference per user
CREATE UNIQUE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

**RLS Policies**:

```sql
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Anonymous users can access local preferences" ON user_preferences
  FOR ALL
  TO anon
  USING (user_id IS NULL);
```

---

## Entity Relationships

```
┌──────────────────┐
│   auth.users     │
│ (Supabase Auth)  │
│                  │
│ - id (PK)        │
│ - email          │
│ - raw_user_meta  │
└────────┬─────────┘
         │
         │ 1:N (ON DELETE CASCADE)
         │
         ├─────────────────────────────┐
         │                             │
         ▼                             ▼
┌─────────────────┐          ┌───────────────────┐
│     tasks       │          │  daily_metrics    │
│                 │          │                   │
│ - id (PK)       │          │ - id (PK)         │
│ - user_id (FK)  │          │ - user_id (FK)    │
│ - text          │          │ - date            │
│ - completed     │          │ - total_tasks     │
└─────────────────┘          └───────────────────┘
         │
         │ 1:1
         │
         ▼
┌─────────────────────┐
│ user_preferences    │
│                     │
│ - id (PK)           │
│ - user_id (FK)      │
│ - show_completed    │
└─────────────────────┘
```

**Relationship Descriptions**:

1. **User → Tasks** (1:N)
   - One user can have many tasks
   - Tasks with `user_id = NULL` are anonymous/local tasks
   - Cascading delete: When user is deleted, all their tasks are deleted

2. **User → DailyMetrics** (1:N)
   - One user can have many daily metric records
   - One record per user per day (enforced by UNIQUE constraint)
   - Cascading delete: When user is deleted, all their metrics are deleted

3. **User → UserPreferences** (1:1)
   - One user has one preferences record
   - Auto-created on first sign-in (via trigger)
   - Cascading delete: When user is deleted, preferences are deleted

---

## Migration Strategy

### Phase 1: Add user_id Column

```sql
-- Migration: 003_add_user_authentication.sql

-- Step 1: Add user_id to tasks
ALTER TABLE public.tasks
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Add index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Step 3: Add user_id to daily_metrics
ALTER TABLE public.daily_metrics
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 4: Update unique constraint on daily_metrics
DROP INDEX IF EXISTS idx_daily_metrics_date;
CREATE UNIQUE INDEX idx_daily_metrics_user_date ON daily_metrics(user_id, date);

-- Step 5: Modify user_preferences FK (if needed)
-- (Already has user_id, just ensure FK is correct)
ALTER TABLE public.user_preferences
DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

ALTER TABLE public.user_preferences
ADD CONSTRAINT user_preferences_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

### Phase 2: Add RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Tasks policies (see Entity 3 above)
-- DailyMetrics policies (see Entity 4 above)
-- UserPreferences policies (see Entity 5 above)
```

### Phase 3: Migration Functions

```sql
-- Function to migrate local tasks to user account
CREATE OR REPLACE FUNCTION public.migrate_local_tasks_to_user(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  migrated_count INTEGER;
BEGIN
  -- Update all NULL user_id tasks to the authenticated user
  UPDATE public.tasks
  SET user_id = p_user_id
  WHERE user_id IS NULL;

  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.migrate_local_tasks_to_user TO authenticated;

-- Function to check if local tasks exist
CREATE OR REPLACE FUNCTION public.has_local_tasks()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.tasks WHERE user_id IS NULL LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.has_local_tasks TO authenticated, anon;
```

### Phase 4: Auto-create User Preferences

```sql
-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, show_completed_tasks)
  VALUES (NEW.id, true)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## TypeScript Type Definitions

### Generated from Supabase Schema

```typescript
// src/lib/database.types.ts (auto-generated)

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          user_id: string | null;  // UPDATED: Now nullable
          text: string;
          completed: boolean;
          display_order: number;
          created_at: string;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;  // UPDATED: Optional for insert
          text: string;
          completed?: boolean;
          display_order: number;
          created_at?: string;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          text?: string;
          completed?: boolean;
          display_order?: number;
          created_at?: string;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      daily_metrics: {
        Row: {
          id: string;
          user_id: string | null;  // UPDATED
          date: string;
          total_tasks: number;
          completed_tasks: number;
          completion_rate: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          date: string;
          total_tasks?: number;
          completed_tasks?: number;
          completion_rate?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          date?: string;
          total_tasks?: number;
          completed_tasks?: number;
          completion_rate?: number | null;
          created_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string | null;
          show_completed_tasks: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          show_completed_tasks?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          show_completed_tasks?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      migrate_local_tasks_to_user: {
        Args: { p_user_id: string };
        Returns: number;
      };
      has_local_tasks: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
  };
}
```

### Application-Level Types

```typescript
// src/lib/types.ts

import type { User as SupabaseUser } from '@supabase/supabase-js';

// User type (extends Supabase User)
export interface User extends SupabaseUser {
  user_metadata: {
    avatar_url?: string;
    full_name?: string;
    email_verified?: boolean;
  };
}

// Auth session stored in chrome.storage.local
export interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
    user_metadata: {
      avatar_url?: string;
      full_name?: string;
      email_verified?: boolean;
    };
  };
}

// Auth state (Zustand store)
export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  // Actions
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

// Task with user context
export interface Task {
  id: string;
  user_id: string | null;
  text: string;
  completed: boolean;
  display_order: number;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

// New task creation (without user_id - added automatically)
export interface NewTask {
  text: string;
  completed?: boolean;
  display_order: number;
}
```

---

## Data Access Patterns

### 1. Fetch User Tasks (Authenticated)

```typescript
// Automatic filtering by user_id via RLS
const { data: tasks, error } = await supabase
  .from('tasks')
  .select('*')
  .order('display_order', { ascending: true });

// RLS automatically adds: WHERE user_id = auth.uid()
```

### 2. Create Task (Authenticated)

```typescript
const { data: { user } } = await supabase.auth.getUser();

const { data, error } = await supabase
  .from('tasks')
  .insert({
    text: 'New task',
    display_order: 0,
    user_id: user?.id  // Must match authenticated user
  })
  .select()
  .single();

// RLS enforces: user_id = auth.uid()
```

### 3. Migrate Local Tasks

```typescript
const { data, error } = await supabase
  .rpc('migrate_local_tasks_to_user');

// Returns count of migrated tasks
console.log(`Migrated ${data} tasks`);
```

### 4. Check for Local Tasks

```typescript
const { data: hasLocal, error } = await supabase
  .rpc('has_local_tasks');

if (hasLocal) {
  // Show migration prompt
}
```

### 5. Get User Profile

```typescript
// From Supabase session
const { data: { user } } = await supabase.auth.getUser();

const profile = {
  id: user.id,
  email: user.email,
  fullName: user.user_metadata.full_name,
  avatarUrl: user.user_metadata.avatar_url,
  emailVerified: user.user_metadata.email_verified
};
```

---

## Validation Rules Summary

### Tasks
- `text`: Required, min length 1
- `user_id`: Must be NULL (anon) OR valid auth.users.id (auth)
- `display_order`: Unique per user
- `completed_at`: NULL when not completed, timestamp when completed

### DailyMetrics
- `date`: Required, unique per user
- `total_tasks`: Non-negative integer
- `completed_tasks`: ≤ total_tasks
- `completion_rate`: 0-100 (derived: completed/total * 100)

### UserPreferences
- `user_id`: One record per user (unique constraint)
- `show_completed_tasks`: Boolean (default true)

---

## Data Retention & Cleanup

### On User Sign-Out
- Session data cleared from `chrome.storage.local`
- Tasks remain in database (user can sign in again)
- No data deletion

### On User Account Deletion
- All user data deleted via CASCADE:
  - tasks (user_id FK)
  - daily_metrics (user_id FK)
  - user_preferences (user_id FK)
- Profile in auth.users deleted
- Cannot be recovered

### Anonymous/Local Tasks
- Remain in database with `user_id = NULL`
- Can be migrated to user account on first sign-in
- Or deleted manually by user

---

## Performance Considerations

### Indexes

```sql
-- Required indexes for query performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_daily_metrics_user_date ON daily_metrics(user_id, date);
CREATE UNIQUE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

### Query Optimization

- RLS policies use `(SELECT auth.uid())` for better performance vs bare `auth.uid()`
- Indexes on foreign keys (user_id) optimize JOIN operations
- UNIQUE constraints prevent duplicate data

---

## Conclusion

This data model extends the existing Onsaero Tasks schema to support Google OAuth authentication while maintaining backward compatibility with anonymous users. The design follows Supabase best practices for Row Level Security, foreign key constraints, and user-scoped data access.

**Key Design Decisions**:
1. ✅ Use Supabase `auth.users` table (no custom profile table for MVP)
2. ✅ Make `user_id` nullable to support migration from local tasks
3. ✅ Implement RLS policies for automatic user-scoped filtering
4. ✅ Use ON DELETE CASCADE for automatic cleanup
5. ✅ Store session in chrome.storage.local for persistence
6. ✅ Provide migration function for local → user task transition
