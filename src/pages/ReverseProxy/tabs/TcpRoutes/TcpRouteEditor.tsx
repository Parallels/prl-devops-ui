import React, { useMemo } from 'react';
import { FormField, Input, MultiToggle, Picker, type PickerItem } from '@prl/ui-kit';
import type { VirtualMachine } from '@/interfaces/VirtualMachine';
import type { TargetType } from './types';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { OsIcon } from '@/utils/virtualMachine';
import { getStateTone } from '@/utils/vmUtils';

interface TcpRouteEditorProps {
  targetType: TargetType;
  targetHost: string;
  targetPort: string;
  targetVmId: string;
  errors: Record<string, string>;
  availableVms: VirtualMachine[];
  disabled?: boolean;
  onTargetTypeChange: (value: TargetType) => void;
  onTargetHostChange: (value: string) => void;
  onTargetPortChange: (value: string) => void;
  onTargetVmIdChange: (value: string) => void;
  onClearError: (key: string) => void;
}

const TcpRouteEditor: React.FC<TcpRouteEditorProps> = ({
  targetType,
  targetHost,
  targetPort,
  targetVmId,
  errors,
  availableVms,
  disabled = false,
  onTargetTypeChange,
  onTargetHostChange,
  onTargetPortChange,
  onTargetVmIdChange,
  onClearError,
}) => {
  const { themeColor } = useSystemSettings();

  const vmPickerItems = useMemo<PickerItem[]>(
    () => availableVms.map((vm) => ({
      id: vm.ID ?? '',
      icon: <OsIcon os={vm.OS} className="h-5 w-5" />,
      title: vm.Name ?? vm.ID ?? '',
      subtitle: vm.OS,
      tags: [{ label: vm.State ?? 'unknown', tone: getStateTone(vm.State) }],
    })),
    [availableVms],
  );

  return (
    <div className="space-y-4">
      <FormField label="Target Type">
        <MultiToggle
          rounded="md"
          variant="solid"
          value={targetType}
          onChange={(v) => onTargetTypeChange(v as TargetType)}
          options={[
            { value: 'static', label: 'Static IP / Host', icon: 'Globe' },
            { value: 'vm', label: 'Virtual Machine', icon: 'VirtualMachine' },
          ]}
          size="sm"
          color={themeColor}
          disabled={disabled}
        />
      </FormField>

      {targetType === 'static' ? (
        <div className="flex gap-3">
          <div className="flex-1">
            <FormField label="Target Host" required>
              <Input
                placeholder="10.0.0.5 or hostname"
                value={targetHost}
                tone={errors.targetHost ? 'danger' : themeColor}
                onChange={(e) => {
                  onTargetHostChange(e.target.value);
                  onClearError('targetHost');
                }}
                validationStatus={errors.targetHost ? 'error' : 'none'}
                className="font-mono"
                disabled={disabled}
              />
              {errors.targetHost && <p className="mt-1 text-xs text-rose-500">{errors.targetHost}</p>}
            </FormField>
          </div>
          <div className="w-28">
            <FormField label="Port" required>
              <Input
                placeholder="22"
                value={targetPort}
                onChange={(e) => {
                  onTargetPortChange(e.target.value);
                  onClearError('targetPort');
                }}
                validationStatus={errors.targetPort ? 'error' : 'none'}
                className="font-mono"
                tone={errors.targetPort ? 'danger' : themeColor}
                disabled={disabled}
              />
              {errors.targetPort && <p className="mt-1 text-xs text-rose-500">{errors.targetPort}</p>}
            </FormField>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <div className="flex-1">
            <FormField label="Virtual Machine" required>
              <div className={disabled ? 'pointer-events-none opacity-60' : ''}>
                <Picker
                  color={themeColor}
                  items={vmPickerItems}
                  selectedId={targetVmId}
                  onSelect={(item) => {
                    onTargetVmIdChange(item.id);
                    onClearError('targetVmId');
                  }}
                  placeholder="Select a virtual machine…"
                  escapeBoundary
                />
              </div>
              {errors.targetVmId && <p className="mt-1 text-xs text-rose-500">{errors.targetVmId}</p>}
            </FormField>
          </div>
          <div className="w-28">
            <FormField label="Port" required>
              <Input
                fullHeight
                placeholder="22"
                value={targetPort}
                onChange={(e) => {
                  onTargetPortChange(e.target.value);
                  onClearError('targetPort');
                }}
                validationStatus={errors.targetPort ? 'error' : 'none'}
                className="font-mono"
                disabled={disabled}
              />
              {errors.targetPort && <p className="mt-1 text-xs text-rose-500">{errors.targetPort}</p>}
            </FormField>
          </div>
        </div>
      )}
    </div>
  );
};

export default TcpRouteEditor;
