# Feature: Claim Grouping & Permissions Matrix

## Overview

All built-in claims now carry three additional metadata fields — `group`, `resource`, and `action` — that describe where they belong in the permissions matrix. A new dedicated endpoint returns all claims pre-organised into the matrix structure so the UI does not need to do any grouping logic itself.

---

## 1. What Changed

### 1.1 Three new fields on every claim

Every `ClaimResponse` object now includes:

| Field | Purpose | Example values |
|-------|---------|---------------|
| `group` | Top-level matrix section | `"Administration"`, `"VMs"`, `"Catalog"` |
| `resource` | Row within the group | `"User"`, `"VM"`, `"Snapshot (Own)"` |
| `action` | Column the claim maps to | `"create"`, `"read"`, `"update"`, `"delete"`, `"execute"`, `"pull"`, `"push"`, `"import"`, `"revert"`, `"configure"` |

These fields are optional strings. They are always populated for every built-in system claim. **Custom claims** (created by an admin) that do not match a known system claim are automatically placed in `group: "Custom"` with empty `resource` and `action`.

### 1.2 Backfill on startup

Existing installations receive the metadata on the next service start — no manual migration is needed. The seeder detects claims that are missing the group field and fills them in transparently.

### 1.3 New grouped endpoint

`GET /v1/auth/claims/grouped` returns all claims already sorted into the matrix hierarchy: groups in canonical display order, each group containing its resources, each resource containing its claims.

---

## 2. TypeScript Types

```typescript
// ── Individual claim (also used inside roles and users) ───────────────────

export interface ClaimResponse {
  id: string;
  name: string;
  /** Top-level matrix section. Always set on built-in claims. */
  group?: string;
  /** Row within the group. Always set on built-in claims. */
  resource?: string;
  /**
   * Column the claim maps to.
   * One of: "create" | "read" | "update" | "delete" |
   *         "execute" | "pull" | "push" | "import" | "revert" | "configure"
   * Always set on built-in claims.
   */
  action?: string;
  /** Only populated when fetching from /auth/claims endpoints */
  users?: ApiUser[];
}

// ── Matrix structure returned by GET /v1/auth/claims/grouped ─────────────

export interface ClaimGroupResourceResponse {
  /** Row label within the group (e.g. "User", "VM", "Snapshot (Own)") */
  resource: string;
  /** All claims that belong to this resource row */
  claims: ClaimResponse[];
}

export interface ClaimGroupResponse {
  /** Section label (e.g. "Administration", "VMs", "Catalog Manager") */
  group: string;
  /** All resource rows within this group */
  resources: ClaimGroupResourceResponse[];
}

// ── Request types (unchanged) ─────────────────────────────────────────────

export interface ClaimRequest {
  name: string;
}
```

---

## 3. API Endpoints

### Existing endpoints (updated responses)

| Method | Path | Claim required | Returns |
|--------|------|----------------|---------|
| `GET` | `/v1/auth/claims` | `LIST_CLAIM` | `ClaimResponse[]` — now includes `group`, `resource`, `action` |
| `GET` | `/v1/auth/claims/{id}` | `LIST_CLAIM` | `ClaimResponse` — now includes `group`, `resource`, `action` |
| `POST` | `/v1/auth/claims` | `CREATE_CLAIM` | `ClaimResponse` (201) |
| `DELETE` | `/v1/auth/claims/{id}` | `DELETE_CLAIM` | 202 |

### New endpoint

| Method | Path | Claim required | Returns |
|--------|------|----------------|---------|
| `GET` | `/v1/auth/claims/grouped` | `LIST_CLAIM` | `ClaimGroupResponse[]` |

---

## 4. Canonical Group & Action Values

### Groups (in display order)

```
Administration
VMs
Catalog
Catalog Manager
Reverse Proxy
Cache
Jobs
SSH
Custom
```

### Actions (matrix columns)

Standard CRUD columns:

| Value | Display label |
|-------|--------------|
| `read` | Read / List |
| `create` | Create |
| `update` | Update |
| `delete` | Delete |

Extended columns (render as additional columns or an "Other" section):

