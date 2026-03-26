import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Combobox,
  FormField,
  FormLayout,
  Input,
  Modal,
  ModalActions,
  MultiToggle,
  type MultiToggleOption,
  PasswordInput,
  Select,
  Toggle,
  Picker,
  type PickerItem,
  type PickerFilter,
  type ThemeColor,
  Panel,
  CollapsiblePanel,
} from '@prl/ui-kit';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { CatalogPushRequest } from '@/interfaces/devops';
import { VirtualMachine } from '@/interfaces/VirtualMachine';
import { devopsService } from '@/services/devops';
import { OsIcon } from '@/utils/virtualMachine';
import { getStateTone } from '@/utils/vmUtils';

// ─── Chip input ──────────────────────────────────────────────────────────────

interface ChipInputProps {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

const ChipInput: React.FC<ChipInputProps> = ({ values, onChange, placeholder }) => {
  const [draft, setDraft] = useState('');
  const { themeColor } = useSystemSettings();

  const commit = () => {
    const v = draft.trim().replace(/,+$/, '');
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          size="sm"
          tone={themeColor}
          placeholder={placeholder ?? 'Type and press Enter…'}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit();
            }
            if (e.key === 'Backspace' && !draft && values.length) onChange(values.slice(0, -1));
          }}
        />
        <Button type="button" variant="soft" color="slate" size="sm" onClick={commit}>
          Add
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="ml-0.5 flex-none leading-none text-neutral-400 transition-colors hover:text-neutral-700 dark:hover:text-neutral-200"
                aria-label={`Remove ${v}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Storage Provider Picker ──────────────────────────────────────────────────

type ProviderKey = 'local' | 'minio' | 'aws-s3' | 'azurestorageprovider' | 'artifactory';
type MinioAuthMode = 'keys' | 'env';
type S3AuthMode = 'keys' | 'session' | 'env';
type ArtAuthMode = 'access_key' | 'userpass';

interface StorageProviderFields {
  // Local
  catalog_path: string;
  // MinIO
  minio_endpoint: string;
  minio_bucket: string;
  minio_use_ssl: boolean;
  minio_ignore_cert: boolean;
  minio_access_key: string;
  minio_secret_key: string;
  minio_auth: MinioAuthMode;
  // AWS S3
  s3_bucket: string;
  s3_region: string;
  s3_access_key: string;
  s3_secret_key: string;
  s3_session_token: string;
  s3_auth: S3AuthMode;
  // Azure Blob
  az_storage_account_name: string;
  az_storage_account_key: string;
  az_container_name: string;
  // Artifactory
  art_url: string;
  art_port: string;
  art_repo: string;
  art_access_key: string;
  art_username: string;
  art_password: string;
  art_auth: ArtAuthMode;
}

const defaultProviderFields = (): StorageProviderFields => ({
  catalog_path: '',
  minio_endpoint: '',
  minio_bucket: '',
  minio_use_ssl: false,
  minio_ignore_cert: false,
  minio_access_key: '',
  minio_secret_key: '',
  minio_auth: 'keys',
  s3_bucket: '',
  s3_region: '',
  s3_access_key: '',
  s3_secret_key: '',
  s3_session_token: '',
  s3_auth: 'keys',
  az_storage_account_name: '',
  az_storage_account_key: '',
  az_container_name: '',
  art_url: '',
  art_port: '',
  art_repo: '',
  art_access_key: '',
  art_username: '',
  art_password: '',
  art_auth: 'access_key',
});

const SECRET_FIELDS = new Set(['access_key', 'secret_key', 'session_token', 'storage_account_key', 'password']);

function buildConnectionString(provider: ProviderKey, fields: Record<string, string | boolean>): string {
  const parts: string[] = [`provider=${provider}`];
  for (const [key, val] of Object.entries(fields)) {
    if (val === '' || val === false || val === undefined) continue;
    parts.push(val === true ? `${key}=true` : `${key}=${val}`);
  }
  return parts.join(';');
}

function buildMaskedPreview(provider: ProviderKey, fields: Record<string, string | boolean>): string {
  const parts: string[] = [`provider=${provider}`];
  for (const [key, val] of Object.entries(fields)) {
    if (val === '' || val === false || val === undefined) continue;
    if (val === true) {
      parts.push(`${key}=true`);
      continue;
    }
    parts.push(SECRET_FIELDS.has(key) ? `${key}=****` : `${key}=${val}`);
  }
  return parts.join(';');
}

const MINIO_AUTH_OPTIONS: MultiToggleOption[] = [
  { value: 'keys', label: 'Access Keys' },
  { value: 'env', label: 'Environment' },
];
const S3_AUTH_OPTIONS: MultiToggleOption[] = [
  { value: 'keys', label: 'Access Keys' },
  { value: 'session', label: 'Session Token' },
  { value: 'env', label: 'Environment' },
];
const ART_AUTH_OPTIONS: MultiToggleOption[] = [
  { value: 'access_key', label: 'Access Key' },
  { value: 'userpass', label: 'Username / Password' },
];

interface StorageProviderPickerProps {
  value: string;
  onChange: (conn: string) => void;
  themeColor: ThemeColor;
}

const StorageProviderPicker: React.FC<StorageProviderPickerProps> = ({ onChange, themeColor }) => {
  const [provider, setProvider] = useState<ProviderKey | ''>('');
  const [fields, setFields] = useState<StorageProviderFields>(defaultProviderFields);

  const setField = <K extends keyof StorageProviderFields>(key: K, val: StorageProviderFields[K]) => setFields((prev) => ({ ...prev, [key]: val }));

  // Derive the canonical fields map and completeness for the current provider
  const { canonicalFields, isComplete } = useMemo(() => {
    if (!provider) return { canonicalFields: {}, isComplete: false };

    let f: Record<string, string | boolean> = {};
    let complete = false;

    if (provider === 'local') {
      f = { catalog_path: fields.catalog_path };
      complete = !!fields.catalog_path;
    } else if (provider === 'minio') {
      f = {
        endpoint: fields.minio_endpoint,
        bucket: fields.minio_bucket,
        ...(fields.minio_use_ssl ? { use_ssl: true } : {}),
        ...(fields.minio_ignore_cert ? { ignore_cert: true } : {}),
      };
      if (fields.minio_auth === 'keys') {
        f.access_key = fields.minio_access_key;
        f.secret_key = fields.minio_secret_key;
        complete = !!(fields.minio_endpoint && fields.minio_bucket && fields.minio_access_key && fields.minio_secret_key);
      } else {
        f.use_environment_authentication = true;
        complete = !!(fields.minio_endpoint && fields.minio_bucket);
      }
    } else if (provider === 'aws-s3') {
      f = { bucket: fields.s3_bucket, region: fields.s3_region };
      if (fields.s3_auth === 'keys') {
        f.access_key = fields.s3_access_key;
        f.secret_key = fields.s3_secret_key;
        complete = !!(fields.s3_bucket && fields.s3_region && fields.s3_access_key && fields.s3_secret_key);
      } else if (fields.s3_auth === 'session') {
        f.session_token = fields.s3_session_token;
        complete = !!(fields.s3_bucket && fields.s3_region && fields.s3_session_token);
      } else {
        f.use_environment_authentication = true;
        complete = !!(fields.s3_bucket && fields.s3_region);
      }
    } else if (provider === 'azurestorageprovider') {
      f = {
        storage_account_name: fields.az_storage_account_name,
        storage_account_key: fields.az_storage_account_key,
        container_name: fields.az_container_name,
      };
      complete = !!(fields.az_storage_account_name && fields.az_storage_account_key && fields.az_container_name);
    } else if (provider === 'artifactory') {
      f = { url: fields.art_url, port: fields.art_port, repo: fields.art_repo };
      if (fields.art_auth === 'access_key') {
        f.access_key = fields.art_access_key;
        complete = !!(fields.art_url && fields.art_repo && fields.art_access_key);
      } else {
        f.username = fields.art_username;
        f.password = fields.art_password;
        complete = !!(fields.art_url && fields.art_repo && fields.art_username && fields.art_password);
      }
    }

    return { canonicalFields: f, isComplete: complete };
  }, [provider, fields]);

  // Notify parent whenever the connection string changes
  useEffect(() => {
    if (!provider || !isComplete) {
      onChange('');
    } else {
      onChange(buildConnectionString(provider as ProviderKey, canonicalFields));
    }
  }, [provider, canonicalFields, isComplete, onChange]);

  const previewString = provider && isComplete ? buildMaskedPreview(provider as ProviderKey, canonicalFields) : '';

  return (
    <div className="space-y-3">
      {/* Provider select */}
      <FormField label="Provider" required width="full">
        <Select
          tone={themeColor}
          value={provider}
          size="sm"
          onChange={(e) => {
            setProvider(e.target.value as ProviderKey | '');
            setFields(defaultProviderFields());
          }}
        >
          <option value="">Select a provider…</option>
          <option value="local">Local</option>
          <option value="minio">MinIO</option>
          <option value="aws-s3">Amazon S3</option>
          <option value="azurestorageprovider">Azure Blob Storage</option>
          <option value="artifactory">Artifactory</option>
        </Select>
      </FormField>

      {/* Provider-specific fields */}
      {provider === 'local' && (
        <FormField label="Catalog Path" required width="full">
          <Input tone={themeColor} size="sm" placeholder="/var/catalog" value={fields.catalog_path} onChange={(e) => setField('catalog_path', e.target.value)} className="font-mono text-xs" />
        </FormField>
      )}

      {provider === 'minio' && (
        <div className="space-y-3">
          <FormLayout columns={2} gap="sm">
            <FormField label="Endpoint" required width="full">
              <Input
                tone={themeColor}
                size="sm"
                placeholder="https://s3.example.com"
                value={fields.minio_endpoint}
                onChange={(e) => setField('minio_endpoint', e.target.value)}
                className="font-mono text-xs"
              />
            </FormField>
            <FormField label="Bucket" required width="full">
              <Input tone={themeColor} size="sm" placeholder="my-bucket" value={fields.minio_bucket} onChange={(e) => setField('minio_bucket', e.target.value)} />
            </FormField>
          </FormLayout>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Toggle color={themeColor} size="sm" checked={fields.minio_use_ssl} onChange={(e) => setField('minio_use_ssl', e.target.checked)} />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Use SSL</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Toggle color={themeColor} size="sm" checked={fields.minio_ignore_cert} onChange={(e) => setField('minio_ignore_cert', e.target.checked)} />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Ignore Certificate</span>
            </label>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">Authentication</p>
            <MultiToggle
              options={MINIO_AUTH_OPTIONS}
              value={fields.minio_auth}
              onChange={(v) => setField('minio_auth', v as MinioAuthMode)}
              variant="solid"
              color={themeColor}
              size="sm"
              adaptiveWidth
            />
          </div>
          {fields.minio_auth === 'keys' && (
            <FormLayout columns={2} gap="sm">
              <FormField label="Access Key" required width="full">
                <PasswordInput tone={themeColor} size="sm" placeholder="access key" value={fields.minio_access_key} onChange={(e) => setField('minio_access_key', e.target.value)} />
              </FormField>
              <FormField label="Secret Key" required width="full">
                <PasswordInput tone={themeColor} size="sm" placeholder="secret key" value={fields.minio_secret_key} onChange={(e) => setField('minio_secret_key', e.target.value)} />
              </FormField>
            </FormLayout>
          )}
        </div>
      )}

      {provider === 'aws-s3' && (
        <div className="space-y-3">
          <FormLayout columns={2} gap="sm">
            <FormField label="Bucket" required width="full">
              <Input tone={themeColor} size="sm" placeholder="my-bucket" value={fields.s3_bucket} onChange={(e) => setField('s3_bucket', e.target.value)} />
            </FormField>
            <FormField label="Region" required width="full">
              <Input tone={themeColor} size="sm" placeholder="us-east-1" value={fields.s3_region} onChange={(e) => setField('s3_region', e.target.value)} />
            </FormField>
          </FormLayout>
          <div>
            <p className="mb-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">Authentication</p>
            <MultiToggle options={S3_AUTH_OPTIONS} value={fields.s3_auth} onChange={(v) => setField('s3_auth', v as S3AuthMode)} variant="solid" color={themeColor} size="sm" adaptiveWidth />
          </div>
          {fields.s3_auth === 'keys' && (
            <FormLayout columns={2} gap="sm">
              <FormField label="Access Key" required width="full">
                <PasswordInput tone={themeColor} size="sm" placeholder="access key" value={fields.s3_access_key} onChange={(e) => setField('s3_access_key', e.target.value)} />
              </FormField>
              <FormField label="Secret Key" required width="full">
                <PasswordInput tone={themeColor} size="sm" placeholder="secret key" value={fields.s3_secret_key} onChange={(e) => setField('s3_secret_key', e.target.value)} />
              </FormField>
            </FormLayout>
          )}
          {fields.s3_auth === 'session' && (
            <FormField label="Session Token" required width="full">
              <PasswordInput tone={themeColor} size="sm" placeholder="session token" value={fields.s3_session_token} onChange={(e) => setField('s3_session_token', e.target.value)} />
            </FormField>
          )}
        </div>
      )}

      {provider === 'azurestorageprovider' && (
        <div className="space-y-3">
          <FormLayout columns={2} gap="sm">
            <FormField label="Storage Account Name" required width="full">
              <Input tone={themeColor} size="sm" placeholder="mystorageaccount" value={fields.az_storage_account_name} onChange={(e) => setField('az_storage_account_name', e.target.value)} />
            </FormField>
            <FormField label="Container Name" required width="full">
              <Input tone={themeColor} size="sm" placeholder="my-container" value={fields.az_container_name} onChange={(e) => setField('az_container_name', e.target.value)} />
            </FormField>
          </FormLayout>
          <FormField label="Storage Account Key" required width="full">
            <PasswordInput tone={themeColor} size="sm" placeholder="account key" value={fields.az_storage_account_key} onChange={(e) => setField('az_storage_account_key', e.target.value)} />
          </FormField>
        </div>
      )}

      {provider === 'artifactory' && (
        <div className="space-y-3">
          <FormLayout columns={2} gap="sm">
            <FormField label="URL" required width="full">
              <Input
                tone={themeColor}
                size="sm"
                placeholder="https://artifactory.example.com"
                value={fields.art_url}
                onChange={(e) => setField('art_url', e.target.value)}
                className="font-mono text-xs"
              />
            </FormField>
            <FormField label="Port" width="full">
              <Input tone={themeColor} size="sm" placeholder="8081" value={fields.art_port} onChange={(e) => setField('art_port', e.target.value)} />
            </FormField>
          </FormLayout>
          <FormField label="Repository" required width="full">
            <Input tone={themeColor} size="sm" placeholder="my-repo" value={fields.art_repo} onChange={(e) => setField('art_repo', e.target.value)} />
          </FormField>
          <div>
            <p className="mb-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">Authentication</p>
            <MultiToggle options={ART_AUTH_OPTIONS} value={fields.art_auth} onChange={(v) => setField('art_auth', v as ArtAuthMode)} variant="solid" color={themeColor} size="sm" adaptiveWidth />
          </div>
          {fields.art_auth === 'access_key' && (
            <FormField label="Access Key" required width="full">
              <PasswordInput tone={themeColor} size="sm" placeholder="access key" value={fields.art_access_key} onChange={(e) => setField('art_access_key', e.target.value)} />
            </FormField>
          )}
          {fields.art_auth === 'userpass' && (
            <FormLayout columns={2} gap="sm">
              <FormField label="Username" required width="full">
                <Input tone={themeColor} size="sm" placeholder="username" value={fields.art_username} onChange={(e) => setField('art_username', e.target.value)} />
              </FormField>
              <FormField label="Password" required width="full">
                <PasswordInput tone={themeColor} size="sm" placeholder="password" value={fields.art_password} onChange={(e) => setField('art_password', e.target.value)} />
              </FormField>
            </FormLayout>
          )}
        </div>
      )}

      {/* Connection string preview */}
      {previewString && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/50">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Connection String Preview</p>
          <p className="break-all font-mono text-xs text-neutral-600 dark:text-neutral-300">{previewString}</p>
        </div>
      )}
    </div>
  );
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCE_MODES: MultiToggleOption[] = [
  { value: 'vm', label: 'Virtual Machine' },
  { value: 'manual', label: 'Manual Path' },
];

const ARCH_OPTIONS = ['arm64', 'amd64', 'x86_64', 'aarch64'];

const COMPRESSION_LEVELS = [
  { value: 'no_compression', label: 'No Compression' },
  { value: 'default', label: 'Default' },
  { value: 'best_speed', label: 'Best Speed' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'best_compression', label: 'Best Compression' },
];

const IS_TAURI = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

function normalizeCatalogId(name: string): string {
  return name
    .toUpperCase()
    .replace(/ /g, '_')
    .replace(/[^A-Z0-9_-]/g, '_');
}

// ─── Form state ───────────────────────────────────────────────────────────────

type SourceMode = 'vm' | 'manual';

interface UploadFormState {
  sourceMode: SourceMode;
  vmId: string;
  local_path: string;
  catalog_id: string;
  description: string;
  version: string;
  architecture: string;
  connection: string;
  compress: boolean;
  compress_level: string;
  uuid: string;
  required_roles: string[];
  required_claims: string[];
  tags: string[];
  min_cpu: string;
  min_memory: string;
  min_disk: string;
}

const defaultForm = (): UploadFormState => ({
  sourceMode: 'vm',
  vmId: '',
  local_path: '',
  catalog_id: '',
  description: '',
  version: '',
  architecture: 'arm64',
  connection: '',
  compress: false,
  compress_level: 'default',
  uuid: '',
  required_roles: [],
  required_claims: [],
  tags: [],
  min_cpu: '',
  min_memory: '',
  min_disk: '',
});

// ─── Props ────────────────────────────────────────────────────────────────────

interface UploadCatalogModalProps {
  isOpen: boolean;
  hostname: string;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (data: CatalogPushRequest) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const UploadCatalogModal: React.FC<UploadCatalogModalProps> = ({ isOpen, hostname, loading, error, onClose, onSubmit }) => {
  const { themeColor } = useSystemSettings();
  const [form, setForm] = useState<UploadFormState>(defaultForm);
  const [vms, setVms] = useState<VirtualMachine[]>([]);
  const [vmsLoading, setVmsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const prevOpen = useRef(false);

  // Reset and load VMs when opening
  useEffect(() => {
    if (isOpen && !prevOpen.current) {
      setForm(defaultForm());
      setValidationError(null);
      setVmsLoading(true);
      devopsService.machines
        .getVirtualMachines(hostname)
        .then(setVms)
        .catch(() => setVms([]))
        .finally(() => setVmsLoading(false));
    }
    prevOpen.current = isOpen;
  }, [isOpen, hostname]);

  const set = <K extends keyof UploadFormState>(key: K, value: UploadFormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  // Map VirtualMachine[] → PickerItem[] for the UI kit Picker component
  const vmPickerItems = useMemo<PickerItem[]>(
    () =>
      vms.map((vm) => ({
        id: vm.ID,
        icon: <OsIcon os={vm.OS} className="h-5 w-5" />,
        title: vm.Name ?? vm.ID,
        subtitle: vm.OS,
        tags: [{ label: vm.State ?? 'unknown', tone: getStateTone(vm.State) }],
      })),
    [vms],
  );

  const vmPickerFilter = useMemo<PickerFilter>(
    () => ({
      label: 'Stopped',
      predicate: (item) => {
        const vm = vms.find((v) => v.ID === item.id);
        return vm?.State?.toLowerCase() === 'stopped';
      },
    }),
    [vms],
  );

  const handleVmSelect = (item: PickerItem) => {
    const vm = vms.find((v) => v.ID === item.id);
    const vmName = vm?.Name ?? '';
    setForm((prev) => ({
      ...prev,
      vmId: item.id,
      local_path: vm?.Home ?? '',
      catalog_id: vmName ? normalizeCatalogId(vmName) : prev.catalog_id,
    }));
    setValidationError(null);
  };

  const handleBrowse = async () => {
    if (!IS_TAURI) return;
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const result = await open({
        multiple: false,
        directory: false,
        title: 'Select Virtual Machine Bundle',
        filters: [{ name: 'Parallels VM', extensions: ['pvm', 'macvm'] }],
      });
      if (typeof result === 'string' && result) {
        set('local_path', result);
        setValidationError(null);
      }
    } catch (e) {
      console.error('[UploadCatalogModal] dialog open failed:', e);
    }
  };

  const handleSubmit = () => {
    const needsPath = form.sourceMode === 'vm' ? !form.vmId : !form.local_path.trim();
    if (needsPath) {
      setValidationError(form.sourceMode === 'vm' ? 'Please select a stopped virtual machine.' : 'Please provide the path to the VM bundle.');
      return;
    }
    if (!form.catalog_id.trim()) {
      setValidationError('Catalog ID is required.');
      return;
    }
    if (!form.version.trim()) {
      setValidationError('Version is required.');
      return;
    }
    if (!form.architecture.trim()) {
      setValidationError('Architecture is required.');
      return;
    }
    setValidationError(null);

    const request: CatalogPushRequest = {
      local_path: form.local_path,
      catalog_id: form.catalog_id.trim(),
      version: form.version.trim(),
      architecture: form.architecture.trim(),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      ...(form.connection.trim() ? { connection: form.connection.trim() } : {}),
      ...(form.compress
        ? {
            compress: true,
            compress_level: form.compress_level,
          }
        : {}),
      ...(form.uuid.trim() ? { uuid: form.uuid.trim() } : {}),
      ...(form.tags.length ? { tags: form.tags } : {}),
      ...(form.required_roles.length ? { required_roles: form.required_roles } : {}),
      ...(form.required_claims.length ? { required_claims: form.required_claims } : {}),
      ...(form.min_cpu || form.min_memory || form.min_disk
        ? {
            minimum_requirements: {
              ...(form.min_cpu ? { cpu: Number(form.min_cpu) } : {}),
              ...(form.min_memory ? { memory: Number(form.min_memory) } : {}),
              ...(form.min_disk ? { disk: Number(form.min_disk) } : {}),
            },
          }
        : {}),
    };

    onSubmit(request);
  };

  const displayError = validationError ?? error;
  const selectedVm = vms.find((v) => v.ID === form.vmId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload to Catalog"
      description="Push a local virtual machine to the catalog service for distribution."
      size="xl"
      actions={
        <ModalActions>
          <Button variant="soft" color="slate" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {(selectedVm || (form.sourceMode === 'manual' && form.local_path !== '')) && (
            <Button variant="solid" color={themeColor} onClick={handleSubmit} loading={loading}>
              Upload to Catalog
            </Button>
          )}
        </ModalActions>
      }
    >
      <div className="space-y-3">
        {/* ── Source ─────────────────────────────────────────────────────── */}
        <Panel padding="xs" variant="glass" backgroundColor="white">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Source</p>
            <MultiToggle
              options={SOURCE_MODES}
              value={form.sourceMode}
              onChange={(v) => {
                setForm((prev) => ({
                  ...prev,
                  sourceMode: v as SourceMode,
                  vmId: '',
                  local_path: '',
                }));
                setValidationError(null);
              }}
              variant="solid"
              color={themeColor}
              size="sm"
              adaptiveWidth
            />
          </div>

          {form.sourceMode === 'vm' ? (
            <>
              <Picker
                color={themeColor}
                items={vmPickerItems}
                loading={vmsLoading}
                selectedId={form.vmId}
                onSelect={handleVmSelect}
                placeholder="Select a stopped virtual machine…"
                emptyMessage="No stopped virtual machines found."
                defaultFilter={vmPickerFilter}
                escapeBoundary
              />
              {selectedVm && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                  <svg className="h-3.5 w-3.5 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
                  </svg>
                  <span className="font-mono">{selectedVm.Home}</span>
                </p>
              )}
            </>
          ) : (
            <FormField label="VM Bundle Path" required width="full" helpText="Absolute path to the .pvm or .macvm bundle on this host.">
              <div className="flex gap-2">
                <Input
                  tone={themeColor}
                  size="sm"
                  placeholder="/Users/me/Parallels/MyVM.pvm"
                  value={form.local_path}
                  onChange={(e) => set('local_path', e.target.value)}
                  className="font-mono text-xs"
                />
                {IS_TAURI && (
                  <Button type="button" variant="soft" color={themeColor} size="sm" leadingIcon="Folder" onClick={() => void handleBrowse()}>
                    Browse
                  </Button>
                )}
              </div>
            </FormField>
          )}
        </Panel>

        {(selectedVm || (form.sourceMode === 'manual' && form.local_path !== '')) && (
          <>
            {/* ── Catalog Details ─────────────────────────────────────────────── */}
            <Panel padding="xs" variant="glass" backgroundColor="white">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Catalog Details</p>
              <FormLayout columns={2} gap="sm">
                <FormField label="Catalog ID" required width="full">
                  <Input tone={themeColor} size="sm" placeholder="e.g. ubuntu-22-04" value={form.catalog_id} onChange={(e) => set('catalog_id', e.target.value)} />
                </FormField>
                <FormField label="Description" width="full">
                  <Input tone={themeColor} size="sm" placeholder="Brief description of this image" value={form.description} onChange={(e) => set('description', e.target.value)} />
                </FormField>
                <FormField label="Version" required width="full">
                  <Input tone={themeColor} size="sm" placeholder="e.g. 1.0.0" value={form.version} onChange={(e) => set('version', e.target.value)} />
                </FormField>
                <FormField label="Architecture" required width="full">
                  <Combobox color={themeColor} value={form.architecture} onChange={(v) => set('architecture', v)} options={ARCH_OPTIONS} placeholder="e.g. arm64" />
                </FormField>
              </FormLayout>
              <FormField label="Connection" width="full" helpText="Select a storage provider to build the connection string. Leave unset for the local catalog.">
                <StorageProviderPicker value={form.connection} onChange={(conn) => set('connection', conn)} themeColor={themeColor} />
              </FormField>
            </Panel>

            {/* ── Compression ─────────────────────────────────────────────────── */}
            <Panel padding="xs" variant="glass" backgroundColor="white">
              <div className="flex items-start justify-between gap-4 p-1">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Compression</p>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Pack and compress the VM bundle before uploading.</p>
                </div>
                <Toggle color={themeColor} checked={form.compress} onChange={(e) => set('compress', e.target.checked)} size="sm" />
              </div>
              {form.compress && (
                <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-700/60">
                  <FormField label="Compression Level" width="full">
                    <Select tone={themeColor} value={form.compress_level} size="sm" onChange={(e) => set('compress_level', e.target.value)}>
                      {COMPRESSION_LEVELS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
              )}
            </Panel>

            {/* ── Access & Metadata ───────────────────────────────────────────── */}
            <CollapsiblePanel title={( <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Access & Metadata <span className="font-normal normal-case text-neutral-400">(optional)</span></p>)} padding="xs" variant="glass" backgroundColor="white">
             
              <div className="space-y-3">
                <FormField label="Tags" width="full" helpText="Free-form labels to help categorize this image.">
                  <ChipInput values={form.tags} onChange={(v) => set('tags', v)} placeholder="e.g. production, ubuntu, base" />
                </FormField>
                <FormLayout columns={2} gap="sm">
                  <FormField label="Required Roles" width="full" helpText="Users must hold one of these roles to download.">
                    <ChipInput values={form.required_roles} onChange={(v) => set('required_roles', v)} placeholder="e.g. developer" />
                  </FormField>
                  <FormField label="Required Claims" width="full" helpText="Users must hold all of these claims to download.">
                    <ChipInput values={form.required_claims} onChange={(v) => set('required_claims', v)} placeholder="e.g. PULL_CATALOG_MANIFEST" />
                  </FormField>
                </FormLayout>
                <FormField label="UUID (optional)" width="full" helpText="Override the auto-generated UUID for this manifest entry.">
                  <Input tone={themeColor} size="sm" placeholder="Leave empty to auto-generate" value={form.uuid} onChange={(e) => set('uuid', e.target.value)} className="font-mono text-xs" />
                </FormField>
              </div>
            </CollapsiblePanel>

            {/* ── Minimum Requirements ────────────────────────────────────────── */}
            <CollapsiblePanel title={(
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Minimum Requirements <span className="font-normal normal-case text-neutral-400">(optional)</span>
              </p>
            )} padding="xs" variant="glass" backgroundColor="white">
 
              <FormLayout columns={3} gap="sm">
                <FormField label="CPU (cores)" width="full">
                  <Input tone={themeColor} size="sm" type="number" min={1} placeholder="e.g. 2" value={form.min_cpu} onChange={(e) => set('min_cpu', e.target.value)} />
                </FormField>
                <FormField label="Memory (MB)" width="full">
                  <Input tone={themeColor} size="sm" type="number" min={256} placeholder="e.g. 4096" value={form.min_memory} onChange={(e) => set('min_memory', e.target.value)} />
                </FormField>
                <FormField label="Disk (MB)" width="full">
                  <Input tone={themeColor} size="sm" type="number" min={1} placeholder="e.g. 20480" value={form.min_disk} onChange={(e) => set('min_disk', e.target.value)} />
                </FormField>
              </FormLayout>
            </CollapsiblePanel>

            {displayError && <Alert tone="danger" variant="subtle" title={validationError ? 'Validation Error' : 'Upload Failed'} description={displayError} />}
          </>
        )}
      </div>
    </Modal>
  );
};
