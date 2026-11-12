import { describe, expect, it } from 'vitest';
import { describeVmCapacityError, getVmCapacity, vmModeLabel, vmModeTooltip } from './vmCapacity';
import type { DevOpsRemoteHost, DevOpsRemoteHostResourceDetailed } from '@/interfaces/devops';

const hostWith = (detailed?: DevOpsRemoteHostResourceDetailed, resources?: DevOpsRemoteHost['resources']): DevOpsRemoteHost => ({
  enabled: true,
  host: 'mac-01',
  state: 'healthy',
  ...(detailed ? { detailed_resources: detailed } : {}),
  ...(resources ? { resources } : {}),
});

describe('getVmCapacity', () => {
  // Real mapper payload from the feature brief.
  const briefPayload = hostWith({
    max_vms_per_host: 10,
    max_vms_per_host_mode: 'running',
    total: { total_vms: 26, logical_cpu_count: 16, memory_size: 65536 },
    total_in_use: { total_vms: 7 },
    total_reserved: { total_vms: 2 },
    total_available: { logical_cpu_count: 8, memory_size: 32768 },
    system_reserved: { logical_cpu_count: 0, memory_size: 0 },
  });

  it('running mode counts VMs holding a hypervisor slot (total_in_use)', () => {
    const cap = getVmCapacity(briefPayload);
    expect(cap).toMatchObject({
      limit: 10,
      mode: 'running',
      used: 7,
      pending: 2,
      shown: 9,
      hasLimit: true,
      total: 26,
      atLimit: false,
    });
    expect(cap.ratio).toBeCloseTo(0.9);
    // 90% crosses the same >85% threshold the CPU/memory bars treat as critical.
    expect(cap.tone).toBe('critical');
  });

  it('any mode counts every VM registered on the host (total)', () => {
    const cap = getVmCapacity(hostWith({ ...getDr(briefPayload), max_vms_per_host_mode: 'any' }));
    expect(cap.mode).toBe('any');
    expect(cap.used).toBe(26);
    expect(cap.shown).toBe(28);
    expect(cap.atLimit).toBe(true);
    expect(cap.ratio).toBe(1);
  });

  it('absent mode defaults to any', () => {
    const cap = getVmCapacity(hostWith({ max_vms_per_host: 10, total: { total_vms: 4 }, total_in_use: { total_vms: 2 } }));
    expect(cap.mode).toBe('any');
    expect(cap.used).toBe(4);
  });

  it('no cap (max_vms_per_host omitted or 0) → hasLimit false, no ratio', () => {
    for (const detailed of [{ total: { total_vms: 26 } }, { max_vms_per_host: 0, total: { total_vms: 26 } }] as DevOpsRemoteHostResourceDetailed[]) {
      const cap = getVmCapacity(hostWith(detailed));
      expect(cap.hasLimit).toBe(false);
      expect(cap.limit).toBe(0);
      expect(cap.ratio).toBeNull();
      expect(cap.atLimit).toBe(false);
      expect(cap.tone).toBe('normal');
      expect(cap.total).toBe(26);
    }
  });

  it('an uncapped host reporting a mode does not become hasLimit', () => {
    const cap = getVmCapacity(hostWith({ max_vms_per_host_mode: 'any', total: { total_vms: 3 } }));
    expect(cap.hasLimit).toBe(false);
    expect(cap.mode).toBe('any');
  });

  it('empty detailed_resources falls back to every default zero', () => {
    const cap = getVmCapacity(hostWith({}));
    expect(cap).toMatchObject({ limit: 0, mode: 'any', used: 0, pending: 0, total: null, hasLimit: false, shown: 0, ratio: null, atLimit: false, tone: 'normal' });
  });

  it('a host build that reports nothing at all yields no total', () => {
    expect(getVmCapacity(hostWith()).total).toBeNull();
    expect(getVmCapacity(undefined).total).toBeNull();
  });

  it('headline resources[0].total_vms is the inventory fallback', () => {
    const cap = getVmCapacity(hostWith({ total: {} }, [{ total_vms: 5 }]));
    expect(cap.total).toBe(5);
  });

  it('thresholds reuse the existing resource-bar bands', () => {
    const at = (used: number, pending: number) =>
      getVmCapacity(hostWith({ max_vms_per_host: 10, total: { total_vms: used }, total_reserved: { total_vms: pending } }));
    expect(at(5, 1).tone).toBe('normal'); // 60% is not above the >60% bar
    expect(at(7, 0).tone).toBe('warning'); // 70%
    expect(at(9, 0).tone).toBe('critical'); // 90%
    expect(at(10, 0).tone).toBe('critical'); // at cap
    expect(at(9, 2).tone).toBe('critical'); // pending overshoot clamps to 1
    expect(at(9, 2).ratio).toBe(1);
    expect(at(10, 0).atLimit).toBe(true);
    expect(at(9, 1).atLimit).toBe(true);
  });
});

describe('copy', () => {
  it('mode labels and tooltips match the approved copy', () => {
    expect(vmModeLabel('any')).toBe('All VMs');
    expect(vmModeLabel('running')).toBe('Running VMs');
    expect(vmModeTooltip('running')).toBe('Mode: running — counts VMs holding a hypervisor slot');
    expect(vmModeTooltip('any')).toBe('Mode: any — counts every VM registered on the host, stopped ones included');
  });
});

describe('describeVmCapacityError', () => {
  it('humanizes the 409 rejection, keeping the numbers verbatim', () => {
    expect(
      describeVmCapacityError({
        statusCode: 409,
        message: '409 host VM limit reached: current 10, pending 0, maximum 10 (mode any)',
      }),
    ).toEqual({
      message:
        'Host VM limit reached — this host holds 10 VMs (current 10, pending 0, counting All VMs). New VMs will be placed on another host.',
    });
    expect(
      describeVmCapacityError(new Error('host VM limit reached: current 8, pending 2, maximum 10 (mode running)'))?.message,
    ).toContain('counting Running VMs');
  });

  it('humanizes the fail-closed 503', () => {
    expect(
      describeVmCapacityError({ statusCode: 503, message: '503 cannot verify host VM capacity: live host inventory failed' })?.message,
    ).toBe('Cannot verify host VM capacity — the host could not enumerate its VMs. Try again.');
  });

  it('returns null for every other error so callers keep the raw message', () => {
    expect(describeVmCapacityError({ message: 'disk capacity exceeded' })).toBeNull();
    expect(describeVmCapacityError('boom')).toBeNull();
    expect(describeVmCapacityError(undefined)).toBeNull();
    expect(describeVmCapacityError(null)).toBeNull();
  });
});

/* helper: read the (already normalized) detailed_resources of a fixture host */
function getDr(host: DevOpsRemoteHost): DevOpsRemoteHostResourceDetailed {
  return (host.detailed_resources ?? {}) as DevOpsRemoteHostResourceDetailed;
}
