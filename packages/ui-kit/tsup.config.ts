import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    loader: {
        '.svg': 'dataurl',
    },
    external: ['react', 'react-dom'],
});
