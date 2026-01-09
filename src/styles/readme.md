# Styles

This directory contains global styles, variables, mixins, or theme definitions.

## Contents
- **Global Reset/Normalize**: Basic CSS reset.
- **Variables**: CSS Variables (`:root`) for colors, spacing, fonts.
- **Typography**: Global font definitions.
- **Utility Classes**: Common reusable classes (if not using Tailwind).

## Note on Component Styles
Specific styles for a single component (e.g., `Button.css`) should co-locate with the component in `src/controls/Button/` or `src/components/MyComponent/`. This folder is for **System-wide** styles.

## Example
\`\`\`css
/* src/styles/variables.css */
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --font-main: 'Inter', sans-serif;
}
\`\`\`