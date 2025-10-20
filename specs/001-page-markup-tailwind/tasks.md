---
description: "Task list for page markup with Tailwind CSS and shadcn/ui"
---

# Tasks: Page Markup with Tailwind CSS and shadcn/ui

**Input**: Design documents from `/specs/001-page-markup-tailwind/`
**Prerequisites**: plan.md (required), spec.md (required), research.md (component decisions), quickstart.md (testing guide)

**Tests**: This feature does not include automated tests. Manual testing will be performed using the checklist in quickstart.md.

**Organization**: Tasks are grouped by user story (P1 → P3) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions
- **Shared package pages**: `packages/shared/src/pages/[page]/ui/`
- **Shared package UI**: `packages/shared/src/shared/ui/`
- **Web app pages**: `apps/web/src/pages/[page]/ui/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install required dependencies and verify development environment

- [ ] T001 Install Card component via pnpx shadcn@latest add card in packages/shared/
- [ ] T002 Install Separator component via pnpx shadcn@latest add separator in packages/shared/
- [ ] T003 Install Sheet component via pnpx shadcn@latest add sheet in packages/shared/
- [ ] T004 [P] Verify shadcn/ui components exported in packages/shared/src/shared/ui/index.ts
- [ ] T005 [P] Verify cn() utility exists in packages/shared/src/shared/lib/utils.ts
- [ ] T006 Start development server with pnpm dev and verify all pages load

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Install and configure Lucide React icon library needed for UI chrome across all pages

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Install lucide-react dependency in packages/shared/ via pnpm add lucide-react
- [ ] T008 Verify Tailwind CSS v4 configuration in tailwind.config.ts supports dark mode class strategy

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Landing Page Marketing Experience (Priority: P1) 🎯 MVP

**Goal**: Create professional landing page with hero section, 3 feature cards, and navigation

**Independent Test**: Navigate to root URL (http://localhost:5173/) and verify hero section, 3 feature cards, and sign-in navigation are visible and properly styled across mobile (320px), tablet (768px), and desktop (1024px+) viewports

### Implementation for User Story 1

- [ ] T009 [US1] Implement hero section with product name, tagline, and CTA button in packages/shared/src/pages/landing/ui/index.tsx
- [ ] T010 [US1] Add Button component import from @/shared/ui and configure CTA to navigate to /sign-in in packages/shared/src/pages/landing/ui/index.tsx
- [ ] T011 [P] [US1] Implement 3 feature cards using Card component with emoji icons (⚡, 📊, 🔄) in packages/shared/src/pages/landing/ui/index.tsx
- [ ] T012 [US1] Add responsive layout with mobile stacking and desktop grid (grid-cols-1 md:grid-cols-3) for feature cards in packages/shared/src/pages/landing/ui/index.tsx
- [ ] T013 [US1] Implement header navigation with sign-in link in packages/shared/src/pages/landing/ui/index.tsx
- [ ] T014 [US1] Add dark mode support with dark: utility classes for all text and backgrounds in packages/shared/src/pages/landing/ui/index.tsx
- [ ] T015 [US1] Add semantic HTML structure (<header>, <main>, <section>) and heading hierarchy (h1, h2, h3) in packages/shared/src/pages/landing/ui/index.tsx
- [ ] T016 [US1] Add focus-visible styles to CTA button and navigation links in packages/shared/src/pages/landing/ui/index.tsx

**Checkpoint**: Landing page is fully functional. Test independently at 320px, 768px, 1024px viewports before proceeding.

---

## Phase 4: User Story 2 - Sign-In Authentication Flow (Priority: P2)

**Goal**: Create clean, centered sign-in page with OAuth buttons and branding

**Independent Test**: Navigate to /sign-in and verify product logo, tagline, and OAuth buttons are centered and properly styled across all viewports

### Implementation for User Story 2

- [ ] T017 [P] [US2] Implement centered layout with flexbox (flex min-h-screen items-center justify-center) in packages/shared/src/pages/sign-in/ui/index.tsx
- [ ] T018 [P] [US2] Add product branding (logo/tagline) with proper heading hierarchy in packages/shared/src/pages/sign-in/ui/index.tsx
- [ ] T019 [US2] Style LoginButton component with shadcn/ui Button in packages/shared/src/pages/sign-in/ui/login-button.tsx
- [ ] T020 [US2] Add hover and focus-visible states to OAuth button in packages/shared/src/pages/sign-in/ui/login-button.tsx
- [ ] T021 [US2] Add responsive sizing for touch targets (min-h-11 min-w-44) on mobile in packages/shared/src/pages/sign-in/ui/login-button.tsx
- [ ] T022 [US2] Add dark mode support with dark: utility classes in packages/shared/src/pages/sign-in/ui/index.tsx
- [ ] T023 [US2] Add semantic HTML (<main>, <h1>) in packages/shared/src/pages/sign-in/ui/index.tsx

**Checkpoint**: Sign-in page is fully functional. Test independently with keyboard navigation and across viewports.

---

## Phase 5: User Story 4 - OAuth Redirect Processing (Priority: P2)

**Goal**: Enhanced loading state during OAuth callback processing

**Independent Test**: Trigger OAuth callback URL and verify centered spinner with Korean text "로그인 중입니다..." appears immediately

**Note**: This story is implemented before Dashboard (US3) because it shares P2 priority with Sign-In and is simpler

### Implementation for User Story 4

- [ ] T024 [P] [US4] Create SVG spinner with animate-spin utility in apps/web/src/pages/redirect/ui/index.tsx
- [ ] T025 [P] [US4] Add centered flexbox layout (flex min-h-screen items-center justify-center flex-col) in apps/web/src/pages/redirect/ui/index.tsx
- [ ] T026 [US4] Add Korean loading text with proper text styling and spacing in apps/web/src/pages/redirect/ui/index.tsx
- [ ] T027 [US4] Add dark mode support for spinner and text in apps/web/src/pages/redirect/ui/index.tsx
- [ ] T028 [US4] Verify loading state appears within 100ms (SC-008) by testing with network throttling

**Checkpoint**: Redirect page loading state is functional. Test with OAuth flow.

---

## Phase 6: User Story 3 - Dashboard Task Management Interface (Priority: P3)

**Goal**: Implement desktop sidebar navigation with mobile Sheet overlay and task management area

**Independent Test**: Authenticate and verify desktop shows sidebar on left + main content on right at ≥1024px; mobile shows hamburger menu with Sheet overlay at <1024px

### Implementation for User Story 3

- [ ] T029 [P] [US3] Create Sidebar component file at packages/shared/src/pages/dashboard/ui/sidebar.tsx
- [ ] T030 [P] [US3] Create MobileNav component file at packages/shared/src/pages/dashboard/ui/mobile-nav.tsx
- [ ] T031 [US3] Implement Sidebar with fixed width (w-64) and navigation links in packages/shared/src/pages/dashboard/ui/sidebar.tsx
- [ ] T032 [US3] Add logout button using shadcn/ui Button with LogOut icon from lucide-react in packages/shared/src/pages/dashboard/ui/sidebar.tsx
- [ ] T033 [US3] Add Separator components between navigation sections in packages/shared/src/pages/dashboard/ui/sidebar.tsx
- [ ] T034 [US3] Implement MobileNav using Sheet component with hamburger trigger in packages/shared/src/pages/dashboard/ui/mobile-nav.tsx
- [ ] T035 [US3] Add Menu and X icons from lucide-react for hamburger button in packages/shared/src/pages/dashboard/ui/mobile-nav.tsx
- [ ] T036 [US3] Add aria-label="Open navigation menu" to hamburger button in packages/shared/src/pages/dashboard/ui/mobile-nav.tsx
- [ ] T037 [US3] Implement flexbox layout with sidebar (hidden lg:block) and main content (flex-1) in packages/shared/src/pages/dashboard/ui/index.tsx
- [ ] T038 [US3] Add responsive breakpoint logic: show Sidebar on desktop (≥1024px), show MobileNav on mobile (<1024px) in packages/shared/src/pages/dashboard/ui/index.tsx
- [ ] T039 [US3] Create placeholder task management sections in main content area in packages/shared/src/pages/dashboard/ui/index.tsx
- [ ] T040 [US3] Add dark mode support to Sidebar, MobileNav, and main content in packages/shared/src/pages/dashboard/ui/
- [ ] T041 [US3] Add semantic HTML (<nav>, <aside>, <main>) and proper heading hierarchy in packages/shared/src/pages/dashboard/ui/index.tsx
- [ ] T042 [US3] Add focus-visible styles to all navigation links and logout button in packages/shared/src/pages/dashboard/ui/sidebar.tsx
- [ ] T043 [US3] Add aria-current="page" to active navigation link in packages/shared/src/pages/dashboard/ui/sidebar.tsx
- [ ] T044 [US3] Verify Sheet closes with ESC key, X button, and backdrop click in packages/shared/src/pages/dashboard/ui/mobile-nav.tsx
- [ ] T045 [US3] Verify keyboard tab order: hamburger → sheet navigation → main content in packages/shared/src/pages/dashboard/ui/index.tsx

**Checkpoint**: Dashboard is fully functional with sidebar navigation. Test desktop and mobile layouts independently.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements, validation, and documentation

- [ ] T046 [P] Verify all pages load without horizontal scroll at 320px width using browser DevTools
- [ ] T047 [P] Verify all interactive elements have hover states using mouse interaction
- [ ] T048 [P] Verify all interactive elements have focus-visible states using Tab key navigation
- [ ] T049 [P] Test keyboard navigation (Tab, Enter, ESC) across all 4 pages
- [ ] T050 [P] Verify 4.5:1 contrast ratio for text in light and dark modes using WebAIM Contrast Checker
- [ ] T051 [P] Test screen reader with Safari + VoiceOver (macOS) or Chrome + NVDA (Windows) on all pages
- [ ] T052 [P] Test responsive layouts at 320px, 768px, 1024px, 1920px viewports
- [ ] T053 [P] Test browser zoom at 150% and 200% on all pages
- [ ] T054 [P] Verify critical content visible with JavaScript disabled (Landing, Sign-In structure)
- [ ] T055 [P] Run biome check on packages/shared/src and apps/web/src to verify linting passes
- [ ] T056 [P] Run pnpm check-types in packages/shared and apps/web to verify TypeScript compilation
- [ ] T057 [P] Build shared package with pnpm build and verify dist/ folder contains compiled files
- [ ] T058 Verify all Success Criteria (SC-001 through SC-008) from spec.md pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1 - Landing): Can start after Foundational (independent, no dependencies)
  - User Story 2 (P2 - Sign-In): Can start after Foundational (independent, no dependencies)
  - User Story 4 (P2 - Redirect): Can start after Foundational (independent, no dependencies)
  - User Story 3 (P3 - Dashboard): Can start after Foundational (independent, no dependencies)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Landing)**: Independent - No dependencies on other stories
- **User Story 2 (P2 - Sign-In)**: Independent - No dependencies on other stories
- **User Story 4 (P2 - Redirect)**: Independent - No dependencies on other stories
- **User Story 3 (P3 - Dashboard)**: Independent - No dependencies on other stories

**Key Insight**: All user stories are independent and can be implemented in parallel by different team members after Phase 2 completes.

### Within Each User Story

- Landing (US1): Tasks T009-T016 are mostly sequential (each builds on page structure)
- Sign-In (US2): Tasks T017-T018 parallel, T019-T023 mostly sequential
- Redirect (US4): Tasks T024-T025 parallel, T026-T028 sequential
- Dashboard (US3): Tasks T029-T030 parallel (create files), T031-T045 sequential (build sidebar → integrate)

### Parallel Opportunities

- Phase 1 Setup: All tasks (T001-T003) can run in parallel (different shadcn/ui components)
- Phase 2 Foundational: Tasks T007-T008 can run in parallel
- User Story 1: Tasks T011 (feature cards) can be developed in parallel with T009-T010 (hero section)
- User Story 2: Tasks T017-T018 can run in parallel (layout + branding)
- User Story 4: Tasks T024-T025 can run in parallel (spinner + layout)
- User Story 3: Tasks T029-T030 can run in parallel (create Sidebar and MobileNav files)
- Phase 7 Polish: All validation tasks (T046-T057) can run in parallel

---

## Parallel Example: User Story 1 (Landing Page)

```bash
# Create hero section and feature cards in parallel:
Task: T009 - Implement hero section with product name, tagline, and CTA
Task: T011 - Implement 3 feature cards using Card component
# Both work on same file but different sections, can merge easily

