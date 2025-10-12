# Quickstart: Task Management Browser Extension

**Feature**: Task Management & Visualization Browser Extension
**Branch**: `001-`
**Date**: 2025-10-11

## Overview

This quickstart guide helps developers set up the task management Chrome extension locally, configure Supabase, and start development.

---

## Prerequisites

- Node.js 18+ and npm
- Chrome browser (latest version)
- Supabase account (free tier)
- Git

---

## Step 1: Clone and Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd onsaero

# Checkout feature branch
git checkout 001-

# Install dependencies
npm install
```

**Expected Dependencies**:
```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "@supabase/supabase-js": "^2.x",
    "zustand": "^4.x",
    "@tanstack/react-query": "^5.x",
    "recharts": "^2.x",
    "@vanilla-extract/css": "^1.x"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "vite": "^7.0.0",
    "@vitejs/plugin-react-swc": "^3.x",
    "@crxjs/vite-plugin": "^2.x",
    "@vanilla-extract/vite-plugin": "^4.x",
    "@biomejs/biome": "2.2.5",
    "vitest": "^2.x",
    "@testing-library/react": "^16.x",
    "@playwright/test": "^1.x"
  }
}
```

---

## Step 2: Configure Supabase

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in details:
   - Name: `onsaero-tasks`
   - Database Password: (generate strong password)
   - Region: (choose closest to you)
4. Wait for project to initialize (~2 minutes)

### 2.2 Get Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

### 2.3 Create Environment File

Create `.env` in project root:

```bash
# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Security Note**: `.env` is gitignored. Never commit credentials!

---

## Step 3: Set Up Supabase Database

### 3.1 Install Supabase CLI (Optional but Recommended)

```bash
# macOS
brew install supabase/tap/supabase

# Windows (scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

### 3.2 Initialize Supabase Locally

```bash
# Link to your project
supabase link --project-ref <your-project-ref>

# Pull existing schema (if any)
supabase db pull
```

### 3.3 Run Database Migrations

Create initial migration file:

```bash
# Create new migration
supabase migration new initial_schema
```

Copy the following SQL into `supabase/migrations/<timestamp>_initial_schema.sql`:

```sql
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
```

Push migration to Supabase:

```bash
# Apply migration to remote
supabase db push
```

### 3.4 Generate TypeScript Types

```bash
# Generate types from database schema
supabase gen types typescript --local > src/lib/supabase-types.ts
```

---

## Step 4: Configure Chrome Extension Manifest

The extension uses Manifest V3 with @crxjs/vite-plugin (auto-generates manifest).

Create `manifest.json` in `src/`:

```json
{
  "manifest_version": 3,
  "name": "Onsaero Tasks",
  "version": "0.1.0",
  "description": "Task management and productivity visualization for your new tab",
  "permissions": ["storage"],
  "chrome_url_overrides": {
    "newtab": "newtab.html"
  },
  "background": {
    "service_worker": "background/service-worker.ts",
    "type": "module"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

---

## Step 5: Configure Vite

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { crx } from '@crxjs/vite-plugin'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import manifest from './src/manifest.json'

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    vanillaExtractPlugin()
  ],
  build: {
    rollupOptions: {
      input: {
        newtab: 'newtab.html'
      }
    }
  }
})
```

Create `newtab.html` in project root:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Onsaero Tasks</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## Step 6: Start Development

### 6.1 Run Dev Server

```bash
npm run dev
```

This starts Vite dev server with HMR and builds the extension in `dist/`.

### 6.2 Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `dist/` folder from your project
5. The extension should now appear in your extensions list

### 6.3 Test the Extension

1. Open a new tab → should see the task management interface
2. Add a task → should save to chrome.storage.sync
3. Sign in with Supabase → tasks should sync to database
4. Open another tab → tasks should sync across tabs

---

## Step 7: Development Workflow

### Hot Module Replacement (HMR)

Changes to React components update instantly without page reload:

```bash
# Edit src/components/task/TaskItem.tsx
# Save → HMR updates the extension automatically
```

For service worker changes:
1. Edit `src/background/service-worker.ts`
2. Save → Vite rebuilds
3. Reload extension in `chrome://extensions/`

### Linting & Formatting

```bash
# Check linting
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code
npm run format
```

### Type Checking

```bash
# Type check without building
npx tsc --noEmit

# Build (includes type check)
npm run build
```

---

## Step 8: Testing

### Unit Tests (Vitest)

```bash
# Run unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

**Example Test**:
```typescript
// src/stores/taskStore.test.ts
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTaskStore } from './taskStore'

