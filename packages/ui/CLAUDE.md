# @paget/ui

## Overview

Vue 3 chat UI — the entry point and user-facing module of Paget. This package will be embedded into production systems, so it must follow design specifications strictly.

## Rules

- Composition API + `<script setup>` only
- All comments: bilingual (中文 / English)
- CSS uses `--paget-*` custom properties from `styles/variables.css`
- Keep production chat components low-coupling; demo pages may use lightweight third-party UI dependencies when needed (Element Plus is currently included)
- i18n: add both zh-CN and en-US entries for every user-visible string
- Components are organized by feature: `ChatPanel/`, `MessageList/`, `ConfigPanel/`, `common/`
- Composables (`useXxx`) encapsulate stateful logic; keep components focused on rendering
- Network/realtime logic should live in composables (e.g. `useWebSocket.ts`), not inside view components
- Pinia stores are minimal — prefer composables for component-scoped state
