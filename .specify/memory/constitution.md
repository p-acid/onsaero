<!--
Sync Impact Report - Constitution Update
=========================================
Version Change: Initial → 1.0.0
Change Type: MAJOR (Initial constitution ratification)

Principles Defined:
  - Type Safety First
  - Modern Tooling
  - Component-Driven Architecture
  - Fast Feedback Loop
  - Build Performance

Templates Status:
  ✅ plan-template.md - Reviewed, compatible with constitution check section
  ✅ spec-template.md - Reviewed, requirements align with principles
  ✅ tasks-template.md - Reviewed, task organization supports all principles

Follow-up Items: None
-->

# Onsaero Constitution

This constitution defines the non-negotiable principles and practices for the Onsaero project.

## Core Principles

### I. Type Safety First (NON-NEGOTIABLE)

TypeScript strict mode MUST be enabled at all times. All code MUST:
- Use explicit types for function parameters and return values
- Avoid `any` type unless absolutely necessary with documented justification
- Leverage TypeScript's type inference where it improves readability
- Enable and respect all strict compiler options: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noUncheckedSideEffectImports`, `verbatimModuleSyntax`

**Rationale**: Type safety catches bugs at compile time, enables better IDE support, and serves as living documentation. The strict configuration prevents common runtime errors and enforces disciplined code practices.

### II. Modern Tooling

Development tooling MUST prioritize speed and developer experience:
- Vite for build tooling (leverages native ES modules and esbuild)
- SWC for Fast Refresh (faster than Babel)
- Biome for linting and formatting (unified, fast tooling)
- Avoid adding tools that duplicate existing functionality

**Rationale**: Modern tools significantly reduce iteration time. Vite's sub-second HMR, SWC's compilation speed, and Biome's all-in-one approach eliminate bottlenecks in the development loop.

### III. Component-Driven Architecture

UI MUST be built as isolated, reusable components:
- Components should have single, clear responsibilities
- Props interfaces MUST be explicitly typed
- Shared components live in dedicated directories (e.g., `src/components/`)
- Component files include their styles when component-specific

**Rationale**: Component isolation enables independent testing, reusability across the application, and easier refactoring. Clear boundaries prevent tight coupling.

### IV. Fast Feedback Loop

Development practices MUST optimize for rapid iteration:
- HMR (Hot Module Replacement) MUST work for all code changes
- Build errors MUST appear immediately in the dev server
- Format and lint checks run automatically (via editor integration or pre-commit)
- CI/CD pipeline MUST fail fast on type errors or lint violations

**Rationale**: Immediate feedback reduces context switching and catches issues before they compound. Automated checks prevent manual oversight from becoming blockers.

### V. Build Performance

Production builds MUST be optimized for performance:
- Type checking occurs before build (`tsc -b && vite build`)
- Dead code elimination via tree-shaking
- Code splitting for routes and heavy dependencies
- Asset optimization (compression, lazy loading where beneficial)

**Rationale**: Fast load times directly impact user experience and SEO. Build-time optimization is cheaper than runtime optimization.

## Development Workflow

### Code Quality Gates

All code changes MUST pass these gates before merge:
1. **Type Check**: `npm run build` completes without errors
2. **Linting**: `npm run lint` reports no violations
3. **Formatting**: Code follows Biome's formatting rules
4. **Build**: Production build succeeds

### Local Development Standards

- Use `npm run dev` for development with HMR
- Run `npm run lint:fix` before committing to auto-fix issues
- Run `npm run format` to ensure consistent style
- Commit messages should be concise and descriptive

### Dependency Management

- Avoid unnecessary dependencies; evaluate bundle size impact
- Keep dependencies up to date with security patches
- Document non-obvious dependency choices in CLAUDE.md
- Use exact versions for Biome to ensure consistency (`--save-exact`)

## React-Specific Standards

### React 19 Practices

- Use `createRoot` API (not legacy `render`)
- Wrap applications in `StrictMode` for development checks
- Leverage React 19 features: automatic batching, transitions, etc.
- Hooks are preferred over class components

### State Management

- Start with built-in hooks (`useState`, `useReducer`, `useContext`)
- Add external state libraries only when complexity justifies it
- Document state management decisions in feature specifications

### Performance Considerations

- Use `memo`, `useMemo`, `useCallback` judiciously (profile first)
- Lazy load routes and heavy components (`React.lazy`)
- Avoid premature optimization; measure before optimizing

## Governance

### Amendment Process

Constitution changes MUST:
1. Be proposed with clear rationale
2. Include impact analysis on existing code and templates
3. Update the `CONSTITUTION_VERSION` following semantic versioning
4. Propagate changes to dependent templates (plan, spec, tasks)
5. Be reviewed before adoption

### Version Semantics

- **MAJOR**: Breaking principle changes (removal, redefinition)
- **MINOR**: New principles added or significant expansions
- **PATCH**: Clarifications, wording improvements, non-semantic fixes

### Compliance

- All PRs MUST verify adherence to these principles
- Violations require explicit justification documented in plan.md complexity tracking
- The `/speckit.plan` command includes a Constitution Check gate
- This constitution supersedes conflicting practices in other documentation

### Runtime Guidance

For implementation-time guidance and context, refer to `CLAUDE.md` which provides practical development information complementing these principles.

**Version**: 1.0.0 | **Ratified**: 2025-10-11 | **Last Amended**: 2025-10-11
