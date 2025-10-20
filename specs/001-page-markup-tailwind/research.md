# Research: Page Markup with Tailwind CSS and shadcn/ui

**Feature**: 001-page-markup-tailwind
**Date**: 2025-10-20
**Phase**: 0 (Outline & Research)

## Overview

This document consolidates research findings for implementing professional page markup across 4 pages using Tailwind CSS v4 and shadcn/ui components while maintaining accessibility and responsive design standards.

## Component Selection Research

### Required shadcn/ui Components

Based on functional requirements analysis, the following shadcn/ui components need to be installed:

#### 1. Card Component
**Decision**: Install `card` component
**Rationale**: Landing page requires 3 feature cards (FR-002). Card provides structured content containers with built-in spacing and visual hierarchy.
**Installation**: `pnpx shadcn@latest add card`
**Usage**: Landing page feature cards
**Alternatives Considered**: Custom div containers rejected because Card provides consistent styling and accessibility patterns

#### 2. Separator Component
**Decision**: Install `separator` component
**Rationale**: Dashboard sidebar and content sections need visual separation. Separator provides semantic `<hr>` with proper ARIA attributes.
**Installation**: `pnpx shadcn@latest add separator`
**Usage**: Dashboard sidebar sections, content area dividers
**Alternatives Considered**: Border utilities alone rejected because Separator ensures accessibility and theme consistency

#### 3. Sheet Component
**Decision**: Install `sheet` component
**Rationale**: Dashboard mobile navigation (FR-007a) requires slide-out panel for collapsed sidebar. Sheet provides accessible overlay with focus trap and keyboard navigation.
**Installation**: `pnpx shadcn@latest add sheet`
**Usage**: Mobile hamburger menu (< 1024px viewports)
**Alternatives Considered**: Custom modal rejected due to complexity of accessibility requirements (focus management, escape handling, backdrop)

#### 4. Spinner/Loading Component (Optional)
**Decision**: Use simple SVG spinner with Tailwind animation
**Rationale**: Redirect page loading indicator (FR-008) needs minimal spinner. shadcn/ui doesn't provide dedicated spinner—custom SVG is simpler.
**Implementation**: Inline SVG with `animate-spin` utility
**Usage**: Redirect page loading state
**Alternatives Considered**: Installing icon library rejected to minimize dependencies

### Existing Components

- **Button**: Already installed, will be used for CTAs, OAuth buttons, logout
- **Input**: Already installed, reserved for future task input features (not in current scope)

## Layout Patterns Research

### Dashboard Sidebar Layout

**Decision**: Flexbox-based sidebar with fixed positioning on desktop
**Rationale**:
- Flexbox provides simple left-sidebar + right-content layout
- Fixed positioning keeps sidebar visible during content scroll
- CSS Grid considered but rejected for simpler mental model

**Desktop Implementation (≥1024px)**:
```
Container: flex
├── Sidebar: w-64 (fixed width 256px)
│   └── Navigation links, logout button
└── Main Content: flex-1 (remaining space)
    └── Task management sections
```

**Tablet/Mobile Implementation (<1024px)**:
- Sidebar hidden by default
- Sheet component provides slide-out overlay
- Hamburger icon in header toggles Sheet
- Backdrop closes on outside click or ESC key

**Breakpoint Strategy**:
- Desktop: `lg:` prefix (1024px+) shows sidebar
- Mobile/Tablet: `<lg:` hides sidebar, shows hamburger button

### Responsive Patterns

**Mobile-First Approach**:
1. Base styles target 320px minimum width
2. Progressive enhancement for larger viewports using `sm:`, `md:`, `lg:`, `xl:` prefixes
3. Content stacking on mobile, horizontal layouts on desktop

**Critical Breakpoints**:
- `sm:` 640px - Phone landscape
- `md:` 768px - Tablet portrait
- `lg:` 1024px - Desktop (sidebar threshold)
- `xl:` 1280px - Large desktop

## Accessibility Patterns

### Keyboard Navigation

**Decision**: Implement focus-visible styling and logical tab order
**Rationale**: FR-014 requires visible focus states; WCAG 2.1 AA mandates keyboard access

**Implementation**:
- All interactive elements receive `focus-visible:ring-2` styling
- Tab order follows visual flow: header → sidebar → main content → footer
- Skip links for keyboard users (optional enhancement)

**Mobile Navigation**:
- Sheet component handles focus trap automatically
- ESC key closes mobile nav
- Focus returns to hamburger button on close

### Semantic HTML

**Decision**: Use semantic HTML5 elements throughout
**Rationale**: FR-013 requires proper heading hierarchy and semantic structure

**Structure**:
- `<header>` for page headers
- `<nav>` for sidebar and navigation areas
- `<main>` for primary content
- `<aside>` for sidebar on desktop
- `<h1>` through `<h3>` for heading hierarchy
- `<button>` for all clickable actions (never `<div>` with onClick)

