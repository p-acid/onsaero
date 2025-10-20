# Quickstart: Page Markup with Tailwind CSS and shadcn/ui

**Feature**: 001-page-markup-tailwind
**Date**: 2025-10-20
**Phase**: 1 (Design & Contracts)

## Overview

This quickstart guide provides step-by-step instructions for developing and testing the page markup feature. Follow these instructions to set up your development environment, install required dependencies, and verify the implementation.

## Prerequisites

Ensure you have the following before starting:

- [x] Node.js ≥ 18 installed
- [x] pnpm 9.0.0 installed
- [x] Git repository cloned
- [x] Feature branch `001-page-markup-tailwind` checked out
- [x] Supabase project configured (authentication should already work)

## Initial Setup

### 1. Install Dependencies

From repository root:

```bash
# Install all monorepo dependencies
pnpm install

# Verify Tailwind CSS v4 is installed
pnpm list tailwindcss
# Should show: tailwindcss@4.1.14

# Verify shadcn/ui is configured
ls packages/shared/src/shared/ui
# Should show: button.tsx, input.tsx, index.ts
```

### 2. Install Required shadcn/ui Components

Navigate to the shared package and install new components:

```bash
cd packages/shared

# Install Card component (for landing page feature cards)
pnpx shadcn@latest add card

# Install Separator component (for dashboard sections)
pnpx shadcn@latest add separator

# Install Sheet component (for mobile sidebar navigation)
pnpx shadcn@latest add sheet

# Verify components were added
ls src/shared/ui
# Should now show: button.tsx, card.tsx, input.tsx, separator.tsx, sheet.tsx, index.ts

cd ../..
```

### 3. Start Development Server

```bash
# Start all apps in development mode (from repo root)
pnpm dev

# OR start only the web app
pnpm dev --filter=web

# Development server should start at http://localhost:5173 (or similar)
```

### 4. Verify Existing Pages Load

Navigate to these URLs to verify current state:

- Landing Page: `http://localhost:5173/`
- Sign-In Page: `http://localhost:5173/sign-in`
- Dashboard Page: `http://localhost:5173/dashboard` (requires authentication)

## Development Workflow

### Building the Shared Package

When making changes to `packages/shared`, you may need to rebuild:

```bash
cd packages/shared

# Build TypeScript modules
pnpm build:modules

# Build Tailwind CSS styles
pnpm build:styles

# OR build both in parallel
pnpm build

cd ../..
```

**Note**: In dev mode, Turborepo handles this automatically via `dependsOn: ["^build"]`.

### Making Changes

**Recommended Order** (align with task priority):

1. **Landing Page** (Priority P1)
   - File: `packages/shared/src/pages/landing/ui/index.tsx`
   - Add hero section with CTA button
   - Add 3 feature cards using Card component
   - Implement responsive layout

2. **Sign-In Page** (Priority P2)
   - Files:
     - `packages/shared/src/pages/sign-in/ui/index.tsx`
     - `packages/shared/src/pages/sign-in/ui/login-button.tsx`
   - Center OAuth button
   - Add branding (logo/tagline)

3. **Dashboard Page** (Priority P3)
   - Files:
     - `packages/shared/src/pages/dashboard/ui/index.tsx`
     - `packages/shared/src/pages/dashboard/ui/sidebar.tsx` (NEW FILE)
     - `packages/shared/src/pages/dashboard/ui/mobile-nav.tsx` (NEW FILE)
   - Implement sidebar navigation for desktop
   - Implement Sheet-based mobile navigation
   - Add placeholder task sections

4. **Redirect Page** (Priority P2)
   - File: `apps/web/src/pages/redirect/ui/index.tsx`
   - Enhance loading spinner
   - Verify Korean text displays correctly

### Code Style Guidelines

Follow these conventions (enforced by Biome):

```tsx
// ✅ Good: Single quotes, no semicolons (ASI), 2-space indent
export const MyComponent = () => {
  return (
    <div className="flex items-center">
      <p>Hello World</p>
    </div>
  )
}

// ✅ Good: Use cn() utility for conditional classes
import { cn } from '@/shared/lib/utils'

export const Button = ({ variant }: { variant: 'primary' | 'secondary' }) => {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-800'
      )}
    >
      Click me
    </button>
  )
}

// ✅ Good: Responsive design with Tailwind prefixes
<div className="flex flex-col lg:flex-row">
  {/* Stacks on mobile, horizontal on desktop */}
</div>

// ✅ Good: Dark mode support
<p className="text-gray-900 dark:text-gray-100">
  This text adapts to theme
</p>
```

### Linting and Formatting

Before committing:

```bash
# Run linter (from repo root)
pnpm lint

# Biome will run automatically on pre-commit hook
# Manual check:
pnpm biome check packages/shared/src

# Auto-fix issues:
pnpm biome check --write packages/shared/src
```

## Testing Guide

### Manual Testing Checklist

#### Viewport Testing

Test each page at these viewport widths:

```bash
# Use browser DevTools responsive mode
# Test at: 320px, 375px, 768px, 1024px, 1920px
```

**Landing Page**:
- [ ] Hero section visible and readable at 320px width
- [ ] CTA button navigates to `/sign-in` when clicked
- [ ] 3 feature cards stack vertically on mobile
- [ ] Feature cards display in grid on desktop (≥1024px)
- [ ] No horizontal scrolling at any viewport

**Sign-In Page**:
- [ ] OAuth button centered at all viewport sizes
- [ ] Button sized appropriately for touch on mobile (min 44x44px)
- [ ] Hover states visible on desktop
- [ ] Logo/tagline visible and properly sized

