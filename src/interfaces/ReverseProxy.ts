export interface ReverseProxyConfig {
    enabled: boolean;
    host?: string;
    port?: string;
}

export interface ReverseProxyHostTls {
    enabled?: boolean;
    cert?: string;
    key?: string;
}

export interface ReverseProxyHostCors {
    enabled?: boolean;
    allowed_origins?: string[];
    allowed_methods?: string[];
    allowed_headers?: string[];
    expose_headers?: string[];
    allow_credentials?: boolean;
    max_age?: number;
}

export interface ReverseProxyHostHttpRoute {
    id?: string;
    order: number;
    path?: string;
    target_vm_id?: string;
    target_host?: string;
    target_port?: string;
    schema?: string;
    pattern?: string;
    request_headers?: Record<string, string>;
    response_headers?: Record<string, string>;
    target_vm_details?: ReverseProxyHostVmDetails;
}

export interface ReverseProxyHostHttpRouteCreateRequest {
    path?: string;
    target_vm_id?: string;
    target_host?: string;
    target_port?: string;
    schema?: string;
    pattern?: string;
    request_headers?: Record<string, string>;
    response_headers?: Record<string, string>;
}

export interface ReverseProxyHostTcpRoute {
    id?: string;
    target_port?: string;
    target_host?: string;
    target_vm_id?: string;
    target_vm_details?: ReverseProxyHostVmDetails;
}

export interface ReverseProxyHostTcpRouteCreateRequest {
    target_port?: string;
    target_host?: string;
    target_vm_id?: string;
}

export interface ReverseProxyHost {
    id: string;
    host: string;
    name: string;
    port: string;
    tls?: ReverseProxyHostTls;
    cors?: ReverseProxyHostCors;
    http_routes?: ReverseProxyHostHttpRoute[];
    tcp_route?: ReverseProxyHostTcpRoute;
}

export interface ReverseProxyHostCreateRequest {
    name?: string;
    host: string;
    port: string;
    tls?: ReverseProxyHostTls;
    cors?: ReverseProxyHostCors;
    http_routes?: ReverseProxyHostHttpRoute[];
    tcp_route?: ReverseProxyHostTcpRoute;
}

export interface ReverseProxyHostUpdateRequest {
    name?: string;
    host: string;
    port: string;
    tls?: ReverseProxyHostTls;
    cors?: ReverseProxyHostCors;
}

export interface ReverseProxyHostVmDetails {
    name: string;
    state: string;
    os: string;
    uptime: string;
    guest_tools_state: string;
    guest_tools_version: string;
    host_external_ip_address: string;
}

export interface ReverseProxyResponse {
    reverse_proxy_config?: ReverseProxyConfig;
    reverse_proxy_hosts?: ReverseProxyHost[];
}
