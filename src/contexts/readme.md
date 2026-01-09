# Contexts (Global State)

This directory contains React Context definitions and their providers. Use Contexts to share state across the component tree without prop drilling.

## Usage
- **AuthContext**: Storing user session data.
- **ThemeContext**: toggling dark/light mode.
- **NotificationContext**: Managing global toast notifications.

## Best Practices
- **Encapsulation**: Create a custom Provider component that manages the internal state.
- **Custom Hooks**: Export a custom hook (e.g., \`useAuth\`) instead of exporting the Context object directly.

## Structure
\`\`\`
src/contexts/
  AuthContext/
    AuthContext.tsx
    useAuth.ts
\`\`\`

## Example
\`\`\`tsx
// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('light');
    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
\`\`\`