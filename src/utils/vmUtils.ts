import { ThemeColor } from "@prl/ui-kit";
import type { VirtualMachine } from "@/interfaces/VirtualMachine";

const stateTone: Record<string, ThemeColor> = {
    running: 'success',
    stopped: 'rose',
    stopping: 'pink',
    starting: 'teal',
    paused: 'amber',
    pausing: 'yellow',
    resuming: 'teal',
    suspended: 'sky',
    suspending: 'blue',
    error: 'rose',
    invalid: 'stone',
};

export function getStateTone(state?: string): ThemeColor {
    if (!state) return 'neutral';
    return stateTone[state.toLowerCase()] ?? 'neutral';
}

type VmStateBody = {
    vm_id?: string;
    current_state?: string;
    previous_state?: string;
    host_id?: string;
    event?: VmStateBody;
};

type VmUptimeBody = {
    vm_id?: string;
    uptime?: string | number;
    host_id?: string;
    event?: VmUptimeBody;
};

type VmReferenceBody = {
    vm_id?: string;
    host_id?: string;
    event?: VmReferenceBody;
};

export interface ParsedVmStateChange {
    vmId?: string;
    currentState?: string;
    previousState?: string;
    hostId?: string;
}

export function parseVmStateChangeBody(body: unknown): ParsedVmStateChange {
    const outer = (body ?? {}) as VmStateBody;
    const inner = outer.event;

    return {
        vmId: inner?.vm_id ?? outer.vm_id,
        currentState: inner?.current_state ?? outer.current_state,
        previousState: inner?.previous_state ?? outer.previous_state,
        hostId: outer.host_id ?? inner?.host_id,
    };
}

export interface ParsedVmUptimeChange {
    vmId?: string;
    uptime?: string;
    hostId?: string;
}

export function parseVmUptimeChangeBody(body: unknown): ParsedVmUptimeChange {
    const outer = (body ?? {}) as VmUptimeBody;
    const inner = outer.event;
    const uptime = inner?.uptime ?? outer.uptime;

    return {
        vmId: inner?.vm_id ?? outer.vm_id,
        uptime: uptime === undefined || uptime === null ? undefined : String(uptime),
        hostId: outer.host_id ?? inner?.host_id,
    };
}

export interface ParsedVmReference {
    vmId?: string;
    hostId?: string;
}

export function parseVmReferenceBody(body: unknown): ParsedVmReference {
    const outer = (body ?? {}) as VmReferenceBody;
    const inner = outer.event;

    return {
        vmId: inner?.vm_id ?? outer.vm_id,
        hostId: outer.host_id ?? inner?.host_id,
    };
}

function compareVmDisplayName(a: VirtualMachine, b: VirtualMachine): number {
    const nameA = (a.Name ?? '').trim();
    const nameB = (b.Name ?? '').trim();
    const byName = nameA.localeCompare(nameB, undefined, { sensitivity: 'base', numeric: true });
    if (byName !== 0) return byName;
    return (a.ID ?? '').localeCompare((b.ID ?? ''), undefined, { sensitivity: 'base', numeric: true });
}

export function sortVirtualMachines(vms: VirtualMachine[]): VirtualMachine[] {
    return [...vms].sort(compareVmDisplayName);
}

export function upsertVirtualMachine(vms: VirtualMachine[], nextVm: VirtualMachine): VirtualMachine[] {
    const index = vms.findIndex((vm) => vm.ID === nextVm.ID);
    if (index === -1) return sortVirtualMachines([...vms, nextVm]);

    const updated = [...vms];
    updated[index] = nextVm;
    return sortVirtualMachines(updated);
}
