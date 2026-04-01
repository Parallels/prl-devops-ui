import React from 'react';
import classNames from 'classnames';
import { ConnectionFlow, IconButton, Pill, ReverseProxyFrom, ReverseProxyTo, VirtualMachine as VirtualMachineIcon } from '@prl/ui-kit';
import type { ReverseProxyHost, ReverseProxyHostTcpRoute } from '@/interfaces/ReverseProxy';
import type { VirtualMachine } from '@/interfaces/VirtualMachine';
import type { VmHealth } from './types';
import { healthToTone } from './types';

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
  );
};

export default TcpFlowHeader;
