# Constants

This directory contains globally constant values. Avoid "Magic Numbers" or hardcoded strings in your components; place them here instead.

## What goes here?
- API Endpoint URLs (if not dynamic)
- Configuration objects
- Regex patterns
- Enums (if they are treated as values)

## Example
\`\`\`ts
// src/constants/config.ts
export const API_BASE_URL = 'https://api.example.com/v1';
export const DEFAULT_TIMEOUT = 5000;
export const MAX_RETRY_ATTEMPTS = 3;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard'
};
\`\`\`