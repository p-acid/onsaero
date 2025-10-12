# Research: Task Management Browser Extension

**Feature**: Task Management & Visualization Browser Extension
**Branch**: `001-`
**Date**: 2025-10-11

## Overview

This document consolidates research findings and technical decisions for building a Chrome extension that replaces the new tab with a task management interface. All technology choices align with the project's constitution and user requirements.

---

## Technology Stack Decisions

### 1. Chrome Extension Architecture (Manifest V3)

**Decision**: Use Manifest V3 with @crxjs/vite-plugin for development

**Rationale**:
- Manifest V3 is the current standard (Manifest V2 deprecated in 2024)
- @crxjs/vite-plugin provides HMR for extension development (critical for fast iteration)
- Vite's dev server with instant updates vs. manual reload on every change
- TypeScript support out of the box
- Service worker architecture (required by MV3) is more secure than persistent background pages

**Alternatives Considered**:
- Webpack + chrome-extension-plugin: Slower build times, more configuration needed
- Manual Manifest V3 setup: No HMR, poor developer experience
- Plasmo framework: Opinionated, adds abstraction layer we don't need

**Best Practices**:
- Keep service worker lightweight (MV3 service workers can be terminated anytime)
- Use chrome.alarms for scheduled tasks instead of setTimeout/setInterval
- All extension pages must be listed in manifest.json
- CSP compliance: No inline scripts, use script imports only

---

### 2. Styling: vanilla-extract

**Decision**: Use vanilla-extract for type-safe, zero-runtime CSS

**Rationale**:
- **Type safety**: CSS is TypeScript (.css.ts files), autocomplete for tokens/classes
- **Zero runtime**: Compiles to static CSS files (critical for extension performance)
- **Vite integration**: First-class Vite plugin support
- **Co-location**: Styles live next to components
- **Design tokens**: Theme variables with TypeScript types
- **Small bundle**: No runtime CSS-in-JS overhead (unlike styled-components, emotion)

**Alternatives Considered**:
- Tailwind CSS: No type safety, large utility class bloat, harder to maintain custom design system
- CSS Modules: Less powerful, no type safety, manual imports
- styled-components/emotion: Runtime overhead (bad for extension startup performance)

**Best Practices**:
- Define global theme tokens in `theme.css.ts` (colors, spacing, typography)
- Use `style()` for component-specific styles
- Use `styleVariants()` for conditional styling
- Leverage `recipe()` for component variants (button sizes, states)
- Extract common patterns into `src/styles/patterns.css.ts`

---

### 3. State Management: Zustand + TanStack Query

**Decision**: Use Zustand for synchronous state, TanStack Query for async/server state

**Rationale**:

**Zustand (sync state)**:
- Minimal boilerplate (no providers, actions, reducers like Redux)
- TypeScript-first design with excellent type inference
- Direct state access without hooks (useful for service worker)
- Tiny bundle size (~1KB)
- Middleware support (persist, devtools)

**TanStack Query (async state)**:
- Server state caching and synchronization
- Automatic refetching, optimistic updates, background sync
- Built-in loading/error states
- Perfect for Supabase API calls
- Devtools for debugging queries

**Alternatives Considered**:
- Redux Toolkit: Overkill for this app, more boilerplate
- Recoil/Jotai: Good but larger bundles, less mature than Zustand
- React Context + useReducer: No persistence, no devtools, manual optimization

**Best Practices (Zustand)**:
```typescript
// taskStore.ts - slice pattern
interface TaskStore {
  tasks: Task[]
  addTask: (task: Task) => void
  removeTask: (id: string) => void
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  removeTask: (id) => set((state) => ({ tasks: state.tasks.filter(t => t.id !== id) })),
}))
```

**Best Practices (TanStack Query)**:
```typescript
// useTaskQuery.ts
export const useTasksQuery = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => supabase.from('tasks').select('*'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useAddTaskMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (task: NewTask) => supabase.from('tasks').insert(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
```

---

### 4. Backend: Supabase

**Decision**: Use Supabase for backend services (database, realtime, auth)

**Rationale**:
- **Managed PostgreSQL**: No server setup, automatic backups
- **Realtime subscriptions**: WebSocket updates for cross-device sync
- **Row Level Security (RLS)**: Built-in authorization at database level
- **TypeScript SDK**: Auto-generated types from database schema
- **Local development**: supabase CLI for local Postgres instance
- **Free tier**: Generous limits for MVP (500MB DB, 2GB bandwidth/month)

**Alternatives Considered**:
- Firebase: Less flexible queries, NoSQL (we need relational data for metrics)
- Appwrite: Less mature, smaller community
- Custom backend (Express + Postgres): More work, hosting costs, maintenance burden