**Dashboard Page**:
- [ ] Sidebar visible on left at desktop (≥1024px)
- [ ] Sidebar contains navigation links and logout button
- [ ] Main content area on right with task sections
- [ ] Sidebar hidden on mobile (<1024px)
- [ ] Hamburger menu visible on mobile
- [ ] Clicking hamburger opens Sheet overlay
- [ ] Sheet closes with X button, ESC key, or backdrop click

**Redirect Page**:
- [ ] Loading spinner centered on screen
- [ ] Korean text "로그인 중입니다..." displays correctly
- [ ] Spinner animates smoothly

#### Accessibility Testing

**Keyboard Navigation**:
```bash
# Test with keyboard only (no mouse)
# Use Tab, Shift+Tab, Enter, ESC keys
```

- [ ] Tab key navigates through all interactive elements
- [ ] Focus visible on all elements (blue ring or similar)
- [ ] Enter key activates buttons and links
- [ ] ESC key closes mobile nav Sheet
- [ ] Tab order logical (header → sidebar → content)

**Screen Reader Testing**:

macOS (Safari + VoiceOver):
```bash
# Enable VoiceOver: Cmd+F5
# Navigate: Ctrl+Option+Arrow keys
```

- [ ] All images have alt text or aria-label
- [ ] Buttons have accessible names
- [ ] Headings announced in correct hierarchy (H1 → H2 → H3)
- [ ] Navigation landmarks announced (`<nav>`, `<main>`, etc.)

**Color Contrast**:
```bash
# Use browser extension: axe DevTools or WAVE
# Or manual check: WebAIM Contrast Checker
```

- [ ] Text contrast ≥ 4.5:1 in light mode
- [ ] Text contrast ≥ 4.5:1 in dark mode
- [ ] Link text distinguishable from body text

#### Browser Testing

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

#### Zoom Testing

Test at browser zoom levels:
- [ ] 100% (default)
- [ ] 150%
- [ ] 200%

Verify: No layout breaking, text remains readable, horizontal scroll minimal

#### JavaScript Disabled

Test with JS disabled (simulate):
```bash
# Chrome: DevTools → Settings → Debugger → Disable JavaScript
```

- [ ] Landing page content visible (hero + features)
- [ ] Sign-in page layout visible (OAuth flow requires JS, expected)
- [ ] Dashboard page structure visible (interactions require JS, expected)

## Verification Commands

### Type Checking

```bash
# Check types in shared package
cd packages/shared
pnpm check-types

# Check types in web app
cd ../../apps/web
pnpm check-types
```

### Build Verification

```bash
# Build shared package
cd packages/shared
pnpm build

# Should complete without errors
# Check dist/ folder exists with compiled files

# Build web app
cd ../../apps/web
pnpm build

# Should complete without errors
# Check dist/ folder exists
```

### Git Hooks Verification

```bash
# Test pre-commit hook
git add packages/shared/src/pages/landing/ui/index.tsx
git commit -m "test: verify pre-commit hook"

# Should run Biome check automatically
# Commit will fail if linting errors exist
```

## Troubleshooting

### shadcn/ui Installation Issues

**Problem**: `pnpx shadcn@latest add` fails

**Solution**:
```bash
# Ensure you're in the correct directory
cd packages/shared

# Check components.json exists
ls components.json

# If missing, consult shadcn/ui docs for init
```

### Tailwind Classes Not Applied

**Problem**: Tailwind utility classes not styling components

**Solution**:
```bash
# Verify Tailwind config
cat tailwind.config.ts

# Ensure shared package styles are imported
cat packages/shared/src/shared/style/index.css
# Should contain: @import "tailwindcss";

# Rebuild styles
cd packages/shared
pnpm build:styles
```

### TypeScript Errors in Shared Package

**Problem**: Import errors when using shared components in web app

**Solution**:
```bash
# Rebuild shared package
cd packages/shared
pnpm build

# Verify exports in package.json
cat package.json | grep exports
# Should show: "./dist/index.js" and "./dist/index.css"
```

### Dark Mode Not Working

**Problem**: `dark:` utility classes not applying

**Solution**:
```tsx
// Verify <html> element has 'dark' class
<html className="dark">

// OR toggle programmatically (future feature)
document.documentElement.classList.toggle('dark')
```

## Next Steps

After completing development and testing:

1. Run full linting and type checks
2. Complete all items in Manual Testing Checklist
3. Commit changes following Conventional Commits format
4. Proceed to `/speckit.tasks` to generate task breakdown
5. Begin implementation following task order

## Additional Resources

- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [React Router v7 Docs](https://reactrouter.com)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_customize&levels=aaa)
- [Biome Linter Rules](https://biomejs.dev/linter/rules/)

## Success Criteria Validation

Before marking this feature complete, verify all Success Criteria from spec.md:

- [ ] SC-001: No horizontal scroll at 320px
- [ ] SC-002: CTA identifiable within 3 seconds
- [ ] SC-003: Auth page loads < 1 second
- [ ] SC-004: Dashboard visual hierarchy clear within 2 seconds
- [ ] SC-005: Hover/focus states respond < 100ms
- [ ] SC-006: Text readable (16px min, 4.5:1 contrast) in both themes
- [ ] SC-007: Full keyboard navigation possible
- [ ] SC-008: Loading state appears < 100ms

All criteria must pass before proceeding to `/speckit.implement`.
