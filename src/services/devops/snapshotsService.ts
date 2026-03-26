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
  async getSnapshots(hostname: string | undefined, vmId: string, grouped = false): Promise<VMSnapshot[]> {
    const targetHost = hostname || authService.currentHostname;
    if (!targetHost) throw new Error('No hostname provided');
    const endpoint = `/api/v1/machines/${vmId}/snapshots${grouped ? '?group=true' : ''}`;
    const response = await apiService.get<ListVMSnapshotResponse>(targetHost, endpoint, {
      errorPrefix: 'Failed to get snapshots',
    });
    return response?.snapshots ?? [];
  }

  async createSnapshot(
    hostname: string | undefined,
    vmId: string,
    request: CreateVMSnapshotRequest,
  ): Promise<CreateVMSnapshotResponse> {
    const targetHost = hostname || authService.currentHostname;
    if (!targetHost) throw new Error('No hostname provided');
    return apiService.post<CreateVMSnapshotResponse>(
      targetHost,
      `/api/v1/machines/${vmId}/snapshots`,
      request,
      { errorPrefix: 'Failed to create snapshot' },
    );
  }

  async deleteSnapshot(
    hostname: string | undefined,
    vmId: string,
    snapshotId: string,
    request: DeleteVMSnapshotRequest = {},
  ): Promise<void> {
    const targetHost = hostname || authService.currentHostname;
    if (!targetHost) throw new Error('No hostname provided');
    await apiService.delete<void>(targetHost, `/api/v1/machines/${vmId}/snapshots/${snapshotId}`, {
      errorPrefix: 'Failed to delete snapshot',
      body: JSON.stringify(request),
    });
  }

  async deleteAllSnapshots(hostname: string | undefined, vmId: string): Promise<void> {
    const targetHost = hostname || authService.currentHostname;
    if (!targetHost) throw new Error('No hostname provided');
    await apiService.delete<void>(targetHost, `/api/v1/machines/${vmId}/snapshots`, {
      errorPrefix: 'Failed to delete all snapshots',
    });
  }

  async revertSnapshot(
    hostname: string | undefined,
    vmId: string,
    snapshotId: string,
    request: RevertVMSnapshotRequest = {},
  ): Promise<void> {
    const targetHost = hostname || authService.currentHostname;
    if (!targetHost) throw new Error('No hostname provided');
    await apiService.post<void>(
      targetHost,
      `/api/v1/machines/${vmId}/snapshots/${snapshotId}/revert`,
      request,
      { errorPrefix: 'Failed to revert snapshot', expectNoContent: true },
    );
  }
}

export const snapshotsService = new SnapshotsService();
export default snapshotsService;
