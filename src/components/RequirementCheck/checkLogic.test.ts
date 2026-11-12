import { describe, expect, it } from 'vitest';
import {
  buildCatalogCheckRequest,
  buildExplicitCheckRequest,
  buildGapDisplay,
  buildWizardCheckRequest,
  checkLabel,
  describeCheckError,
  hasNumericGap,
  inferMacOs,
  isBlockingCheck,
  isSkippedDiskCheck,
  summarizeHost,
  toPositiveNumber,
} from './checkLogic';
import type { CheckDetail, CheckHostResult } from '@/interfaces/Machine';

describe('buildCatalogCheckRequest (mode A)', () => {
  it('builds a catalog-driven request and omits blank/- values', () => {
    expect(
      buildCatalogCheckRequest({ catalogId: 'MACOS_BASE', version: '-', architecture: 'arm64', managerId: '  ' }),
    ).toEqual({ catalog_id: 'MACOS_BASE', architecture: 'arm64' });
  });

  it('keeps an explicit version and manager id', () => {
    expect(
      buildCatalogCheckRequest({ catalogId: 'UBUNTU', version: '22.04', architecture: 'amd64', managerId: 'mgr-1' }),
    ).toEqual({ catalog_id: 'UBUNTU', architecture: 'amd64', version: '22.04', catalog_manager_id: 'mgr-1' });
  });

  it('is skipped (null) without architecture — required with catalog_id', () => {
    expect(buildCatalogCheckRequest({ catalogId: 'X', architecture: '-' })).toBeNull();
    expect(buildCatalogCheckRequest({ architecture: 'arm64' })).toBeNull();
  });
});

describe('buildExplicitCheckRequest (mode B)', () => {
  it('emits empty requirements when nothing is provided (server defaults apply)', () => {
    expect(buildExplicitCheckRequest({})).toEqual({ requirements: {} });
  });

  it('parses numeric fields and ignores junk', () => {
    expect(
      buildExplicitCheckRequest({ cpu: ' 4 ', memory: 'junk', disk: '65536', sizeBytes: 17179869184 }),
    ).toEqual({ requirements: { cpu: 4, disk: 65536, size: 17179869184 } });
  });

  it('adds os and host_id scoping only when set', () => {
    expect(buildExplicitCheckRequest({ macOS: true, hostId: 'h-1' })).toEqual({
      requirements: { os: 'macos' },
      host_id: 'h-1',
    });
    expect(buildExplicitCheckRequest({ hostId: '-' })).toEqual({ requirements: {} });
  });
});

describe('buildWizardCheckRequest (mode selection)', () => {
  const base = {
    catalogId: 'MACOS_BASE',
    version: '14',
    architecture: 'arm64',
    managerId: 'mgr-1',
    manifestCpu: '2',
    manifestMemory: '8192',
    sizeBytes: 17179869184,
    macOS: true,
  };

  it('uses catalog mode when no specs are overridden', () => {
    expect(buildWizardCheckRequest({ ...base, cpuText: '', memoryText: '  ' })).toEqual({
      catalog_id: 'MACOS_BASE',
      architecture: 'arm64',
      version: '14',
      catalog_manager_id: 'mgr-1',
    });
  });

  it('switches to explicit mode on override, filling blanks from the manifest', () => {
    expect(buildWizardCheckRequest({ ...base, cpuText: '4', memoryText: '' })).toEqual({
      requirements: { cpu: 4, memory: 8192, size: 17179869184, os: 'macos' },
    });
  });

  it('falls back to server defaults when the override is unparseable junk', () => {
    expect(buildWizardCheckRequest({ ...base, cpuText: 'abc', memoryText: '', manifestCpu: undefined })).toEqual({
      requirements: { memory: 8192, size: 17179869184, os: 'macos' },
    });
  });

  it('is null when catalog inputs are incomplete and no override exists', () => {
    expect(buildWizardCheckRequest({ ...base, architecture: '-', cpuText: '', memoryText: '' })).toBeNull();
  });
});

describe('toPositiveNumber', () => {
  it('accepts positive finite values only', () => {
    expect(toPositiveNumber('4')).toBe(4);
    expect(toPositiveNumber(0)).toBeUndefined();
    expect(toPositiveNumber('-1')).toBeUndefined();
    expect(toPositiveNumber('')).toBeUndefined();
    expect(toPositiveNumber('nope')).toBeUndefined();
    expect(toPositiveNumber(undefined)).toBeUndefined();
  });
});

