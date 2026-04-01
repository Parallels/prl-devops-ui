import {
  CatalogManager,
  CatalogManagerCreateRequest,
  CatalogManagerUpdateRequest,
} from '@/interfaces/CatalogManager';
import { CatalogManifestItem as RawCatalogManifest } from '@/interfaces/devops';

export type CatalogSource = {
  id: string;
  type: 'local' | 'manager';
  title: string;
  subtitle: string;
  managerId?: string;
};

export interface CatalogProvider {
  type: string;
  host: string;
}

export interface CatalogRow {
  id: string;
  manifestId: string;
  name: string;
  version: string;
  architecture: string;
  active: boolean;
  tainted: boolean;
  taintedBy?: string;
  taintedAt?: string;
  revoked: boolean;
  revokedBy?: string;
  revokedAt?: string;
  size: string;
  created: string;
  updated: string;
  tags: string;
  tagsList: string[];
  description: string;
  downloadCount?: number;
  lastDownloadedAt?: string;
  requiredRoles?: string[];
  requiredClaims?: string[];
  provider?: CatalogProvider;
  specs: {
    cpu?: string;
    memory?: string;
  };
}

export interface CatalogManifestLeaf {
  id: string;
  row: CatalogRow;
}

export interface CatalogManifestVersion {
  id: string;
  version: string;
  tags: string[];
  items: CatalogManifestLeaf[];
}

export interface CatalogManifestItem {
  id: string;
  manifestId: string;
  title: string;
  description: string;
  versions: CatalogManifestVersion[];
  totalItems: number;
  architectures: string[];
  tags: string[];
  source: CatalogSource;
  provider?: CatalogProvider;
  taintedCount: number;
  revokedCount: number;
  inactiveCount: number;
  requiredRoles: string[];
  requiredClaims: string[];
  totalDownloads: number;
}

export interface CatalogManagerFormData {
  name: string;
  url: string;
  internal: boolean;
  active: boolean;
  authentication_method: 'credentials' | 'api_key';
  username: string;
  password: string;
  api_key: string;
  global: boolean;
  required_claims: string[];
}

export const defaultManagerForm: CatalogManagerFormData = {
  name: '',
  url: '',
  internal: false,
  active: true,
  authentication_method: 'credentials',
  username: '',
  password: '',
  api_key: '',
  global: false,
  required_claims: [],
};

