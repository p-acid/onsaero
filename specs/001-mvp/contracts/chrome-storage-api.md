# API Contract: Chrome Storage API

**Feature**: Task Management & Visualization Browser Extension
**Branch**: `001-`
**Date**: 2025-10-11

## Overview

This document defines the contracts for Chrome Extension Storage API usage. The extension uses `chrome.storage.sync` for local caching and cross-device sync (when user is signed into Chrome).

---

## Storage Architecture

### Storage Keys

| Key | Type | Description | Max Size |
|-----|------|-------------|----------|
| `tasks` | `Task[]` | Array of all tasks (active + recent completed) | ~90KB |
| `preferences` | `UserPreferences` | User preferences object | ~1KB |
| `last_sync` | `string` | ISO timestamp of last Supabase sync | ~30 bytes |
| `user_id` | `string` | Current authenticated user ID | ~40 bytes |
| `sync_queue` | `SyncOperation[]` | Pending operations (offline mode) | ~5KB |

**Total Estimated**: ~96KB (within 100KB quota)

---

## Storage Operations

### 1. Get All Tasks

**API**: `chrome.storage.sync.get()`

```typescript
interface GetTasksResult {
  tasks?: Task[]
  last_sync?: string
}

// Get all tasks
const result = await chrome.storage.sync.get(['tasks', 'last_sync'])

const tasks: Task[] = result.tasks ?? []
const lastSync: string = result.last_sync ?? new Date(0).toISOString()

// Response type
type Response = {
  tasks: Task[]
  last_sync: string
}
```

**Example Response**:
```json
{
  "tasks": [
    {
      "id": "uuid-1",
      "title": "Buy groceries",
      "completed": false,
      "created_at": "2025-10-11T10:00:00Z",
      "display_order": 0
    }
  ],
  "last_sync": "2025-10-11T11:30:00Z"
}
```

---

### 2. Set Tasks (Batch Update)

**API**: `chrome.storage.sync.set()`

```typescript
interface SetTasksRequest {
  tasks: Task[]
  last_sync?: string
}

// Set tasks
await chrome.storage.sync.set({
  tasks: updatedTasks,
  last_sync: new Date().toISOString()
})

// Response: void (success) or throws error
```

**Error Handling**:
```typescript
try {
  await chrome.storage.sync.set({ tasks })
} catch (error) {
  if (error.message.includes('QUOTA_BYTES')) {
    // Handle quota exceeded
    await cleanupOldTasks()
    await chrome.storage.sync.set({ tasks: filteredTasks })
  }
}
```

---

### 3. Add Single Task (Optimistic Update)

**API**: `chrome.storage.sync.get()` + `chrome.storage.sync.set()`

```typescript
async function addTaskToStorage(newTask: Task): Promise<void> {
  const { tasks = [] } = await chrome.storage.sync.get('tasks')

  const updated = [...tasks, newTask].sort((a, b) => a.display_order - b.display_order)

  await chrome.storage.sync.set({
    tasks: updated,
    last_sync: new Date().toISOString()
  })
}
```

---

### 4. Update Single Task

```typescript
async function updateTaskInStorage(taskId: string, updates: Partial<Task>): Promise<void> {
  const { tasks = [] } = await chrome.storage.sync.get('tasks')

  const updated = tasks.map(task =>
    task.id === taskId
      ? { ...task, ...updates, updated_at: new Date().toISOString() }
      : task
  )

  await chrome.storage.sync.set({
    tasks: updated,
    last_sync: new Date().toISOString()
  })
}
```

---

### 5. Delete Task

```typescript
async function deleteTaskFromStorage(taskId: string): Promise<void> {
  const { tasks = [] } = await chrome.storage.sync.get('tasks')

  const updated = tasks.filter(task => task.id !== taskId)

  await chrome.storage.sync.set({
    tasks: updated,
    last_sync: new Date().toISOString()
  })
}
```

---

### 6. Get User Preferences