### ARIA Attributes

**Decision**: Minimal ARIA, prefer semantic HTML
**Rationale**: "First rule of ARIA: Don't use ARIA" - semantic HTML provides implicit roles

**Required ARIA**:
- `aria-label` for icon-only buttons (hamburger menu)
- `aria-current="page"` for active navigation links
- shadcn/ui components include necessary ARIA attributes by default

## Dark Mode Implementation

**Decision**: Tailwind `dark:` utility class approach
**Rationale**: FR-012 requires light theme with dark mode support

**Implementation**:
- Add `dark` class to `<html>` element for dark mode toggle
- Use `dark:` prefix for dark mode variants: `bg-white dark:bg-gray-900`
- shadcn/ui components support dark mode out of the box
- Toggle mechanism deferred to future state management (not in current scope)

**Color Strategy**:
- Light mode: White/gray backgrounds, dark text
- Dark mode: Dark gray/black backgrounds, light text
- Ensure 4.5:1 contrast ratio in both themes (WCAG AA)

## Loading States

### Redirect Page Spinner

**Decision**: Centered SVG spinner with Korean status text
**Rationale**: FR-008 requires loading indicator with Korean text; SC-008 requires <100ms appearance

**Implementation**:
```tsx
<div className="flex min-h-screen flex-col items-center justify-center">
  <svg className="h-12 w-12 animate-spin" />
  <p className="mt-4 text-gray-600 dark:text-gray-400">로그인 중입니다...</p>
</div>
```

**Performance**: Inline SVG ensures immediate render (no network request)

## Progressive Enhancement

**Decision**: Server-render all critical content, enhance with JS
**Rationale**: FR-015 requires critical content without JavaScript

**Critical Content** (must work without JS):
- Landing page hero and feature cards (static content)
- Sign-in page layout and branding (OAuth buttons require JS for auth flow)
- Dashboard page structure (task interactions require JS)

**JavaScript-Dependent**:
- OAuth authentication flow
- Mobile nav Sheet toggle
- Dark mode toggle (future)
- Task management interactions (existing functionality)

## Icon Strategy

**Decision**: Use emoji for feature cards, Lucide React for UI icons
**Rationale**: Spec assumption states "emoji or icon libraries" for features; Lucide provides accessible, tree-shakable icons

**Implementation**:
- Landing page features: Emoji (⚡, 📊, 🔄)
- UI chrome: Lucide React icons (Menu, X, LogOut)
- Icons include accessible labels via `aria-label` or adjacent text

## Spacing and Typography

**Decision**: Use Tailwind's default spacing scale and typography plugin
**Rationale**: FR-012 requires consistent spacing aligned with Tailwind design system

**Spacing Scale**:
- Container padding: `px-4 sm:px-6 lg:px-8` (responsive)
- Section gaps: `space-y-8` or `space-y-12`
- Component margins: `mt-4`, `mb-6`, etc.

**Typography**:
- Base font size: 16px (Tailwind default `text-base`)
- Headings: `text-4xl` (h1), `text-2xl` (h2), `text-xl` (h3)
- Line height: Tailwind defaults (1.5 for body, tighter for headings)
- Font family: System font stack (Tailwind default)

## Performance Considerations

### Tailwind CSS Optimization

**Decision**: Use Tailwind's JIT mode (default in v4)
**Rationale**: Generates only used classes, reduces CSS bundle size

**Implementation**: Already configured via Tailwind v4 setup (no action needed)

### Component Lazy Loading

**Decision**: No lazy loading for page components (all critical)
**Rationale**: Only 4 pages, all part of core navigation flow

**Future Optimization**: Lazy load Sheet component on desktop (only needed for mobile)

## Best Practices Summary

### Tailwind Utility Usage

1. Use `cn()` utility from `@/shared/lib/utils` for conditional classes
2. Group utilities logically: layout → sizing → spacing → colors → text
3. Extract repeated patterns to shared components (not utility classes)
4. Prefer semantic class names for components, utilities for layout

### Component Composition

1. Pages compose from shared UI components (Button, Card, etc.)
2. Dashboard-specific components (Sidebar, MobileNav) stay in dashboard/ui/
3. No prop drilling—use context for global state (theme, auth)
4. Keep components small and focused (single responsibility)

### Testing Strategy

**Manual Testing Checklist**:
- [ ] Test all pages at 320px, 768px, 1024px, 1920px widths
- [ ] Test keyboard navigation (Tab, Enter, ESC)
- [ ] Test screen reader with Safari + VoiceOver (macOS) or Chrome + NVDA (Windows)
- [ ] Test dark mode toggle (when implemented)
- [ ] Test browser zoom at 150% and 200%
- [ ] Test with JavaScript disabled (critical content visibility)

## Open Questions Resolved

All technical unknowns from Technical Context have been resolved through this research phase. No further clarifications needed before proceeding to Phase 1 (Design & Contracts).
