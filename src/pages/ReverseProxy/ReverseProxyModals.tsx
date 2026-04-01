import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  ConfirmModal,
  CustomIcon,
  FormField,
  Hero,
  IconButton,
  Input,
  Modal,
  ModalActions,
  MultiToggle,
  Picker,
  type PickerItem,
  Pill,
  Select,
  Stepper,
  type Step,
  Textarea,
  Toggle,
  Panel,
} from '@prl/ui-kit';
import { ReverseProxyHost, ReverseProxyHostHttpRoute, ReverseProxyHostTcpRoute } from '@/interfaces/ReverseProxy';
import { VirtualMachine } from '@/interfaces/VirtualMachine';
import { devopsService } from '@/services/devops';
import { useSession } from '@/contexts/SessionContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { OsIcon } from '@/utils/virtualMachine';
import { getStateTone } from '@/utils/vmUtils';

// ── Shared helpers ────────────────────────────────────────────────────────────

type TargetType = 'static' | 'vm';
type RouteMode = 'http' | 'tcp';
type WizardPhase = 'select' | 'wizard';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

function headersToEntries(h?: Record<string, string>): { key: string; value: string }[] {
  if (!h) return [];
  return Object.entries(h).map(([key, value]) => ({ key, value }));
}

function entriesToRecord(rows: { key: string; value: string }[]): Record<string, string> {
  return rows.reduce<Record<string, string>>((acc, { key, value }) => {
    if (key.trim()) acc[key.trim()] = value;
    return acc;
  }, {});
}

// ── TagInput ──────────────────────────────────────────────────────────────────

interface TagInputProps {
  values: string[];
  placeholder?: string;
  onChange: (values: string[]) => void;
  disabled?: boolean;
  suggestions?: string[];
}

