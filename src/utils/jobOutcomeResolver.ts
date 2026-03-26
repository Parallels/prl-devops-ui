export interface JobOutcomeInput {
  message?: string;
  job_type?: string;
  job_operation?: string;
  result_record_id?: string;
  result_record_type?: string;
  result?: string;
}

export interface JobOutcomeHighlightTarget {
  pageId: string;
  menuItemId: string;
  itemId?: string;
  recordId?: string;
}

export interface JobOutcomeDeepLinkTarget {
  path: string;
  state: Record<string, unknown>;
  label: string;
}

export interface JobOutcomeResolution {
  highlight?: JobOutcomeHighlightTarget;
  deepLink?: JobOutcomeDeepLinkTarget;
}

interface ParsedResultIds {
  hostId?: string;
  vmId?: string;
  catalogId?: string;
  reverseProxyId?: string;
}

function parseResultIds(result?: string): ParsedResultIds {
  if (!result) return {};

  const parsed: ParsedResultIds = {};
  const keyValueRegex = /([a-z_]+)\s*=\s*([a-zA-Z0-9_-]+)/gi;

  for (const match of result.matchAll(keyValueRegex)) {
    const key = (match[1] ?? '').toLowerCase();
    const value = match[2];
    if (!value) continue;

    if (key === 'host_id' || key === 'orchestrator_host_id') {
      parsed.hostId = value;
    } else if (key === 'vm_id' || key === 'machine_id') {
      parsed.vmId = value;
    } else if (key === 'catalog_id') {
      parsed.catalogId = value;
    } else if (key === 'reverse_proxy_id' || key === 'reverse_proxy_host_id') {
      parsed.reverseProxyId = value;
    }
  }

  return parsed;
}

function resolveKind(input: JobOutcomeInput): 'host' | 'vm' | 'catalog' | 'reverse_proxy' | null {
  const recordType = (input.result_record_type ?? '').toLowerCase();
  const jobType = (input.job_type ?? '').toLowerCase();
  const operation = (input.job_operation ?? '').toLowerCase();

  if (recordType === 'orchestrator_host' || recordType === 'host' || recordType === 'machine' || recordType === 'machines' || (jobType === 'orchestrator' && operation === 'deploy')) {
    return 'host';
  }

  if (recordType === 'vm' || recordType === 'virtual_machine' || jobType === 'vm') {
    return 'vm';
  }

  if (recordType === 'catalog' || recordType === 'packer' || recordType === 'packer_template' || jobType === 'catalog') {
    return 'catalog';
  }

  if (recordType === 'reverse_proxy' || recordType === 'reverse_proxy_host' || jobType === 'reverse_proxy') {
    return 'reverse_proxy';
  }

  return null;
}

/**
 * Resolve a completed/failed job payload into highlight and deep-link targets.
 * This keeps navigation + highlight behavior centralized and consistent.
 */
export function resolveJobOutcome(input: JobOutcomeInput): JobOutcomeResolution {
  const kind = resolveKind(input);
  if (!kind) return {};

  const parsedIds = parseResultIds(input.result);

  if (kind === 'host') {
    const hostId = input.result_record_id ?? parsedIds.hostId;
    return {
      highlight: {
        pageId: 'hosts',
        menuItemId: 'hosts',
        itemId: hostId,
        recordId: hostId,
      },
      deepLink: hostId
        ? {
            path: '/hosts',
            state: { selectHostId: hostId },
            label: 'Host',
          }
        : undefined,
    };
  }

  if (kind === 'vm') {
    const vmId = input.result_record_id ?? parsedIds.vmId;
    const isOrchestrator = (input.job_type ?? '').toLowerCase() === 'orchestrator';
    return {
      highlight: {
        pageId: 'vms',
        menuItemId: 'vms',
        itemId: isOrchestrator ? 'orchestrator' : undefined,
        recordId: vmId,
      },
      deepLink: vmId
        ? {
            path: '/vms',
            state: { selectVmId: vmId },
            label: 'VM',
          }
        : undefined,
    };
  }

  if (kind === 'catalog') {
    const catalogId = input.result_record_id ?? parsedIds.catalogId;
    return {
      highlight: {
        pageId: 'catalogs',
        menuItemId: 'catalogs',
        recordId: catalogId,
      },
      deepLink: catalogId
        ? {
            path: '/catalogs',
            state: { selectCatalogId: catalogId },
            label: 'Catalog',
          }
        : undefined,
    };
  }

  const reverseProxyId = input.result_record_id ?? parsedIds.reverseProxyId;
  return {
    deepLink: reverseProxyId
      ? {
          path: '/reverse-proxy',
          state: { selectProxyId: reverseProxyId },
          label: 'Reverse Proxy',
        }
      : undefined,
  };
}