const formatBytes = (size?: number): string => {
  if (!size || size <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = size;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[index]}`;
};

const formatCatalogDate = (value?: string): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const parseSpec = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const result = String(value).trim();
  return result.length > 0 ? result : undefined;
};

const extractSpecs = (item: Record<string, unknown>): { cpu?: string; memory?: string } => {
  const nested = (item.specs && typeof item.specs === 'object' ? item.specs : {}) as Record<string, unknown>;
  return {
    cpu: parseSpec(nested.cpu ?? item.cpu),
    memory: parseSpec(nested.memory ?? item.memory),
  };
};

const normalizeToken = (value: unknown): string => String(value ?? '').trim().toLowerCase();

const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const token = normalizeToken(value);
    if (['true', '1', 'yes', 'y', 'on', 'active', 'enabled'].includes(token)) return true;
    if (['false', '0', 'no', 'n', 'off', 'inactive', 'disabled'].includes(token)) return false;
  }
  return undefined;
};

const deriveCatalogRowState = (
  item: Record<string, unknown>,
  tagsList: string[],
): { active: boolean; tainted: boolean; revoked: boolean } => {
  const tags = tagsList.map((tag) => normalizeToken(tag));
  const tagIncludes = (token: string): boolean => tags.some((tag) => tag === token || tag.includes(token));

  const statusToken = [item.status, item.state, item.lifecycle_state]
    .map((value) => (typeof value === 'string' ? normalizeToken(value) : ''))
    .find(Boolean);

  const tainted =
    (toBoolean(item.tainted) ?? false) ||
    (toBoolean(item.is_tainted) ?? false) ||
    (toBoolean(item.isTainted) ?? false) ||
    tagIncludes('tainted') ||
    statusToken === 'tainted';

  const revoked =
    (toBoolean(item.revoked) ?? false) ||
    (toBoolean(item.is_revoked) ?? false) ||
    (toBoolean(item.isRevoked) ?? false) ||
    tagIncludes('revoked') ||
    statusToken === 'revoked';

  const explicitActive = [
    item.active,
    item.is_active,
    item.isActive,
    item.enabled,
    item.available,
  ]
    .map((value) => toBoolean(value))
    .find((value) => value !== undefined);

  const statusActive = statusToken
    ? !['tainted', 'revoked', 'inactive', 'disabled', 'deleted', 'error', 'failed'].includes(statusToken)
    : undefined;

  const active = (explicitActive ?? statusActive ?? true) && !tainted && !revoked;

  return { active, tainted, revoked };
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const compareVersionsDesc = (a: string, b: string): number => {
  const isALatest = a.toLowerCase() === 'latest';
  const isBLatest = b.toLowerCase() === 'latest';
  if (isALatest && !isBLatest) return -1;
  if (!isALatest && isBLatest) return 1;

  const numA = Number(a);
  const numB = Number(b);
  if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
    return numB - numA;
  }

  return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
};

const extractProvider = (item: Record<string, unknown>): CatalogProvider | undefined => {
  const raw = item.provider;
  if (!raw || typeof raw !== 'object') return undefined;
  const p = raw as Record<string, unknown>;
  const type = typeof p.type === 'string' ? p.type.trim() : '';
  const host = typeof p.host === 'string' ? p.host.trim() : '';
  if (!type) return undefined;
  return { type, host };
};

const extractStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v).trim()).filter(Boolean);
};

const mapCatalogRow = (manifest: RawCatalogManifest, item: Record<string, unknown>, idx: number): CatalogRow => {
  const tagsList = Array.isArray(item.tags)
    ? item.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [];
  const specs = extractSpecs(item);
  const state = deriveCatalogRowState(item, tagsList);
  const provider = extractProvider(item);

  return {
    id: `${manifest.name}-${item.id ?? idx}-${item.version ?? 'na'}-${item.architecture ?? 'na'}`,
    manifestId: manifest.name,
    name: (item.name as string) || manifest.name,
    version: (item.version as string) || '-',
    architecture: (item.architecture as string) || '-',
    active: state.active,
    tainted: state.tainted,
    taintedBy: typeof item.tainted_by === 'string' ? item.tainted_by : undefined,
    taintedAt: formatCatalogDate(item.tainted_at as string | undefined),
    revoked: state.revoked,
    revokedBy: typeof item.revoked_by === 'string' ? item.revoked_by : undefined,
    revokedAt: formatCatalogDate(item.revoked_at as string | undefined),
    size: formatBytes(toNumber(item.compressed_size) ?? toNumber(item.pack_size) ?? toNumber(item.size)),
    created: formatCatalogDate(item.created_at as string),
    updated: formatCatalogDate(item.updated_at as string),
    tags: tagsList.length ? tagsList.join(', ') : '-',
    tagsList,
    description: (item.description as string) || manifest.description || '',
    downloadCount: toNumber(item.download_count),
    lastDownloadedAt: formatCatalogDate(item.last_downloaded_at as string),
    requiredRoles: extractStringArray(item.required_roles),
    requiredClaims: extractStringArray(item.required_claims),
    provider,
    specs,
  };
};

export const mapCatalogRows = (manifests: RawCatalogManifest[]): CatalogRow[] => {
  const rows: CatalogRow[] = [];

  for (const manifest of manifests) {
    if (!manifest.items?.length) {
      rows.push({
        id: `${manifest.name}-empty`,
        manifestId: manifest.name,
        name: manifest.name,
        version: '-',
        architecture: '-',
        active: true,
        tainted: false,
        revoked: false,
        size: '-',
        created: '-',
        updated: '-',
        tags: '-',
        tagsList: [],
        description: manifest.description ?? '',
        specs: {},
      });
      continue;
    }

    manifest.items.forEach((item, idx) => {
      rows.push(mapCatalogRow(manifest, item as Record<string, unknown>, idx));
    });
  }

  return rows;
};

export const mapCatalogManifests = (manifests: RawCatalogManifest[], source: CatalogSource): CatalogManifestItem[] =>
  manifests
    .map((manifest) => {
      const byVersion = new Map<string, CatalogManifestVersion>();
      const manifestTags = new Set<string>();
      const architectures = new Set<string>();
      const allRoles = new Set<string>();
      const allClaims = new Set<string>();
      let provider: CatalogProvider | undefined;
      let taintedCount = 0;
      let revokedCount = 0;
      let inactiveCount = 0;
      let totalDownloads = 0;

      (manifest.items ?? []).forEach((item, idx) => {
        const row = mapCatalogRow(manifest, item as Record<string, unknown>, idx);
        const versionKey = row.version || '-';
        let versionNode = byVersion.get(versionKey);
        if (!versionNode) {
          versionNode = {
            id: `${manifest.name}-${versionKey}`,
            version: versionKey,
            tags: [],
            items: [],
          };
          byVersion.set(versionKey, versionNode);
        }

        row.tagsList.forEach((tag) => manifestTags.add(tag));
        if (row.architecture !== '-') architectures.add(row.architecture);
        versionNode.tags = Array.from(new Set([...versionNode.tags, ...row.tagsList]));
        versionNode.items.push({ id: row.id, row });

        // Aggregate manifest-level stats
        if (!provider && row.provider) provider = row.provider;
        if (row.tainted) taintedCount += 1;
        if (row.revoked) revokedCount += 1;
        if (!row.active) inactiveCount += 1;
        totalDownloads += row.downloadCount ?? 0;
        row.requiredRoles?.forEach((r) => allRoles.add(r));
        row.requiredClaims?.forEach((c) => allClaims.add(c));
      });

      const versions = Array.from(byVersion.values())
        .sort((a, b) => compareVersionsDesc(a.version, b.version))
        .map((version) => ({
          ...version,
          items: [...version.items].sort((a, b) => a.row.architecture.localeCompare(b.row.architecture)),
        }));

      return {
        id: manifest.name,
        manifestId: manifest.name,
        title: manifest.name,
        description: manifest.description ?? '',
        versions,
        totalItems: versions.reduce((acc, version) => acc + version.items.length, 0),
        architectures: Array.from(architectures).sort((a, b) => a.localeCompare(b)),
        tags: Array.from(manifestTags).sort((a, b) => a.localeCompare(b)),
        source,
        provider,
        taintedCount,
        revokedCount,
        inactiveCount,
        requiredRoles: Array.from(allRoles).sort(),
        requiredClaims: Array.from(allClaims).sort(),
        totalDownloads,
      } satisfies CatalogManifestItem;
    })
    .sort((a, b) => a.title.localeCompare(b.title));

export const filterCatalogManifests = (
  nodes: CatalogManifestItem[],
  query: string,
): CatalogManifestItem[] => {
  const token = normalizeToken(query);
  if (!token) return nodes;

  return nodes.reduce<CatalogManifestItem[]>((acc, node) => {
    const manifestMatch = [
      node.manifestId,
      node.title,
      node.description,
      node.architectures.join(' '),
      node.tags.join(' '),
    ].some((value) => normalizeToken(value).includes(token));

    const filteredVersions = node.versions.reduce<CatalogManifestVersion[]>((versionAcc, version) => {
      const versionMatch = [version.version, version.tags.join(' ')].some((value) =>
        normalizeToken(value).includes(token));

      const filteredItems = version.items.filter(({ row }) => {
        const haystack = [
          row.manifestId,
          row.name,
          row.version,
          row.architecture,
          row.tags,
          row.description,
          row.size,
          row.created,
          row.updated,
        ];
        return haystack.some((value) => normalizeToken(value).includes(token));
      });

      if (manifestMatch || versionMatch) {
        versionAcc.push(version);
      } else if (filteredItems.length > 0) {
        versionAcc.push({ ...version, items: filteredItems });
      }

      return versionAcc;
    }, []);

    if (manifestMatch || filteredVersions.length > 0) {
      acc.push({
        ...node,
        versions: manifestMatch ? node.versions : filteredVersions,
      });
    }

    return acc;
  }, []);
};

export const managerToForm = (manager: CatalogManager): CatalogManagerFormData => ({
  name: manager.name ?? '',
  url: manager.url ?? '',
  internal: Boolean(manager.internal),
  active: Boolean(manager.active),
  authentication_method: (manager.authentication_method as 'credentials' | 'api_key') || 'credentials',
  username: manager.username ?? '',
  password: manager.password ?? '',
  api_key: manager.api_key ?? '',
  global: Boolean(manager.global),
  required_claims: (manager.required_claims ?? []).map((c) => c.trim().toUpperCase()).filter(Boolean),
});

export const toManagerRequest = (
  form: CatalogManagerFormData,
): CatalogManagerCreateRequest | CatalogManagerUpdateRequest => ({
  name: form.name.trim(),
  url: form.url.trim(),
  internal: form.internal,
  active: form.active,
  authentication_method: form.authentication_method,
  username: form.authentication_method === 'credentials' ? form.username.trim() : '',
  password: form.authentication_method === 'credentials' ? form.password : '',
  api_key: form.authentication_method === 'api_key' ? form.api_key.trim() : '',
  global: form.global,
  required_claims: form.required_claims,
});

export const normalizeForDirtyCheck = (form: CatalogManagerFormData): string =>
  JSON.stringify({
    ...toManagerRequest(form),
    required_claims: [...form.required_claims].sort(),
  });