describe('response classification', () => {
  const check = (over: Partial<CheckDetail>): CheckDetail => ({ name: 'cpu', passed: false, ...over });

  it('flags the three blocking entries', () => {
    expect(isBlockingCheck('host_state')).toBe(true);
    expect(isBlockingCheck('architecture')).toBe(true);
    expect(isBlockingCheck('vm_requirements')).toBe(true);
    expect(isBlockingCheck('cpu')).toBe(false);
  });

  it('treats a passed disk check with a skip note as a warning', () => {
    expect(isSkippedDiskCheck(check({ name: 'disk', passed: true, message: 'disk capacity: check skipped (host agent too old)' }))).toBe(true);
    expect(isSkippedDiskCheck(check({ name: 'disk', passed: true, message: 'VM disk: required 10 MiB, available 20 MiB' }))).toBe(false);
    expect(isSkippedDiskCheck(check({ name: 'disk', passed: false, message: 'skipped' }))).toBe(false);
  });

  it('detects numeric gaps suitable for progress bars', () => {
    expect(hasNumericGap(check({ required: 8, available: 2, unit: 'logical_cpus' }))).toBe(true);
    expect(hasNumericGap(check({ passed: true, required: 8, available: 8 }))).toBe(false);
    expect(hasNumericGap(check({ required: 0, available: 2 }))).toBe(false);
    expect(hasNumericGap(check({ required: 8 }))).toBe(false);
    expect(hasNumericGap(check({ required: 'x' as unknown as number, available: 2 }))).toBe(false);
  });

  it('formats vCPU gaps as "2 / 8 vCPUs" with clamped percentage', () => {
    expect(buildGapDisplay(check({ required: 8, available: 2, unit: 'logical_cpus' }))).toEqual({
      label: 'CPU',
      value: '2 / 8 vCPUs',
      percentage: 25,
    });
    expect(buildGapDisplay(check({ required: 8, available: 99, unit: 'logical_cpus' }))?.percentage).toBe(100);
  });

  it('humanizes MiB values', () => {
    const display = buildGapDisplay(
      check({ name: 'disk', required: 65536, available: 12000, unit: 'MiB' }),
    );
    expect(display?.label).toBe('Disk');
    expect(display?.value).toBe('12 GB / 64 GB');
  });

  it('returns no bar for non-numeric checks', () => {
    expect(buildGapDisplay(check({ message: 'VM not supported' }))).toBeNull();
  });
});

describe('summarizeHost', () => {
  it('splits blocking, warning, gap and passed entries', () => {
    const host: CheckHostResult = {
      host_id: 'h-1',
      host: 'mac-01',
      passed: false,
      checks: [
        { name: 'host_state', passed: false, message: 'Host not healthy' },
        { name: 'cpu', passed: false, required: 8, available: 2, unit: 'logical_cpus', message: 'CPU: required 8, available 2' },
        { name: 'memory', passed: true, message: 'ok' },
        { name: 'disk', passed: true, message: 'disk capacity: check skipped' },
        { name: 'quantum_flux', passed: false, message: 'Flux capacitor missing' },
      ],
    };
    const summary = summarizeHost(host);
    expect(summary.blocking.map((c) => c.name)).toEqual(['host_state']);
    expect(summary.gaps.map((c) => c.name)).toEqual(['cpu', 'quantum_flux']);
    expect(summary.warnings.map((c) => c.name)).toEqual(['disk']);
    expect(summary.failedCount).toBe(3);
    expect(summary.passedCount).toBe(1);
  });

  it('survives a host entry without checks', () => {
    const summary = summarizeHost({ host_id: 'h-2', passed: false });
    expect(summary.checks).toEqual([]);
    expect(summary.failedCount).toBe(0);
  });
});

describe('vm_count check (host VM limit)', () => {
  const vmCountCheck: CheckDetail = {
    name: 'vm_count',
    passed: false,
    required: 10,
    available: 10,
    unit: 'vms',
    message: 'VM limit: current 8, pending 2, maximum 10',
  };

  it('has a friendly label', () => {
    expect(checkLabel('vm_count')).toBe('Virtual machines');
  });

  it('renders a full bar with the server message kept verbatim', () => {
    expect(hasNumericGap(vmCountCheck)).toBe(true);
    expect(buildGapDisplay(vmCountCheck)).toEqual({
      label: 'Virtual machines',
      value: '10 / 10 vms',
      percentage: 100,
    });
  });

  it('classifies as a gap, not a blocking entry', () => {
    const summary = summarizeHost({ host_id: 'h-1', passed: false, checks: [vmCountCheck] });
    expect(summary.blocking).toEqual([]);
    expect(summary.gaps.map((c) => c.name)).toEqual(['vm_count']);
    expect(summary.failedCount).toBe(1);
  });
});

describe('inferMacOs', () => {
  it('matches case-insensitively across names and tag lists', () => {
    expect(inferMacOs(['macOS_Sonoma', ['tainted']])).toBe(true);
    expect(inferMacOs(['ubuntu-24.04', ['amd64', 'jammy'], undefined])).toBe(false);
  });
});

describe('describeCheckError', () => {
  it('passes the server message through verbatim (400 remediation text)', () => {
    const message = 'invalid catalog_id: catalog manifest not found after retrying: 401 Unauthorized';
    expect(describeCheckError({ message, statusCode: 400 })).toEqual({
      title: 'Check failed',
      description: message,
      isAuthError: false,
    });
  });

  it('labels auth and unknown-host errors', () => {
    expect(describeCheckError({ message: 'no token', statusCode: 401 }).isAuthError).toBe(true);
    expect(describeCheckError({ message: 'host not found', statusCode: 404 }).title).toBe('Unknown host');
  });

  it('falls back when no message is present', () => {
    expect(describeCheckError({}).description).toBe('The requirements check failed.');
  });
});
