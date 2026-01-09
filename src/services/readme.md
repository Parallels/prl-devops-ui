# Services (External Communication)

This directory contains pure TypeScript classes or objects capable of communicating with the outside world. In a Tauri app, this is primarily where we interact with the Rust backend.

## Purpose
- **Abstraction**: Hide the specific implementation details of API calls or Tauri commands.
- **Centralization**: Keep all API endpoints/commands in one place.
- **Typing**: Ensure strict typing of request/response bodies.

## Tauri Invocation
Do **NOT** call \`invoke\` directly in your components. Always wrap it in a service method.

## Example
\`\`\`ts
// src/services/UserService.ts
import { invoke } from '@tauri-apps/api/core';
import { User } from '../interfaces/User';

export class UserService {
    static async getUser(id: string): Promise<User> {
        return await invoke<User>('get_user', { id });
    }

    static async createUser(user: Partial<User>): Promise<void> {
        await invoke('create_user', { user });
    }
}
\`\`\`