describe('taskStore', () => {
  it('adds task', () => {
    const { result } = renderHook(() => useTaskStore())

    act(() => {
      result.current.addTask({
        id: '1',
        title: 'Test task',
        completed: false,
        created_at: new Date().toISOString(),
        display_order: 0
      })
    })

    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].title).toBe('Test task')
  })
})
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e
```

**Example E2E Test**:
```typescript
// tests/e2e/tasks.spec.ts
import { test, expect } from '@playwright/test'

test('add and complete task', async ({ page }) => {
  await page.goto('chrome-extension://<extension-id>/newtab.html')

  // Add task
  await page.fill('[data-testid="task-input"]', 'Buy milk')
  await page.click('[data-testid="add-task-btn"]')

  // Verify task appears
  await expect(page.locator('text=Buy milk')).toBeVisible()

  // Complete task
  await page.click('[data-testid="task-checkbox-0"]')
  await expect(page.locator('text=Buy milk')).toHaveClass(/completed/)
})
```

---

## Step 9: Build for Production

```bash
# Type check + build
npm run build
```

Output in `dist/` directory:
```
dist/
├── manifest.json          # Generated manifest
├── newtab.html            # New tab page
├── assets/
│   ├── newtab-[hash].js  # Bundled JS
│   └── newtab-[hash].css # Bundled CSS
├── icons/
└── background/
    └── service-worker.js
```

### Load Production Build

1. Go to `chrome://extensions/`
2. Remove development version
3. Load unpacked from `dist/` folder
4. Test all features

---

## Step 10: Debugging

### Chrome DevTools

**For New Tab Page**:
1. Open new tab (extension loads)
2. Right-click → Inspect
3. Use React DevTools extension

**For Service Worker**:
1. Go to `chrome://extensions/`
2. Find your extension
3. Click "service worker" link → opens DevTools

### Supabase Logs

View real-time logs in Supabase dashboard:
1. Go to **Logs** → **API**
2. Filter by endpoint (e.g., `/rest/v1/tasks`)

### Storage Inspection

**chrome.storage.sync**:
```javascript
// In DevTools console
chrome.storage.sync.get(null, (data) => console.log(data))
```

**Supabase**:
1. Go to **Table Editor** in Supabase dashboard
2. Select `tasks` table → view all data

---

## Troubleshooting

### Issue: Extension not loading

**Solution**:
1. Check `dist/manifest.json` exists
2. Verify Vite build completed without errors
3. Reload extension in `chrome://extensions/`

### Issue: Supabase connection error

**Solution**:
1. Check `.env` file has correct credentials
2. Verify Supabase project is active (not paused)
3. Check browser console for CORS errors

### Issue: Storage quota exceeded

**Solution**:
```typescript
// Clear old data
await chrome.storage.sync.clear()

// Or cleanup selectively
const { tasks } = await chrome.storage.sync.get('tasks')
const filtered = tasks.filter(t => !t.completed)
await chrome.storage.sync.set({ tasks: filtered })
```

### Issue: RLS policy blocking queries

**Solution**:
1. Ensure user is authenticated: `supabase.auth.getUser()`
2. Check RLS policies in Supabase dashboard
3. Temporarily disable RLS for debugging (re-enable after!)

---

## Next Steps

1. **Implement core features** (see `tasks.md` after running `/speckit.tasks`)
2. **Configure Supabase Auth** (magic link, OAuth)
3. **Add error boundaries** and loading states
4. **Implement offline support** with sync queue
5. **Add analytics** (optional: Supabase Analytics or Google Analytics)

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview build locally

# Code Quality
npm run lint             # Check linting
npm run lint:fix         # Fix auto-fixable issues
npm run format           # Format code
npm run type-check       # TypeScript check

# Testing
npm run test             # Run unit tests
npm run test:watch       # Watch mode
npm run test:e2e         # E2E tests

# Supabase
supabase start           # Start local Supabase
supabase db push         # Push migrations
supabase gen types typescript --local > src/lib/supabase-types.ts
```

---

## Resources

- [Vite Documentation](https://vite.dev/)
- [Chrome Extension Docs (MV3)](https://developer.chrome.com/docs/extensions/mv3/)
- [Supabase Documentation](https://supabase.com/docs)
- [Zustand Guide](https://zustand-demo.pmnd.rs/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [vanilla-extract Docs](https://vanilla-extract.style/)
- [Recharts Documentation](https://recharts.org/)

---

## Support

For issues or questions:
1. Check [CLAUDE.md](../CLAUDE.md) for project conventions
2. Review [spec.md](./spec.md) for feature requirements
3. Consult [data-model.md](./data-model.md) for schema details
4. See [contracts/](./contracts/) for API documentation
