import { describe, expect, it } from 'vitest';
import { getForcedDownloadTarget, resolveDownloadTarget } from './downloadTarget';

describe('downloadTarget', () => {
  it('defaults to host when both modules are available and no preference is provided', () => {
    expect(resolveDownloadTarget({ preferredTarget: undefined, hasHostModule: true, hasOrchestratorModule: true })).toBe('host');
  });

  it('uses the preferred target when both modules are available', () => {
    expect(resolveDownloadTarget({ preferredTarget: 'orchestrator', hasHostModule: true, hasOrchestratorModule: true })).toBe('orchestrator');
  });

  it('falls back to orchestrator when only orchestrator is available', () => {
    expect(resolveDownloadTarget({ preferredTarget: 'host', hasHostModule: false, hasOrchestratorModule: true })).toBe('orchestrator');
    expect(getForcedDownloadTarget({ preferredTarget: undefined, hasHostModule: false, hasOrchestratorModule: true })).toBe('orchestrator');
  });

  it('falls back to host when only host is available', () => {
    expect(resolveDownloadTarget({ preferredTarget: 'orchestrator', hasHostModule: true, hasOrchestratorModule: false })).toBe('host');
    expect(getForcedDownloadTarget({ preferredTarget: undefined, hasHostModule: true, hasOrchestratorModule: false })).toBe('host');
  });

  it('does not force the target when both modules are available without a deep-link preference', () => {
    expect(getForcedDownloadTarget({ preferredTarget: undefined, hasHostModule: true, hasOrchestratorModule: true })).toBeUndefined();
  });
});
