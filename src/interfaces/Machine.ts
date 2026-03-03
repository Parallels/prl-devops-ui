/*
 * Machine state response
 */
export interface MachineStateResponse {
    id: string;
    operation: string;
    status: string;
}

export interface CreateMachineFromCatalogManifest {
    catalog_id: string;
    version?: string;
    catalog_manager_id?: string;
    path?: string;
    specs?: {
        cpu?: string;
        memory?: string;
        [key: string]: string | undefined;
    };
}

export interface CreateMachineAsyncRequest {
    name: string;
    startOnCreate: boolean;
    architecture: string;
    owner: string;
    catalog_manifest: CreateMachineFromCatalogManifest;
}