**API**: `chrome.storage.sync.get()`

```typescript
interface GetPreferencesResult {
  preferences?: UserPreferences
}

const { preferences } = await chrome.storage.sync.get('preferences')

const userPrefs: UserPreferences = preferences ?? {
  user_id: '',
  show_completed_by_default: false,
  theme: 'auto',
  default_view: 'list',
  updated_at: new Date().toISOString()
}

// Response type
type Response = UserPreferences
```

---

### 7. Update User Preferences

```typescript
async function updatePreferences(updates: Partial<UserPreferences>): Promise<void> {
  const { preferences = getDefaultPreferences() } = await chrome.storage.sync.get('preferences')

  const updated: UserPreferences = {
    ...preferences,
    ...updates,
    updated_at: new Date().toISOString()
  }

  await chrome.storage.sync.set({ preferences: updated })
}
```

---

## Storage Listeners (Cross-Tab Sync)

### Listen for Storage Changes

**API**: `chrome.storage.onChanged.addListener()`

```typescript
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync') return

  // Handle task changes
  if (changes.tasks) {
    const oldTasks: Task[] = changes.tasks.oldValue ?? []
    const newTasks: Task[] = changes.tasks.newValue ?? []

    console.log('Tasks updated:', { oldTasks, newTasks })

    // Update Zustand store
    useTaskStore.getState().setTasks(newTasks)
  }

  // Handle preferences changes
  if (changes.preferences) {
    const newPrefs: UserPreferences = changes.preferences.newValue

    // Update UI state
    usePreferencesStore.getState().setPreferences(newPrefs)
  }

  // Handle sync timestamp changes
  if (changes.last_sync) {
    console.log('Last sync updated:', changes.last_sync.newValue)
  }
})
```

**Change Object Structure**:
```typescript
interface StorageChange {
  oldValue?: any
  newValue?: any
}

interface StorageChanges {
  [key: string]: StorageChange
}
```

**Example Change Event**:
```json
{
  "tasks": {
    "oldValue": [{ "id": "1", "title": "Old task" }],
    "newValue": [{ "id": "1", "title": "Old task" }, { "id": "2", "title": "New task" }]
  },
  "last_sync": {
    "oldValue": "2025-10-11T10:00:00Z",
    "newValue": "2025-10-11T11:00:00Z"
  }
}
```

---

## Quota Management

### Check Storage Usage

**API**: `chrome.storage.sync.getBytesInUse()`

```typescript
async function checkStorageQuota(): Promise<{
  used: number
  limit: number
  percentage: number
  remaining: number
}> {
  const used = await chrome.storage.sync.getBytesInUse()
  const limit = chrome.storage.sync.QUOTA_BYTES // 102,400 bytes (100KB)
  const percentage = (used / limit) * 100
  const remaining = limit - used

  return { used, limit, percentage, remaining }
}

// Usage
const quota = await checkStorageQuota()
if (quota.percentage > 80) {
  console.warn(`Storage at ${quota.percentage.toFixed(1)}% capacity`)
  await cleanupOldCompletedTasks()
}
```

---

### Cleanup Strategy (When Approaching Quota)

```typescript
async function cleanupOldCompletedTasks(): Promise<void> {
  const { tasks = [] } = await chrome.storage.sync.get('tasks')

  // Keep only active tasks + completed tasks from last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const filtered = tasks.filter(task => {
    if (!task.completed) return true // Keep all active tasks

    const completedAt = new Date(task.completed_at ?? task.updated_at)
    return completedAt > thirtyDaysAgo // Keep recent completed tasks
  })

  await chrome.storage.sync.set({
    tasks: filtered,
    last_sync: new Date().toISOString()
  })

  console.log(`Cleaned up ${tasks.length - filtered.length} old completed tasks`)
}
```

---

### Monitor Quota in Real-Time

