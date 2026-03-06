import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import type { IncomingMessage } from "http";

const host = process.env.TAURI_DEV_HOST;

import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    react(),
    tsconfigPaths(),
    tailwindcss(),
    // Prevent macOS .DS_Store files from being processed as JS modules
    {
      name: 'ignore-ds-store',
      load(id: string) {
        if (id.endsWith('.DS_Store')) return '';
      },
    },
  ],
  resolve: {
    alias: {
      "@prl/ui-kit": path.resolve(__dirname, "packages/ui-kit/src"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1421,
    strictPort: true,
    host: host || "0.0.0.0",
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri` and macOS metadata files
      ignored: ["**/src-tauri/**", /\.DS_Store$/],
    },
    allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', 'devops-ui.carloslapao.com', 'devops-ui.local-build.co'],
    proxy: {
      "/api": {
        target: process.env.VITE_DEVOPS_API_URL || "http://localhost:5680" || "http://devops-local.local-build.co:5475",
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy) => {
          // The browser sends Origin: http://localhost:1421 on the WS upgrade.
          // Most Go WebSocket upgraders reject origins that don't match the host.
          // Rewrite Origin to the target server so the upgrader accepts it.
          proxy.on("proxyReqWs", (proxyReq: IncomingMessage & { setHeader: (k: string, v: string) => void }) => {
            const apiUrl = process.env.VITE_DEVOPS_API_URL || "http://localhost:5680";
            proxyReq.setHeader("Origin", apiUrl);
          });
        },
      },
    },
  },
}));
