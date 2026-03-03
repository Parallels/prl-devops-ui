
/**
 * Catalog Manager Create Request
 */
export interface CatalogManagerCreateRequest {
    name: string;
    url: string;
    internal: boolean;
    active: boolean;
    authentication_method: string;
    username: string;
    password: string;
    api_key: string;
    global: boolean;
    required_claims: string[];
}

/**
 * Catalog Manager Update Request
 */
export interface CatalogManagerUpdateRequest {
    name: string;
    url: string;
    internal: boolean;
    active: boolean;
    authentication_method: string;
    username: string;
    password: string;
    api_key: string;
    global: boolean;
    required_claims: string[];
}

/**
 * Catalog Manager
 */
export interface CatalogManager {
    id: string;
    name: string;
    url: string;
    internal: boolean;
    active: boolean;
    authentication_method: string;
    username: string;
    password: string;
    api_key: string;
    global: boolean;
    required_claims?: string[];
    owner_id: string;
    created_at: string;
    updated_at: string;
}
