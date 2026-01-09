# Controls ("Dumb" Components)

This directory contains **Presentational** or **Dumb** components. These components are responsible for how things look.

## Characteristics
- **Stateless**: They rarely have their own state, unless it's strictly for UI (e.g., hover state, open/close menu).
- **Props-driven**: They receive data and callbacks exclusively via props.
- **Reusable**: They are highly generic and can be used in many different contexts.
- **No Dependencies**: They should NOT depend on global state, contexts, or services.

## Examples
- Buttons
- text Inputs
- Modals
- Cards
- Tables

## Structure
\`\`\`
src/controls/
  Button/
    Button.tsx
    Button.css
  Card/
    Card.tsx
\`\`\`

## Example
\`\`\`tsx
// src/controls/Button.tsx
import React from 'react';
import './Button.css';

interface ButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ onClick, children, variant = 'primary' }) => (
    <button className={\`btn btn-\${variant}\`} onClick={onClick}>
        {children}
    </button>
);
\`\`\`