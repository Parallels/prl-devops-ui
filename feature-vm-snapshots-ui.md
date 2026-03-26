# Feature: VM Snapshots UI

## Overview

Virtual machine snapshots allow users to capture the state of a VM at a point in time and later revert to that state. The API exposes five operations: list, create, delete (single), delete all, and revert. The list endpoint supports both a flat list and a hierarchical tree view grouped by parent-child relationships.

---

## Endpoints

All endpoints are under `/v1/machines/{id}/snapshots` and require authentication via API key or Bearer token.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/machines/{id}/snapshots` | List all snapshots (flat or tree) |
| `POST` | `/v1/machines/{id}/snapshots` | Create a new snapshot |
| `DELETE` | `/v1/machines/{id}/snapshots/{snapshot_id}` | Delete a single snapshot |
| `DELETE` | `/v1/machines/{id}/snapshots` | Delete all snapshots for a VM |
| `POST` | `/v1/machines/{id}/snapshots/{snapshot_id}/revert` | Revert VM to a snapshot |

All successful responses return HTTP `202 Accepted`.

---

## Authorization Claims

Each endpoint requires one of two claims (OR logic — the user needs either the global claim or the "own" scoped claim):

| Operation | Global Claim | Own-VM Claim |
|-----------|-------------|--------------|
| Create | `CREATE_SNAPSHOT_VM_CLAIM` | `CREATE_OWN_VM_SNAPSHOT_CLAIM` |
| Delete single | `DELETE_SNAPSHOT_VM_CLAIM` | `DELETE_OWN_VM_SNAPSHOT_CLAIM` |
| Delete all | `DELETE_ALL_SNAPSHOTS_VM_CLAIM` | `DELETE_ALL_OWN_VM_SNAPSHOTS_CLAIM` |
| List | `LIST_SNAPSHOT_VM_CLAIM` | `LIST_OWN_VM_SNAPSHOT_CLAIM` |
| Revert | `REVERT_SNAPSHOT_VM_CLAIM` | `REVERT_OWN_VM_SNAPSHOT_CLAIM` |

The UI should use these claims to conditionally show/hide buttons and actions.

---

## TypeScript Interfaces

```typescript
// ── Snapshot model ──────────────────────────────────────────────

export interface VMSnapshot {
  id: string;
  name: string;
  date: string;        // ISO date string from the hypervisor
  state: string;       // e.g. "running", "stopped", "suspended"
  current: boolean;    // true if the VM is currently at this snapshot
  parent: string;      // snapshot ID of the parent; empty string for root
  children?: VMSnapshot[]; // only populated in tree mode (group=true)
}

// ── List response ────────────────────────────────────────────────

export interface ListVMSnapshotResponse {
  snapshots: VMSnapshot[];
}

// ── Create ───────────────────────────────────────────────────────

export interface CreateVMSnapshotRequest {
  snapshot_name: string;
  snapshot_description?: string;
}

export interface CreateVMSnapshotResponse {
  snapshot_name: string;
  snapshot_id: string;
}

// ── Delete single ────────────────────────────────────────────────

export interface DeleteVMSnapshotRequest {
  delete_children?: boolean; // if true, cascade-deletes child snapshots
}

// ── Delete all ───────────────────────────────────────────────────
// No request body required.

// ── Revert ───────────────────────────────────────────────────────

export interface RevertVMSnapshotRequest {
  skip_resume?: boolean; // if true, leaves the VM in stopped state after revert
}

// ── Error response ───────────────────────────────────────────────

