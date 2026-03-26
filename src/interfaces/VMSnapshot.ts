export interface VMSnapshot {
  id: string;
  name: string;
  date: string;
  state: string;
  current: boolean;
  parent: string;
  children?: VMSnapshot[];
}

export interface ListVMSnapshotResponse {
  snapshots: VMSnapshot[];
}

export interface CreateVMSnapshotRequest {
  snapshot_name: string;
  snapshot_description?: string;
}

export interface CreateVMSnapshotResponse {
  snapshot_name: string;
  snapshot_id: string;
}

export interface DeleteVMSnapshotRequest {
  delete_children?: boolean;
}

export interface RevertVMSnapshotRequest {
  skip_resume?: boolean;
}
