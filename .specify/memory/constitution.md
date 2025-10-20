<!--
Sync Impact Report:
Version: 1.0.0 (initial creation)
Modified principles: N/A (initial constitution)
Added sections:
  - Core Principles (6 principles)
  - UI Component Standards
  - Development Workflow
  - Governance
Templates status:
  ✅ plan-template.md - reviewed, constitution check section compatible
  ✅ spec-template.md - reviewed, requirements align with principles
  ✅ tasks-template.md - reviewed, task structure compatible
Follow-up TODOs: None
-->

# Onsaero Project Constitution

## Core Principles

### I. Tailwind CSS-First Design System

All UI components and pages MUST use Tailwind CSS v4 for styling. Inline styles, CSS modules, or custom CSS files are prohibited except for global base styles in the shared package.

**Rationale**: Ensures consistency, maintainability, and leverages Tailwind's utility-first approach for rapid development while maintaining a cohesive design system across the monorepo.

### II. shadcn/ui Component Library

UI components MUST be sourced from shadcn/ui when available. Custom components are permitted only when shadcn/ui lacks the required functionality. All shadcn/ui components MUST be installed via CLI commands and stored in `packages/shared/src/shared/ui/`.

**Rationale**: Provides accessible, well-tested, and customizable components that integrate seamlessly with Tailwind CSS and Radix UI primitives, reducing development time and ensuring accessibility standards.

### III. Feature-Sliced Design Architecture

The shared package MUST follow Feature-Sliced Design (FSD) layer hierarchy:
- `entities/` - Business entities
- `pages/` - Full page components
- `widgets/` - Composite UI blocks
- `shared/` - Shared utilities and infrastructure

Cross-layer imports MUST respect the hierarchy (higher layers can import from lower layers, never the reverse).

**Rationale**: Enforces clear separation of concerns, improves code discoverability, and prevents circular dependencies in a monorepo environment.

### IV. Monorepo Workspace Isolation

Each workspace (apps/web, apps/extension, packages/shared) MUST maintain clear boundaries. Shared code MUST reside in `packages/shared` and be consumed via workspace dependencies (`workspace:*`). Direct cross-app imports are prohibited.

**Rationale**: Enables independent building, testing, and deployment of applications while maximizing code reuse through the shared package architecture.

### V. Component-Driven Page Markup

Page components in `packages/shared/src/pages/` MUST be role-focused and semantically structured. Pages MUST compose widgets and UI components rather than implementing business logic. State management belongs in stores or context providers.

**Rationale**: Separates presentation from logic, improves testability, and allows pages to be reused across web and extension applications with consistent behavior.

### VI. Accessibility-First Implementation

All UI components and pages MUST meet WCAG 2.1 AA standards. Use semantic HTML, ARIA attributes when necessary, and ensure keyboard navigation support. shadcn/ui components provide baseline accessibility that MUST NOT be degraded.

**Rationale**: Ensures the application is usable by all users, including those with disabilities, and aligns with modern web standards and legal requirements.

## UI Component Standards

### Component Structure

- Components MUST use functional components with TypeScript
- Props MUST be explicitly typed with interfaces or types
- Component files MUST be named using kebab-case (e.g., `login-button.tsx`)
- Index files MUST export components using named exports

### Styling Guidelines

- Use Tailwind CSS utility classes via the `className` prop
- Complex class combinations MUST use the `cn()` utility from `shared/lib/utils`
- Responsive design MUST use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)
- Dark mode support MUST use Tailwind's `dark:` prefix when implemented
- Class order MUST follow Biome's `useSortedClasses` rule (enforced automatically)

### shadcn/ui Integration

- Install components via: `pnpx shadcn@latest add [component-name]`
- Components MUST be added to `packages/shared/src/shared/ui/`
- Customizations MUST be made through Tailwind config or component props
- Do NOT modify shadcn/ui component source files directly without documentation

## Development Workflow

### Code Quality Gates

1. **Linting**: All code MUST pass Biome checks before commit (enforced via pre-commit hook)
2. **Type Safety**: TypeScript strict mode MUST be enabled; type errors are blocking
3. **Commit Messages**: MUST follow Conventional Commits format (enforced via commitlint)
4. **Code Formatting**: Use Biome with single quotes, ASI mode, 2-space indentation

### Build and Development

- Shared package MUST be built before consuming apps in production builds
- Development mode uses Turbo's dependency orchestration (`dependsOn: ["^build"]`)
- Type generation from Supabase MUST be run after schema changes: `pnpm generate-types:supabase`

### Testing and Validation

- Component changes SHOULD be manually tested across both web and extension apps
- Authentication flows MUST be tested with protected and unauthenticated loaders
- Responsive layouts MUST be validated across mobile, tablet, and desktop viewports

## Governance

### Amendment Process

This constitution supersedes all other development practices. Amendments require:
1. Documented justification for the change
2. Impact analysis on existing code and templates
3. Update to constitution version following semantic versioning
4. Propagation of changes to dependent templates and documentation

### Versioning Policy

- **MAJOR**: Backward-incompatible principle removals or redefinitions
- **MINOR**: New principle/section added or materially expanded guidance
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance Review

- All pull requests MUST verify compliance with this constitution
- Principle violations MUST be justified in the Complexity Tracking section of plan.md
- Use CLAUDE.md for project-specific runtime development guidance

### Conflict Resolution

When conflicts arise between this constitution and existing code:
1. Constitution principles take precedence
2. Technical debt MUST be documented with migration plan
3. Gradual refactoring is preferred over big-bang rewrites

**Version**: 1.0.0 | **Ratified**: 2025-10-20 | **Last Amended**: 2025-10-20