export interface ApiErrorResponse {
  message: string;
  code: number;
}
```

---

## Endpoint Details

### GET `/v1/machines/{id}/snapshots`

Returns the snapshot list for a VM. Supports two modes via query param:

| Query Param | Value | Behaviour |
|-------------|-------|-----------|
| `group` | `"true"` | Returns snapshots as a nested tree (parent → children hierarchy) |
| `group` | omitted / any other value | Returns a flat list of all snapshots |

**Flat response example:**
```json
{
  "snapshots": [
    {
      "id": "snap-001",
      "name": "Before upgrade",
      "date": "2026-03-20T10:00:00Z",
      "state": "stopped",
      "current": false,
      "parent": ""
    },
    {
      "id": "snap-002",
      "name": "Post upgrade",
      "date": "2026-03-21T14:30:00Z",
      "state": "stopped",
      "current": true,
      "parent": "snap-001"
    }
  ]
}
```

**Tree response example** (`?group=true`):
```json
{
  "snapshots": [
    {
      "id": "snap-001",
      "name": "Before upgrade",
      "date": "2026-03-20T10:00:00Z",
      "state": "stopped",
      "current": false,
      "parent": "",
      "children": [
        {
          "id": "snap-002",
          "name": "Post upgrade",
          "date": "2026-03-21T14:30:00Z",
          "state": "stopped",
          "current": true,
          "parent": "snap-001",
          "children": []
        }
      ]
    }
  ]
}
```

---

### POST `/v1/machines/{id}/snapshots`

Creates a new snapshot. The API polls internally until the snapshot appears in the DB (up to 10 seconds), then returns `202` with the snapshot name and ID.

**Request:**
```json
{
  "snapshot_name": "Before upgrade",
  "snapshot_description": "Taken before applying patch v2.3"
}
```

**Response `202`:**
```json
{
  "snapshot_name": "Before upgrade",
  "snapshot_id": "snap-abc123"
}
```

> **UI note:** `snapshot_name` is required. `snapshot_description` is optional. After success, refresh the snapshot list.

---

### DELETE `/v1/machines/{id}/snapshots/{snapshot_id}`

Deletes a single snapshot. Optionally cascades to children.

**Request body (optional):**
```json
{
  "delete_children": true
}
```

**Response:** `202` (empty body) on success.

> **UI note:** If the snapshot has children (visible in tree mode), prompt the user about `delete_children`. Without it, the hypervisor may reject or re-parent children depending on the backend.

---

### DELETE `/v1/machines/{id}/snapshots`

Deletes **all** snapshots for the VM. Iterates the current list and deletes each one. The API confirms when the list is empty before returning `202`.

**No request body.**

**Response:** `202` (empty body) on success.

> **UI note:** This is destructive and irreversible. Always show a confirmation dialog before calling this endpoint.

---

### POST `/v1/machines/{id}/snapshots/{snapshot_id}/revert`

Reverts the VM to the specified snapshot. The API polls until `snapshot.current == true` for the target snapshot before returning.

**Request body (optional):**
```json
{
  "skip_resume": false
}
```

**Response:** `202` (empty body) on success.

> **UI note:** After a successful revert the previously `current: true` snapshot will no longer be current. Refresh the list and highlight the newly active snapshot.

---

## UI Implementation Notes

### Snapshot List Component

- Offer a **toggle** between flat list and tree view (`?group=true`). Tree view is better for displaying lineage; flat list is better for bulk operations.
- Mark the snapshot where `current === true` visually (e.g. a badge or highlight). Only one snapshot will have this flag set at a time.
- Show `date`, `name`, `state`, and `parent` (as a breadcrumb or linked reference in tree mode).

### Tree View

- Root snapshots have `parent === ""`.
- Build the tree client-side from the flat list, or use `?group=true` to receive it pre-built from the API.
- Use the `children` array recursively to render nested rows or a collapsible tree.

### Actions per Snapshot Row

| Action | Endpoint | Show condition |
|--------|----------|----------------|
| Revert | `POST /snapshots/{id}/revert` | Always; disable if `current === true` |
| Delete | `DELETE /snapshots/{id}` | Always |
| Delete with children | `DELETE /snapshots/{id}` + `delete_children: true` | Only if snapshot has children |

### Async Behaviour

All mutating operations (`POST` create, `DELETE`, `POST` revert) block on the server side until the operation is confirmed (up to ~10 seconds of polling at 500ms intervals). The UI should:

1. Show a loading/spinner state on the triggering button.
2. Await the `202` response before refreshing the list.
3. On timeout (no `202`), display the error message from `ApiErrorResponse.message`.

### Error Handling

All error responses use:
```typescript
interface ApiErrorResponse {
  message: string;
  code: number;  // mirrors HTTP status code
}
```

Common failure messages to handle gracefully:
- `"Snapshot not created"`
- `"Snapshot not deleted"`
- `"Snapshots not deleted"`
- `"Snapshot not reverted"`
- `"please check snapshot id[<id>]: <reason>"`

---

## Claim-Gated UI Elements

```typescript
// Example claim check helper
function hasSnapshotClaim(
  userClaims: string[],
  globalClaim: string,
  ownClaim: string
): boolean {
  return userClaims.includes(globalClaim) || userClaims.includes(ownClaim);
}

// Usage
const canCreate = hasSnapshotClaim(claims, 'CREATE_SNAPSHOT_VM_CLAIM', 'CREATE_OWN_VM_SNAPSHOT_CLAIM');
const canDelete = hasSnapshotClaim(claims, 'DELETE_SNAPSHOT_VM_CLAIM', 'DELETE_OWN_VM_SNAPSHOT_CLAIM');
const canDeleteAll = hasSnapshotClaim(claims, 'DELETE_ALL_SNAPSHOTS_VM_CLAIM', 'DELETE_ALL_OWN_VM_SNAPSHOTS_CLAIM');
const canList = hasSnapshotClaim(claims, 'LIST_SNAPSHOT_VM_CLAIM', 'LIST_OWN_VM_SNAPSHOT_CLAIM');
const canRevert = hasSnapshotClaim(claims, 'REVERT_SNAPSHOT_VM_CLAIM', 'REVERT_OWN_VM_SNAPSHOT_CLAIM');
```

Hide (not just disable) the entire snapshot panel if the user lacks `canList`. Hide individual action buttons based on the relevant claim.
