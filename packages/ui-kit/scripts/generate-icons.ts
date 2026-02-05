
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.resolve(__dirname, '../src/assets/icons');
const OUTPUT_DIR = path.resolve(__dirname, '../src/icons');
const COMPONENT_OUTPUT_DIR = path.join(OUTPUT_DIR, 'components');

// Function to convert kebab-case or snake_case file names to PascalCase for component names
function toPascalCase(str: string): string {
    // Handle some specific cases or just standard conversion
    // Remove extension first
    const name = str.replace(/\.svg$/, '');

    return name
        .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
        .replace(/^./, (c) => c.toUpperCase())
        .replace(/ /g, '');
}

// Simple SVG cleaner/optimizer (very basic, relies on just wrapping what's inside)
// Realistically, we might want to strip 'width', 'height' attributes to let CSS control them,
// or set them to '1em'/'currentColor'.
function processSvgContent(content: string): string {
    // Remove XML declaration
    let clean = content.replace(/<\?xml.*?\?>/, '');
    // Remove DOCTYPE
    clean = clean.replace(/<!DOCTYPE.*?>/, '');

    // Remove style tags (causes JSX issues and global pollution)
    clean = clean.replace(/<style>.*?<\/style>/gs, '');

    // Extract SVG tag attributes and content
    const svgMatch = clean.match(/<svg([^>]*)>([\s\S]*?)<\/svg>/);

    if (!svgMatch) {
        // Fallback for when regex fails (simple SVGs) or return wrapped
        return clean;
    }

    let attributes = svgMatch[1];
    let body = svgMatch[2];

    // Remove width and height from attributes if present, we want to control via props/css
    attributes = attributes.replace(/width="[^"]*"/g, '');
    attributes = attributes.replace(/height="[^"]*"/g, '');
    attributes = attributes.replace(/xmlns:xlink="[^"]*"/g, '');
    attributes = attributes.replace(/xmlns:svg="[^"]*"/g, '');
    attributes = attributes.replace(/style="[^"]*"/g, '');
    attributes = attributes.replace(/xml:space="[^"]*"/g, '');
    attributes = attributes.replace(/class=/g, 'className=');

    // Ensure viewBox is preserved.

    // Replace standard HTML attributes with React naming if necessary
    // e.g. class -> className, xmlns:xlink -> xmlnsXlink
    // This simple regex replacement is risky for complex SVGs but fine for simple icons usually.
    // Ideally use SVGR but we are doing a lightweight script.

    body = body
        .replace(/xmlns:xlink="[^"]*"/g, '')
        .replace(/xmlns:svg="[^"]*"/g, '')
        .replace(/xmlns:svg/g, '') // Catch leftovers
        .replace(/xmlns:xlink/g, '') // Catch leftovers
        .replace(/style="[^"]*"/g, '') // Remove inline styles as they are not React compatible strings
        .replace(/class=/g, 'className=')
        .replace(/fill-rule=/g, 'fillRule=')
        .replace(/clip-rule=/g, 'clipRule=')
        .replace(/stroke-width=/g, 'strokeWidth=')
        .replace(/stroke-linecap=/g, 'strokeLinecap=')
        .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
        .replace(/stroke-miterlimit=/g, 'strokeMiterlimit=')
        .replace(/stroke-dasharray=/g, 'strokeDasharray=')
        .replace(/stroke-dashoffset=/g, 'strokeDashoffset=')
        .replace(/clip-path=/g, 'clipPath=')
        .replace(/text-anchor=/g, 'textAnchor=')
        .replace(/font-family=/g, 'fontFamily=')
        .replace(/font-size=/g, 'fontSize=')
        .replace(/font-weight=/g, 'fontWeight=')
        .replace(/letter-spacing=/g, 'letterSpacing=')
        .replace(/dominant-baseline=/g, 'dominantBaseline=')
        .replace(/stop-color=/g, 'stopColor=')
        .replace(/stop-opacity=/g, 'stopOpacity=')
        .replace(/pointer-events=/g, 'pointerEvents=')
        .replace(/xml:space="[^"]*"/g, '') // Remove xml:space in body
        .replace(/xml:space=/g, 'xmlSpace=');

    // Reconstruct
    // We define standard props. 
    // We will spread {...props} on the svg
    return `<svg ${attributes} {...props} ref={ref}>${body}</svg>`;
}

async function generate() {
    if (!fs.existsSync(ICONS_DIR)) {
        console.error(`Icons directory not found: ${ICONS_DIR}`);
        process.exit(1);
    }

    // Ensure output dirs exist
    if (fs.existsSync(OUTPUT_DIR)) {
        fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(COMPONENT_OUTPUT_DIR, { recursive: true });

    const files = fs.readdirSync(ICONS_DIR).filter((f) => f.endsWith('.svg'));

    const iconEntries: { name: string; componentName: string; fileName: string }[] = [];

    console.log(`Found ${files.length} SVG files.`);

    for (const file of files) {
        const originalName = file.replace(/\.svg$/, '');
        const componentName = toPascalCase(originalName);
        const componentFileName = `${componentName}.tsx`;

        const svgContent = fs.readFileSync(path.join(ICONS_DIR, file), 'utf-8');
        const jsxContent = processSvgContent(svgContent);

        const fileContent = `
import { forwardRef, type SVGProps } from 'react';

export const ${componentName} = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => (
  ${jsxContent}
));

${componentName}.displayName = '${componentName}';
`;

        fs.writeFileSync(path.join(COMPONENT_OUTPUT_DIR, componentFileName), fileContent.trim());
        iconEntries.push({ name: originalName, componentName, fileName: componentName });
    }

    // Generate index.ts exporting all components
    const indexContent = iconEntries
        .map((entry) => `export * from './components/${entry.fileName}';`)
        .join('\n');

    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent);

    // Generate Registry (Map)
    // We want a map of "IconNameString" -> Component
    // And we want to export the IconName type.

    const imports = iconEntries.map(e => `import { ${e.componentName} } from './components/${e.fileName}';`).join('\n');
    const mapEntries = iconEntries.map(e => `    "${e.name}": ${e.componentName},`).join('\n');

    const typeDefinitions = `export type IconName = \n${iconEntries.map(e => `    | "${e.name}"`).join('\n')};`;

    const registryContent = `
import React from 'react';
${imports}

${typeDefinitions}

export const iconRegistry: Record<IconName, React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>> = {
${mapEntries}
};
`;

    fs.writeFileSync(path.join(OUTPUT_DIR, 'registry.ts'), registryContent.trim());

    console.log(`Successfully generated ${files.length} icon components.`);
}

generate().catch(console.error);
