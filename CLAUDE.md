# Paget - AI Page Agent

## Project Overview

Paget is an AI-powered web page automation agent built on a reflection-before-action architecture. It observes page state, reflects on progress, then executes batch actions — all orchestrated through a client-server model with WebSocket communication.

## Monorepo Structure

```
packages/
├── shared/           # Shared types & constants (frontend + backend)
├── page-controller/  # DOM extraction & element interaction (runs in browser)
├── ui/               # Vue 3 chat UI (entry point + user config)
└── server/           # NestJS backend (LLM, Agent, Prompt, Session, WebSocket)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + TypeScript + Vite + Pinia |
| Backend | NestJS + TypeORM + LangChain.js |
| Database | MySQL |
| Realtime | Socket.IO (WebSocket) |
| Monorepo | pnpm workspace |

## Architecture Key Concepts

### Reflection-Before-Action Loop

Every agent step outputs:
1. `evaluation_previous_goal` — assess previous action result
2. `memory` — key info to carry forward
3. `next_goal` — clear next objective
4. `actions[]` — one or more actions to execute (batch support)

### Event Model (3 categories)

- **statuschange** — agent lifecycle: `idle → running → completed/error`
- **historychange** — persistent events (steps, observations, errors) used as LLM context
- **activity** — transient UI feedback (thinking, executing, executed) NOT sent to LLM

### Data Flow

```
Browser (UI + PageController)  ←— WebSocket —→  Server (Agent + LLM)
  - Reports page state (DOM)                      - Runs reflection loop
  - Executes batch actions                        - Calls LLM via LangChain
  - Displays events in ChatPanel                  - Persists history to MySQL
```

## Coding Conventions

### Language / 语言

- **All code comments MUST be bilingual (Chinese + English)**. Write Chinese first, then English on the same line or next line.
- Format: `// 中文说明 / English explanation`
- For JSDoc/block comments:
  ```ts
  /**
   * 获取当前页面的浏览器状态快照
   * Get a browser state snapshot of the current page
   */
  ```
- Variable names, function names, class names: **English only**
- Commit messages: English
- Documentation files (.md): Chinese preferred, English acceptable

### TypeScript

- Strict mode enabled across all packages
- Use `interface` for data shapes, `type` for unions/intersections
- Prefer `unknown` over `any`; if `any` is unavoidable, add a comment explaining why
- Use Zod for runtime validation (especially in server/agent tools)
- Enum values: UPPER_SNAKE_CASE
- No default exports except Vue SFC files (.vue)

### Vue 3 (packages/ui)

- Composition API with `<script setup lang="ts">` only, no Options API
- Component naming: PascalCase files, PascalCase in templates
- Props: use `defineProps<T>()` with TypeScript interface
- Emits: use `defineEmits<T>()` with typed events
- State management: Pinia stores in `stores/`, composables in `composables/`
- Scoped styles (`<style scoped>`) by default
- CSS custom properties defined in `styles/variables.css`, prefix: `--paget-`
- No Tailwind — use plain CSS with design tokens

### NestJS (packages/server)

- One module per domain: `llm`, `agent`, `prompt`, `session`
- Entity files: `*.entity.ts` with TypeORM decorators
- DTOs: `dto/*.dto.ts` with class-validator decorators
- Services contain business logic; Controllers are thin (delegate to services)
- WebSocket events defined in `@paget/shared` constants, not magic strings
- Use constructor injection, avoid `@Inject()` where possible

### Shared Package

- Types only (no runtime code with side effects)
- All WebSocket event names defined in `constants/events.ts`
- All status enums defined in `constants/status.ts`

### Page Controller

- No framework dependency (vanilla TypeScript, runs in any browser)
- Framework-specific logic isolated in `patches/` directory
- Vue patch (`patches/vue.ts`): handle v-model reactivity
- Element Plus patch (`patches/element-plus.ts`): handle custom components
- Batch execution stops on first error (fail-fast)

## File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Vue component | PascalCase.vue | `ChatPanel.vue` |
| Composable | camelCase.ts | `useWebSocket.ts` |
| Pinia store | camelCase.ts | `chat.ts` |
| NestJS module | kebab-case.*.ts | `llm.module.ts` |
| NestJS entity | kebab-case.entity.ts | `llm.entity.ts` |
| Shared types | camelCase.ts | `agent.ts` |
| CSS | kebab-case.css | `variables.css` |

## Package Dependencies

```
@paget/ui ──→ @paget/shared
           ──→ @paget/page-controller

@paget/page-controller ──→ @paget/shared

@paget/server ──→ @paget/shared
```

- `shared` has NO dependencies on other workspace packages
- `page-controller` depends only on `shared`
- `ui` and `server` depend on `shared`; `ui` also depends on `page-controller`
- **Never** create circular dependencies between packages

## Commands

```bash
pnpm dev:ui          # Start frontend dev server (Vite, port 5173)
pnpm dev:server      # Start backend dev server (NestJS watch mode)
pnpm dev             # Start both concurrently
pnpm build           # Build all packages
pnpm build:shared    # Build shared package only
```

## Testing Guidelines

- Unit tests: colocate with source as `*.spec.ts`
- E2E tests: `tests/` directory at package root
- Mock WebSocket and LLM calls in tests — never call real APIs

## Important Notes

- The `page-controller` package runs **in the browser** (injected into target pages), not on the server
- The server never directly manipulates DOM — it sends action commands via WebSocket, and the client-side PageController executes them
- LLM API keys are stored in MySQL, never hardcoded or committed to git
- The `.env` file is gitignored; use `.env.example` as template
