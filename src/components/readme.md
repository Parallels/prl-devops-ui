# Components ("Smart" Components)

This directory contains **Container** or **Smart** components. These components are responsible for how things work.

## Characteristics
- **Stateful**: They often manage local state or interact with global state (Context/Redux).
- **Data Fetching**: They are responsible for fetching data using Hooks or Services.
- **Composition**: They compose "Dumb" components (from `src/controls`) to build complex UI features.
- **Routing**: They are often the targets of Route definitions (Pages).

## Structure
Each component should be in its own folder if it has related styles or sub-components.

\`\`\`
src/components/
  Dashboard/
    Dashboard.tsx
    Dashboard.module.css
  UserProfile/
    UserProfile.tsx
\`\`\`

## Example
\`\`\`tsx
// src/components/Dashboard.tsx
import { useState, useEffect } from 'react';
import { useUser } from '../hooks/useUser'; // Using a Hook
import { Button } from '../controls/Button'; // Using a Control

export const Dashboard = () => {
    const { user, isLoading } = useUser();

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            <h1>Welcome, {user.name}</h1>
            <Button onClick={() => alert('Clicked')}>Action</Button>
        </div>
    );
};
\`\`\`