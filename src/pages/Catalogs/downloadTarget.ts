import type { DownloadTarget } from './Modals/DownloadCatalogModals';

interface ResolveDownloadTargetOptions {
  preferredTarget?: DownloadTarget;
  hasHostModule: boolean;
  hasOrchestratorModule: boolean;
}

export function resolveDownloadTarget({
  preferredTarget,
  hasHostModule,
  hasOrchestratorModule,
}: ResolveDownloadTargetOptions): DownloadTarget {
  if (preferredTarget === 'orchestrator' && (hasOrchestratorModule || !hasHostModule)) {
    return 'orchestrator';
  }

  if (preferredTarget === 'host' && (hasHostModule || !hasOrchestratorModule)) {
    return 'host';
  }

  if (hasOrchestratorModule && !hasHostModule) {
    return 'orchestrator';
  }

  if (hasHostModule && !hasOrchestratorModule) {
    return 'host';
  }

  return preferredTarget ?? 'host';
}

export function getForcedDownloadTarget(options: ResolveDownloadTargetOptions): DownloadTarget | undefined {
  if (options.preferredTarget) {
    return resolveDownloadTarget(options);
  }

  if (options.hasHostModule !== options.hasOrchestratorModule) {
    return resolveDownloadTarget(options);
  }

  return undefined;
}
