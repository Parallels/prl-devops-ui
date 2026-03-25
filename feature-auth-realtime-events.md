# Feature: Auth Real-Time Events (WebSocket)

## Overview

The backend now emits real-time events over WebSocket whenever users, roles,
or claims are mutated. The UI must subscribe to the `"auth"` event channel and
use the incoming messages to invalidate its local state — re-fetching only what
changed rather than polling on a timer.

---

## 1. WebSocket Connection

### Subscribe

```
GET /v1/ws/subscribe?event_types=auth
Authorization: Bearer <token>
Upgrade: websocket
```

Pass `event_types=auth` as a query parameter. Multiple types can be
comma-separated (e.g. `event_types=auth,job_manager`).

On success the server responds with HTTP 101 and the connection upgrades to
WebSocket. The server immediately sends a confirmation frame:

```json
{
  "client_id": "c_abc123",
  "subscriptions": ["auth"]
}
```

### Unsubscribe

```
POST /v1/ws/unsubscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "client_id": "c_abc123",
  "event_types": ["auth"]
}
```

---

## 2. Envelope (all events)

Every message arriving over the WebSocket is a JSON object with this shape:

```typescript
interface EventMessage<T = unknown> {
  /** Unique ID for this event */
  id: string;
  /** Optional reference to a previous event (replies/chained events) */
  ref_id?: string;
  /** Routing key — for auth events this is always "auth" */
  event_type: string;
  /** UTC timestamp when the event was produced */
  timestamp: string; // ISO-8601
  /**
   * The message string that identifies what happened.
   * Use this to switch on which handler to call.
   */
  message: string;
  /** Event-specific payload — see the table below for each message type */
  body?: T;
}
```

---

## 3. Auth Event Types

All auth events share `event_type: "auth"`. Distinguish them by `message`.

### 3.1 TypeScript body types

```typescript
// User-level events
interface AuthUserEvent   { user_id: string }

// Role-level events
interface AuthRoleEvent   { role_id: string }

// Claim-level events
interface AuthClaimEvent  { claim_id: string }

// Role ↔ Claim association events
interface AuthRoleClaimEvent {
  role_id:  string;
  claim_id: string;
}

// User ↔ Role association events
interface AuthUserRoleEvent {
  user_id: string;
  role_id: string;
}

// User ↔ Claim association events
interface AuthUserClaimEvent {
  user_id:  string;
  claim_id: string;
}
```

### 3.2 Message reference table

| `message` | Body type | Trigger |
|---|---|---|
| `USER_ADDED` | `AuthUserEvent` | A new user was created |
| `USER_UPDATED` | `AuthUserEvent` | A user's name/email/password was changed |
| `USER_REMOVED` | `AuthUserEvent` | A user was deleted |
| `ROLE_ADDED` | `AuthRoleEvent` | A new role was created |
| `ROLE_REMOVED` | `AuthRoleEvent` | A role was deleted |
| `ROLE_CLAIM_ADDED` | `AuthRoleClaimEvent` | A claim was added to a role |
| `ROLE_CLAIM_REMOVED` | `AuthRoleClaimEvent` | A claim was removed from a role |
| `USER_ROLE_ADDED` | `AuthUserRoleEvent` | A role was assigned to a user |
| `USER_ROLE_REMOVED` | `AuthUserRoleEvent` | A role was removed from a user |
| `USER_CLAIM_ADDED` | `AuthUserClaimEvent` | A claim was directly assigned to a user |
| `USER_CLAIM_REMOVED` | `AuthUserClaimEvent` | A direct claim was removed from a user |
| `CLAIM_ADDED` | `AuthClaimEvent` | A new custom claim was created |
| `CLAIM_REMOVED` | `AuthClaimEvent` | A claim was deleted |

---

## 4. Recommended Handler Pattern

