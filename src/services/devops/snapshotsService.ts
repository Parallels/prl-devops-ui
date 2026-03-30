import { apiService } from '../api';
import { authService } from '../authService';
import type {
  ListVMSnapshotResponse,
  VMSnapshot,
  CreateVMSnapshotRequest,
  CreateVMSnapshotResponse,
  DeleteVMSnapshotRequest,
  RevertVMSnapshotRequest,
} from '@/interfaces/VMSnapshot';

class SnapshotsService {
  private baseUrl(vmId: string, isOrchestrator: boolean): string {
    return isOrchestrator
      ? `/api/v1/orchestrator/machines/${vmId}/snapshots`
      : `/api/v1/machines/${vmId}/snapshots`;
  }

  async getSnapshots(hostname: string | undefined, vmId: string, grouped = false, isOrchestrator = false): Promise<VMSnapshot[]> {
    const targetHost = hostname || authService.currentHostname;
    if (!targetHost) throw new Error('No hostname provided');
    const base = this.baseUrl(vmId, isOrchestrator);
    const endpoint = grouped ? `${base}?group=true` : base;
    const response = await apiService.get<ListVMSnapshotResponse>(targetHost, endpoint, {
      errorPrefix: 'Failed to get snapshots',
    });
    return response?.snapshots ?? [];
  }

  async createSnapshot(
    hostname: string | undefined,
    vmId: string,
    request: CreateVMSnapshotRequest,
    isOrchestrator = false,
  ): Promise<CreateVMSnapshotResponse> {
    const targetHost = hostname || authService.currentHostname;
    if (!targetHost) throw new Error('No hostname provided');
    return apiService.post<CreateVMSnapshotResponse>(
      targetHost,
      this.baseUrl(vmId, isOrchestrator),
      request,
      { errorPrefix: 'Failed to create snapshot' },
    );
  }

  async deleteSnapshot(
    hostname: string | undefined,
    vmId: string,
    snapshotId: string,
    request: DeleteVMSnapshotRequest = {},
    isOrchestrator = false,
  ): Promise<void> {
    const targetHost = hostname || authService.currentHostname;
    if (!targetHost) throw new Error('No hostname provided');
    await apiService.delete<void>(targetHost, `${this.baseUrl(vmId, isOrchestrator)}/${snapshotId}`, {
      errorPrefix: 'Failed to delete snapshot',
      body: JSON.stringify(request),
    });
  }

  async deleteAllSnapshots(hostname: string | undefined, vmId: string, isOrchestrator = false): Promise<void> {
    const targetHost = hostname || authService.currentHostname;
    if (!targetHost) throw new Error('No hostname provided');
    await apiService.delete<void>(targetHost, this.baseUrl(vmId, isOrchestrator), {
      errorPrefix: 'Failed to delete all snapshots',
    });
  }

  async revertSnapshot(
    hostname: string | undefined,
    vmId: string,
    snapshotId: string,
    request: RevertVMSnapshotRequest = {},
    isOrchestrator = false,
  ): Promise<void> {
    const targetHost = hostname || authService.currentHostname;
    if (!targetHost) throw new Error('No hostname provided');
    await apiService.post<void>(
      targetHost,
      `${this.baseUrl(vmId, isOrchestrator)}/${snapshotId}/revert`,
      request,
      { errorPrefix: 'Failed to revert snapshot', expectNoContent: true },
    );
  }
}

export const snapshotsService = new SnapshotsService();
export default snapshotsService;