```typescript
// Monitor storage usage on every write
async function safeStorageSet(items: Record<string, any>): Promise<void> {
  // Pre-check: Estimate new size
  const currentUsage = await chrome.storage.sync.getBytesInUse()
  const estimatedNewSize = JSON.stringify(items).length

  if (currentUsage + estimatedNewSize > chrome.storage.sync.QUOTA_BYTES * 0.95) {
    // Approaching quota limit (95%)
    await cleanupOldCompletedTasks()
  }

  try {
    await chrome.storage.sync.set(items)
  } catch (error) {
    if (error.message.includes('QUOTA_BYTES')) {
      // Force cleanup and retry
      await cleanupOldCompletedTasks()
      await chrome.storage.sync.set(items)
    } else {
      throw error
    }
  }
}
```

---

## Offline Queue (Sync Operations)

### Queue Structure

```typescript
interface SyncOperation {
  id: string              // Operation ID (UUID)
  type: 'create' | 'update' | 'delete'
  entity: 'task' | 'preference'
  payload: Task | Partial<Task> | UserPreferences
  timestamp: string       // ISO timestamp
  retries: number        // Retry count
}

interface SyncQueue {
  operations: SyncOperation[]
}
```

### Add to Queue (When Offline)

```typescript
async function queueSyncOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries'>): Promise<void> {
  const { sync_queue = { operations: [] } } = await chrome.storage.sync.get('sync_queue')

  const newOp: SyncOperation = {
    ...operation,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    retries: 0
  }

  sync_queue.operations.push(newOp)

  await chrome.storage.sync.set({ sync_queue })
}

// Usage
if (navigator.onLine === false) {
  await queueSyncOperation({
    type: 'create',
    entity: 'task',
    payload: newTask
  })
}
```

### Process Queue (When Back Online)

```typescript
async function processSyncQueue(): Promise<void> {
  const { sync_queue = { operations: [] } } = await chrome.storage.sync.get('sync_queue')

  for (const op of sync_queue.operations) {
    try {
      if (op.entity === 'task') {
        if (op.type === 'create') {
          await supabase.from('tasks').insert(op.payload)
        } else if (op.type === 'update') {
          await supabase.from('tasks').update(op.payload).eq('id', op.payload.id)
        } else if (op.type === 'delete') {
          await supabase.from('tasks').delete().eq('id', op.payload.id)
        }
      }
      // Remove from queue on success
      sync_queue.operations = sync_queue.operations.filter(o => o.id !== op.id)
    } catch (error) {
      console.error('Failed to sync operation:', op, error)
      op.retries++

      if (op.retries > 3) {
        // Give up after 3 retries
        sync_queue.operations = sync_queue.operations.filter(o => o.id !== op.id)
      }
    }
  }

  await chrome.storage.sync.set({ sync_queue })
}

// Listen for online event
window.addEventListener('online', processSyncQueue)
```

---

## Sync Conflict Resolution

### Merge Strategy (Last-Write-Wins)

```typescript
async function mergeTasksFromSupabase(serverTasks: Task[]): Promise<void> {
  const { tasks: localTasks = [] } = await chrome.storage.sync.get('tasks')

  const merged = new Map<string, Task>()

  // Add all server tasks (server is source of truth)
  serverTasks.forEach(task => merged.set(task.id, task))

  // Merge local tasks (only if newer)
  localTasks.forEach(localTask => {
    const serverTask = merged.get(localTask.id)

    if (!serverTask) {
      // Local-only task (created offline)
      merged.set(localTask.id, localTask)
    } else {
      // Compare timestamps
      const localTime = new Date(localTask.updated_at).getTime()
      const serverTime = new Date(serverTask.updated_at).getTime()

      if (localTime > serverTime) {
        // Local is newer, keep local (will sync to server)
        merged.set(localTask.id, localTask)
      }
      // Else: server is newer or equal, already in map
    }
  })

  const mergedTasks = Array.from(merged.values()).sort((a, b) => a.display_order - b.display_order)

  await chrome.storage.sync.set({
    tasks: mergedTasks,
    last_sync: new Date().toISOString()
  })
}
```

