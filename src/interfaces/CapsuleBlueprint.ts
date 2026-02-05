export interface CapsuleBlueprint {
  id: string;
  type: string;
  active: boolean;
  icon_url: string;
  icon_data: string;
  cover_image_url: string;
  cover_image_data: string;
  description: string;
  auto_generated_creds: boolean;
  name: string;
  slug: string;
  version: string;
  featured: boolean;
  small_description: string;
  subdomain: string;
  enable_https: boolean;
  enable_desktop_app: boolean;
  stars: number;
  connection_string: string;
  categories: string[];
  versions: string[];
  copyright: string;
  global_parameters: CapsuleBlueprintParameter[];
  services: CapsuleBlueprintService[];
  volumes: CapsuleBlueprintVolume[];
  networks: CapsuleBlueprintNetwork[];
  last_deployed_at: Date;
  last_downloaded_at: Date;
  download_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CapsuleBlueprintParameter {
  type: CapsuleBlueprintParameterType;
  service_name?: string;
  is_read_only: boolean;
  name: string;
  hidden: boolean;
  key: string;
  default_value: string;
  value_type: CapsuleBlueprintValueType;
  hint: string;
  help: string;
  is_required: boolean;
  is_secret: boolean;
  options?: Record<string, string> | Array<string | { key?: string; value?: string }>;
  depends_on: CapsuleBlueprintParameterDependency[];
  auto_generated_username: boolean;
  auto_generated_password: boolean;
}
export interface CapsuleBlueprintParameterDependency {
  id: string;
  package_id?: string;
  parameter_id?: string;
  operator?: string;
  condition: string;
  field_name: string;
  field_value: string;
}

export const CapsuleBlueprintParameterType = {
  Env: "env",
  Var: "var",
} as const;
export type CapsuleBlueprintParameterType = (typeof CapsuleBlueprintParameterType)[keyof typeof CapsuleBlueprintParameterType];

export const CapsuleBlueprintValueType = {
  Int: "int",
  String: "string",
  Array: "array",
  Boolean: "boolean",
  Select: "select",
} as const;
export type CapsuleBlueprintValueType = (typeof CapsuleBlueprintValueType)[keyof typeof CapsuleBlueprintValueType];

export interface CapsuleBlueprintNetwork {
  name: string;
}
export interface CapsuleBlueprintVolume {
  name: string;
}

export interface CapsuleBlueprintService {
  id: string;
  blueprint_id: string;
  service_name: string;
  slug: string;
  image: string;
  tag: string;
  command?: string[];
  restart_policy: string;
  parameters: CapsuleBlueprintParameter[];
  volumes: CapsuleBlueprintServiceVolume[];
  port_mappings: CapsuleBlueprintServicePortMapping[];
  networks: string[];
  health_check: CapsuleBlueprintServiceHealthCheck;
  depends_on?: string[];
  created_at: Date;
  updated_at: Date;
  platform: string;
}

export interface CapsuleBlueprintServiceHealthCheck {
  interval: string;
  timeout: string;
  start_period: string;
  test?: string[];
  retries?: number;
}

export interface CapsuleBlueprintServicePortMapping {
  port: string;
  map_to: string;
}

export interface CapsuleBlueprintServiceVolume {
  type: string;
  source: string;
  target: string;
}

export interface CapsuleBlueprintBundleIdResponse {
  bundle_id: string;
}

export interface MyCapsuleReview {
  exists: boolean;
  review?: CapsuleReview;
}

export interface SubmitCapsuleReviewResponse {
  success: boolean;
  review: CapsuleReview;
}

export interface SubmitCapsuleReviewRequest {
  id: string;
  stars: number;
  review: string;
}

export interface CapsuleReview {
  id: string;
  stars: number;
  review: string;
  created_at: Date;
  updated_at: Date;
  user: CapsuleReviewUser;
}

export interface CapsuleReviewUser {
  id: string;
  username: string;
  name: string;
}

export interface PaginatedCapsuleReviews {
  reviews: CapsuleReview[];
  total: number;
  page: number;
  limit: number;
  average_stars: number;
}
