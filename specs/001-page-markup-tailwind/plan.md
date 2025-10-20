# Implementation Plan: Page Markup with Tailwind CSS and shadcn/ui

**Branch**: `001-page-markup-tailwind` | **Date**: 2025-10-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-page-markup-tailwind/spec.md`

**Note**: This plan outlines the technical approach for implementing professional page markup across 4 key pages (Landing, Sign-In, Dashboard, Redirect) using Tailwind CSS v4 and shadcn/ui components.

## Summary

This feature enhances the visual presentation layer of the Onsaero task management application by implementing professional, accessible, and responsive page markup. The primary requirement is to upgrade 4 existing placeholder pages with polished UI using Tailwind CSS utility classes and shadcn/ui components while maintaining WCAG 2.1 AA accessibility standards.

**Technical Approach**: Component-driven markup within Feature-Sliced Design architecture, leveraging shadcn/ui for UI primitives, Tailwind CSS v4 for styling, and implementing a desktop-focused sidebar layout for the dashboard with responsive mobile adaptations.

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict mode enabled)
**Primary Dependencies**:
- React 19.1.1
- Tailwind CSS v4.1.14
- shadcn/ui (Radix UI primitives)
- React Router v7.9.4
- Biome 2.2.6 (linting/formatting)

**Storage**: N/A (UI/presentation layer only, no data persistence in this feature)
**Testing**: Manual testing across viewports and devices (mobile 320px+, tablet 768px+, desktop 1024px+)
**Target Platform**: Web browsers (modern evergreen browsers: Chrome, Firefox, Safari, Edge)
**Project Type**: Monorepo web application (Turborepo with shared package architecture)
**Performance Goals**:
- Page load < 1 second on broadband
- Interactive elements respond within 100ms
- No horizontal scroll on any viewport ≥320px

**Constraints**:
- Must use Tailwind CSS exclusively (no inline styles or CSS modules)
- Must use shadcn/ui components where available
- Must meet WCAG 2.1 AA accessibility standards
- Must support keyboard navigation
- Must implement progressive enhancement (critical content without JS)
- Must support both light and dark themes

**Scale/Scope**: 4 pages (Landing, Sign-In, Dashboard, Redirect) across 2 packages (shared + web)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Tailwind CSS-First Design System
**Status**: ✅ PASS
- Requirement FR-010 explicitly mandates Tailwind CSS utility classes exclusively
- No inline styles, CSS modules, or custom CSS planned
- Global base styles limited to shared package as permitted

### Principle II: shadcn/ui Component Library
**Status**: ✅ PASS
- Requirement FR-011 mandates shadcn/ui components for interactive elements
- Installation via CLI to `packages/shared/src/shared/ui/` as required
- Current components: Button, Input (additional components to be identified and installed)

### Principle III: Feature-Sliced Design Architecture
**Status**: ✅ PASS
- Pages located in `packages/shared/src/pages/` per FSD pages layer
- Redirect page in `apps/web/src/pages/` (app-specific override)
- No cross-layer violations planned
- Components will be added to `shared/ui/` layer as needed

### Principle IV: Monorepo Workspace Isolation
**Status**: ✅ PASS
- Shared pages consumed via `@onsaero/shared` workspace dependency
- No direct cross-app imports
- Clear boundary: shared package for reusable UI, web app for routing/integration

### Principle V: Component-Driven Page Markup
**Status**: ✅ PASS
- Pages will compose widgets and UI components
- Business logic delegated to existing stores and context providers
- Presentation-only focus (no new business logic)

### Principle VI: Accessibility-First Implementation
**Status**: ✅ PASS
- Requirement FR-013 mandates WCAG 2.1 AA standards
- Requirement FR-014 mandates keyboard navigation
- shadcn/ui baseline accessibility to be preserved
- Semantic HTML and proper heading hierarchy required

**Constitution Compliance**: ALL PRINCIPLES PASS - No violations to justify

## Project Structure

### Documentation (this feature)

```
specs/001-page-markup-tailwind/
├── spec.md                      # Feature specification
├── plan.md                      # This file
├── research.md                  # Phase 0: Component research and patterns
├── data-model.md                # Phase 1: N/A (UI-only, no data model changes)
├── quickstart.md                # Phase 1: Development and testing guide
├── checklists/
│   └── requirements.md          # Spec quality validation
└── contracts/                   # Phase 1: N/A (no API contracts for UI markup)
```

### Source Code (repository root)

```
packages/shared/
├── src/
│   ├── pages/
│   │   ├── landing/
│   │   │   └── ui/
│   │   │       └── index.tsx        # Landing page component (enhance)
│   │   ├── sign-in/
│   │   │   └── ui/
│   │   │       ├── index.tsx        # Sign-in page component (enhance)
│   │   │       └── login-button.tsx # OAuth button component (enhance)
│   │   └── dashboard/
│   │       └── ui/
│   │           ├── index.tsx        # Dashboard page component (enhance with sidebar)
│   │           ├── sidebar.tsx      # NEW: Sidebar navigation component
│   │           └── mobile-nav.tsx   # NEW: Mobile navigation component
│   ├── widgets/                     # Composite UI blocks (if needed)
│   └── shared/
│       ├── ui/
│       │   ├── button.tsx           # EXISTS: shadcn/ui Button
│       │   ├── input.tsx            # EXISTS: shadcn/ui Input
│       │   ├── card.tsx             # NEW: shadcn/ui Card (to install)
│       │   ├── separator.tsx        # NEW: shadcn/ui Separator (to install)
│       │   └── sheet.tsx            # NEW: shadcn/ui Sheet (mobile sidebar, to install)
│       ├── lib/
│       │   └── utils.ts             # cn() utility for class merging
│       └── style/
│           └── index.css            # Global styles + Tailwind imports
│
apps/web/
├── src/
│   └── pages/
│       └── redirect/
│           └── ui/
│               └── index.tsx        # OAuth redirect page (enhance loading state)
```

**Structure Decision**: This is a web monorepo application (Option 2 variant) with a shared package pattern. The feature leverages existing FSD structure in `packages/shared/src/pages/` for reusable page components, with a single app-specific override in `apps/web/src/pages/redirect/` for OAuth callback handling. No new top-level structure needed—enhancements applied to existing files with 3 new component files for dashboard sidebar functionality.

## Complexity Tracking

*No constitution violations - this section is empty*
