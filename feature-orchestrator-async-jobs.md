# Feature: Orchestrator Async Machine Creation & Host Job Forwarding

## Overview

This feature adds asynchronous machine creation to the orchestrator and forwards job progress events from remote hosts to the UI in real time.

---

## New API Endpoints

Both endpoints follow the same pattern as the existing `POST /v1/machines/async` endpoint.

### `POST /v1/orchestrator/machines/async`

Creates a virtual machine on the best available orchestrator host, running the operation in the background.

**Auth**: Requires `CREATE_VM` claim (same as sync endpoint).

**Request body**: `CreateVirtualMachineRequest` (identical to `POST /v1/orchestrator/machines`)

**Response**: `202 Accepted`
```json
{
  "id": "job-uuid",
  "owner": "user-id",
  "state": "pending",
  "job_type": "orchestrator",
  "job_operation": "create",
  "progress": 0,
  "message": "Initializing orchestrator virtual machine creation",
  "created_at": "2026-03-25T10:00:00Z"
}
```

---

### `POST /v1/orchestrator/hosts/{id}/machines/async`

Creates a virtual machine on a specific orchestrator host in the background.

**Auth**: Requires `CREATE_VM` claim.

**Path param**: `id` — the orchestrator host ID.

**Request body**: `CreateVirtualMachineRequest`

**Response**: `202 Accepted` — same `JobResponse` shape as above.

---

## Polling Job Progress

After receiving `202`, poll or subscribe to track progress:

### REST polling

```
GET /v1/jobs/{job_id}
```

Job `state` values: `pending` → `init` → `running` → `completed` | `failed`

When `state` is `completed`, the response includes:
```json
{
  "result_record_id": "<virtual-machine-id>",
  "result_record_type": "virtual_machine",
  "progress": 100
}
```

Use `result_record_id` to fetch the created VM from `GET /v1/orchestrator/machines/{id}`.

---

## WebSocket Event Changes

### Local job events (existing behaviour — unchanged)

The UI's `job_manager` subscription already receives `JOB_CREATED`, `JOB_UPDATED`, `JOB_COMPLETED`, `JOB_DELETED` for jobs running locally on this service.

### New: Forwarded host job events

When the orchestrator delegates work to a remote host (e.g. a `machines/async` call forwarded to that host), the host emits its own `JOB_XXX` events. The orchestrator now listens for those events over the existing WebSocket connection and re-broadcasts them to all UI clients subscribed to `job_manager`.

**Forwarded events are wrapped in a `HostJobEvent` envelope:**

```json
{
  "id": "event-uuid",
  "event_type": "job_manager",
  "timestamp": "2026-03-25T10:00:05Z",
  "message": "JOB_UPDATED",
  "body": {
    "host_id": "host-uuid",
    "event": {
      "id": "remote-job-uuid",
      "state": "running",
      "progress": 45,
      "message": "Pulling catalog manifest...",
      ...
    }
  }
}
```

**How to distinguish local vs. forwarded events:**

- **Local**: `body` is a `JobResponse` object directly (no `host_id` field at the top level of body)
- **Forwarded**: `body.host_id` is present — this is the ID of the remote orchestrator host

### Example event shapes

#### `JOB_CREATED` forwarded from host
```json
{
  "event_type": "job_manager",
  "message": "JOB_CREATED",
  "body": {
    "host_id": "abc-123",
    "event": {
      "id": "remote-job-uuid",
      "owner": "user-id",
      "state": "pending",
      "job_type": "machines",
      "job_operation": "create",
      "progress": 0
    }
  }
}
```

#### `JOB_UPDATED` forwarded from host
```json
{
  "event_type": "job_manager",
  "message": "JOB_UPDATED",
  "body": {
    "host_id": "abc-123",
    "event": {
      "id": "remote-job-uuid",
      "state": "running",
      "progress": 60,
      "message": "Extracting catalog image"
    }
  }
}
```

#### `JOB_COMPLETED` forwarded from host
```json
{
  "event_type": "job_manager",
  "message": "JOB_COMPLETED",
  "body": {
    "host_id": "abc-123",
    "event": {
      "id": "remote-job-uuid",
      "state": "completed",
      "progress": 100,
      "result": "Virtual machine vm-uuid created",
      "result_record_id": "vm-uuid",
      "result_record_type": "virtual_machine"
    }
  }
}
```

---

## UI Implementation Notes

1. **Subscribe** to `job_manager` event type on the WebSocket (same as today).
2. When a `JOB_XXX` event arrives with `body.host_id` set, treat it as a remote host job.
3. Display remote job progress in the same job tracking UI as local jobs, optionally with a "running on host `<host_id>`" label.
4. On `JOB_COMPLETED` (remote), use `body.event.result_record_id` to navigate to or refresh the new VM in the orchestrator machines list.
5. The orchestrator's own local job (the one returned by `POST .../async`) will complete when the remote host's creation call returns — this may happen slightly after the remote `JOB_COMPLETED` event, so wait for the local job to reach `completed` before redirecting.
