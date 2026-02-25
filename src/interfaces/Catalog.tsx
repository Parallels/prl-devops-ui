/**
 * Catalog Pack Content Item
 */

export interface CatalogPackContentItem {
    name: string;
    path: string;
    created_at: string;
    updated_at: string;
    hash?: string;
    [key: string]: unknown;
}