| Value | Display label |
|-------|--------------|
| `execute` | Execute |
| `pull` | Pull |
| `push` | Push |
| `import` | Import |
| `revert` | Revert |
| `configure` | Configure |

---

## 5. Sample Response — `GET /v1/auth/claims/grouped`

```json
[
  {
    "group": "Administration",
    "resources": [
      {
        "resource": "User",
        "claims": [
          { "id": "LIST_USER",   "name": "LIST_USER",   "group": "Administration", "resource": "User", "action": "read"   },
          { "id": "CREATE_USER", "name": "CREATE_USER", "group": "Administration", "resource": "User", "action": "create" },
          { "id": "UPDATE_USER", "name": "UPDATE_USER", "group": "Administration", "resource": "User", "action": "update" },
          { "id": "DELETE_USER", "name": "DELETE_USER", "group": "Administration", "resource": "User", "action": "delete" }
        ]
      },
      {
        "resource": "Role",
        "claims": [
          { "id": "LIST_ROLE",   "name": "LIST_ROLE",   "group": "Administration", "resource": "Role", "action": "read"   },
          { "id": "CREATE_ROLE", "name": "CREATE_ROLE", "group": "Administration", "resource": "Role", "action": "create" },
          { "id": "UPDATE_ROLE", "name": "UPDATE_ROLE", "group": "Administration", "resource": "Role", "action": "update" },
          { "id": "DELETE_ROLE", "name": "DELETE_ROLE", "group": "Administration", "resource": "Role", "action": "delete" }
        ]
      }
    ]
  },
  {
    "group": "VMs",
    "resources": [
      {
        "resource": "VM",
        "claims": [
          { "id": "LIST_VM",    "name": "LIST_VM",    "group": "VMs", "resource": "VM", "action": "read"    },
          { "id": "CREATE_VM",  "name": "CREATE_VM",  "group": "VMs", "resource": "VM", "action": "create"  },
          { "id": "UPDATE_VM",  "name": "UPDATE_VM",  "group": "VMs", "resource": "VM", "action": "update"  },
          { "id": "DELETE_VM",  "name": "DELETE_VM",  "group": "VMs", "resource": "VM", "action": "delete"  },
          { "id": "EXECUTE_COMMAND_VM", "name": "EXECUTE_COMMAND_VM", "group": "VMs", "resource": "VM", "action": "execute" }
        ]
      }
    ]
  },
  {
    "group": "Custom",
    "resources": [
      {
        "resource": "MY_CUSTOM_CLAIM",
        "claims": [
          { "id": "MY_CUSTOM_CLAIM", "name": "MY_CUSTOM_CLAIM", "group": "Custom" }
        ]
      }
    ]
  }
]
```

---

## 6. UI Integration Notes

### Building the matrix

Use `GET /v1/auth/claims/grouped` as the data source for the permissions matrix. The backend already sorts groups in canonical order and groups resources within each section — you just need to render what you receive.

**Suggested column layout:**

1. Iterate `ClaimGroupResponse[]` to render each section (group header row).
2. Within each group, iterate `resources` to render sub-rows.
3. For each resource row, find claims by `action` to fill the correct cell:
   - `action === "read"` → Read column
   - `action === "create"` → Create column
   - `action === "update"` → Update column
   - `action === "delete"` → Delete column
   - Any other action → render as an extra column or in an "Other" sub-section.

### Claim picker

When an admin is assigning claims to a role or user, use `group` and `resource` to drive a hierarchical picker: `GROUP > RESOURCE > CLAIM_NAME`. The `action` value can be used as a secondary label or badge (e.g. a small coloured chip showing "read").

### Custom claims

Claims in the `"Custom"` group will have empty `resource` and `action`. The backend uses the claim's `name` as the resource fallback, so they will still appear as individual rows in the matrix. Render them in a visually distinct "Custom" section at the bottom.

### Role assignment matrix

When editing a role's claims, you can load `GET /v1/auth/claims/grouped` to populate the matrix, and then highlight the cells that correspond to claims already in `GET /v1/auth/roles/{id}/claims`. A checked cell calls `POST /v1/auth/roles/{id}/claims`; an unchecked cell calls `DELETE /v1/auth/roles/{id}/claims/{claimId}`.
