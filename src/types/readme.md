# Types (Aliases & Unions)

This directory contains TypeScript Type aliases. Use types for unions, mapped types, or complex utility types.

## vs Interfaces
Use **Types** when you need:
- Union types (\`type Status = 'loading' | 'success';\`)
- Tuple types
- Mapped types

## Example
\`\`\`ts
// src/types/Status.ts
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export type UserRole = 'admin' | 'user' | 'guest';

// Union Example
export type Result<T> = 
  | { success: true; data: T } 
  | { success: false; error: string };
\`\`\`