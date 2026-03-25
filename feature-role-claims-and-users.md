# Feature: Role Claims & Effective Claims on Users

## Overview

This document describes backend changes to how roles, role claims, and users are returned by the API. The UI needs to update its type definitions and rendering logic accordingly.

---

## 1. What Changed

### 1.1 Roles now include their members

`GET /v1/auth/roles` and `GET /v1/auth/roles/{id}` already returned a `claims` array. They now also return a populated `users` array — every user that has been assigned that role.

### 1.2 Role claims are a first-class sub-resource

Role claims can be managed independently of the role via dedicated endpoints. The claims listed on a role represent the **permissions that every member of that role inherits**.

### 1.3 Users now expose `effective_claims`

Every user response now includes an `effective_claims` array. This is the **merged, deduplicated** set of all claims the user actually has — both claims assigned directly to the user *and* claims inherited from each of their roles. Each entry is tagged with its origin so the UI can distinguish the two.

**Deduplication rule:** if the same claim exists both directly on the user and inherited from a role, the direct assignment wins (`is_inherited: false`).

---

## 2. TypeScript Types

```typescript
// ── Claim inside a role or user ────────────────────────────────────────────

export interface ClaimResponse {
  id: string;
  name: string;
  /** Display group (e.g. "Administration", "VMs"). Present on built-in claims. */
  group?: string;
  /** Resource row within the group (e.g. "User", "VM"). */
  resource?: string;
  /** Action column (e.g. "create", "read", "update", "delete"). */
  action?: string;
  /** Users that hold this claim directly. Only populated on the /auth/claims endpoints. */
  users?: ApiUser[];
}

// ── Effective claim on a user ───────────────────────────────────────────────

export interface UserClaimResponse {
  id: string;
  name: string;
  /** true  → claim comes from a role, not assigned directly */
  is_inherited: boolean;
  /**
   * ID of the **first** role (in the user's role list) that granted this claim.
   * Only set when is_inherited is true.
   *
   * Note: if multiple roles carry the same claim, only one role ID is reported
   * here. The claim is still deduplicated — it appears exactly once regardless
   * of how many roles grant it.
   */
  source_role?: string;
}

// ── User ───────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  username: string;
  name?: string;
  email: string;
  /** IDs of roles assigned to this user */
  roles: string[];
  /** IDs of claims assigned directly to this user */
  claims: string[];
  /**
   * Merged set of all claims this user actually has (direct + role-inherited).
   * Use this array to drive access checks in the UI, not `claims`.
   */
  effective_claims: UserClaimResponse[];
  isSuperUser: boolean;
}

// ── Role ───────────────────────────────────────────────────────────────────

export interface RoleResponse {
  id: string;
  name: string;
  /** All claims that members of this role inherit */
  claims: ClaimResponse[];
  /** All users that currently have this role assigned */
  users: ApiUser[];
}

// ── Requests ───────────────────────────────────────────────────────────────

export interface RoleRequest {
  name: string;
  /** Optional: claim IDs to attach on creation */
  claims?: string[];
}

export interface RoleClaimRequest {
  /** Claim name / ID to add to the role */
  name: string;
}

export interface UserCreateRequest {
  username: string;
  name: string;
  email: string;
  password: string;
  /** Role IDs to assign. Defaults to ["USER"] if omitted. */
  roles?: string[];
  /** Direct claim IDs to assign. Defaults to a read-only set if omitted. */
  claims?: string[];
  is_super_user?: boolean;
}
```

---

## 3. API Endpoints

### Roles

| Method | Path | Claim required | Returns |
|--------|------|----------------|---------|
| `GET` | `/v1/auth/roles` | `LIST_ROLE` | `RoleResponse[]` |
| `GET` | `/v1/auth/roles/{id}` | `LIST_ROLE` | `RoleResponse` |
| `POST` | `/v1/auth/roles` | `CREATE_ROLE` | `RoleResponse` (201) |
| `DELETE` | `/v1/auth/roles/{id}` | `DELETE_ROLE` | 202 |

### Role Claims (sub-resource)

| Method | Path | Claim required | Body | Returns |
|--------|------|----------------|------|---------|
| `GET` | `/v1/auth/roles/{id}/claims` | `LIST_ROLE` | — | `ClaimResponse[]` |
| `POST` | `/v1/auth/roles/{id}/claims` | `UPDATE_ROLE` | `RoleClaimRequest` | `ClaimResponse` (201) |
| `DELETE` | `/v1/auth/roles/{id}/claims/{claim_id}` | `UPDATE_ROLE` | — | 202 |

### Users

| Method | Path | Claim required | Returns |
|--------|------|----------------|---------|
| `GET` | `/v1/auth/users` | `LIST_USER` | `ApiUser[]` |
| `GET` | `/v1/auth/users/{id}` | `LIST_USER` | `ApiUser` |
| `POST` | `/v1/auth/users` | `CREATE_USER` | `ApiUser` (201) |
| `DELETE` | `/v1/auth/users/{id}` | `DELETE_USER` | 202 |

---

## 4. UI Integration Notes

### Displaying a role's members

When the admin opens a role detail page, render the `users` array from `RoleResponse`. Each entry is a full `ApiUser` so you can show username, email, etc. without an extra fetch.

### Displaying a user's permissions

Prefer `effective_claims` over `claims` wherever you need to show *what a user can actually do*. Use the `is_inherited` flag to visually distinguish direct grants (bold / solid icon) from inherited ones (muted / role badge showing `source_role`).

### Managing role claims

To add a claim to a role, `POST /v1/auth/roles/{roleId}/claims` with `{ "name": "CLAIM_ID" }`.
To remove it, `DELETE /v1/auth/roles/{roleId}/claims/{claimId}`.

After either operation, **the change takes effect on the user's next login** (next token issue). Existing JWTs are not invalidated immediately. The UI should communicate this to admins (e.g. "Changes will apply when affected users next log in.").

### Creating a user with roles

Pass role IDs in the `roles` array of `UserCreateRequest`. The user will inherit all claims of those roles from the moment their first JWT is issued.

---

## 5. Behavior to be Aware Of

- **Role claim changes are not live**: a user's JWT encodes the effective claims at
  login time. Revoked role claims only take effect after the user logs in again.
- **`effective_claims` is always deduplicated**: a claim appears at most once,
  regardless of how many roles grant it.
  - Direct assignment wins: if `LIST_USER` is both on the user directly and via a
    role, it appears with `is_inherited: false`.
  - Multiple roles with the same claim: if `role1` and `role2` both carry
    `LIST_USER`, the claim still appears once. `source_role` identifies whichever
    role comes first in the user's role list — it is **not** an exhaustive list of
    every role that grants the claim. Do not use `source_role` for audit purposes.
- **`roles` on `ApiUser` is ID-only**: to get the full role object (with its claims
  list), fetch `GET /v1/auth/roles/{id}` separately.
