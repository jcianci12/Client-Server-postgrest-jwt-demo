# Migration Guide: UIStateService

This document provides guidance on migrating from the separate `LoadingService` and `StatusService` to the new consolidated `UIStateService`.

## Overview

We've consolidated the `LoadingService` and `StatusService` into a single `UIStateService` to:

1. Reduce duplication
2. Provide a single source of truth for UI state
3. Simplify state management
4. Improve maintainability

## Migration Steps

### 1. Update Imports

Replace:
```typescript
import { LoadingService } from '../loading.service';
import { StatusService } from '../services/status.service';
```

With:
```typescript
import { UIStateService } from '../services/ui-state.service';
```

### 2. Update Constructor Injection

Replace:
```typescript
constructor(
  private loadingService: LoadingService,
  private statusService: StatusService
) {}
```

With:
```typescript
constructor(private uiStateService: UIStateService) {}
```

### 3. Update Method Calls

| Old API | New API |
|---------|---------|
| `loadingService.show()` | `uiStateService.showLoading()` |
| `loadingService.hide()` | `uiStateService.hideLoading()` |
| `statusService.showLoading()` | `uiStateService.showLoading()` |
| `statusService.hideLoading()` | `uiStateService.hideLoading()` |
| `statusService.showMessage(msg)` | `uiStateService.showMessage(msg)` |
| `statusService.clearMessage()` | `uiStateService.clearMessage()` |
| `statusService.setLastVisitedJobsite(site)` | `uiStateService.setLastVisitedJobsite(site)` |
| `statusService.getLastVisitedJobsite()` | `uiStateService.getLastVisitedJobsite()` |
| `statusService.setLastVisitedUrl(url)` | `uiStateService.setLastVisitedUrl(url)` |
| `statusService.getRedirectUrl()` | `uiStateService.getRedirectUrl()` |

### 4. Update Observable Subscriptions

Replace:
```typescript
loadingService.loading$.subscribe(isLoading => {
  // Do something with loading state
});

statusService.status$.subscribe(status => {
  const { loading, message } = status;
  // Do something with status
});
```

With:
```typescript
// Option 1: Subscribe to the full state
uiStateService.state$.subscribe(state => {
  const { loading, message } = state;
  // Do something with state
});

// Option 2: Subscribe to individual properties
uiStateService.loading$.subscribe(isLoading => {
  // Do something with loading state
});

uiStateService.message$.subscribe(message => {
  // Do something with message
});
```

### 5. Update Template Bindings

Replace:
```html
<div *ngIf="loadingService.loading$ | async">Loading...</div>
<div *ngIf="statusService.status$ | async as status">
  <div *ngIf="status.message">{{ status.message }}</div>
</div>
```

With:
```html
<div *ngIf="uiStateService.loading$ | async">Loading...</div>
<div *ngIf="uiStateService.message$ | async as message">{{ message }}</div>

<!-- Or using the full state -->
<div *ngIf="uiStateService.state$ | async as state">
  <div *ngIf="state.loading">Loading...</div>
  <div *ngIf="state.message">{{ state.message }}</div>
</div>
```

## Deprecation Timeline

The old services (`LoadingService` and `StatusService`) will be deprecated and eventually removed:

1. **Phase 1 (Current)**: Both old and new services available
2. **Phase 2 (Next Release)**: Old services marked as deprecated
3. **Phase 3 (Future Release)**: Old services removed

## Questions?

If you have any questions about this migration, please contact the development team. 