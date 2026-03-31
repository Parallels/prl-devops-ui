---
layout: page
title: Catalog
subtitle: Manifest Metadata Management
menubar: docs_devops_menu
show_sidebar: false
toc: true
---

# Manifest Metadata Management

## Overview

The manifest metadata management feature allows users with the appropriate permissions to update the following fields on a specific catalog manifest version atomically:

- **Description** — a human-readable summary of the manifest
- **Tags** — free-form labels used for filtering and discovery
- **Required Claims** — access claims a user must hold to pull the manifest
- **Required Roles** — roles a user must hold to pull the manifest

All four fields are updated in a single atomic operation. The change is immediately persisted to the local database **and** pushed to the remote storage provider so the metadata file stays in sync.

---

## API Endpoint

```
PUT /v1/catalog/{catalogId}/{version}/{architecture}/metadata
```

### Path Parameters

| Parameter      | Type   | Description                        |
|----------------|--------|------------------------------------|
| `catalogId`    | string | The catalog identifier or name     |
| `version`      | string | The manifest version string        |
| `architecture` | string | The target architecture (e.g. arm64, x86_64) |

### Request Body

All fields are **optional**. Omit a field to leave it unchanged. Send an empty array (`[]`) to clear all values for that field.

```json
{
  "description": "Updated description for this manifest version",
  "tags": ["production", "base-image"],
  "required_claims": ["catalog.read"],
  "required_roles": ["developer"]
}
```

| Field             | Type            | Description                                              |
|-------------------|-----------------|----------------------------------------------------------|
| `description`     | string          | New description. Omit to keep existing value.            |
| `tags`            | array of string | Full replacement list of tags. Omit to keep existing.    |
| `required_claims` | array of string | Full replacement list of claims. Omit to keep existing.  |
| `required_roles`  | array of string | Full replacement list of roles. Omit to keep existing.   |

### Response

Returns the updated `CatalogManifest` object on success (`200 OK`).

### Authorization

Requires the **Super User** role.

Also available through a Catalog Manager proxy:

```
PUT /v1/catalog-managers/{id}/catalog/{catalogId}/{version}/{architecture}/metadata
```

The proxied route accepts the same request body and requires either `catalog_manager.update.own` claim or Super User role.

---

## UI Implementation Guide

### Where to surface this feature

The metadata editor should be accessible from the **manifest version detail view** — the screen that shows a single `{catalogId} / {version} / {architecture}` entry. Place an **Edit Metadata** button (or an edit icon) in the header or action bar of that view, visible only to users with the Super User role.

### Editor Panel / Modal

Open an inline panel or modal with the following fields:

#### Description

- A multiline text area pre-populated with the current `description` value.
- Label: **Description**
- Placeholder: `Enter a description for this manifest…`

#### Tags

- A tag-input component (chip/pill style) pre-populated with the current `tags` array.
- Allow the user to type a new tag and press **Enter** or **,** to add it.
- Each tag should have an ✕ button to remove it.
- Label: **Tags**
- Sending an empty list clears all tags.

#### Required Claims

- A tag-input component pre-populated with the current `required_claims` array.
- Label: **Required Claims**
- Placeholder: `e.g. catalog.read`
- No existence validation is performed by the API — any string is accepted.
- Sending an empty list removes all claim restrictions (the manifest becomes accessible to any authenticated user).

#### Required Roles

- A tag-input component pre-populated with the current `required_roles` array.
- Label: **Required Roles**
- Placeholder: `e.g. developer`
- No existence validation is performed by the API — any string is accepted.
- Sending an empty list removes all role restrictions.

### Partial Update Behaviour

The `PUT /metadata` endpoint uses partial-update semantics based on JSON field presence:

- If a field key is **absent** from the JSON body, that field is not modified.
- If a field key is **present** (even as an empty array or empty string), it replaces the current value.

The UI must implement this by building the request body dynamically:

1. Start with an empty object `{}`.
2. If the user edited the description field, include `"description": "<value>"`.
3. If the user edited the tags list (added or removed any tag), include `"tags": [...]`.
4. If the user edited the required claims list, include `"required_claims": [...]`.
5. If the user edited the required roles list, include `"required_roles": [...]`.
6. If the user made no changes at all, either skip the API call or show a "no changes" notice.

This means the UI needs to track which fields were **touched** by the user, not just compare old vs new values — so that deliberately clearing a field (e.g. removing all tags) is correctly sent as `"tags": []`.

### Confirmation and Error Handling

- Show a loading indicator while the request is in flight.
- On **success**: close the panel/modal, refresh the manifest detail view, and show a success toast: `Metadata updated successfully`.
- On **error**: display the `message` field from the API error response inside the modal. Do not close the modal so the user can correct their input.
- If the user has unsaved changes and tries to close the modal, prompt: `You have unsaved changes. Discard them?`

### Optimistic UI (optional)

For a snappier experience, the UI can optimistically update the displayed tags/claims/roles/description as soon as the user clicks **Save**, then revert on error.

---

## Data Flow

```
User submits form
      │
      ▼
UI builds partial JSON body (only touched fields)
      │
      ▼
PUT /v1/catalog/{catalogId}/{version}/{architecture}/metadata
      │
      ├─► Local database updated atomically
      │
      └─► PushMetadata called → remote storage file updated
                │
                ├─ Pull current metadata file from remote
                ├─ Patch description / tags / claims / roles
                ├─ Compare checksums
                └─ Push updated file if changed
```

---

## Security Considerations

- Only Super User role can invoke this endpoint.
- No server-side validation is performed on the content of `required_claims` or `required_roles` values — the UI should make clear to the operator that these are string identifiers that must match what the access control system issues.
- Clearing all claims and roles makes a manifest pullable by **any authenticated user** — the UI should display a warning when both arrays are submitted as empty.
