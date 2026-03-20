# Feature: User Configs API

## Overview

The User Configs API allows the UI to persist per-user settings server-side. Each entry is scoped to the authenticated user — users can only read and write their own configs. No special roles or claims are required beyond being authenticated.

Typical use cases: selected columns, layout preferences, filter defaults, view modes, any other UI state worth persisting across sessions.

---

## Authentication

All endpoints require a valid Bearer token (JWT) or API key. No additional claims or roles are needed. The server resolves the user ID from the token automatically — the client never sends a `user_id` in the request body.

Include in every request:
```
Authorization: Bearer <token>
```

---

## Data Model

### `UserConfig`

| Field        | Type     | Description                                              |
|--------------|----------|----------------------------------------------------------|
| `id`         | `string` | UUID, assigned by the server                             |
| `user_id`    | `string` | UUID of the owning user, assigned by the server          |
| `slug`       | `string` | Machine-readable key, unique per user (e.g. `vm-list-columns`) |
| `name`       | `string` | Human-readable label (for UI display purposes)           |
| `type`       | `string` | Value type: `string`, `bool`, `int`, or `json`           |
| `value`      | `string` | The stored value, always serialized as a string          |
| `created_at` | `string` | ISO 8601 UTC timestamp                                   |
| `updated_at` | `string` | ISO 8601 UTC timestamp                                   |

### Value Types

| Type     | Description                                                                 |
|----------|-----------------------------------------------------------------------------|
| `string` | Plain text                                                                  |
| `bool`   | `"true"` or `"false"` as a string                                           |
| `int`    | Integer as a string, e.g. `"42"`                                            |
| `json`   | JSON-serialized object/array as a string; the UI is responsible for parsing |

The `type` field is informational — the server stores all values as strings. The UI uses `type` to know how to deserialize `value` when reading.

---

## Endpoints

Base path: `/v1/user/configs`

---

### `GET /v1/user/configs`

Returns all config entries for the authenticated user.

**Response `200 OK`**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "a3f1b2c4-...",
    "slug": "vm-list-columns",
    "name": "VM List Selected Columns",
    "type": "json",
    "value": "[\"name\",\"status\",\"cpu\",\"memory\"]",
    "created_at": "2026-03-18T10:00:00Z",
    "updated_at": "2026-03-18T10:00:00Z"
  }
]
```

Returns an empty array `[]` if the user has no configs.

Supports optional filtering via `X-Filter` header (server-side filter syntax).

---

### `GET /v1/user/configs/{id}`

Returns a single config entry by its UUID or slug.

**Path parameter:** `id` — the config's UUID **or** its slug

**Response `200 OK`**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "a3f1b2c4-...",
  "slug": "vm-list-columns",
  "name": "VM List Selected Columns",
  "type": "json",
  "value": "[\"name\",\"status\",\"cpu\",\"memory\"]",
  "created_at": "2026-03-18T10:00:00Z",
  "updated_at": "2026-03-18T10:00:00Z"
}
```

**Response `404 Not Found`** — config does not exist for this user

---

### `POST /v1/user/configs`

Creates a new config entry. The slug must be unique per user — attempting to create a duplicate slug returns an error.

**Request body**
```json
{
  "slug": "vm-list-columns",
  "name": "VM List Selected Columns",
  "type": "json",
  "value": "[\"name\",\"status\",\"cpu\",\"memory\"]"
}
```

| Field   | Required | Notes                                              |
|---------|----------|----------------------------------------------------|
| `slug`  | yes      | Unique per user                                    |
| `name`  | yes      | Display label                                      |
| `type`  | no       | Defaults to `string` if omitted                    |
| `value` | no       | Can be empty string                                |

**Response `201 Created`** — returns the created `UserConfig` object

**Response `400 Bad Request`** — missing required fields or invalid `type`

**Response `500`** — slug already exists for this user

---

### `PUT /v1/user/configs/{id}`

Updates an existing config entry. All fields are optional — only provided fields are updated. The slug is immutable after creation.

**Path parameter:** `id` — the config's UUID **or** its slug

**Request body**
```json
{
  "name": "VM List Selected Columns",
  "type": "json",
  "value": "[\"name\",\"status\"]"
}
```

| Field   | Required | Notes                             |
|---------|----------|-----------------------------------|
| `name`  | no       | Omit to leave unchanged           |
| `type`  | no       | Omit to leave unchanged           |
| `value` | no       | Omit to leave unchanged           |

**Response `200 OK`** — returns the updated `UserConfig` object

**Response `404 Not Found`** — config does not exist for this user

---

### `DELETE /v1/user/configs/{id}`

Deletes a config entry.

**Path parameter:** `id` — the config's UUID **or** its slug

**Response `202 Accepted`** — no body

**Response `404 Not Found`** — config does not exist for this user

---

## Error Response Shape

All error responses follow:
```json
{
  "message": "human readable description",
  "code": 404
}
```

---

## Recommended UI Integration Pattern

### Service / API client

Create a `UserConfigService` (or equivalent) that wraps the five endpoints. The slug is the stable identifier to use from the UI — it never changes after creation.

### Upsert helper

Since the UI often wants to "save a setting" without caring whether it already exists, implement an upsert:

1. `GET /v1/user/configs/{slug}` — check if it exists
2. If `404` → `POST /v1/user/configs` to create
3. If found → `PUT /v1/user/configs/{slug}` to update

### Loading settings on startup

On app init (after auth), call `GET /v1/user/configs` once and cache the result locally. Use the `slug` as the map key for O(1) lookup throughout the session.

### Slug naming convention

Use kebab-case with a feature prefix to avoid collisions:

```
vm-list-columns
vm-list-page-size
catalog-list-sort-field
catalog-list-sort-direction
dashboard-layout
```

### JSON values

When `type` is `json`, serialize before saving and parse after reading:

```ts
// saving
await upsertUserConfig({
  slug: 'vm-list-columns',
  name: 'VM List Selected Columns',
  type: 'json',
  value: JSON.stringify(selectedColumns),
})

// reading
const raw = configs.find(c => c.slug === 'vm-list-columns')
const columns = raw ? JSON.parse(raw.value) : defaultColumns
```

### Bool and int values

```ts
// bool
value: String(myBool)           // "true" / "false"
parsed: raw.value === 'true'

// int
value: String(myNumber)         // "42"
parsed: parseInt(raw.value, 10)
```
