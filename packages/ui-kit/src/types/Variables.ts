export type SmartVariableType = "var" | "env";
export type SmartVariableSource = "global" | "system" | "service";

export interface SmartVariable {
  fullToken: string;
  type: SmartVariableType;
  source: SmartVariableSource;
  name: string;
  description?: string;
  defaultValue?: string;
}

export const SYSTEM_VARIABLES: SmartVariable[] = [
  {
    fullToken: "{{ var::system::capsule_id }}",
    type: "var",
    source: "system",
    name: "capsule_id",
    description: "The unique identifier of the capsule instance.",
  },
  {
    fullToken: "{{ var::system::capsule_name }}",
    type: "var",
    source: "system",
    name: "capsule_name",
    description: "The name of the capsule.",
  },
  {
    fullToken: "{{ var::system::host_ip }}",
    type: "var",
    source: "system",
    name: "host_ip",
    description: "The IP address of the host machine.",
  },
  {
    fullToken: "{{ var::system::app_url }}",
    type: "var",
    source: "system",
    name: "app_url",
    description: "The main URL for the application.",
  },
  // Runtime Variables
  {
    fullToken: "{{ var::system::name }}",
    type: "var",
    source: "system",
    name: "name",
    description: "Capsule Name (Runtime)",
  },
  {
    fullToken: "{{ var::system::reverse_proxy_host }}",
    type: "var",
    source: "system",
    name: "reverse_proxy_host",
    description: "IP of the caddy reverse host (Runtime)",
  },
  {
    fullToken: "{{ var::system::ip_address }}",
    type: "var",
    source: "system",
    name: "ip_address",
    description: "IP of the VM (Runtime)",
  },
  {
    fullToken: "{{ var::system::host_gateway_ip }}",
    type: "var",
    source: "system",
    name: "host_gateway_ip",
    description: "IP of the docker gateway (Runtime)",
  },
  // Derived Variables
  {
    fullToken: "{{ var::system::sub_domain }}",
    type: "var",
    source: "system",
    name: "sub_domain",
    description: "The subdomain value (derived from slug)",
  },
  {
    fullToken: "{{ var::system::domain }}",
    type: "var",
    source: "system",
    name: "domain",
    description: "The domain suffix (parallels.private)",
  },
  {
    fullToken: "{{ var::system::host_url }}",
    type: "var",
    source: "system",
    name: "host_url",
    description: "The full URL (derived from sub_domain and domain)",
  },
];
