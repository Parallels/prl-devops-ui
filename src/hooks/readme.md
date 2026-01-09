# Hooks (Logic Reuse)

This directory contains custom React Hooks. Hooks allow you to reuse stateful logic between different components.

## When to use
- If you find yourself copying the same \`useEffect\` or \`useState\` logic across components, extract it here.
- Composition of other hooks (e.g., combining \`useState\` and \`useEffect\`).

## Connections
- **Contexts**: Hooks often consume Contexts (e.g., \`useAuth\` wraps \`AuthContext\`).
- **Services**: Hooks often call Services to fetch data and manage loading/error states.

## Example
\`\`\`tsx
// src/hooks/useWindowSize.ts
import { useState, useEffect } from 'react';

export const useWindowSize = () => {
    const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return size;
};
\`\`\`