# After both complete, continue with:
Task: T010 - Configure CTA button navigation
Task: T012 - Add responsive layout for cards
Task: T013 - Implement header navigation
Task: T014 - Add dark mode support
Task: T015 - Add semantic HTML structure
Task: T016 - Add focus-visible styles
```

---

## Parallel Example: User Story 3 (Dashboard)

```bash
# Create component files in parallel:
Task: T029 - Create Sidebar component file
Task: T030 - Create MobileNav component file

# Implement components in parallel (different files):
Task: T031 - Implement Sidebar navigation links
Task: T034 - Implement MobileNav with Sheet component
# Both can proceed simultaneously

# After both components complete:
Task: T037 - Integrate Sidebar and MobileNav into dashboard page
Task: T038 - Add responsive breakpoint logic
# Then continue with remaining tasks sequentially
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Minimum Viable Product**: Landing page with hero and feature cards

1. Complete Phase 1: Setup (install shadcn/ui components)
2. Complete Phase 2: Foundational (install Lucide React)
3. Complete Phase 3: User Story 1 (Landing Page)
4. **STOP and VALIDATE**: Test landing page independently
   - Navigate to http://localhost:5173/
   - Verify hero section, 3 feature cards, navigation visible
   - Test at 320px, 768px, 1024px viewports
   - Test keyboard navigation (Tab to CTA, Enter navigates)
   - Test dark mode toggle (if implemented)