const TagInput: React.FC<TagInputProps> = ({ values, placeholder, onChange, disabled, suggestions = [] }) => {
  const [draft, setDraft] = useState('');
  const commit = (raw: string) => {
    const v = raw.trim();
    if (!v || values.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...values, v]);
    setDraft('');
  };
  return (
    <div
      className={`rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 p-1.5 min-h-9.5 flex flex-wrap gap-1 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {values.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
          {v}
          <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="hover:text-rose-500">
            ×
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-25 bg-transparent text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 outline-none px-1"
        placeholder={values.length === 0 ? placeholder : ''}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit(draft);
          }
          if (e.key === 'Backspace' && !draft && values.length) onChange(values.slice(0, -1));
        }}
        onBlur={() => draft && commit(draft)}
        list={suggestions.length > 0 ? 'tag-suggestions' : undefined}
      />
      {suggestions.length > 0 && (
        <datalist id="tag-suggestions">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </div>
  );
};

// ── HTTP Route card (inline editor inside wizard) ─────────────────────────────

interface HttpRouteForm {
  path: string;
  schema: 'http' | 'https';
  targetType: TargetType;
  targetHost: string;
  targetPort: string;
  targetVmId: string;
  requestHeaders: { key: string; value: string }[];
  responseHeaders: { key: string; value: string }[];
}

const blankRoute = (): HttpRouteForm => ({
  path: '/',
  schema: 'http',
  targetType: 'static',
  targetHost: '',
  targetPort: '80',
  targetVmId: '',
  requestHeaders: [],
  responseHeaders: [],
});

interface RouteCardProps {
  index: number;
  route: HttpRouteForm;
  availableVms: VirtualMachine[];
  errors: Record<string, string>;
  onUpdate: (index: number, route: HttpRouteForm) => void;
  onRemove: (index: number) => void;
}

const RouteCard: React.FC<RouteCardProps> = ({ index, route, availableVms, errors, onUpdate, onRemove }) => {
  const [expanded, setExpanded] = useState(true);
  const { themeColor } = useSystemSettings();

  const upd = (patch: Partial<HttpRouteForm>) => onUpdate(index, { ...route, ...patch });

  const vmPickerItems = useMemo<PickerItem[]>(
    () =>
      availableVms.map((vm) => ({
        id: vm.ID ?? '',
        icon: <OsIcon os={vm.OS} className="h-5 w-5" />,
        title: vm.Name ?? vm.ID ?? '',
        subtitle: vm.OS,
        tags: [{ label: vm.State ?? 'unknown', tone: getStateTone(vm.State) }],
      })),
    [availableVms],
  );

  const targetSummary = route.targetType === 'vm' ? (availableVms.find((v) => v.ID === route.targetVmId)?.Name ?? (route.targetVmId || '—')) : route.targetHost || '—';

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-800/50">
        <CustomIcon icon="Script" className="w-4 h-4 text-neutral-400 shrink-0" />
        <span className="font-mono text-sm text-neutral-800 dark:text-neutral-200 truncate flex-1">{route.path || '/'}</span>
        <Pill size="sm" tone={route.schema === 'https' ? 'emerald' : 'sky'} variant="soft">
          {route.schema.toUpperCase()}
        </Pill>
        <span className="text-xs text-neutral-500 truncate max-w-30 hidden sm:block">
          → {targetSummary}:{route.targetPort || '—'}
        </span>
        <IconButton
          icon={expanded ? 'ChevronUp' : 'ChevronDown'}
          size="xs"
          variant="ghost"
          color="slate"
          onClick={() => setExpanded((p) => !p)}
          aria-label={expanded ? 'Collapse route' : 'Expand route'}
        />
        <IconButton icon="Trash" size="xs" variant="ghost" color="danger" onClick={() => onRemove(index)} aria-label="Remove route" />
      </div>

      {/* Expanded fields */}
      {expanded && (
        <div className="p-3 space-y-3 border-t border-neutral-200 dark:border-neutral-700">
          {/* Path + schema */}
          <div className="flex gap-3">
            <div className="flex-1">
              <FormField label="Path / Pattern" required>
                <Input
                  placeholder="/api/v1"
                  value={route.path}
                  onChange={(e) => upd({ path: e.target.value })}
                  validationStatus={errors[`route_${index}_path`] ? 'error' : 'none'}
                  className="font-mono"
                  size="sm"
                />
                {errors[`route_${index}_path`] && <p className="mt-1 text-xs text-rose-500">{errors[`route_${index}_path`]}</p>}
              </FormField>
            </div>
            <div className="w-28">
              <FormField label="Schema">
                <Select value={route.schema} onChange={(e) => upd({ schema: e.target.value as 'http' | 'https' })} size="sm">
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                </Select>
              </FormField>
            </div>
          </div>

          {/* Target type */}
          <FormField label="Target Type">
            <MultiToggle
              value={route.targetType}
              onChange={(v) => upd({ targetType: v as TargetType })}
              options={[
                { value: 'static', label: 'Static IP / Host' },
                { value: 'vm', label: 'Virtual Machine' },
              ]}
              size="sm"
            />
          </FormField>

          {/* Target fields */}
          {route.targetType === 'static' ? (
            <div className="flex gap-3">
              <div className="flex-1">
                <FormField label="Target Host" required>
                  <Input
                    placeholder="10.0.0.5 or hostname"
                    value={route.targetHost}
                    onChange={(e) => upd({ targetHost: e.target.value })}
                    validationStatus={errors[`route_${index}_host`] ? 'error' : 'none'}
                    className="font-mono"
                    size="sm"
                  />
                  {errors[`route_${index}_host`] && <p className="mt-1 text-xs text-rose-500">{errors[`route_${index}_host`]}</p>}
                </FormField>
              </div>
              <div className="w-28">
                <FormField label="Port" required>
                  <Input
                    placeholder="8080"
                    value={route.targetPort}
                    onChange={(e) => upd({ targetPort: e.target.value })}
                    validationStatus={errors[`route_${index}_port`] ? 'error' : 'none'}
                    className="font-mono"
                    size="sm"
                  />
                  {errors[`route_${index}_port`] && <p className="mt-1 text-xs text-rose-500">{errors[`route_${index}_port`]}</p>}
                </FormField>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1">
                <FormField label="Virtual Machine" required>
                  <Picker
                    color={themeColor}
                    items={vmPickerItems}
                    selectedId={route.targetVmId}
                    onSelect={(item) => upd({ targetVmId: item.id })}
                    placeholder="Select a virtual machine…"
                    escapeBoundary
                  />
                  {errors[`route_${index}_vm`] && <p className="mt-1 text-xs text-rose-500">{errors[`route_${index}_vm`]}</p>}
                </FormField>
              </div>
              <div className="w-28">
                <FormField label="Port" required>
                  <Input
                    placeholder="3000"
                    value={route.targetPort}
                    onChange={(e) => upd({ targetPort: e.target.value })}
                    validationStatus={errors[`route_${index}_port`] ? 'error' : 'none'}
                    className="font-mono"
                    size="sm"
                  />
                  {errors[`route_${index}_port`] && <p className="mt-1 text-xs text-rose-500">{errors[`route_${index}_port`]}</p>}
                </FormField>
              </div>
            </div>
          )}

          {/* Request headers */}
          <details className="group">
            <summary className="cursor-pointer text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 select-none list-none flex items-center gap-1">
              <CustomIcon icon="ArrowChevronRight" className="w-3 h-3 group-open:rotate-90 transition-transform" />
              Request Headers {route.requestHeaders.length > 0 && `(${route.requestHeaders.length})`}
            </summary>
            <div className="mt-2 space-y-2 pl-4">
              {route.requestHeaders.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    size="sm"
                    placeholder="Header name"
                    value={row.key}
                    className="font-mono flex-1"
                    onChange={(e) => upd({ requestHeaders: route.requestHeaders.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)) })}
                  />
                  <Input
                    size="sm"
                    placeholder="Value"
                    value={row.value}
                    className="font-mono flex-1"
                    onChange={(e) => upd({ requestHeaders: route.requestHeaders.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)) })}
                  />
                  <Button variant="ghost" color="rose" size="sm" leadingIcon="Trash" onClick={() => upd({ requestHeaders: route.requestHeaders.filter((_, j) => j !== i) })} />
                </div>
              ))}
              <Button variant="outline" color="slate" size="sm" leadingIcon="Add" onClick={() => upd({ requestHeaders: [...route.requestHeaders, { key: '', value: '' }] })}>
                Add Header
              </Button>
            </div>
          </details>

          {/* Response headers */}
          <details className="group">
            <summary className="cursor-pointer text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 select-none list-none flex items-center gap-1">
              <CustomIcon icon="ArrowChevronRight" className="w-3 h-3 group-open:rotate-90 transition-transform" />
              Response Headers {route.responseHeaders.length > 0 && `(${route.responseHeaders.length})`}
            </summary>
            <div className="mt-2 space-y-2 pl-4">
              {route.responseHeaders.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    size="sm"
                    placeholder="Header name"
                    value={row.key}
                    className="font-mono flex-1"
                    onChange={(e) => upd({ responseHeaders: route.responseHeaders.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)) })}
                  />
                  <Input
                    size="sm"
                    placeholder="Value"
                    value={row.value}
                    className="font-mono flex-1"
                    onChange={(e) => upd({ responseHeaders: route.responseHeaders.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)) })}
                  />
                  <Button variant="ghost" color="rose" size="sm" leadingIcon="Trash" onClick={() => upd({ responseHeaders: route.responseHeaders.filter((_, j) => j !== i) })} />
                </div>
              ))}
              <Button variant="outline" color="slate" size="sm" leadingIcon="Add" onClick={() => upd({ responseHeaders: [...route.responseHeaders, { key: '', value: '' }] })}>
                Add Header
              </Button>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

// ── Port helper ───────────────────────────────────────────────────────────────

function pickSafePort(usedPorts: Set<number>): string {
  const MIN = 5000;
  const MAX = 65535;
  let port: number;
  let attempts = 0;
  do {
    port = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
    attempts++;
  } while (usedPorts.has(port) && attempts < 200);
  return String(port);
}

function usedPortSet(hosts: ReverseProxyHost[]): Set<number> {
  return new Set(hosts.map((h) => parseInt(h.port ?? '0', 10)).filter((p) => p > 0));
}

// ── Create Proxy Host Modal (wizard) ──────────────────────────────────────────

interface CreateProxyHostModalProps {
  isOpen: boolean;
  existingHosts?: ReverseProxyHost[];
  orchestratorHostId?: string;
  onClose: () => void;
  onSubmit: (data: Partial<ReverseProxyHost>) => Promise<void>;
}

export const CreateProxyHostModal: React.FC<CreateProxyHostModalProps> = ({ isOpen, existingHosts = [], onClose, onSubmit }) => {
  const { session } = useSession();
  const { themeColor } = useSystemSettings();
  const hostname = session?.hostname ?? '';

  // Wizard phase: 'select' = route type picker, 'wizard' = stepper
  const [phase, setPhase] = useState<WizardPhase>('select');

  // Step tracking
  const [step, setStep] = useState(0);

  // Step 1: General
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(() => pickSafePort(usedPortSet(existingHosts)));
  const [routeMode, setRouteMode] = useState<RouteMode>('http');

  // Step 2: TLS
  const [tlsEnabled, setTlsEnabled] = useState(false);
  const [tlsCert, setTlsCert] = useState('');
  const [tlsKey, setTlsKey] = useState('');

  // Step 3: HTTP routes
  const [httpRoutes, setHttpRoutes] = useState<HttpRouteForm[]>([blankRoute()]);

  // Step 3: TCP route
  const [tcpTargetType, setTcpTargetType] = useState<TargetType>('static');
  const [tcpTargetHost, setTcpTargetHost] = useState('');
  const [tcpTargetPort, setTcpTargetPort] = useState('');
  const [tcpTargetVmId, setTcpTargetVmId] = useState('');

  // Step 4: CORS
  const [corsEnabled, setCorsEnabled] = useState(false);
  const [corsOrigins, setCorsOrigins] = useState<string[]>([]);
  const [corsMethods, setCorsMethods] = useState<string[]>(['GET', 'POST', 'OPTIONS']);
  const [corsHeaders, setCorsHeaders] = useState<string[]>([]);
  const [corsExposeHeaders, setCorsExposeHeaders] = useState<string[]>([]);
  const [corsCredentials, setCorsCredentials] = useState(false);
  const [corsMaxAge, setCorsMaxAge] = useState('');

  // Shared
  const [availableVms, setAvailableVms] = useState<VirtualMachine[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Total steps: 4 for HTTP (includes CORS), 3 for TCP/none
  const totalSteps = routeMode === 'http' ? 4 : 3;
  const isLastStep = step === totalSteps - 1;

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    setPhase('select');
    setStep(0);
    setName('');
    setHost('');
    setPort(pickSafePort(usedPortSet(existingHosts)));
    setRouteMode('http');
    setTlsEnabled(false);
    setTlsCert('');
    setTlsKey('');
    setHttpRoutes([blankRoute()]);
    setTcpTargetType('static');
    setTcpTargetHost('');
    setTcpTargetPort('');
    setTcpTargetVmId('');
    setCorsEnabled(false);
    setCorsOrigins([]);
    setCorsMethods(['GET', 'POST', 'OPTIONS']);
    setCorsHeaders([]);
    setCorsExposeHeaders([]);
    setCorsCredentials(false);
    setCorsMaxAge('');
    setErrors({});
  }, [isOpen]);

  // Fetch VMs when opened
  useEffect(() => {
    if (!isOpen || !hostname) return;
    devopsService.machines
      .getVirtualMachines(hostname, false)
      .then(setAvailableVms)
      .catch(() => setAvailableVms([]));
  }, [isOpen, hostname]);

  // Auto-adjust port when TLS toggled
  useEffect(() => {
    const used = usedPortSet(existingHosts);
    if (tlsEnabled && parseInt(port, 10) < 1024) {
      setPort(used.has(443) ? pickSafePort(used) : '443');
    }
    if (!tlsEnabled && port === '443') {
      setPort(pickSafePort(used));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tlsEnabled]);

  // Validate current step before advancing
  const validateStep = (): boolean => {
    const e: Record<string, string> = {};

    if (step === 0) {
      if (!host.trim()) e.host = 'Host is required';
      if (!port.trim()) e.port = 'Port is required';
    }

    if (step === 1) {
      if (tlsEnabled && !tlsCert.trim()) e.tlsCert = 'Certificate is required when TLS is enabled';
      if (tlsEnabled && !tlsKey.trim()) e.tlsKey = 'Private key is required when TLS is enabled';
    }

    if (step === 2) {
      if (routeMode === 'http') {
        httpRoutes.forEach((r, i) => {
          if (!r.path.trim()) e[`route_${i}_path`] = 'Path is required';
          if (r.targetType === 'static' && !r.targetHost.trim()) e[`route_${i}_host`] = 'Target host is required';
          if (r.targetType === 'vm' && !r.targetVmId) e[`route_${i}_vm`] = 'Select a VM';
          if (!r.targetPort.trim()) e[`route_${i}_port`] = 'Port is required';
        });
      }
      if (routeMode === 'tcp') {
        if (tcpTargetType === 'static' && !tcpTargetHost.trim()) e.tcpHost = 'Target host is required';
        if (tcpTargetType === 'vm' && !tcpTargetVmId) e.tcpVm = 'Select a VM';
        if (!tcpTargetPort.trim()) e.tcpPort = 'Port is required';
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setErrors({});
    if (step === 0) {
      setPhase('select');
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!validateStep()) return;
    setSaving(true);
    try {
      const payload: Partial<ReverseProxyHost> = {
        ...(name.trim() && { name: name.trim() }),
        host: host.trim(),
        port: port.trim(),
      };

      if (tlsEnabled) {
        payload.tls = { enabled: true, cert: tlsCert.trim(), key: tlsKey.trim() };
      }

      if (routeMode === 'http') {
        payload.http_routes = httpRoutes.map((r, i) => {
          const route: ReverseProxyHostHttpRoute = {
            order: i,
            path: r.path.trim(),
            schema: r.schema,
            target_port: r.targetPort.trim(),
            request_headers: entriesToRecord(r.requestHeaders),
            response_headers: entriesToRecord(r.responseHeaders),
          };
          if (r.targetType === 'static') {
            route.target_host = r.targetHost.trim();
          } else {
            route.target_vm_id = r.targetVmId;
          }
          return route;
        });

        if (corsEnabled) {
          payload.cors = {
            enabled: true,
            allowed_origins: corsOrigins,
            allowed_methods: corsMethods,
            allowed_headers: corsHeaders,
            expose_headers: corsExposeHeaders,
            allow_credentials: corsCredentials,
            ...(corsMaxAge ? { max_age: parseInt(corsMaxAge, 10) } : {}),
          };
        }
      }

      if (routeMode === 'tcp') {
        const tcpRoute: Partial<ReverseProxyHostTcpRoute> = {
          target_port: tcpTargetPort.trim(),
        };
        if (tcpTargetType === 'static') {
          tcpRoute.target_host = tcpTargetHost.trim();
        } else {
          tcpRoute.target_vm_id = tcpTargetVmId;
        }
        payload.tcp_route = tcpRoute;
      }

      await onSubmit(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  }, [
    name,
    host,
    port,
    tlsEnabled,
    tlsCert,
    tlsKey,
    routeMode,
    httpRoutes,
    corsEnabled,
    corsOrigins,
    corsMethods,
    corsHeaders,
    corsExposeHeaders,
    corsCredentials,
    corsMaxAge,
    tcpTargetType,
    tcpTargetHost,
    tcpTargetPort,
    tcpTargetVmId,
    onSubmit,
    onClose,
  ]);

  const vmPickerItems = useMemo<PickerItem[]>(
    () =>
      availableVms.map((vm) => ({
        id: vm.ID ?? '',
        icon: <OsIcon os={vm.OS} className="h-5 w-5" />,
        title: vm.Name ?? vm.ID ?? '',
        subtitle: vm.OS,
        tags: [{ label: vm.State ?? 'unknown', tone: getStateTone(vm.State) }],
      })),
    [availableVms],
  );

  const wizardHasData =
    name.trim() !== '' ||
    host.trim() !== '' ||
    (routeMode === 'http' && httpRoutes.some((r) => r.path !== '/' || r.targetHost !== '' || r.targetVmId !== '')) ||
    (routeMode === 'tcp' && (tcpTargetHost !== '' || tcpTargetVmId !== ''));

  // ── Step content helpers ───────────────────────────────────────────────────

  const renderGeneralStep = () => (
    <div className="space-y-4">
      <FormField label="Name" description="Friendly display name (optional — falls back to host if left blank)">
        <Input placeholder="e.g. My API Gateway" value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <FormField label="Host / Domain" required>
        <Input
          placeholder="api.domain.local or 0.0.0.0"
          value={host}
          onChange={(e) => {
            setHost(e.target.value);
            setErrors((p) => ({ ...p, host: '' }));
          }}
          validationStatus={errors.host ? 'error' : 'none'}
        />
        {errors.host && <p className="mt-1 text-xs text-rose-500">{errors.host}</p>}
      </FormField>
      <FormField label="Listen Port" required>
        <Input
          placeholder="80"
          value={port}
          onChange={(e) => {
            setPort(e.target.value);
            setErrors((p) => ({ ...p, port: '' }));
          }}
          validationStatus={errors.port ? 'error' : 'none'}
          className="font-mono"
        />
        {errors.port && <p className="mt-1 text-xs text-rose-500">{errors.port}</p>}
      </FormField>
    </div>
  );

  const renderTlsStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Enable TLS</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Secure connections with a certificate — port will be set to 443</p>
        </div>
        <Toggle checked={tlsEnabled} onChange={(e) => setTlsEnabled(e.target.checked)} color="emerald" />
      </div>

      {tlsEnabled && (
        <div className="space-y-4 pl-3 border-l-2 border-emerald-200 dark:border-emerald-700">
          <FormField label="Certificate" description="PEM-encoded certificate (BEGIN CERTIFICATE)" required>
            <Textarea
              value={tlsCert}
              onChange={(e) => {
                setTlsCert(e.target.value);
                setErrors((p) => ({ ...p, tlsCert: '' }));
              }}
              placeholder={'-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'}
              rows={5}
              className="font-mono text-xs"
              validationStatus={errors.tlsCert ? 'error' : 'none'}
            />
            {errors.tlsCert && <p className="mt-1 text-xs text-rose-500">{errors.tlsCert}</p>}
          </FormField>
          <FormField label="Private Key" description="PEM-encoded private key (BEGIN PRIVATE KEY)" required>
            <Textarea
              value={tlsKey}
              onChange={(e) => {
                setTlsKey(e.target.value);
                setErrors((p) => ({ ...p, tlsKey: '' }));
              }}
              placeholder={'-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'}
              rows={5}
              className="font-mono text-xs"
              validationStatus={errors.tlsKey ? 'error' : 'none'}
            />
            {errors.tlsKey && <p className="mt-1 text-xs text-rose-500">{errors.tlsKey}</p>}
          </FormField>
        </div>
      )}

      {!tlsEnabled && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
          <CustomIcon icon="Info" className="w-4 h-4 text-neutral-400 shrink-0" />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">TLS is optional. You can skip this step and add certificates later from the Settings tab.</p>
        </div>
      )}
    </div>
  );

  const renderRoutesStep = () => {
    if (routeMode === 'http') {
      return (
        <div className="space-y-3">
          {httpRoutes.length === 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
              <CustomIcon icon="Info" className="w-4 h-4 text-neutral-400 shrink-0" />
              <p className="text-xs text-neutral-500 dark:text-neutral-400">No routes yet. Add at least one HTTP route, or add them later from the detail panel.</p>
            </div>
          )}
          {httpRoutes.map((route, idx) => (
            <RouteCard
              key={idx}
              index={idx}
              route={route}
              availableVms={availableVms}
              errors={errors}
              onUpdate={(i, r) => setHttpRoutes((p) => p.map((x, j) => (j === i ? r : x)))}
              onRemove={(i) => setHttpRoutes((p) => p.filter((_, j) => j !== i))}
            />
          ))}
          <Button variant="outline" color="slate" size="sm" leadingIcon="Add" onClick={() => setHttpRoutes((p) => [...p, blankRoute()])}>
            Add HTTP Route
          </Button>
        </div>
      );
    }

    if (routeMode === 'tcp') {
      return (
        <div className="space-y-4">
          <FormField label="Target Type">
            <MultiToggle
              value={tcpTargetType}
              onChange={(v) => {
                setTcpTargetType(v as TargetType);
                setErrors({});
              }}
              options={[
                { value: 'static', label: 'Static IP / Host' },
                { value: 'vm', label: 'Virtual Machine' },
              ]}
              size="sm"
            />
          </FormField>

          {tcpTargetType === 'static' ? (
            <div className="flex gap-3">
              <div className="flex-1">
                <FormField label="Target Host" required>
                  <Input
                    placeholder="10.0.0.5 or hostname"
                    value={tcpTargetHost}
                    onChange={(e) => {
                      setTcpTargetHost(e.target.value);
                      setErrors((p) => ({ ...p, tcpHost: '' }));
                    }}
                    validationStatus={errors.tcpHost ? 'error' : 'none'}
                    className="font-mono"
                  />
                  {errors.tcpHost && <p className="mt-1 text-xs text-rose-500">{errors.tcpHost}</p>}
                </FormField>
              </div>
              <div className="w-28">
                <FormField label="Port" required>
                  <Input
                    placeholder="5432"
                    value={tcpTargetPort}
                    onChange={(e) => {
                      setTcpTargetPort(e.target.value);
                      setErrors((p) => ({ ...p, tcpPort: '' }));
                    }}
                    validationStatus={errors.tcpPort ? 'error' : 'none'}
                    className="font-mono"
                  />
                  {errors.tcpPort && <p className="mt-1 text-xs text-rose-500">{errors.tcpPort}</p>}
                </FormField>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1">
                <FormField label="Virtual Machine" required>
                  <Picker
                    color={themeColor}
                    items={vmPickerItems}
                    selectedId={tcpTargetVmId}
                    onSelect={(item) => {
                      setTcpTargetVmId(item.id);
                      setErrors((p) => ({ ...p, tcpVm: '' }));
                    }}
                    placeholder="Select a virtual machine…"
                    escapeBoundary
                  />
                  {errors.tcpVm && <p className="mt-1 text-xs text-rose-500">{errors.tcpVm}</p>}
                </FormField>
              </div>
              <div className="w-28">
                <FormField label="Port" required>
                  <Input
                    placeholder="5432"
                    value={tcpTargetPort}
                    onChange={(e) => {
                      setTcpTargetPort(e.target.value);
                      setErrors((p) => ({ ...p, tcpPort: '' }));
                    }}
                    validationStatus={errors.tcpPort ? 'error' : 'none'}
                    className="font-mono"
                  />
                  {errors.tcpPort && <p className="mt-1 text-xs text-rose-500">{errors.tcpPort}</p>}
                </FormField>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderCorsStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Enable CORS</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Applies cross-origin headers to all HTTP responses from this host</p>
        </div>
        <Toggle checked={corsEnabled} onChange={(e) => setCorsEnabled(e.target.checked)} color={themeColor} />
      </div>

      {corsEnabled && (
        <div className="space-y-4 pl-3 border-l-2 border-sky-200 dark:border-sky-700">
          <FormField label="Allowed Origins" description="Enter origins and press Enter. Use * for all.">
            <TagInput values={corsOrigins} placeholder="https://example.com" onChange={setCorsOrigins} />
          </FormField>

          <FormField label="Allowed Methods">
            <div className="flex flex-wrap gap-1.5">
              {HTTP_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCorsMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    corsMethods.includes(m) ? 'bg-sky-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Allowed Headers" description="Header names allowed in requests.">
            <TagInput values={corsHeaders} placeholder="Content-Type" onChange={setCorsHeaders} suggestions={['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']} />
          </FormField>

          <FormField label="Expose Headers" description="Headers exposed to the browser.">
            <TagInput values={corsExposeHeaders} placeholder="X-Custom-Header" onChange={setCorsExposeHeaders} />
          </FormField>

          <div className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Allow Credentials</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Include credentials (cookies, auth headers) in CORS requests</p>
            </div>
            <Toggle checked={corsCredentials} onChange={(e) => setCorsCredentials(e.target.checked)} color={themeColor} size="sm" />
          </div>

          <FormField label="Max Age (seconds)" description="How long preflight results can be cached.">
            <Input placeholder="86400" value={corsMaxAge} onChange={(e) => setCorsMaxAge(e.target.value)} className="font-mono w-32" />
          </FormField>
        </div>
      )}
    </div>
  );

  // ── Selection phase (onboarding) ───────────────────────────────────────────

  const renderSelectPhase = () => (
    <div className="flex flex-col gap-5">
      {/* Hero banner */}
      <Hero
        tone={themeColor}
        icon="ReverseProxyRoutes"
        title="New Proxy Host"
        subtitle="A proxy host listens on a port and forwards traffic to your backend. Pick a routing strategy to get started."
      />

      {/* Route type cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* HTTP Routes */}
        <button
          type="button"
          onClick={() => setRouteMode('http')}
          className={`group relative text-left rounded-xl border-2 p-4 transition-all duration-200 focus:outline-none ${
            routeMode === 'http'
              ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30 shadow-md shadow-sky-500/10'
              : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/60 hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50/50 dark:hover:bg-sky-950/20'
          }`}
        >
          {/* Selected check */}
          {routeMode === 'http' && (
            <span className={`absolute top-3 right-3 w-5 h-5 rounded-full bg-${themeColor}-500 flex items-center justify-center`}>
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}

          {/* Icon */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
              routeMode === 'http'
                ? `bg-${themeColor}-500 shadow-sm shadow-${themeColor}-500/30`
                : `bg-neutral-100 dark:bg-neutral-700 group-hover:bg-${themeColor}-100 dark:group-hover:bg-${themeColor}-900/40`
            }`}
          >
            <CustomIcon
              icon="ReverseProxyRoutes"
              className={`w-5 h-5 ${routeMode === 'http' ? 'text-white' : `text-neutral-500 dark:text-neutral-400 group-hover:text-${themeColor}-600 dark:group-hover:text-${themeColor}-400`}`}
            />
          </div>

          <p className={`text-sm font-semibold mb-1 ${routeMode === 'http' ? `text-${themeColor}-700 dark:text-${themeColor}-300` : 'text-neutral-800 dark:text-neutral-200'}`}>HTTP Routes</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">Path-based routing, TLS termination, CORS and custom headers.</p>

          <ul className="space-y-1">
            {['Web apps & APIs', 'WebSocket proxying', 'CORS & TLS control'].map((f) => (
              <li key={f} className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <span className={`w-1 h-1 rounded-full shrink-0 ${routeMode === 'http' ? `bg-${themeColor}-400` : 'bg-neutral-300 dark:bg-neutral-600'}`} />
                {f}
              </li>
            ))}
          </ul>
        </button>

        {/* TCP Route */}
        <button
          type="button"
          onClick={() => setRouteMode('tcp')}
          className={`group relative text-left rounded-xl border-2 p-4 transition-all duration-200 focus:outline-none ${
            routeMode === 'tcp'
              ? `border-${themeColor}-500 bg-${themeColor}-50 dark:bg-${themeColor}-950/30 shadow-md shadow-${themeColor}-500/10`
              : `border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/60 hover:border-${themeColor}-300 dark:hover:border-${themeColor}-700 hover:bg-${themeColor}-50/50 dark:hover:bg-${themeColor}-950/20`
          }`}
        >
          {/* Selected check */}
          {routeMode === 'tcp' && (
            <span className={`absolute top-3 right-3 w-5 h-5 rounded-full bg-${themeColor}-500 flex items-center justify-center`}>
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}

          {/* Icon */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
              routeMode === 'tcp'
                ? `bg-${themeColor}-500 shadow-sm shadow-${themeColor}-500/30`
                : `bg-neutral-100 dark:bg-neutral-700 group-hover:bg-${themeColor}-100 dark:group-hover:bg-${themeColor}-900/40`
            }`}
          >
            <CustomIcon
              icon="Live"
              className={`w-5 h-5 ${routeMode === 'tcp' ? 'text-white' : `text-neutral-500 dark:text-neutral-400 group-hover:text-${themeColor}-600 dark:group-hover:text-${themeColor}-400`}`}
            />
          </div>

          <p className={`text-sm font-semibold mb-1 ${routeMode === 'tcp' ? `text-${themeColor}-700 dark:text-${themeColor}-300` : 'text-neutral-800 dark:text-neutral-200'}`}>TCP Route</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">Raw TCP tunnel to a single backend — ideal for non-HTTP protocols.</p>

          <ul className="space-y-1">
            {['Databases (Postgres, MySQL)', 'Redis / message queues', 'SSH & custom protocols'].map((f) => (
              <li key={f} className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <span className={`w-1 h-1 rounded-full shrink-0 ${routeMode === 'tcp' ? `bg-${themeColor}-400` : 'bg-neutral-300 dark:bg-neutral-600'}`} />
                {f}
              </li>
            ))}
          </ul>
        </button>
      </div>

      {/* Step preview strip */}
      <div className="flex items-center gap-1.5 px-1">
        {(routeMode === 'http' ? ['General', 'TLS', 'Routes', 'CORS'] : ['General', 'TLS', 'Route']).map((label, i, arr) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-1">
              <span
                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  routeMode === 'http'
                    ? `bg-${themeColor}-100 dark:bg-${themeColor}-900/40 text-${themeColor}-600 dark:text-${themeColor}-400`
                    : `bg-${themeColor}-100 dark:bg-${themeColor}-900/40 text-${themeColor}-600 dark:text-${themeColor}-400`
                }`}
              >
                {i + 1}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{label}</span>
            </div>
            {i < arr.length - 1 && (
              <div className={`flex-1 h-px min-w-3 ${routeMode === 'http' ? `bg-${themeColor}-200 dark:bg-${themeColor}-800/60` : `bg-${themeColor}-200 dark:bg-${themeColor}-800/60`}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const stepDefs: Step[] = [
    {
      id: 'general',
      title: (
        <div className="flex items-center gap-2">
          {' '}
          <CustomIcon icon="Settings" className="w-4 h-4" />
          General
        </div>
      ),
      subtitle: 'Host & port',
      status: step > 0 ? 'completed' : step === 0 ? 'active' : 'pending',
      content: renderGeneralStep(),
    },
    {
      id: 'tls',
      title: (
        <div className="flex items-center gap-2">
          {' '}
          <CustomIcon icon="ReverseProxyTLS" className="w-4 h-4" />
          TLS
        </div>
      ),
      subtitle: 'Certificates',
      status: step > 1 ? 'completed' : step === 1 ? 'active' : 'pending',
      content: renderTlsStep(),
    },
    {
      id: 'routes',
      title: (
        <div className="flex items-center gap-2">
          {' '}
          <CustomIcon icon="ReverseProxyRoutes" className="w-4 h-4" />
          Routes
        </div>
      ),
      subtitle: routeMode === 'http' ? 'HTTP routes' : routeMode === 'tcp' ? 'TCP route' : 'No routes',
      status: step > 2 ? 'completed' : step === 2 ? 'active' : 'pending',
      content: renderRoutesStep(),
    },
    ...(routeMode === 'http'
      ? [
          {
            id: 'cors',
            title: (
              <div className="flex items-center gap-2">
                {' '}
                <CustomIcon icon="ReverseProxyCORS" className="w-4 h-4" />
                CORS
              </div>
            ),
            subtitle: 'Cross-origin',
            status: (step === 3 ? 'active' : 'pending') as 'active' | 'pending',
            content: renderCorsStep(),
          },
        ]
      : []),
  ];

  return (
    <Modal isOpen={isOpen} title="Create Proxy Host" onClose={onClose} size="lg" icon="Add">
      {phase === 'select' ? (
        <>
          {renderSelectPhase()}

          <ModalActions align="between">
            <Button variant="outline" color="slate" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="solid"
              color={routeMode === 'tcp' ? 'violet' : themeColor}
              size="sm"
              trailingIcon="ArrowChevronRight"
              onClick={() => {
                setStep(0);
                setPhase('wizard');
              }}
            >
              Continue with {routeMode === 'http' ? 'HTTP Routes' : 'TCP Route'}
            </Button>
          </ModalActions>
        </>
      ) : (
        <>
          <Stepper
            steps={stepDefs}
            currentIndex={step}
            orientation="horizontal"
            variant="card"
            connector="progress"
            tone={themeColor}
            interactive
            onChange={(newIndex) => {
              if (newIndex < step) {
                setErrors({});
                setStep(newIndex);
              }
            }}
            contentClassName="!p-0 !border-0 !bg-transparent !shadow-none dark:!bg-transparent !rounded-none min-h-[200px]"
          />

          <ModalActions align="between">
            <div className="flex items-center gap-2">
              <Button variant="outline" color="slate" size="sm" onClick={handleBack}>
                {step === 0 ? '← Change type' : 'Back'}
              </Button>
              <Button
                variant="ghost"
                color="slate"
                size="sm"
                onClick={() => wizardHasData ? setShowCancelConfirm(true) : onClose()}
              >
                Cancel
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">
                {step + 1} / {totalSteps}
              </span>
              {isLastStep ? (
                <Button variant="solid" color={themeColor} size="sm" loading={saving} onClick={() => void handleSubmit()}>
                  Create Host
                </Button>
              ) : (
                <Button variant="solid" color={themeColor} size="sm" onClick={handleNext}>
                  Next
                </Button>
              )}
            </div>
          </ModalActions>
        </>
      )}

      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Discard Changes"
        description="You have unsaved changes. Are you sure you want to discard them and close?"
        confirmLabel="Discard & Close"
        confirmColor="rose"
        onConfirm={() => { setShowCancelConfirm(false); onClose(); }}
        onClose={() => setShowCancelConfirm(false)}
      />
    </Modal>
  );
};

// ── HTTP Route Modal (used in RoutesTab for adding routes to existing hosts) ───

type HttpTargetType = 'static' | 'vm';

export interface HttpRouteFormData {
  path: string;
  schema: 'http' | 'https';
  pattern: string;
  targetType: HttpTargetType;
  targetHost: string;
  targetPort: string;
  targetVmId: string;
  requestHeaders: { key: string; value: string }[];
  responseHeaders: { key: string; value: string }[];
}

interface HttpRouteModalProps {
  isOpen: boolean;
  editing?: ReverseProxyHostHttpRoute | null;
  availableVms: VirtualMachine[];
  onClose: () => void;
  onSubmit: (data: HttpRouteFormData) => Promise<void>;
}

export const HttpRouteModal: React.FC<HttpRouteModalProps> = ({ isOpen, editing, availableVms, onClose, onSubmit }) => {
  const { themeColor } = useSystemSettings();
  const [path, setPath] = useState('/');
  const [schema, setSchema] = useState<'http' | 'https'>('http');
  const [pattern, setPattern] = useState('');
  const [targetType, setTargetType] = useState<HttpTargetType>('static');
  const [targetHost, setTargetHost] = useState('');
  const [targetPort, setTargetPort] = useState('');
  const [targetVmId, setTargetVmId] = useState('');
  const [requestHeaderRows, setRequestHeaderRows] = useState<{ key: string; value: string }[]>([]);
  const [headerRows, setHeaderRows] = useState<{ key: string; value: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const hasVm = !!editing?.target_vm_id;
      setPath(editing?.path ?? '/');
      setSchema((editing?.schema ?? 'http') as 'http' | 'https');
      setPattern(editing?.pattern ?? '');
      setTargetType(hasVm ? 'vm' : 'static');
      setTargetHost(editing?.target_host ?? '');
      setTargetPort(editing?.target_port ?? '');
      setTargetVmId(editing?.target_vm_id ?? '');
      setRequestHeaderRows(headersToEntries(editing?.request_headers));
      setHeaderRows(headersToEntries(editing?.response_headers));
      setErrors({});
      setIsDirty(false);
      setShowCancelConfirm(false);
    }
  }, [isOpen, editing]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!path.trim()) e.path = 'Path is required';
    if (targetType === 'static' && !targetHost.trim()) e.targetHost = 'Target host is required';
    if (targetType === 'vm' && !targetVmId) e.targetVmId = 'Select a virtual machine';
    if (!targetPort.trim()) e.targetPort = 'Port is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit({
        path: path.trim(),
        schema,
        pattern: pattern.trim(),
        targetType,
        targetHost: targetHost.trim(),
        targetPort: targetPort.trim(),
        targetVmId,
        requestHeaders: requestHeaderRows.filter((r) => r.key.trim()),
        responseHeaders: headerRows.filter((r) => r.key.trim()),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }, [path, schema, targetType, targetHost, targetPort, targetVmId, headerRows, onSubmit, onClose]);

  const vmPickerItems = useMemo<PickerItem[]>(
    () =>
      availableVms.map((vm) => ({
        id: vm.ID ?? '',
        icon: <OsIcon os={vm.OS} className="h-5 w-5" />,
        title: vm.Name ?? vm.ID ?? '',
        subtitle: vm.OS,
        tags: [{ label: vm.State ?? 'unknown', tone: getStateTone(vm.State) }],
      })),
    [availableVms],
  );

  return (
    <Modal
      isOpen={isOpen}
      title={editing ? 'Edit HTTP Route' : 'Add HTTP Route'}
      onClose={() => isDirty ? setShowCancelConfirm(true) : onClose()}
      size="md"
      actions={
        <>
          <ModalActions>
            <Button variant="outline" color="slate" size="sm" onClick={() => isDirty ? setShowCancelConfirm(true) : onClose()}>
              Cancel
            </Button>
            <Button variant="soft" color={themeColor} size="sm" loading={saving} onClick={() => void handleSubmit()}>
              {editing ? 'Save Route' : 'Add Route'}
            </Button>
          </ModalActions>
          <ConfirmModal
            isOpen={showCancelConfirm}
            title="Discard Changes"
            description="You have unsaved changes. Are you sure you want to discard them and close?"
            confirmLabel="Discard & Close"
            confirmColor="rose"
            onConfirm={() => { setShowCancelConfirm(false); onClose(); }}
            onClose={() => setShowCancelConfirm(false)}
          />
        </>
      }
    >
      <div className="space-y-4">
        {/* Path + Schema */}
        <Panel variant="glass" backgroundColor="white" padding="xs">
          <div className="flex gap-3">
            <div className="flex-1">
              <FormField label="Path" required>
                <Input
                  tone={themeColor}
                  placeholder="/api/v1"
                  value={path}
                  onChange={(e) => {
                    setPath(e.target.value);
                    setErrors((p) => ({ ...p, path: '' }));
                    setIsDirty(true);
                  }}
                  validationStatus={errors.path ? 'error' : 'none'}
                  className="font-mono"
                />
                {errors.path && <p className="mt-1 text-xs text-rose-500">{errors.path}</p>}
              </FormField>
            </div>
            <div className="w-28">
              <FormField label="Schema">
                <Select tone={themeColor} value={schema} onChange={(e) => { setSchema(e.target.value as 'http' | 'https'); setIsDirty(true); }}>
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                </Select>
              </FormField>
            </div>
          </div>

          {/* Pattern (optional) */}
          <FormField label="Match Pattern" description="Optional regex or glob to match request paths. Leave empty to match all requests to the path prefix.">
            <Input tone={themeColor} placeholder="e.g. ^/api/.*" value={pattern} onChange={(e) => { setPattern(e.target.value); setIsDirty(true); }} className="font-mono" />
          </FormField>
        </Panel>
        <Panel variant="glass" backgroundColor="white" padding="xs">
          {/* Target type */}
          <FormField label="Target Type">
            <MultiToggle
              color={themeColor}
              variant="solid"
              value={targetType}
              onChange={(v) => { setTargetType(v as HttpTargetType); setIsDirty(true); }}
              options={[
                { value: 'static', label: 'Static IP / Host', icon: 'Globe' },
                { value: 'vm', label: 'Virtual Machine', icon: 'VirtualMachine' },
              ]}
              size="md"
            />
          </FormField>

          {/* Target fields */}
          {targetType === 'static' ? (
            <div className="flex gap-3">
              <div className="flex-1">
                <FormField label="Target Host" required>
                  <Input
                    tone={themeColor}
                    placeholder="10.0.0.5 or hostname"
                    value={targetHost}
                    onChange={(e) => {
                      setTargetHost(e.target.value);
                      setErrors((p) => ({ ...p, targetHost: '' }));
                      setIsDirty(true);
                    }}
                    validationStatus={errors.targetHost ? 'error' : 'none'}
                    className="font-mono"
                  />
                  {errors.targetHost && <p className="mt-1 text-xs text-rose-500">{errors.targetHost}</p>}
                </FormField>
              </div>
              <div className="w-28">
                <FormField label="Port" required>
                  <Input
                    tone={themeColor}
                    placeholder="3000"
                    value={targetPort}
                    onChange={(e) => {
                      setTargetPort(e.target.value);
                      setErrors((p) => ({ ...p, targetPort: '' }));
                      setIsDirty(true);
                    }}
                    validationStatus={errors.targetPort ? 'error' : 'none'}
                    className="font-mono"
                  />
                  {errors.targetPort && <p className="mt-1 text-xs text-rose-500">{errors.targetPort}</p>}
                </FormField>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1">
                <FormField label="Virtual Machine" required>
                  <Picker
                    color={themeColor}
                    items={vmPickerItems}
                    selectedId={targetVmId}
                    onSelect={(item) => {
                      setTargetVmId(item.id);
                      setErrors((p) => ({ ...p, targetVmId: '' }));
                      setIsDirty(true);
                    }}
                    placeholder="Select a virtual machine…"
                    escapeBoundary
                  />
                  {errors.targetVmId && <p className="mt-1 text-xs text-rose-500">{errors.targetVmId}</p>}
                </FormField>
              </div>
              <div className="w-28">
                <FormField label="Port" required>
                  <Input
                    tone={themeColor}
                    placeholder="3000"
                    value={targetPort}
                    onChange={(e) => {
                      setTargetPort(e.target.value);
                      setErrors((p) => ({ ...p, targetPort: '' }));
                      setIsDirty(true);
                    }}
                    validationStatus={errors.targetPort ? 'error' : 'none'}
                    className="font-mono"
                  />
                  {errors.targetPort && <p className="mt-1 text-xs text-rose-500">{errors.targetPort}</p>}
                </FormField>
              </div>
            </div>
          )}
        </Panel>
        <Panel variant="glass" backgroundColor="white" padding="xs">
          {/* Request headers */}
          <FormField label="Request Headers" description="Injected into every request forwarded to the target">
            <div className="space-y-2">
              {requestHeaderRows.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    tone={themeColor}
                    placeholder="Header name"
                    value={row.key}
                    onChange={(e) => { setRequestHeaderRows((p) => p.map((r, j) => (j === i ? { ...r, key: e.target.value } : r))); setIsDirty(true); }}
                    className="font-mono flex-1"
                    size="sm"
                  />
                  <Input
                    tone={themeColor}
                    placeholder="Value"
                    value={row.value}
                    onChange={(e) => { setRequestHeaderRows((p) => p.map((r, j) => (j === i ? { ...r, value: e.target.value } : r))); setIsDirty(true); }}
                    className="font-mono flex-1"
                    size="sm"
                  />
                  <div>
                    <IconButton variant="ghost" color="rose" size="sm" icon="Trash" onClick={() => { setRequestHeaderRows((p) => p.filter((_, j) => j !== i)); setIsDirty(true); }} />
                  </div>
                </div>
              ))}
              <Button variant="soft" color={themeColor} size="sm" leadingIcon="Add" onClick={() => { setRequestHeaderRows((p) => [...p, { key: '', value: '' }]); setIsDirty(true); }}>
                Add Header
              </Button>
            </div>
          </FormField>

          {/* Response headers */}
          <FormField label="Response Headers" description="Injected into every response from this route">
            <div className="space-y-2">
              {headerRows.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    tone={themeColor}
                    placeholder="Header name"
                    value={row.key}
                    onChange={(e) => { setHeaderRows((p) => p.map((r, j) => (j === i ? { ...r, key: e.target.value } : r))); setIsDirty(true); }}
                    className="font-mono flex-1"
                    size="sm"
                  />
                  <Input
                    tone={themeColor}
                    placeholder="Value"
                    value={row.value}
                    onChange={(e) => { setHeaderRows((p) => p.map((r, j) => (j === i ? { ...r, value: e.target.value } : r))); setIsDirty(true); }}
                    className="font-mono flex-1"
                    size="sm"
                  />
                  <div>
                    <IconButton variant="ghost" color="rose" size="sm" icon="Trash" onClick={() => { setHeaderRows((p) => p.filter((_, j) => j !== i)); setIsDirty(true); }} />
                  </div>
                </div>
              ))}
              <Button variant="soft" color={themeColor} size="sm" leadingIcon="Add" onClick={() => { setHeaderRows((p) => [...p, { key: '', value: '' }]); setIsDirty(true); }}>
                Add Header
              </Button>
            </div>
          </FormField>
        </Panel>
      </div>
    </Modal>
  );
};