```typescript
// Typed union so the compiler enforces exhaustive handling
type AuthEvent =
  | EventMessage<AuthUserEvent>
  | EventMessage<AuthRoleEvent>
  | EventMessage<AuthClaimEvent>
  | EventMessage<AuthRoleClaimEvent>
  | EventMessage<AuthUserRoleEvent>
  | EventMessage<AuthUserClaimEvent>;

function handleAuthEvent(raw: EventMessage): void {
  switch (raw.message) {

    // ── Users ───────────────────────────────────────────────────────────
    case "USER_ADDED": {
      const { user_id } = raw.body as AuthUserEvent;
      // Append to user list or re-fetch list
      userStore.invalidate();
      break;
    }
    case "USER_UPDATED": {
      const { user_id } = raw.body as AuthUserEvent;
      // Re-fetch only this user
      userStore.invalidateOne(user_id);
      break;
    }
    case "USER_REMOVED": {
      const { user_id } = raw.body as AuthUserEvent;
      // Remove from local list immediately
      userStore.remove(user_id);
      break;
    }

    // ── Roles ───────────────────────────────────────────────────────────
    case "ROLE_ADDED": {
      const { role_id } = raw.body as AuthRoleEvent;
      roleStore.invalidate();
      break;
    }
    case "ROLE_REMOVED": {
      const { role_id } = raw.body as AuthRoleEvent;
      roleStore.remove(role_id);
      break;
    }

    // ── Role ↔ Claim associations ────────────────────────────────────
    case "ROLE_CLAIM_ADDED":
    case "ROLE_CLAIM_REMOVED": {
      const { role_id } = raw.body as AuthRoleClaimEvent;
      // The role's claim list changed — re-fetch that role
      roleStore.invalidateOne(role_id);
      // Also invalidate all users because their effective_claims may change
      userStore.invalidateEffectiveClaims();
      break;
    }

    // ── User ↔ Role associations ─────────────────────────────────────
    case "USER_ROLE_ADDED":
    case "USER_ROLE_REMOVED": {
      const { user_id } = raw.body as AuthUserRoleEvent;
      // Re-fetch this user (roles array + effective_claims both change)
      userStore.invalidateOne(user_id);
      break;
    }

    // ── User ↔ Claim associations ────────────────────────────────────
    case "USER_CLAIM_ADDED":
    case "USER_CLAIM_REMOVED": {
      const { user_id } = raw.body as AuthUserClaimEvent;
      userStore.invalidateOne(user_id);
      break;
    }

    // ── Claims ───────────────────────────────────────────────────────
    case "CLAIM_ADDED": {
      claimStore.invalidate();
      break;
    }
    case "CLAIM_REMOVED": {
      const { claim_id } = raw.body as AuthClaimEvent;
      claimStore.remove(claim_id);
      break;
    }
  }
}
```

---

## 5. Important Behaviors to Handle

### Role claim changes do not expire existing JWTs

When `ROLE_CLAIM_ADDED` or `ROLE_CLAIM_REMOVED` arrives, the affected users'
**current sessions are not invalidated**. Their JWTs still carry the old
effective claims until they log in again. The UI should:

- Refresh the role detail view immediately (re-fetch `GET /auth/roles/{id}`).
- Invalidate any cached `effective_claims` for users that belong to that role
  so the next time a user detail panel is opened it shows fresh data.
- Optionally display an inline notice on the role editor:
  *"Changes will take effect for members on their next login."*

### `USER_UPDATED` does not re-issue a JWT

Changing a user's name, email, or password via the API emits `USER_UPDATED`
but does not force a token refresh. If the current logged-in user is the one
being updated, the UI may want to prompt them to re-authenticate.

### Ordering is best-effort

Auth events are fired in a goroutine after the HTTP response is already written.
The order of events across different entities is not guaranteed. Do not rely on
a `ROLE_CLAIM_ADDED` arriving before a subsequent `USER_ROLE_ADDED` — treat
each message as independent.

---

## 6. Sample Wire Frames

### USER_ADDED

```json
{
  "id": "01HXYZ...",
  "event_type": "auth",
  "timestamp": "2026-03-25T14:22:01.123Z",
  "message": "USER_ADDED",
  "body": {
    "user_id": "usr_abc123"
  }
}
```

### ROLE_CLAIM_REMOVED

```json
{
  "id": "01HXYZ...",
  "event_type": "auth",
  "timestamp": "2026-03-25T14:23:44.456Z",
  "message": "ROLE_CLAIM_REMOVED",
  "body": {
    "role_id": "TESTER",
    "claim_id": "LIST_USER"
  }
}
```

### USER_ROLE_ADDED

```json
{
  "id": "01HXYZ...",
  "event_type": "auth",
  "timestamp": "2026-03-25T14:24:10.789Z",
  "message": "USER_ROLE_ADDED",
  "body": {
    "user_id": "usr_abc123",
    "role_id": "ADMIN"
  }
}
```