**Best Practices**:
- Define schema in migrations (version controlled SQL)
- Enable RLS on all tables
- Use `supabase gen types typescript` to generate TypeScript types
- Use Supabase Realtime for cross-device sync
- Implement hybrid sync: chrome.storage.sync (fast local) + Supabase (persistent, cross-device)

**Hybrid Sync Strategy**:
1. **Write path**: Save to chrome.storage.sync first (instant UI update) → background sync to Supabase
2. **Read path**: Load from chrome.storage.sync (fast) → fetch from Supabase in background → merge if conflicts
3. **Cross-device sync**: Supabase Realtime subscriptions update chrome.storage.sync on other devices

---

### 5. Data Visualization: Recharts

**Decision**: Use Recharts for dashboard charts

**Rationale**:
- **React-first**: Built for React with declarative API
- **SVG-based**: Scalable, accessible, works in extensions
- **TypeScript support**: Well-typed props and data
- **Responsive**: Built-in responsive container
- **Common charts included**: Bar, Line, Pie (all we need)
- **Customizable**: Flexible styling, animations optional

**Alternatives Considered**:
- Chart.js: Not React-native, requires wrapper, imperative API
- D3.js: Too low-level, steep learning curve, overkill for basic charts
- Victory: Larger bundle size, less active maintenance

**Best Practices**:
```typescript
// Dashboard chart example
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const WeeklyChart = ({ data }: { data: DailyMetric[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="completed" fill="var(--color-primary)" />
    </BarChart>
  </ResponsiveContainer>
)
```

- Lazy load chart components with React.lazy (reduce initial bundle)
- Use `ResponsiveContainer` for flexible sizing
- Leverage vanilla-extract CSS variables for chart colors (theme consistency)

---

### 6. Testing Strategy

**Decision**: Vitest (unit/integration) + Testing Library (components) + Playwright (e2e)

**Rationale**:

**Vitest**:
- Native Vite integration (same config, instant HMR in tests)
- Fast (ESM-first, parallel by default)
- Jest-compatible API (easy migration, familiar syntax)
- Built-in TypeScript support

**Testing Library**:
- Encourages testing user behavior (not implementation details)
- Works seamlessly with React 19
- Accessible queries (getByRole, getByLabelText)

**Playwright**:
- Extension testing support (chrome.storage, manifest)
- Cross-browser (can test in actual Chrome)
- Built-in test runner, assertions, fixtures
- Screenshot/video recording for debugging

**Alternatives Considered**:
- Jest: Slower, requires more config for ESM/TypeScript
- Cypress: No native extension support, slower than Playwright
- Puppeteer: Lower-level, need to build test framework ourselves

**Best Practices**:
```typescript
// Unit test (Vitest)
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTaskStore } from './taskStore'

describe('taskStore', () => {
  it('adds task', () => {
    const { result } = renderHook(() => useTaskStore())
    act(() => {
      result.current.addTask({ id: '1', title: 'Test' })
    })
    expect(result.current.tasks).toHaveLength(1)
  })
})

// Component test (Testing Library)
import { render, screen } from '@testing-library/react'
import { TaskItem } from './TaskItem'

it('renders task', () => {
  render(<TaskItem task={{ id: '1', title: 'Buy milk' }} />)
  expect(screen.getByText('Buy milk')).toBeInTheDocument()
})

// E2E test (Playwright)
import { test, expect } from '@playwright/test'

test('add task in new tab', async ({ page }) => {
  await page.goto('chrome-extension://<id>/newtab.html')
  await page.fill('[aria-label="Task title"]', 'New task')
  await page.click('button:has-text("Add")')
  await expect(page.locator('text=New task')).toBeVisible()
})
```

---

### 7. Chrome Storage + Supabase Sync Architecture

**Decision**: Hybrid storage with chrome.storage.sync as local cache and Supabase as source of truth

**Technical Implementation**:

**Data Flow**:
1. **Initial load**: Read from chrome.storage.sync (fast) → fetch from Supabase in background → update if newer
2. **User action (add/edit/delete)**: Update chrome.storage.sync → optimistic UI → sync to Supabase → handle conflicts
3. **Cross-tab sync**: chrome.storage.onChanged listener updates Zustand store
4. **Cross-device sync**: Supabase Realtime subscription updates chrome.storage.sync

**Conflict Resolution**:
- Last-write-wins with timestamp comparison
- Server (Supabase) is source of truth
- Local storage serves as cache for performance

**Quota Management**:
- chrome.storage.sync has 100KB total limit
- Monitor with chrome.storage.sync.getBytesInUse()
- If approaching limit: remove old completed tasks locally, keep in Supabase
- Show warning at 80KB usage

