export const getPasswordKey = (hostname: string) => `secret::${hostname}::password`;
export const getApiKeyKey = (hostname: string) => `secret::${hostname}::apiKey`;
