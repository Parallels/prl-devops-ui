import { useCallback, useEffect, useRef, useState } from 'react';
import { devopsService } from '@/services/devops';
import type { ApiError } from '@/interfaces/api';
import type { CheckMachineRequirementsRequest, CheckMachineRequirementsResponse } from '@/interfaces/Machine';

export type RequirementCheckStatus = 'idle' | 'loading' | 'done' | 'error';

export interface RequirementCheckState {
  status: RequirementCheckStatus;
  response?: CheckMachineRequirementsResponse;
  error?: ApiError;
}

interface UseRequirementCheckOptions {
  /** Debounce for successive runs (the live disk probe makes each call expensive). */
  debounceMs?: number;
}

/**
 * Drives POST /orchestrator/machines/check for one surface.
 *
 * Rules baked in here:
 * - `passed: false` resolves normally into `state.response` — it is a verdict,
 *   not an error; only 400/404/401-403 land in `state.error`.
 * - The verdict is a point-in-time snapshot and is never cached: every `run`
 *   (re-)fires the request, debounced by default.
 * - Stale responses are discarded via a sequence guard.
 */
export function useRequirementCheck(hostname: string, options: UseRequirementCheckOptions = {}) {
  const { debounceMs = 400 } = options;

  const [state, setState] = useState<RequirementCheckState>({ status: 'idle' });
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const seqRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      seqRef.current += 1;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const run = useCallback(
    (request: CheckMachineRequirementsRequest, immediate = false) => {
      if (!hostname) return;
      cancel();
      const fire = () => {
        const seq = ++seqRef.current;
        // Never keep a stale verdict visible while re-checking — the previous
        // verdict is a point-in-time snapshot of a moving fleet.
        setState({ status: 'loading' });
        devopsService.orchestrator
          .checkMachineRequirements(hostname, request)
          .then((response) => {
            if (!mountedRef.current || seq !== seqRef.current) return;
            setState({ status: 'done', response });
          })
          .catch((error: ApiError) => {
            if (!mountedRef.current || seq !== seqRef.current) return;
            setState({ status: 'error', error });
          });
      };
      if (immediate) {
        fire();
      } else {
        timerRef.current = setTimeout(fire, debounceMs);
      }
    },
    [cancel, debounceMs, hostname],
  );

  const reset = useCallback(() => {
    cancel();
    seqRef.current += 1;
    setState({ status: 'idle' });
  }, [cancel]);

  return { state, run, reset };
}

export default useRequirementCheck;