5. Deploy/demo if ready - Landing page provides immediate value!

### Incremental Delivery (Recommended)

**Strategy**: Add one user story at a time, validate independently

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Landing) → Test independently → Deploy/Demo (**MVP!**)
3. Add User Story 2 (Sign-In) → Test independently → Deploy/Demo
4. Add User Story 4 (Redirect) → Test independently → Deploy/Demo
5. Add User Story 3 (Dashboard) → Test independently → Deploy/Demo
6. Complete Polish phase → Final validation → Production release

Each story adds value without breaking previous stories.

### Parallel Team Strategy

**With multiple developers**, maximize throughput:

1. Team completes Setup + Foundational together (6 tasks, ~30 minutes)
2. Once Foundational is done, split work:
   - **Developer A**: User Story 1 (Landing) - 8 tasks
   - **Developer B**: User Story 2 (Sign-In) + User Story 4 (Redirect) - 12 tasks
   - **Developer C**: User Story 3 (Dashboard) - 17 tasks
3. Stories complete and integrate independently
4. Team validates together in Phase 7 (Polish)

**Estimated Timeline**:
- Setup + Foundational: 30-60 minutes
- User Story 1: 2-3 hours
- User Story 2 + 4: 2-3 hours (combined)
- User Story 3: 4-5 hours (most complex with sidebar)
- Polish: 1-2 hours
- **Total**: 10-14 hours (sequential) or 5-7 hours (3 developers in parallel)

---

## Notes

- [P] tasks = different files or independent sections, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Manual testing replaces automated tests (see quickstart.md checklist)
- Commit after each completed user story phase
- Stop at any checkpoint to validate story independently
- Avoid: modifying same file section simultaneously, skipping validation checkpoints

---

## Task Count Summary

- **Total Tasks**: 58
- **Setup (Phase 1)**: 6 tasks
- **Foundational (Phase 2)**: 2 tasks
- **User Story 1 (P1 - Landing)**: 8 tasks
- **User Story 2 (P2 - Sign-In)**: 7 tasks
- **User Story 4 (P2 - Redirect)**: 5 tasks
- **User Story 3 (P3 - Dashboard)**: 17 tasks
- **Polish (Phase 7)**: 13 tasks

**Parallel Opportunities**: 21 tasks marked with [P] can run in parallel when dependencies allow

**Independent Test Criteria**: Each user story has clear checkpoints for independent validation before proceeding