**Best Practices**:
```typescript
// src/lib/storage.ts
export const syncToSupabase = async (tasks: Task[]) => {
  const { data: serverTasks } = await supabase.from('tasks').select('*')

  // Merge strategy: server wins on conflict
  const merged = mergeTasks(tasks, serverTasks, 'server-wins')

  await chrome.storage.sync.set({ tasks: merged })
  return merged
}

// Listen for cross-tab changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.tasks) {
    useTaskStore.getState().setTasks(changes.tasks.newValue)
  }
})

// Supabase realtime for cross-device sync
supabase
  .channel('tasks')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
    syncFromSupabase() // Fetch updated tasks and update local storage
  })
  .subscribe()
```

---

### 8. Performance Optimization Strategies

**Decisions**: Multiple strategies to meet performance goals

**1. Code Splitting**:
- Lazy load dashboard: `const Dashboard = lazy(() => import('./pages/Dashboard'))`
- Lazy load Recharts: Only load when dashboard visible
- Route-based splitting (if adding settings page later)

**2. Render Optimization**:
- `React.memo()` for TaskItem (prevent re-render on unrelated state changes)
- Virtual scrolling for 1000+ tasks (react-window or native IntersectionObserver)
- Debounce search/filter inputs

**3. Bundle Optimization**:
- Tree shaking (Vite default)
- Import only needed Recharts components: `import { BarChart } from 'recharts/BarChart'`
- Use `@tanstack/react-query` with selective imports

**4. Extension-Specific**:
- Service worker: Keep minimal, use chrome.alarms for periodic tasks
- Preload critical data in service worker, use chrome.storage.local as cache
- CSP-compliant: No eval(), inline scripts, or unsafe dynamic code

**Best Practices**:
```typescript
// Virtual scrolling for large task lists
import { useVirtualizer } from '@tanstack/react-virtual'

const TaskList = ({ tasks }: { tasks: Task[] }) => {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // estimated task item height
  })

  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(item => (
          <div key={item.key} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${item.start}px)` }}>
            <TaskItem task={tasks[item.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Integration Patterns

### Supabase + TanStack Query Pattern

```typescript
// src/api/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/supabase'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// src/hooks/useTaskQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../api/supabase'
import { syncToStorage } from '../lib/storage'

export const useTasksQuery = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
      if (error) throw error

      // Sync to chrome.storage.sync for offline access
      await syncToStorage(data)
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useAddTaskMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (task: NewTask) => {
      const { data, error } = await supabase.from('tasks').insert(task).select().single()
      if (error) throw error
      return data
    },
    onMutate: async (newTask) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previous = queryClient.getQueryData(['tasks'])

      queryClient.setQueryData(['tasks'], (old: Task[]) => [...old, { ...newTask, id: crypto.randomUUID() }])

      return { previous }
    },
    onError: (err, newTask, context) => {
      // Rollback on error
      queryClient.setQueryData(['tasks'], context?.previous)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
```

### vanilla-extract + Component Pattern

```typescript
// src/components/task/TaskItem.css.ts
import { style } from '@vanilla-extract/css'
import { theme } from '../../styles/theme.css'

export const taskItem = style({
  display: 'flex',
  alignItems: 'center',
  padding: theme.space.md,
  borderRadius: theme.radius.sm,
  backgroundColor: theme.colors.surface,
  border: `1px solid ${theme.colors.border}`,
  transition: 'all 0.2s',

  ':hover': {
    backgroundColor: theme.colors.surfaceHover,
  },
})

export const taskCompleted = style({
  opacity: 0.6,
  textDecoration: 'line-through',
})

// src/components/task/TaskItem.tsx
import { taskItem, taskCompleted } from './TaskItem.css'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export const TaskItem = ({ task, onToggle, onDelete }: TaskItemProps) => {
  return (
    <div className={`${taskItem} ${task.completed ? taskCompleted : ''}`}>
      <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} />
      <span>{task.title}</span>
      <button onClick={() => onDelete(task.id)}>Delete</button>
    </div>
  )
}
```

---

## Summary

All technology choices support the project's constitution principles:
- ✅ **Type Safety**: TypeScript strict mode, vanilla-extract type-safe CSS
- ✅ **Modern Tooling**: Vite + SWC + Biome (fast, unified)
- ✅ **Component-Driven**: React 19 + vanilla-extract co-location
- ✅ **Fast Feedback**: HMR via @crxjs/vite-plugin, Biome auto-fix
- ✅ **Build Performance**: Code splitting, tree shaking, static CSS

The stack is optimized for Chrome extension constraints:
- Service worker compatibility (Manifest V3)
- CSP compliance (no unsafe-eval, inline scripts)
- Performance targets met via lazy loading, virtual scrolling, efficient state management
- Hybrid storage strategy balances local speed with cross-device sync

**Next Phase**: Generate data model and API contracts based on this research.
