-- Migration: Add user authentication support
-- Description: Add user_id columns to tasks and daily_metrics tables, enable RLS, and create migration functions
-- Created: 2025-10-13

-- ============================================================================
-- Step 1: Add user_id columns
-- ============================================================================

-- Add user_id to tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to daily_metrics table
ALTER TABLE public.daily_metrics
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================================
-- Step 2: Add indexes for query performance
-- ============================================================================

-- Index for tasks.user_id (improves user-specific queries)
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);

-- Composite index for daily_metrics (user_id + date)
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON public.daily_metrics(user_id, date);

-- Update unique constraint on daily_metrics to include user_id
DROP INDEX IF EXISTS daily_metrics_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_metrics_user_date_unique ON public.daily_metrics(user_id, date);

-- ============================================================================
-- Step 3: Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 4: RLS Policies for tasks table
-- ============================================================================

-- Drop existing policies if they exist (to make migration idempotent)
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anonymous users can access local tasks" ON public.tasks;

-- Policy: Authenticated users can view their own tasks
CREATE POLICY "Users can view their own tasks" ON public.tasks
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Policy: Authenticated users can insert their own tasks
CREATE POLICY "Users can insert their own tasks" ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Authenticated users can update their own tasks
CREATE POLICY "Users can update their own tasks" ON public.tasks
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Authenticated users can delete their own tasks
CREATE POLICY "Users can delete their own tasks" ON public.tasks
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Policy: Anonymous users can access tasks without user_id (local tasks)
CREATE POLICY "Anonymous users can access local tasks" ON public.tasks
  FOR ALL
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

-- ============================================================================
-- Step 5: RLS Policies for daily_metrics table
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own metrics" ON public.daily_metrics;
DROP POLICY IF EXISTS "Users can insert their own metrics" ON public.daily_metrics;
DROP POLICY IF EXISTS "Users can update their own metrics" ON public.daily_metrics;
DROP POLICY IF EXISTS "Anonymous users can access local metrics" ON public.daily_metrics;

-- Policy: Authenticated users can view their own metrics
CREATE POLICY "Users can view their own metrics" ON public.daily_metrics
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Policy: Authenticated users can insert their own metrics
CREATE POLICY "Users can insert their own metrics" ON public.daily_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Authenticated users can update their own metrics
CREATE POLICY "Users can update their own metrics" ON public.daily_metrics
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Anonymous users can access metrics without user_id
CREATE POLICY "Anonymous users can access local metrics" ON public.daily_metrics
  FOR ALL
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

-- ============================================================================
-- Step 6: Migration Functions
-- ============================================================================

-- Function: Migrate local tasks to authenticated user account
CREATE OR REPLACE FUNCTION public.migrate_local_tasks_to_user(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  migrated_count INTEGER;
BEGIN
  -- Update all tasks with NULL user_id to the provided user_id
  UPDATE public.tasks
  SET user_id = p_user_id
  WHERE user_id IS NULL;

  -- Get the count of updated rows
  GET DIAGNOSTICS migrated_count = ROW_COUNT;

  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.migrate_local_tasks_to_user(UUID) TO authenticated;

-- Function: Check if local tasks exist (user_id IS NULL)
CREATE OR REPLACE FUNCTION public.has_local_tasks()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.tasks
    WHERE user_id IS NULL
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.has_local_tasks() TO authenticated, anon;

-- ============================================================================
-- Step 7: Comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.tasks.user_id IS 'References auth.users(id). NULL for anonymous/local tasks, set for authenticated users.';
COMMENT ON COLUMN public.daily_metrics.user_id IS 'References auth.users(id). NULL for anonymous metrics, set for authenticated users.';
COMMENT ON FUNCTION public.migrate_local_tasks_to_user IS 'Migrates all local tasks (user_id IS NULL) to the specified user account. Returns count of migrated tasks.';
COMMENT ON FUNCTION public.has_local_tasks IS 'Returns true if there are any tasks with user_id IS NULL (local/anonymous tasks).';
