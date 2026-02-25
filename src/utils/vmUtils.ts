import { ThemeColor } from "@prl/ui-kit";

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