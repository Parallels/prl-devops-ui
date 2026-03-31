# Claude Code Configuration - RuFlo V3

> **IMPORTANT**: These rules are MANDATORY for every interaction in this project.
> Before responding to ANY message, read and follow the Swarm Activation section.
> There are NO exceptions for code-related tasks.

## Behavioral Rules (Always Enforced)

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- NEVER save working files, text/mds, or tests to the root folder
- Never continuously check status after spawning a swarm — wait for results
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files

## Project Stack

This is a **Tauri v2 desktop application** with a **React/TypeScript frontend** and an internal **React UI Kit package**.

- **Frontend**: React, TypeScript, Vite
- **Desktop shell**: Tauri v2 (Rust)
- **IPC**: Tauri commands (`invoke`) and events (`listen`/`emit`)
- **State**: Frontend manages UI state; Rust backend manages system/OS-level state
- **Build target**: Native desktop (macOS, Linux, Windows)
- **UI Kit**: Internal React component library at `/packages/ui-kit` — consumed by the frontend, maintained as its own package

### Key Constraints

- Frontend code lives in `/src` — React components, hooks, TypeScript only
- Rust/Tauri code lives in `/src-tauri` — commands, plugins, system integration
- UI Kit lives in `/packages/ui-kit` — has its own `package.json`, build, and lint pipeline
- NEVER mix frontend and Tauri concerns — IPC boundary must stay clean
- NEVER modify `/packages/ui-kit` without also verifying the frontend still builds
- Tauri commands must be declared in `src-tauri/src/main.rs` or a dedicated commands module
- Use `invoke` for request/response patterns, Tauri events for push/streaming from Rust to frontend
- Always check `src-tauri/tauri.conf.json` before changing capabilities or permissions
- Rust changes require `cargo build` — always verify Rust compiles before committing

## File Organization

- NEVER save to root folder — use the directories below
- `/src` — React components, hooks, TypeScript source
- `/src-tauri` — Rust backend, Tauri commands, plugins
- `/src-tauri/src` — Rust source files
- `/packages/ui-kit` — internal React component library (self-contained package)
- `/tests` — frontend test files
- `/docs` — documentation and markdown files
- `/config` — configuration files
- `/scripts` — utility scripts
- `/examples` — example code

## Project Architecture

- Follow Domain-Driven Design with bounded contexts
- Keep files under 500 lines
- Use typed interfaces for all public APIs
- Prefer TDD London School (mock-first) for new code
- Use event sourcing for state changes
- Ensure input validation at system boundaries
- IPC layer is a system boundary — validate on both sides (TypeScript + Rust)

### Project Config

- **Topology**: hierarchical-mesh
- **Max Agents**: 15
- **Memory**: hybrid
- **HNSW**: Enabled
- **Neural**: Enabled

## Build & Test

```bash
# UI Kit (MUST pass before frontend build)
cd packages/ui-kit && npm run build
cd packages/ui-kit && npm run lint
cd packages/ui-kit && npm test

# Frontend only
npm run build
npm test
npm run lint

# Full Tauri app (frontend + Rust)
npm run tauri build

# Tauri dev mode
npm run tauri dev

# Rust only
cd src-tauri && cargo build
cd src-tauri && cargo test
cd src-tauri && cargo clippy
```

- ALWAYS run `cd packages/ui-kit && npm run build && npm run lint` after any changes to the UI Kit
- ALWAYS run `npm test` after frontend changes
- ALWAYS run `cargo clippy` after Rust changes
- ALWAYS verify `npm run tauri build` succeeds before committing
- NEVER commit if the UI Kit build or lint fails
- NEVER commit if Rust fails to compile

## Security Rules

- NEVER hardcode API keys, secrets, or credentials in source files
- NEVER commit .env files or any file containing secrets
- Always validate user input at system boundaries (TypeScript AND Rust)
- Always sanitize file paths to prevent directory traversal — especially in Tauri commands
- Tauri capabilities in `tauri.conf.json` follow least-privilege — do not expand them without review
- Run `npx @claude-flow/cli@latest security scan` after security-related changes

## Concurrency: 1 MESSAGE = ALL RELATED OPERATIONS

- All operations MUST be concurrent/parallel in a single message
- Use Claude Code's Task tool for spawning agents, not just MCP
- ALWAYS batch ALL todos in ONE TodoWrite call (5-10+ minimum)
- ALWAYS spawn ALL agents in ONE message with full instructions via Task tool
- ALWAYS batch ALL file reads/writes/edits in ONE message
- ALWAYS batch ALL Bash commands in ONE message

## MANDATORY: Swarm Activation

**BEFORE doing ANY task that involves writing, editing, or analyzing code, you MUST:**

