import { CatalogPackContentItem } from "./Catalog";

/**
 * Catalog cache manifest item
 */
export interface CatalogCacheManifestItem {
    name: string;
    id: string;
    catalog_id: string;
    description: string;
    architecture: string;
    version: string;
    type: string;
    tags: string[];
    size: number;
    path: string;
    pack_file: string;
    metadata_filename: string;
    created_at: string;
    updated_at: string;
    required_roles: string[];
    pack_contents: CatalogPackContentItem[];
    pack_size: number;
    cache_date: string;
    cache_local_path: string;
    cache_metadata_name: string;
    cache_file_name: string;
    cache_type: string;
    cache_size: number;
    [key: string]: unknown;
}

/**
 * Catalog cache response
 */
export interface CatalogCacheResponse {
    total_size?: number;
    manifests?: CatalogCacheManifestItem[];
    cache_config?: CacheConfig;
    [key: string]: unknown;
}

export interface CacheConfig {
    enabled: boolean;
    folder: string;
    keep_free_disk_space: number;
    max_size: number;
}
