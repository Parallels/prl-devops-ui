import type { ReverseProxyHost } from '@/interfaces/ReverseProxy';
import type { ReverseProxyHostHttpRoute, ReverseProxyHostTcpRoute } from '@/interfaces/ReverseProxy';
import type { VirtualMachine } from '@/interfaces/VirtualMachine';

interface AccessUrlResult {
  url: string;
  hasPublicAccess: boolean;
}

/**
 * Build the externally accessible URL for a reverse proxy route target.
 * - HTTP routes with VM target + public IP → schema://external_ip:port/path
 * - TCP routes with VM target + public IP → external_ip:port
 * - Fallback (local/empty) → localhost:port or localhost:port/path
 */
export function buildAccessUrl(
  proxyHost: ReverseProxyHost,
  /** Either an HTTP route or TCP route — at least one must be defined */
  route: ReverseProxyHostHttpRoute | ReverseProxyHostTcpRoute,
  /** Optional VM lookup data (used on Host detail page where route targets VMs) */
  availableVms?: VirtualMachine[],
): AccessUrlResult {
  // Try target_vm_details first, fall back to availableVms lookup
  const vmDetails = 'target_vm_id' in route ? route.target_vm_details : undefined;
  const routeVmId = 'target_vm_id' in route ? route.target_vm_id : undefined;
  
  let ip = vmDetails?.host_external_ip_address || '';
  if (!ip && routeVmId && availableVms) {
    const vm = availableVms.find((v) => v.ID === routeVmId);
    ip = vm?.host_external_ip_address || '';
  }
  const hasVmTarget = !!routeVmId;
  const isPublic = hasVmTarget && ip.length > 0;
  const endpoint = isPublic ? ip : 'localhost';

  if ('path' in route) {
    // HTTP route
    const httpRoute = route as ReverseProxyHostHttpRoute;
    const schema = httpRoute.schema === 'https' ? 'https' : 'http';
    const path = httpRoute.path || '/';
    return {
      url: `${schema}://${endpoint}:${proxyHost.port}${path}`,
      hasPublicAccess: isPublic,
    };
  }

  // TCP route — always use the proxy host listener port for access
  return {
    url: `${endpoint}:${proxyHost.port}`,
    hasPublicAccess: isPublic,
  };
}

/**
 * Build access URL for TCP route using the full proxy host context.
 * This version resolves availableVms from the reverse proxy host object.
 */
export function buildAccessUrlForReverseProxy(
  /** Full reverse proxy host data including route configuration */
  proxyOrchestratorIp: string,
  proxyPort: number,
  tcpTargetVmId?: string,
  availableVms?: VirtualMachine[],
): AccessUrlResult {
  let ip = '';
  
  if (tcpTargetVmId && availableVms) {
    const vm = availableVms.find((v) => v.ID === tcpTargetVmId);
    ip = vm?.host_external_ip_address || '';
  }

  const hasVmTarget = !!tcpTargetVmId;
  const isPublic = hasVmTarget && ip.length > 0;
  const endpoint = isPublic ? ip : proxyOrchestratorIp;

  return {
    url: `${endpoint}:${proxyPort}`,
    hasPublicAccess: isPublic,
  };
}
