-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 500),
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Indexes
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

-- Completed_at trigger
CREATE OR REPLACE FUNCTION update_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND OLD.completed = false THEN
    NEW.completed_at = now();
  ELSIF NEW.completed = false THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_completed_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_completed_at();

-- Daily metrics table
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tasks_created INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_metrics_user_date ON daily_metrics(user_id, date DESC);

-- User preferences table
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  show_completed_by_default BOOLEAN NOT NULL DEFAULT false,
  theme TEXT NOT NULL DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
  default_view TEXT NOT NULL DEFAULT 'list' CHECK (default_view IN ('list', 'dashboard')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Tasks RLS
CREATE POLICY "Users can view their own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Daily metrics RLS
CREATE POLICY "Users can view their own metrics" ON daily_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own metrics" ON daily_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own metrics" ON daily_metrics FOR UPDATE USING (auth.uid() = user_id);

-- User preferences RLS
CREATE POLICY "Users can view their own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- RPC Functions
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

-- Metrics update trigger
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