1. Call `mcp__ruflo__swarm_init` with topology `hierarchical`, maxAgents `8`, strategy `specialized`
2. In the SAME message, spawn ALL agents using `mcp__ruflo__agent_spawn`:
   - `architect` — component structure, DDD bounded contexts, Tauri IPC boundary design, UI Kit API contracts
   - `coder` — React components, TypeScript, hooks, Rust/Tauri commands, UI Kit components
   - `reviewer` — code quality, React patterns, Rust idioms, accessibility, UI Kit consistency
   - `tester` — Jest/Vitest unit tests, React Testing Library, Rust cargo tests, UI Kit regression
   - `security` — CVE scanning, XSS, Tauri capability audit, IPC input validation
3. Set `run_in_background: true` on ALL agent Task calls
4. After spawning — STOP. Do not add more tool calls. Wait for agent results.

**This is not optional. Responding directly to code tasks without spawning the swarm is not permitted.**

## Swarm Rules

- ALL agent spawns MUST happen in ONE single message (parallel execution)
- NEVER poll for status after spawning — trust agents to return results
- Consensus: `raft`
- Shared memory namespace: `prl-devops-ui`
- Checkpoint via `post-task` hooks after each swarm completes
- For UI tasks: `architect` agent MUST validate against existing DDD bounded contexts before `coder` proceeds
- For UI Kit tasks: `reviewer` agent MUST verify no breaking changes to public component API before `coder` proceeds
- For Tauri tasks: `architect` agent MUST review IPC boundary before `coder` touches Rust

## Swarm Orchestration

- MUST initialize the swarm using CLI tools when starting complex tasks
- MUST spawn concurrent agents using Claude Code's Task tool
- Never use CLI tools alone for execution — Task tool agents do the actual work
- MUST call CLI tools AND Task tool in ONE message for complex work

### 3-Tier Model Routing (ADR-026)

| Tier | Handler | Latency | Cost | Use Cases |
|------|---------|---------|------|-----------|
| **1** | Agent Booster (WASM) | <1ms | $0 | Simple transforms (var→const, add types) — Skip LLM |
| **2** | Haiku | ~500ms | $0.0002 | Simple tasks, low complexity (<30%) |
| **3** | Sonnet/Opus | 2-5s | $0.003-0.015 | Complex reasoning, architecture, security (>30%) |

- Always check for `[AGENT_BOOSTER_AVAILABLE]` or `[TASK_MODEL_RECOMMENDATION]` before spawning agents
- Use Edit tool directly when `[AGENT_BOOSTER_AVAILABLE]`

## V3 CLI Commands

### Core Commands

| Command | Subcommands | Description |
|---------|-------------|-------------|
| `init` | 4 | Project initialization |
| `agent` | 8 | Agent lifecycle management |
| `swarm` | 6 | Multi-agent swarm coordination |
| `memory` | 11 | AgentDB memory with HNSW search |
| `task` | 6 | Task creation and lifecycle |
| `session` | 7 | Session state management |
| `hooks` | 17 | Self-learning hooks + 12 workers |
| `hive-mind` | 6 | Byzantine fault-tolerant consensus |

### Quick CLI Examples

```bash
npx @claude-flow/cli@latest init --wizard
npx @claude-flow/cli@latest agent spawn -t coder --name my-coder
npx @claude-flow/cli@latest swarm init --v3-mode
npx @claude-flow/cli@latest memory search --query "authentication patterns"
npx @claude-flow/cli@latest doctor --fix
```

## Available Agents (60+ Types)

### Core Development

`coder`, `reviewer`, `tester`, `planner`, `researcher`

### Specialized

`security-architect`, `security-auditor`, `memory-specialist`, `performance-engineer`

### Swarm Coordination

`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`

### GitHub & Repository

`pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`

### SPARC Methodology

`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`

## Memory Commands Reference

```bash
# Store (REQUIRED: --key, --value; OPTIONAL: --namespace, --ttl, --tags)
npx @claude-flow/cli@latest memory store --key "pattern-auth" --value "JWT with refresh" --namespace patterns

# Search (REQUIRED: --query; OPTIONAL: --namespace, --limit, --threshold)
npx @claude-flow/cli@latest memory search --query "authentication patterns"

# List (OPTIONAL: --namespace, --limit)
npx @claude-flow/cli@latest memory list --namespace patterns --limit 10

# Retrieve (REQUIRED: --key; OPTIONAL: --namespace)
npx @claude-flow/cli@latest memory retrieve --key "pattern-auth" --namespace patterns
```

## Quick Setup

```bash
claude mcp add ruflo -- node node_modules/ruflo/bin/ruflo.js mcp start
npx @claude-flow/cli@latest daemon start
npx @claude-flow/cli@latest doctor --fix
```

## Claude Code vs CLI Tools

- Claude Code's Task tool handles ALL execution: agents, file ops, code generation, git
- CLI tools handle coordination via Bash: swarm init, memory, hooks, routing
- NEVER use CLI tools as a substitute for Task tool agents

## Support

- Documentation: <https://github.com/ruvnet/ruflo>
- Issues: <https://github.com/ruvnet/ruflo/issues>
