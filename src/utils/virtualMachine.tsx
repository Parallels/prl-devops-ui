import { Apple, Debian, Ubuntu, Windows, VirtualMachine as VmIcon, } from '@prl/ui-kit';

export function OsIcon({ os, className = 'w-6 h-6' }: { os?: string; className?: string }) {
    const lower = (os ?? '').toLowerCase();
    if (lower.includes('win-10') || lower.includes('win-11')) return <Windows className={className} />;
    if (lower.includes('ubuntu')) return <Ubuntu className={className} />;
    if (lower.includes('debian')) return <Debian className={className} />;
    if (lower.includes('macos')) return <Apple className={className} />;
    return <VmIcon className={className} />;
}