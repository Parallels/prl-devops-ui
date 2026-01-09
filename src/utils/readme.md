# Utilities (Pure Functions)

This directory contains standalone utility functions. These should be pure functions (deterministic: same input = same output) and have no side effects if possible.

## Characteristics
- **Stateless**: No internal state.
- **Independent**: No dependency on React or hooks.
- **Testable**: Easily unit-tested.

## Examples
- Date formatting
- String manipulation
- Validation logic
- Math helpers

## Example
\`\`\`ts
// src/utils/dateUtils.ts
export const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US').format(date);
};
\`\`\`