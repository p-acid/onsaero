# Tasks: Task Management & Visualization Browser Extension

**Input**: Design documents from `/specs/001-/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in feature specification - implementing without test tasks per user requirements

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Chrome extension (single project)**: `src/`, `supabase/`, `public/` at repository root
- Paths follow structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and Chrome extension structure

- [X] T001 Install Chrome extension dependencies (@crxjs/vite-plugin, @vanilla-extract/vite-plugin, @tanstack/react-query, zustand, recharts, @supabase/supabase-js)
- [X] T002 [P] Configure Vite for Chrome extension with @crxjs/vite-plugin in vite.config.ts
- [X] T003 [P] Create Chrome extension manifest.json in src/ with new tab override and permissions
- [X] T004 [P] Create newtab.html entry point in project root
- [X] T005 [P] Setup vanilla-extract theme system in src/styles/theme.css.ts
- [X] T006 [P] Configure Biome linting and formatting for extension development

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Setup Supabase project and get credentials for .env configuration
- [ ] T008 Create Supabase database schema in supabase/migrations/001_initial_schema.sql (tasks, daily_metrics, user_preferences tables)
- [ ] T009 [P] Create TypeScript type definitions in src/lib/types.ts (Task, DailyMetric, UserPreferences interfaces)
- [ ] T010 [P] Initialize Supabase client in src/api/supabase.ts with environment configuration
- [ ] T011 [P] Setup chrome.storage.sync utilities in src/lib/storage.ts (get, set, clear, quota management)
- [ ] T012 [P] Create Zustand task store in src/stores/taskStore.ts for local state management
- [ ] T013 [P] Create TanStack Query client setup in src/lib/queryClient.ts for async state
- [ ] T014 [P] Setup chrome.storage.onChanged listener for cross-tab sync in src/lib/storage.ts
- [ ] T015 Create React App entry point in src/main.tsx and src/App.tsx
- [ ] T016 [P] Create base UI components layout in src/components/layout/NewTabLayout.tsx
- [ ] T017 [P] Setup error boundaries and loading states in src/components/ui/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Quick Task Capture (Priority: P1) 🎯 MVP

**Goal**: Users can quickly add tasks whenever they open a new browser tab, capturing to-dos immediately without switching contexts

**Independent Test**: Can be fully tested by opening a new tab, adding a task with a title, and verifying it persists when closing and reopening tabs

### Implementation for User Story 1

- [ ] T018 [P] [US1] Create TaskInput component in src/components/task/TaskInput.tsx with form validation
- [ ] T019 [P] [US1] Create TaskItem component in src/components/task/TaskItem.tsx for individual task display
- [ ] T020 [P] [US1] Create TaskList component in src/components/task/TaskList.tsx for task collection display
- [ ] T021 [P] [US1] Create EmptyState component in src/components/ui/EmptyState.tsx for no tasks state
- [ ] T022 [P] [US1] Style TaskInput component with vanilla-extract in src/components/task/TaskInput.css.ts
- [ ] T023 [P] [US1] Style TaskItem component with vanilla-extract in src/components/task/TaskItem.css.ts
- [ ] T024 [P] [US1] Style TaskList component with vanilla-extract in src/components/task/TaskList.css.ts
- [ ] T025 [US1] Create task API functions in src/api/tasks.ts (createTask, getTasks, deleteTask)
- [ ] T026 [US1] Create TanStack Query hooks in src/hooks/useTaskQuery.ts (useTasksQuery, useAddTaskMutation, useDeleteTaskMutation)
- [ ] T027 [US1] Implement chrome.storage.sync integration in taskStore.ts for local persistence
- [ ] T028 [US1] Integrate TaskInput, TaskList, and EmptyState in src/pages/NewTab.tsx
- [ ] T029 [US1] Add task creation workflow with optimistic updates
- [ ] T030 [US1] Add task deletion functionality with confirmation
- [ ] T031 [US1] Implement real-time sync across browser tabs using chrome.storage.onChanged
- [ ] T032 [US1] Add input validation (non-empty title, max 500 characters)
- [ ] T033 [US1] Add error handling for storage quota and network issues

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Task Completion Tracking (Priority: P2)

**Goal**: Users can mark tasks as complete to track their progress and build a history of accomplished work

**Independent Test**: Can be tested by adding several tasks, marking some as complete, and verifying that completed tasks are visually distinguished and tracked separately

### Implementation for User Story 2

- [ ] T034 [P] [US2] Add completion checkbox to TaskItem component in src/components/task/TaskItem.tsx
- [ ] T035 [P] [US2] Create CompletedTaskToggle component in src/components/task/CompletedTaskToggle.tsx for show/hide completed tasks
- [ ] T036 [P] [US2] Style completed task states with vanilla-extract in TaskItem.css.ts (strikethrough, opacity, etc.)
- [ ] T037 [P] [US2] Style CompletedTaskToggle component in src/components/task/CompletedTaskToggle.css.ts
- [ ] T038 [US2] Extend task API functions in src/api/tasks.ts (updateTask for completion status)
- [ ] T039 [US2] Create TanStack Query hooks in src/hooks/useTaskQuery.ts (useUpdateTaskMutation)
- [ ] T040 [US2] Update taskStore.ts to handle task completion state and toggle visibility
- [ ] T041 [US2] Update Task interface in src/lib/types.ts to include completed_at timestamp
- [ ] T042 [US2] Implement task completion/uncompletion workflow with optimistic updates
- [ ] T043 [US2] Add completed tasks visibility toggle in NewTab.tsx page
- [ ] T044 [US2] Update TaskList component to filter completed tasks based on toggle state
- [ ] T045 [US2] Implement completion timestamp tracking in Supabase via database triggers
- [ ] T046 [US2] Add visual distinction for completed vs active tasks in UI
- [ ] T047 [US2] Update chrome.storage.sync to persist completion state and toggle preference

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Progress Visualization Dashboard (Priority: P3)

**Goal**: Users can view visual representations of their task completion patterns and productivity trends

**Independent Test**: Can be tested by creating and completing multiple tasks over time, then viewing the dashboard to verify that visualizations accurately reflect task completion data

### Implementation for User Story 3

- [ ] T048 [P] [US3] Create MetricsCard component in src/components/dashboard/MetricsCard.tsx for stat display
- [ ] T049 [P] [US3] Create WeeklyChart component in src/components/dashboard/WeeklyChart.tsx with Recharts BarChart
- [ ] T050 [P] [US3] Create AllTimeMetrics component in src/components/dashboard/AllTimeMetrics.tsx with completion rate
- [ ] T051 [P] [US3] Create Dashboard page component in src/pages/Dashboard.tsx to contain all visualizations
- [ ] T052 [P] [US3] Style MetricsCard with vanilla-extract in src/components/dashboard/MetricsCard.css.ts
- [ ] T053 [P] [US3] Style WeeklyChart with vanilla-extract in src/components/dashboard/WeeklyChart.css.ts
- [ ] T054 [P] [US3] Style AllTimeMetrics with vanilla-extract in src/components/dashboard/AllTimeMetrics.css.ts
- [ ] T055 [P] [US3] Style Dashboard page with vanilla-extract in src/pages/Dashboard.css.ts
- [ ] T056 [US3] Create metrics API functions in src/api/metrics.ts (getDailyMetrics, getAllTimeMetrics)
- [ ] T057 [US3] Create Supabase RPC function get_all_time_metrics in database migration
- [ ] T058 [US3] Create TanStack Query hooks in src/hooks/useMetrics.ts (useWeeklyMetricsQuery, useAllTimeMetricsQuery)
- [ ] T059 [US3] Implement daily metrics calculation and aggregation logic
- [ ] T060 [US3] Add dashboard view toggle in NewTabLayout.tsx (list view vs dashboard view)
- [ ] T061 [US3] Integrate Dashboard component into NewTab.tsx with lazy loading
- [ ] T062 [US3] Add EmptyState for dashboard when no task history exists
- [ ] T063 [US3] Implement real-time dashboard updates when tasks are completed
- [ ] T064 [US3] Add loading states for dashboard chart components
- [ ] T065 [US3] Optimize dashboard performance for 1000+ tasks with virtualization

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T066 [P] Create Chrome extension background service worker in src/background/service-worker.ts
- [ ] T067 [P] Add extension popup UI in src/popup.html and src/pages/Popup.tsx (optional)
- [ ] T068 [P] Create extension icons in public/icons/ (16px, 48px, 128px)
- [ ] T069 [P] Implement hybrid sync strategy between chrome.storage.sync and Supabase
- [ ] T070 [P] Add storage quota monitoring and cleanup for old completed tasks
- [ ] T071 [P] Setup Supabase Realtime subscriptions for cross-device sync
- [ ] T072 [P] Add user preferences management for theme and default view
- [ ] T073 [P] Implement offline support with sync queue for pending operations
- [ ] T074 [P] Add keyboard shortcuts for quick task addition (Ctrl+Enter, etc.)
- [ ] T075 [P] Optimize bundle size with code splitting for dashboard components
- [ ] T076 [P] Add accessibility features (ARIA labels, keyboard navigation)
- [ ] T077 [P] Performance optimization: virtual scrolling for large task lists
- [ ] T078 [P] Add data export functionality (CSV, JSON) from dashboard
- [ ] T079 Code cleanup and refactoring across all components
- [ ] T080 Run quickstart.md validation and setup verification

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 components but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses task data from US1/US2 but independently testable

### Within Each User Story

- React components before integration
- API functions before query hooks
- Query hooks before component integration
- Core implementation before optimization
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Component creation and styling within each story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all UI components for User Story 1 together:
Task: "Create TaskInput component in src/components/task/TaskInput.tsx"
Task: "Create TaskItem component in src/components/task/TaskItem.tsx"
Task: "Create TaskList component in src/components/task/TaskList.tsx"
Task: "Create EmptyState component in src/components/ui/EmptyState.tsx"

# Launch all styling for User Story 1 together:
Task: "Style TaskInput component with vanilla-extract in src/components/task/TaskInput.css.ts"
Task: "Style TaskItem component with vanilla-extract in src/components/task/TaskItem.css.ts"
Task: "Style TaskList component with vanilla-extract in src/components/task/TaskList.css.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Chrome extension requires Manifest V3 compliance (CSP, service worker)
- Hybrid storage: chrome.storage.sync (local cache) + Supabase (source of truth)
- Focus on performance: new tab must load <500ms, operations <100ms
- Tests not included per feature specification requirements
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently