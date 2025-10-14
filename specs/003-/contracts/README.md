# API Contracts: Authentication Gate

**Feature**: Authentication Gate for Main Service
**Date**: 2025-10-13
**Status**: Phase 1 Complete

## Overview

This directory contains TypeScript contract definitions for the authentication gate feature. These contracts serve as the authoritative interface specifications that guide implementation and testing.

## Contracts

### 1. [auth-store-contract.ts](./auth-store-contract.ts)

**Purpose**: Defines the Zustand authentication store interface

**Key Exports**:
- `AuthState` - Authentication state shape
- `AuthActions` - Authentication action signatures
- `AuthStore` - Complete store type
- `AuthSyncMessage` - Cross-tab sync message structure
- `AuthChangeAction` - Action type enum

**Responsibilities**:
- User and session state management
- OAuth authentication flow
- Cross-tab state broadcasting
- Error state handling

**Usage**: Import types when implementing `src/stores/authStore.ts`

---

### 2. [route-guard-contract.ts](./route-guard-contract.ts)

**Purpose**: Defines route protection component and hook interfaces

**Key Exports**:
- `ProtectedRouteProps` - Protected route component props
- `AuthGuardResult` - Auth guard hook return type
- `RouteConfig` - Route configuration structure
- `RouterLocationState` - Router state for redirects

**Responsibilities**:
- Route access control (public vs protected)
- Authentication checks before rendering
- Redirect logic for unauthorized access
- Loading state during auth validation

**Usage**: Import types when implementing `src/components/guards/ProtectedRoute.tsx` and `src/hooks/useAuthGuard.ts`

---

### 3. [cross-tab-sync-contract.ts](./cross-tab-sync-contract.ts)

**Purpose**: Defines cross-tab synchronization mechanism

**Key Exports**:
- `AuthSyncMessage` - Sync message structure
- `BroadcastMechanism` - Broadcast interface
- `BroadcastSupport` - Feature detection result

**Responsibilities**:
- BroadcastChannel API usage
- localStorage fallback for older browsers
- Message validation and replay protection
- 5-second sync latency guarantee

**Usage**: Import types when implementing cross-tab sync in `src/stores/authStore.ts`

---

## Contract Principles

### 1. Type Safety

All contracts use strict TypeScript types with:
- Explicit return types for all functions
- No `any` types (aligned with Constitution)
- Discriminated unions for message types
- Readonly properties where applicable

### 2. Documentation

Each contract includes:
- JSDoc comments for all exports
- Usage examples
- Expected behavior specifications
- Error handling requirements

### 3. Testability

Contracts define:
- Initial state for testing
- State transition expectations
- Error scenarios
- Mock-friendly interfaces

### 4. Implementation Guidance

Contracts provide:
- Example implementations
- Browser compatibility notes
- Performance targets
- Security considerations

---

## Implementation Checklist

When implementing code against these contracts:

- [ ] Import contract types, do not redefine
- [ ] Satisfy all required properties and methods
- [ ] Follow documented state transitions
- [ ] Handle all specified error states
- [ ] Meet performance targets (latency, sync time)
- [ ] Write tests that validate contract compliance

---

## Validation

To verify implementation matches contracts:

```typescript
// Example: Validate auth store matches contract
import type { AuthStore } from './contracts/auth-store-contract'
import { useAuthStore } from './stores/authStore'

// TypeScript will error if useAuthStore doesn't match AuthStore type
const store: AuthStore = useAuthStore.getState()
```

If implementation compiles without errors, it satisfies the contract.

---

## Versioning

Contracts follow semantic versioning:
- **MAJOR**: Breaking changes (signature modifications, removed properties)
- **MINOR**: Additions (new optional properties, new methods)
- **PATCH**: Documentation updates, non-breaking clarifications

**Current Version**: 1.0.0

---

## Related Documents

- [spec.md](../spec.md) - Feature specification
- [data-model.md](../data-model.md) - Data model and entities
- [research.md](../research.md) - Technical research and decisions
- [quickstart.md](../quickstart.md) - Implementation quick start guide

---

## Contract Review

Before implementing:
1. Read all three contract files
2. Understand state transitions and error handling
3. Note performance requirements
4. Review usage examples

During implementation:
1. Import types from contracts, do not duplicate
2. Use TypeScript strict mode to catch violations
3. Write unit tests against contract specifications

After implementation:
1. Verify all contract types are satisfied
2. Validate performance targets met
3. Test error scenarios defined in contracts
4. Update this README if contracts are extended
