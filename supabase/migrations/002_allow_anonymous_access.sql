-- Allow anonymous access for MVP
-- This migration updates RLS policies to allow operations without authentication
-- user_id can be NULL for anonymous users

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

DROP POLICY IF EXISTS "Users can view their own metrics" ON daily_metrics;
DROP POLICY IF EXISTS "Users can insert their own metrics" ON daily_metrics;
DROP POLICY IF EXISTS "Users can update their own metrics" ON daily_metrics;

DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;

-- Create new permissive policies for anonymous access
-- Tasks: Allow all operations if user_id is NULL (anonymous) or matches auth.uid()
CREATE POLICY "Allow anonymous and authenticated task access" ON tasks
  FOR ALL
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Allow anonymous and authenticated task insert" ON tasks
  FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Daily metrics: Allow all operations if user_id is NULL or matches auth.uid()
CREATE POLICY "Allow anonymous and authenticated metrics access" ON daily_metrics
  FOR ALL
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Allow anonymous and authenticated metrics insert" ON daily_metrics
  FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- User preferences: Allow all operations if user_id matches auth.uid() or is for anonymous
CREATE POLICY "Allow authenticated preferences access" ON user_preferences
  FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Allow authenticated preferences insert" ON user_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Update RPC function to handle NULL user_id (anonymous users)
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
  WHERE user_id IS NULL OR user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make user_id nullable in tasks table (if not already)
ALTER TABLE tasks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE daily_metrics ALTER COLUMN user_id DROP NOT NULL;
