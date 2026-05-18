# Parallels DevOps UI

A hybrid desktop and web application for managing Parallels DevOps products. Built with React 19 + TypeScript + Vite, with optional Tauri 2.x integration for cross-platform desktop builds.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Testing](#testing)
- [Building](#building)
- [Docker](#docker)
- [Kubernetes (Helm)](#kubernetes-helm)
- [Workspace Packages](#workspace-packages)
- [VS Code Setup](#vs-code-setup)

---

## Prerequisites

### Required (all platforms)

| Tool    | Version           | Notes                                 |
| ------- | ----------------- | ------------------------------------- |
| Node.js | v24+              | Use nvm or fnm for version management |
| npm     | bundled with Node | Workspaces support required           |
| Git     | any               |                                       |

### Required for desktop (Tauri) builds

| Tool          | Notes                                    |
| ------------- | ---------------------------------------- |
| Rust (stable) | Install via [rustup](https://rustup.rs/) |
| Tauri CLI     | Installed automatically via npm          |

#### Platform-specific Tauri requirements

**macOS**

```bash
xcode-select --install
```

**Linux (Debian/Ubuntu)**

```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev \
  librsvg2-dev patchelf libssl-dev pkg-config gcc g++
```

**Windows**

- Install [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- Install WebView2 (bundled on Windows 11; download for Windows 10)

---

## Project Structure

```
prl-devops-ui/
├── src/                        # Main React application
│   ├── components/             # Shared UI components
│   ├── pages/                  # Page-level components
│   ├── contexts/               # React context providers
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # API/HTTP services
│   ├── interfaces/             # TypeScript interfaces
│   ├── utils/                  # Utility functions
│   ├── router/                 # React Router configuration
│   ├── layout/                 # Layout components
│   ├── constants/              # App-wide constants
│   ├── styles/                 # Global styles
│   ├── test/                   # Test setup
│   ├── App.tsx
│   └── main.tsx
├── packages/
│   └── ui-kit/                 # @prl/ui-kit — shared component library
│       └── src/
├── src-tauri/                  # Tauri desktop backend (Rust)
│   ├── src/
│   ├── Cargo.toml
│   └── tauri.conf.json
├── docker/                     # Docker + nginx config
├── helm/                       # Kubernetes Helm chart
├── public/                     # Static assets
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.js
├── tsconfig.json
└── Makefile
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd prl-devops-ui
```

### 2. Install dependencies

```bash
# Recommended — installs npm workspaces and fetches Rust deps
make install

# Alternatively
npm install
```

> The npm workspace setup installs dependencies for both the root app and `packages/ui-kit` in a single command.

### 3. Configure environment variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

See [Environment Variables](#environment-variables) for the full list.

### 4. Start the development server

**Web only (fastest):**

```bash
npm run dev
# App runs at http://localhost:1421
```

**Tauri desktop app:**

```bash
make dev
# or: npm run tauri dev
```

---

## Environment Variables

Create a `.env` file in the project root. All variables are prefixed with `VITE_` to be exposed to the frontend by Vite.

### Required

| Variable               | Description            | Example                 |
| ---------------------- | ---------------------- | ----------------------- |
| `VITE_DEVOPS_API_URL`  | Backend API base URL   | `http://localhost:5680` |
| `VITE_DEVOPS_USERNAME` | Default API username   | `admin`                 |
| `VITE_DEVOPS_PASSWORD` | Default API password   | `changeme`              |
| `VITE_DEVOPS_EMAIL`    | Default API user email | `admin@example.com`     |

### Optional

| Variable                | Description                                  | Default   |
| ----------------------- | -------------------------------------------- | --------- |
| `VITE_DEV_PORT`         | Dev server port                              | `1421`    |
| `VITE_DEFAULT_HOST_URL` | Locks the host URL field in the UI           | _(unset)_ |
| `VITE_DEFAULT_USERNAME` | Pre-fills username for locked deployment     | _(unset)_ |
| `VITE_DEFAULT_PASSWORD` | Pre-fills password for locked deployment     | _(unset)_ |
| `VITE_IS_DEVELOPMENT`   | Enables development-mode features            | _(unset)_ |
| `VITE_CHANNEL`          | Release channel (`stable`, `beta`, `canary`) | _(unset)_ |

> **Note:** The dev server proxies all `/api` requests to `VITE_DEVOPS_API_URL` (default: `http://localhost:5680`). You need the Parallels DevOps backend running locally or pointed at via that variable.

### Docker-only

| Variable  | Description         | Values                                        |
| --------- | ------------------- | --------------------------------------------- |
| `APP_ENV` | Runtime environment | `production`, `canary`, `beta`, `development` |

---

## Development

### Web dev server

```bash
npm run dev
```

Starts Vite on port `1421` with HMR and API proxy.

### Tauri desktop dev

```bash
make dev
# or
npm run tauri dev
```

Starts both the Vite dev server and Tauri desktop shell with hot reload.

### Type checking

```bash
make lint
# or
npm run lint
```

Runs `tsc --noEmit` — type errors only, no output files.

---

## Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
make test-coverage
# or
npm run test -- --coverage
```

Tests use **Vitest** with a `jsdom` environment. Coverage reports are generated as `lcov` and `html` in `coverage/`.

---

## Building

### Web only

```bash
make build-web
# or
npm run build:web
```

Output goes to `dist/`.

### Tauri desktop — current OS

```bash
make build
# or
npm run tauri build
```

### Tauri desktop — specific platforms

```bash
make build-macos        # macOS Universal (arm64 + x86_64)
make build-windows      # Windows x86_64
make build-linux        # Linux x86_64
make build-linux-arm64  # Linux ARM64
make build-windows-arm64
make build-all          # All platforms
```

> Cross-compilation requires additional Rust targets. The Makefile handles target installation automatically.

### Mobile (experimental)

```bash
make ios-init && make ios        # Initialize and run iOS
make android-init && make android  # Initialize and run Android
make build-ios                   # Build iOS
make build-android               # Build Android
```

---

## Docker

The Dockerfile uses a multi-stage build:

1. **Build** — `node:25-alpine`, runs `npm run build:web`
2. **Serve** — `nginx:alpine`, serves the SPA with runtime env injection

### Build and run

```bash
docker build -t prl-devops-ui:latest .

docker run -p 80:80 \
  -e APP_ENV=production \
  prl-devops-ui:latest
```

The `docker/entrypoint.sh` script generates an `env-config.js` at container start based on `APP_ENV`, allowing environment configuration without rebuilding the image.

---

## Kubernetes (Helm)

A Helm chart is included in `helm/prl-devops-ui/`.

```bash
helm install prl-devops-ui ./helm/prl-devops-ui \
  --set image.repository=your-registry/prl-devops-ui \
  --set image.tag=latest
```

---

## Workspace Packages

This is an npm workspaces monorepo. `packages/ui-kit` (`@prl/ui-kit`) is the shared component library used by the main app.

### Working with `@prl/ui-kit`

```bash
# Build the library
npm run build -w packages/ui-kit

# Watch mode
npm run dev -w packages/ui-kit

# Type check
npm run lint -w packages/ui-kit
```

### Importing in the app

```typescript
import { Button, Card } from "@prl/ui-kit";
```

The root `tsconfig.json` and Vite config resolve `@prl/ui-kit` directly from `packages/ui-kit/src` via path aliases — no build step needed during development.

---

## VS Code Setup

Open the workspace root and VS Code will prompt you to install recommended extensions (`.vscode/extensions.json`).

A debug launch configuration (`.vscode/launch.json`) is included for Tauri desktop debugging.

---

## Available Make Targets

```
make install           Install all dependencies
make dev               Start Tauri desktop dev server
make build-web         Build web app only
make build             Build desktop app for current OS
make build-macos       Build for macOS Universal
make build-windows     Build for Windows x86_64
make build-linux       Build for Linux x86_64
make build-all         Build for all platforms
make test              Run tests
make test-coverage     Run tests with coverage
make lint              Type check
make clean             Remove build artifacts
make check             Check Tauri environment
```
