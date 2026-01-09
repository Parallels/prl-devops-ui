# Interfaces (Data Shapes)

This directory contains TypeScript Interface definitions. Use interfaces to define the shape of objects, especially Data Transfer Objects (DTOs) from the backend.

## vs Types
Use **Interfaces** for object shapes (things that can be extended / implemented).
Use **Types** for unions, aliases, or primitives.

## Example
\`\`\`ts
// src/interfaces/User.ts
export interface User {
    id: string;
    username: string;
    email: string;
    isActive: boolean;
    roles: string[];
}
\`\`\`