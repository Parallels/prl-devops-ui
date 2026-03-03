import React from 'react';
import classNames from 'classnames';
import {
    Button,
    ConnectionFlow,
    ReverseProxyFrom,
    ReverseProxyTo,
    VirtualMachine as VirtualMachineIcon,
} from '@prl/ui-kit';
import type { ReverseProxyHost, ReverseProxyHostTcpRoute } from '@/interfaces/ReverseProxy';
import type { VmHealth } from './types';
import { healthToTone } from './types';

interface TcpFlowHeaderProps {
    proxyHost: ReverseProxyHost;
    tcpRoute: ReverseProxyHostTcpRoute;
    proxyEnabled: boolean;
    localVmHealth: VmHealth;
    actionLoading: boolean;
    canStartOrResume: boolean;
    onVmAction: () => void;
}

const TcpFlowHeader: React.FC<TcpFlowHeaderProps> = ({
    proxyHost,
    tcpRoute,
    proxyEnabled,
    localVmHealth,
    actionLoading,
    canStartOrResume,
    onVmAction,
}) => {
    const hasVmTarget = !!tcpRoute.target_vm_id;
    const effectiveHealth: VmHealth = hasVmTarget ? localVmHealth : 'running';

    const targetLabel = tcpRoute.target_vm_id
        ? (tcpRoute.target_vm_details?.name ?? tcpRoute.target_vm_id)
        : (tcpRoute.target_host ?? '—');
    const resolvedTargetPort = tcpRoute.target_port ?? '—';

    const targetActions = canStartOrResume ? (
        <div className="mt-2 flex items-center justify-end w-full">
            <Button
                variant="solid"
                color={localVmHealth === 'stopped' ? 'success' : 'warning'}
                size="xs"
                loading={actionLoading}
                onClick={() => void onVmAction()}
            >
                {localVmHealth === 'stopped' ? 'Start VM' : 'Resume VM'}
            </Button>
        </div>
    ) : undefined;

    return (
        <ConnectionFlow
            dotSpacing={30}
            childIndent="sm"
            items={[
                {
                    id: 'listener',
                    tone: !proxyEnabled ? 'neutral' : (effectiveHealth === 'running' ? 'emerald' : 'sky'),
                    icon: <ReverseProxyFrom className={classNames('w-10 h-10', proxyEnabled && 'animate-pulse animate-icon-rock')} />,
                    title: 'Listening',
                    titleClassName: 'uppercase tracking-wider text-[10px]',
                    subtitle: `${proxyHost.host || '0.0.0.0'}:${proxyHost.port}`,
                    description: !proxyEnabled ? 'Proxy disabled' : 'Allowing Traffic',
                },
                {
                    id: 'target-parent',
                    tone: healthToTone(effectiveHealth, proxyEnabled),
                    icon: hasVmTarget
                        ? <VirtualMachineIcon className={classNames('w-10 h-10', proxyEnabled && effectiveHealth === 'running' && 'animate-pulse')} />
                        : <ReverseProxyTo className={classNames('w-10 h-10', proxyEnabled && 'animate-pulse')} />,
                    title: hasVmTarget ? 'Target VM' : 'Target',
                    titleClassName: 'uppercase tracking-wider text-[10px]',
                    subtitle: `${targetLabel}:${resolvedTargetPort}`,
                    description: hasVmTarget ? localVmHealth : undefined,
                    actions: targetActions,
                }
            ]}
            flowState={!proxyEnabled ? 'disabled' : (effectiveHealth === 'running' ? 'flowing' : 'stopped')}
            flowIcon={!proxyEnabled ? <span className="text-base leading-none text-neutral-300 dark:text-neutral-600" title="Proxy engine is disabled" style={{ lineHeight: 1 }}>⊘</span> : undefined}
        />
    );
};

export default TcpFlowHeader;
