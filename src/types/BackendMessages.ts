export enum BackendMessageType {
    GLOBAL = 'global',
    PDFM = 'pdfm',
}

export type GlobalMessage = {
    client_id: string;
    subscriptions: string[];
}