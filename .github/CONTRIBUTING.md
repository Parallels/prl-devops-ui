# Contributing to Parallels DevOps UI

Thank you for contributing! This document covers everything you need to get set up and submit a pull request.

---

## Table of Contents

- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Development workflow](#development-workflow)
- [Branching strategy](#branching-strategy)
- [Commit messages](#commit-messages)
- [Pull requests](#pull-requests)
- [Release process](#release-process)
- [Tests](#tests)
- [CI pipeline](#ci-pipeline)

---

## Project structure

```
prl-devops-ui/
├── src/                        # Main React application
│   ├── components/             # Shared UI components
│   ├── contexts/               # React contexts (session, config, theme…)
│   ├── pages/                  # Page-level components
│   ├── services/               # API and WebSocket service layer
│   └── test/                   # Vitest setup and shared test utilities
├── packages/
│   └── ui-kit/                 # @prl/ui-kit — reusable component library
│       └── src/
│           ├── components/
│           └── contexts/
├── helm/prl-devops-ui/         # Helm chart for Kubernetes deployment
├── docker/                     # Dockerfile support files (nginx, entrypoint)
├── src-tauri/                  # Tauri desktop app (Rust) — separate build
└── .github/                    # Workflows, templates, Dependabot config
```

The project is an **npm workspace monorepo**. The `ui-kit` package is consumed by the main app via the path alias `@prl/ui-kit`.

---

## Prerequisites

| Tool | Minimum version | Notes |
|------|----------------|-------|
| Node.js | 24 | Match the CI version |
| npm | 10 | Comes with Node 24 |
| Docker | 24 | Only needed for container builds |
| Rust + Tauri CLI | latest stable | Only needed for desktop builds |

---

## Getting started

```sh
# Install all workspace dependencies (root + ui-kit)
npm install

# Start the web dev server (browser only, no Tauri)
npm run dev

# Start the Tauri desktop app
npm run tauri dev
```

The dev server runs at `http://localhost:1421` and proxies `/api` requests to the backend.
Set `VITE_DEVOPS_API_URL` to point to a running Parallels DevOps Service instance:

```sh
VITE_DEVOPS_API_URL=http://my-server:5680 npm run dev
```

---

## Development workflow

### Web app changes

```sh
npm run lint          # TypeScript type-check
npm run test          # Run Vitest unit tests
npm run build:web     # Production Vite build (no type-check)
npm run build         # Full build: tsc + vite (matches CI)
```

### ui-kit changes

```sh
npm run build -w packages/ui-kit    # Build the component library
npm run lint  -w packages/ui-kit    # Type-check ui-kit
```

The main app resolves `@prl/ui-kit` directly to `packages/ui-kit/src` via a Vite alias, so you can iterate on ui-kit components without rebuilding the package each time. The `tsup` build step is only required for the CI artifact and for consumers outside this monorepo.

### Docker

```sh
docker compose up                   # Build and run (production, port 5780)
APP_ENV=development docker compose up
docker compose --profile dev up     # Run dev profile (port 8081)
```

---

## Branching strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code. Bug fixes and small PRs merge straight into it. |
| `dev` | Long-lived integration branch for big features. `main` is merged back into `dev` automatically after every push to `main` (`sync-main-to-dev.yml`). Never rebased or force-pushed. |
| `feature/<short-description>` | New features |
| `fix/<short-description>` | Bug fixes |
| `chore/<short-description>` | Tooling, CI, dependency updates |
| `docs/<short-description>` | Documentation only |

Branch names should be lowercase and use hyphens, e.g. `feature/catalog-async-upload`.

### Working with `dev`

- **Big features** branch off `dev` and open PRs against `dev`.
- **Bug fixes and small work** branch off `main` and target `main` directly.
- When dev work is ready, a human opens the long-running **`dev` → `main` integration PR**. Its `## Changelog` section is filled and regenerated automatically by `update-dev-integration-pr.yml` from every PR merged into `dev` — never hand-edit that section, and never edit `CHANGELOG.md` on `dev` (it only changes on `main`, via release PRs).
- If the automatic `main` → `dev` sync reports conflicts, resolve them with `git checkout dev && git merge main`, push, and re-run the workflow.

---

## Commit messages

Follow the **Conventional Commits** format:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer: Fixes #123]
```

**Types:** `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `chore`, `ci`

**Scope** (optional): `ui-kit`, `catalog`, `auth`, `ws`, `helm`, `docker`, `ci`

Examples:
```
feat(catalog): auto-fill catalog ID from VM name on upload
fix(ws): flush message queue after reconnect
chore(deps): bump vitest to 4.1.0
```

---

## Pull requests

1. Branch off `main` — or `dev` for big-feature work — using the naming convention above
2. Keep PRs focused — one concern per PR
3. Fill in the PR template completely, especially the **Changelog** section (automation reads it)
4. Ensure all CI checks pass before requesting review
5. At least one approval from a CODEOWNER is required to merge

---

## Release process

One process, identical to the Parallels DevOps Service repo:

1. **Every merged PR contributes changelog bullets.** The `## Changelog` section
   of each PR body (`- feat: …`, `- fix: …`) is the single source for
   `CHANGELOG.md` and the GitHub Release notes. Dependabot bumps are added
   automatically from the PR titles.
2. **Cut a release:** run **Actions → Create Release PR** and pick
   `patch` / `minor` / `major`. It bumps `VERSION`, `package.json`, the Helm
   chart and the Tauri app versions, generates the `CHANGELOG.md` section from
   the merged PR bodies, and opens a release PR labelled `release-request`.
3. **Merge the release PR into `main`.** That push automatically creates a
   **draft GitHub Release** (`publish_release.yml`) whose notes come from the
   committed `CHANGELOG.md` section.
4. **Click "Publish release" on the draft — that is the deploy button.**
   Publishing runs `release.yml`: desktop builds (Linux/macOS/Windows, amd64 +
   ARM64), Docker image, `latest.json` for the updater, asset upload, then the
   AKS production deploy. A human publishing the draft is the only gate.
5. **Beta and Canary stay manual:** dispatch **Release — Beta** or
   **Release — Canary** from the Actions tab for pre-release testing.

The manual "Release — Production" dispatch is an emergency re-run path only.

---

## Tests

Tests live alongside source files as `*.test.ts` / `*.test.tsx`.

```sh
npm run test                  # Run all tests once
npm run test -- --watch       # Watch mode
npm run test -- --coverage    # With coverage report (written to coverage/)
```

- Use **Vitest** and **React Testing Library** for component tests
- `jsdom` is the default test environment
- Global `describe`/`it`/`expect` are available without imports
- The `src/test/setup.ts` file loads `@testing-library/jest-dom` matchers

Coverage thresholds (lines / functions / branches / statements): **50%** minimum. These will be raised as the test suite matures.

---

## CI pipeline

Every pull request to `main` runs:

| Job | What it checks |
|-----|---------------|
| `UI Kit: Type Check` | `tsc --noEmit` on `packages/ui-kit` |
| `UI Kit: Build` | `tsup` produces a valid dist |
| `App: Type Check` | `tsc --noEmit` on `src/` |
| `App: Tests` | Vitest with coverage thresholds |
| `App: Build` | `vite build` produces a valid `dist/` |
| `Docker: Build` | Multi-stage Docker image builds successfully |

All jobs must pass before a PR can be merged.
