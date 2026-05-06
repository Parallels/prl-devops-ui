import React, { useState, useCallback } from 'react';
import classNames from 'classnames';
import { ConnectionFlow, IconButton, Pill, ReverseProxyFrom, ReverseProxyTo, VirtualMachine as VirtualMachineIcon } from '@prl/ui-kit';
import type { ReverseProxyHost, ReverseProxyHostTcpRoute } from '@/interfaces/ReverseProxy';
import type { VirtualMachine } from '@/interfaces/VirtualMachine';
import type { VmHealth } from './types';
import { healthToTone } from './types';
import { buildAccessUrl } from '@/utils/accessUrlBuilder';

interface TcpFlowHeaderProps {
  proxyHost: ReverseProxyHost;
  tcpRoute: ReverseProxyHostTcpRoute;
  proxyEnabled: boolean;
  localVmHealth: VmHealth;
  actionLoading: boolean;
  canStartOrResume: boolean;
  availableVms: VirtualMachine[];
  onVmAction: () => void;
}

function proxyStatusBadge(proxyEnabled: boolean, health: VmHealth) {
  if (!proxyEnabled)
    return (
      <Pill size="sm" tone="neutral" variant="soft">
        Disabled
      </Pill>
    );
  if (health === 'running')
    return (
      <Pill size="sm" tone="emerald" variant="soft">
        Running
      </Pill>
    );
  return (
    <Pill size="sm" tone="sky" variant="soft">
      Waiting
    </Pill>
  );
}

function vmHealthBadge(health: VmHealth, proxyEnabled: boolean) {
  if (!proxyEnabled) return null;
  switch (health) {
    case 'running':
      return (
        <Pill size="sm" tone="emerald" variant="soft">
          Running
        </Pill>
      );
    case 'stopped':
      return (
        <Pill size="sm" tone="rose" variant="soft">
          Stopped
        </Pill>
      );
    case 'paused':
      return (
        <Pill size="sm" tone="amber" variant="soft">
          Paused
        </Pill>
      );
    case 'suspended':
      return (
        <Pill size="sm" tone="amber" variant="soft">
          Suspended
        </Pill>
      );
    default:
      return (
        <Pill size="sm" tone="neutral" variant="soft">
          Unknown
        </Pill>
      );
  }
}

const TcpFlowHeader: React.FC<TcpFlowHeaderProps> = ({ proxyHost, tcpRoute, proxyEnabled, localVmHealth, actionLoading, canStartOrResume, availableVms, onVmAction }) => {
  const hasVmTarget = !!tcpRoute.target_vm_id;
  const effectiveHealth: VmHealth = hasVmTarget ? localVmHealth : 'running';

  const targetLabel = tcpRoute.target_vm_id
    ? (tcpRoute.target_vm_details?.name ?? availableVms.find((v) => v.ID === tcpRoute.target_vm_id)?.Name ?? tcpRoute.target_vm_id)
    : (tcpRoute.target_host ?? '—');
  const resolvedTargetPort = tcpRoute.target_port ?? '—';

  const tcpUrlInfo = hasVmTarget && proxyEnabled && tcpRoute.target_vm_id ? buildAccessUrl(proxyHost, tcpRoute, availableVms) : null;
  const routeHealthy = effectiveHealth === 'running';
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!tcpUrlInfo?.url) return;
    navigator.clipboard.writeText(tcpUrlInfo.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [tcpUrlInfo?.url]);

  const targetActions = canStartOrResume ? (
    <div className="mt-2 flex items-center justify-end w-full">
      <IconButton
        icon={localVmHealth === 'stopped' ? 'Run' : 'Refresh'}
        tooltip={localVmHealth === 'stopped' ? 'Start VM' : 'Resume VM'}
        variant="soft"
        color={localVmHealth === 'stopped' ? 'success' : 'warning'}
        size="xs"
        loading={actionLoading}
        onClick={() => void onVmAction()}
      />
    </div>
  ) : undefined;

  return (
    <div className="flex flex-col gap-2">
      <ConnectionFlow
        dotSpacing={30}
        childIndent="md"
        fullWidthConnectors
        items={[
          {
            id: 'listener',
            tone: !proxyEnabled ? 'neutral' : effectiveHealth === 'running' ? 'emerald' : 'sky',
            icon: <ReverseProxyFrom className={classNames('w-10 h-10', proxyEnabled && 'animate-pulse animate-icon-rock')} />,
            title: 'Listening',
            titleClassName: 'uppercase tracking-wider text-[10px]',
            subtitle: `${proxyHost.host || '0.0.0.0'}:${proxyHost.port}`,
            badge: proxyStatusBadge(proxyEnabled, effectiveHealth),
          },
          {
            id: 'target-parent',
            tone: healthToTone(effectiveHealth, proxyEnabled),
            icon: hasVmTarget ? (
              <VirtualMachineIcon className={classNames('w-10 h-10', proxyEnabled && effectiveHealth === 'running' && 'animate-pulse')} />
            ) : (
              <ReverseProxyTo className={classNames('w-10 h-10', proxyEnabled && 'animate-pulse')} />
            ),
            title: hasVmTarget ? 'Target VM' : 'Target',
            titleClassName: 'uppercase tracking-wider text-[10px]',
            subtitle: `${targetLabel}:${resolvedTargetPort}`,
            badge: hasVmTarget ? vmHealthBadge(effectiveHealth, proxyEnabled) : undefined,
            actions: targetActions,
          },
        ]}
        flowState={!proxyEnabled ? 'disabled' : effectiveHealth === 'running' ? 'flowing' : 'stopped'}
        flowIcon={
          !proxyEnabled ? (
            <span className="text-base leading-none text-neutral-300 dark:text-neutral-600" title="Proxy engine is disabled" style={{ lineHeight: 1 }}>
              ⊘
            </span>
          ) : undefined
        }
      />
      {tcpUrlInfo?.hasPublicAccess && routeHealthy && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shrink-0">Access</span>
          <span className="text-sm font-mono text-emerald-800 dark:text-emerald-300 truncate flex-1" title={tcpUrlInfo.url}>
            {tcpUrlInfo.url}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded px-1 py-0.5 text-emerald-600 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/40 transition-colors"
            aria-label="Copy access URL"
          >
            {copied ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              // eslint-disable-next-line jsx-a11y/alt-text
              <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
          {copied && (
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 absolute -bottom-4">
              Copied!
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TcpFlowHeader;