---

## Storage Initialization

### First-Time Setup

```typescript
async function initializeStorage(): Promise<void> {
  const existing = await chrome.storage.sync.get(['tasks', 'preferences', 'last_sync'])

  // Initialize tasks if not present
  if (!existing.tasks) {
    await chrome.storage.sync.set({
      tasks: [],
      last_sync: new Date(0).toISOString() // Epoch (force initial sync)
    })
  }

  // Initialize preferences with defaults
  if (!existing.preferences) {
    const defaultPreferences: UserPreferences = {
      user_id: '',
      show_completed_by_default: false,
      theme: 'auto',
      default_view: 'list',
      updated_at: new Date().toISOString()
    }

    await chrome.storage.sync.set({
      preferences: defaultPreferences
    })
  }
}

// Call on extension install
chrome.runtime.onInstalled.addListener(() => {
  initializeStorage()
})
```

---

## Error Handling

### Common Errors

| Error | Cause | Handling |
|-------|-------|----------|
| `QUOTA_BYTES_PER_ITEM` | Single item > 8KB | Split into multiple keys or cleanup |
| `QUOTA_BYTES` | Total storage > 100KB | Cleanup old data, show warning |
| `MAX_ITEMS` | More than 512 items | Consolidate into arrays |
| `MAX_WRITE_OPERATIONS_PER_MINUTE` | Too many writes (burst limit) | Debounce writes, batch operations |

**Error Handling Pattern**:
```typescript
async function safeStorageOperation<T>(
  operation: () => Promise<T>
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    if (error.message.includes('QUOTA_BYTES')) {
      console.error('Storage quota exceeded')
      await cleanupOldCompletedTasks()
      return await operation() // Retry once
    } else if (error.message.includes('MAX_WRITE_OPERATIONS')) {
      console.error('Write rate limit exceeded')
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s
      return await operation() // Retry once
    } else {
      console.error('Storage operation failed:', error)
      return null
    }
  }
}
```

---

## Best Practices

### 1. Batch Writes

```typescript
// ❌ Bad: Multiple individual writes
await chrome.storage.sync.set({ tasks })
await chrome.storage.sync.set({ last_sync: new Date().toISOString() })
await chrome.storage.sync.set({ preferences })

// ✅ Good: Single batched write
await chrome.storage.sync.set({
  tasks,
  last_sync: new Date().toISOString(),
  preferences
})
```

### 2. Debounce Frequent Updates

```typescript
import { debounce } from 'lodash-es'

const debouncedSaveToStorage = debounce(async (tasks: Task[]) => {
  await chrome.storage.sync.set({
    tasks,
    last_sync: new Date().toISOString()
  })
}, 500) // Wait 500ms before saving

// Usage
function updateTask(taskId: string, updates: Partial<Task>) {
  const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
  debouncedSaveToStorage(updatedTasks)
}
```

### 3. Monitor Quota Proactively

```typescript
// Check quota on app load
async function displayQuotaWarning() {
  const quota = await checkStorageQuota()

  if (quota.percentage > 90) {
    showToast({
      type: 'warning',
      message: `Storage almost full (${quota.percentage.toFixed(0)}%). Old completed tasks will be cleaned up.`,
      action: {
        label: 'Clean Now',
        onClick: cleanupOldCompletedTasks
      }
    })
  }
}
```

---

## Summary

**Primary Use Cases**:
- ✅ Fast local caching for instant UI updates
- ✅ Cross-tab sync within same browser profile
- ✅ Cross-device sync for Chrome users (when signed in)
- ✅ Offline queue for pending Supabase operations

**Key Constraints**:
- 100KB total storage limit
- 8KB per item limit
- Rate limiting on writes (handle with debounce/batch)

**Integration with Supabase**:
- chrome.storage.sync = local cache (fast reads)
- Supabase = source of truth (persistent, cross-device)
- Bidirectional sync with last-write-wins conflict resolution
